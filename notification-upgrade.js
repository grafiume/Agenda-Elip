(() => {
  const style = document.createElement('style');
  style.textContent = `
    #enableNotificationsBtn.enabled{background:#287642;color:#fff;border-color:#287642}
    #alarmOverlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;padding:20px}
    #alarmOverlay.show{display:flex}
    #alarmCard{width:min(92vw,440px);background:#fff;border-radius:22px;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35)}
    #alarmCard .bell{font-size:54px;line-height:1;margin-bottom:8px}
    #alarmCard h2{margin:4px 0 10px;font-size:26px}
    #alarmCard p{margin:6px 0;color:#555;font-size:17px}
    #alarmCard button{margin-top:18px;width:100%;background:#b42318;color:#fff;border-color:#b42318;font-weight:700;font-size:18px;min-height:52px}
  `;
  document.head.appendChild(style);

  const toolbar = document.querySelector('.toolbar');
  if (!toolbar) return;

  const enableBtn = document.createElement('button');
  enableBtn.id = 'enableNotificationsBtn';
  enableBtn.type = 'button';
  enableBtn.textContent = '🔔 Attiva notifiche';
  toolbar.appendChild(enableBtn);

  const overlay = document.createElement('div');
  overlay.id = 'alarmOverlay';
  overlay.innerHTML = `
    <div id="alarmCard" role="alertdialog" aria-modal="true">
      <div class="bell">⏰</div>
      <h2 id="alarmTitle">Promemoria</h2>
      <p id="alarmWhen"></p>
      <p id="alarmNotes"></p>
      <button type="button" id="stopAlarmBtn">Spegni allarme</button>
    </div>`;
  document.body.appendChild(overlay);

  let audioCtx = null;
  let soundTimer = null;
  let currentAlarmId = null;

  function notificationSupported(){ return 'Notification' in window; }

  function refreshButton(){
    if (!notificationSupported()) {
      enableBtn.textContent = '🔔 Allarme sonoro attivo';
      enableBtn.classList.add('enabled');
      return;
    }
    if (Notification.permission === 'granted') {
      enableBtn.textContent = '🔔 Notifiche attive';
      enableBtn.classList.add('enabled');
    } else if (Notification.permission === 'denied') {
      enableBtn.textContent = '🔕 Notifiche bloccate';
      enableBtn.classList.remove('enabled');
    } else {
      enableBtn.textContent = '🔔 Attiva notifiche';
      enableBtn.classList.remove('enabled');
    }
  }

  async function unlockAudio(){
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.02);
    } catch (_) {}
  }

  async function enableNotifications(){
    await unlockAudio();
    if (notificationSupported() && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch (_) {}
    }
    refreshButton();
    if (notificationSupported() && Notification.permission === 'denied') {
      alert('Le notifiche sono bloccate. Su PC apri le impostazioni del browser e consenti le notifiche per grafiume.github.io.');
    } else {
      alert('Notifiche e allarme sonoro attivati su questo dispositivo.');
    }
  }

  enableBtn.addEventListener('click', enableNotifications);
  document.addEventListener('pointerdown', unlockAudio, {once:true});

  function beepPattern(){
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;
    [0, .28, .56].forEach((offset, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i % 2 ? 880 : 660;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.45, now + offset + .02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + .22);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + .24);
    });
    if (navigator.vibrate) navigator.vibrate([250,120,250,120,400]);
  }

  function stopSound(){
    if (soundTimer) clearInterval(soundTimer);
    soundTimer = null;
    currentAlarmId = null;
    overlay.classList.remove('show');
  }
  document.getElementById('stopAlarmBtn').onclick = stopSound;

  async function systemNotification(event){
    if (!notificationSupported() || Notification.permission !== 'granted') return;
    const options = {
      body: `${event.time} • ${event.notes || 'Appuntamento Agenda ELIP'}`,
      icon: './icon.svg',
      badge: './icon.svg',
      tag: `agenda-elip-${event.id}`,
      renotify: true,
      requireInteraction: true
    };
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg?.showNotification) await reg.showNotification(`⏰ ${event.title}`, options);
      else new Notification(`⏰ ${event.title}`, options);
    } catch (_) {
      try { new Notification(`⏰ ${event.title}`, options); } catch (_) {}
    }
  }

  async function showAlarm(event){
    if (currentAlarmId === event.id) return;
    currentAlarmId = event.id;
    document.getElementById('alarmTitle').textContent = event.title || 'Promemoria';
    document.getElementById('alarmWhen').textContent = `${event.date.split('-').reverse().join('/')} alle ${event.time}`;
    const notes = document.getElementById('alarmNotes');
    notes.textContent = event.notes || '';
    notes.style.display = event.notes ? '' : 'none';
    overlay.classList.add('show');
    await unlockAudio();
    beepPattern();
    soundTimer = setInterval(beepPattern, 5000);
    systemNotification(event);
  }

  async function checkEnhancedAlarms(){
    if (typeof getData !== 'function' || typeof saveData !== 'function') return;
    const data = await getData();
    const now = Date.now();
    let changed = false;
    for (const event of data.events || []) {
      if (event.alarmOn !== 'yes' || event.alarmShown || event.state === 'Archiviato' || event.state === 'Completato') continue;
      const start = new Date(`${event.date}T${event.time}:00`).getTime();
      if (!Number.isFinite(start)) continue;
      const alarmAt = start - Number(event.alarmMinutes || 0) * 60000;
      if (now >= alarmAt && now <= start + 60 * 60000) {
        event.alarmShown = true;
        changed = true;
        await showAlarm(event);
      }
    }
    if (changed) await saveData(data);
  }

  if (typeof checkAlarms === 'function') checkAlarms = checkEnhancedAlarms;
  setInterval(checkEnhancedAlarms, 15000);
  setTimeout(checkEnhancedAlarms, 1200);
  refreshButton();
})();