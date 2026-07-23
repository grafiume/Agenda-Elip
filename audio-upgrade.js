(() => {
  const style = document.createElement('style');
  style.textContent = `
    #recordBtn.recording{background:#d93025!important;color:#fff!important;border-color:#d93025!important;animation:pulseRec 1s infinite}
    #stopBtn.active-stop{background:#fff1f0!important;color:#b42318!important;border-color:#d93025!important}
    #recordingStatus{font-weight:700;color:#d93025;margin:8px 0 2px;display:none}
    #recordingStatus.on{display:block}
    #audioList{display:grid;gap:8px;margin-top:10px}
    .audio-item{display:flex;align-items:center;gap:8px;padding:9px;border:1px solid #d9d9d6;border-radius:12px;background:#fff;flex-wrap:wrap}
    .audio-item span{flex:1;min-width:130px;font-weight:600}
    .audio-item button{padding:8px 10px}
    .audio-item .remove-audio{color:#b42318}
    @keyframes pulseRec{0%,100%{opacity:1}50%{opacity:.65}}
  `;
  document.head.appendChild(style);

  const oldRecord = document.getElementById('recordBtn');
  const oldStop = document.getElementById('stopBtn');
  if (!oldRecord || !oldStop) return;

  const status = document.createElement('div');
  status.id = 'recordingStatus';
  status.textContent = '● Registrazione in corso…';
  oldStop.parentElement.insertAdjacentElement('afterend', status);

  const list = document.createElement('div');
  list.id = 'audioList';
  status.insertAdjacentElement('afterend', list);

  let workingAudios = [];
  let recorder = null;
  let chunks = [];
  let activeStream = null;

  function normalizeAudios(event){
    const arr = Array.isArray(event?.audios) ? [...event.audios] : [];
    if (event?.audio && !arr.length) arr.push(event.audio);
    return arr;
  }

  function renderAudios(){
    list.innerHTML = '';
    workingAudios.forEach((audio, index) => {
      const row = document.createElement('div');
      row.className = 'audio-item';
      const label = document.createElement('span');
      label.textContent = `Registrazione ${index + 1}`;
      const play = document.createElement('button');
      play.type = 'button';
      play.textContent = '▶ Ascolta';
      play.onclick = () => openBlob(audio);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-audio';
      remove.textContent = 'Elimina';
      remove.onclick = () => {
        if (confirm(`Eliminare la registrazione ${index + 1}?`)) {
          workingAudios.splice(index,1);
          renderAudios();
        }
      };
      row.append(label, play, remove);
      list.appendChild(row);
    });
    const oldPlay = document.getElementById('playBtn');
    if (oldPlay) oldPlay.classList.add('hidden');
  }

  const originalOpenEditor = openEditor;
  openEditor = async function(id,date,time){
    await originalOpenEditor(id,date,time);
    workingAudios = normalizeAudios(currentEvent);
    window.pendingAudio = null;
    renderAudios();
    oldRecord.classList.remove('recording');
    oldRecord.textContent = '● Registra nuova';
    oldRecord.disabled = false;
    oldStop.disabled = true;
    oldStop.classList.remove('active-stop');
    status.classList.remove('on');
  };

  async function beginRecording(){
    try{
      activeStream = await navigator.mediaDevices.getUserMedia({audio:true});
      chunks = [];
      recorder = new MediaRecorder(activeStream);
      recorder.ondataavailable = e => { if(e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunks,{type:recorder.mimeType || 'audio/webm'});
        workingAudios.push({
          name:`nota-vocale-${new Date().toISOString()}`,
          type:blob.type,
          data:await blob.arrayBuffer(),
          created:new Date().toISOString()
        });
        activeStream?.getTracks().forEach(t=>t.stop());
        activeStream = null;
        oldRecord.classList.remove('recording');
        oldRecord.textContent = '● Registra un’altra';
        oldRecord.disabled = false;
        oldStop.disabled = true;
        oldStop.classList.remove('active-stop');
        status.classList.remove('on');
        renderAudios();
      };
      recorder.start();
      oldRecord.classList.add('recording');
      oldRecord.textContent = '● Sto registrando';
      oldRecord.disabled = true;
      oldStop.disabled = false;
      oldStop.classList.add('active-stop');
      status.classList.add('on');
    }catch(e){
      alert('Consenti l’uso del microfono nelle impostazioni di Safari.');
    }
  }

  function endRecording(){
    if(recorder && recorder.state !== 'inactive') recorder.stop();
  }

  oldRecord.onclick = beginRecording;
  oldStop.onclick = endRecording;

  const originalSave = saveEvent;
  saveEvent = async function(){
    if(!title.value.trim()){
      alert('Scrivi il nome dell’attività');
      return;
    }
    const data = await getData();
    const id = eventId.value || uid();
    const old = data.events.find(e=>e.id===id) || {};
    let photo = old.photo || null;
    const chosen = document.getElementById('photoLibraryInput')?.files?.[0] || document.getElementById('photoCameraInput')?.files?.[0] || document.getElementById('photoInput')?.files?.[0];
    if(chosen) photo = {name:chosen.name,type:chosen.type,data:await chosen.arrayBuffer()};
    const e = {
      ...old,
      id,
      title:title.value.trim(),
      date:document.getElementById('date').value,
      time:document.getElementById('time').value,
      priority:priority.value,
      state:state.value,
      alarmOn:alarmOn.value,
      alarmMinutes:Number(alarmMinutes.value||0),
      notes:eventNotes.value,
      photo,
      audios:[...workingAudios],
      audio:null,
      alarmShown:false,
      created:old.created || new Date().toISOString()
    };
    const i = data.events.findIndex(x=>x.id===id);
    if(i>=0) data.events[i]=e; else data.events.push(e);
    await saveData(data);
    eventDialog.close();
    render();
  };
  document.getElementById('saveBtn').onclick = saveEvent;
})();