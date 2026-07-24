(() => {
  const ua = navigator.userAgent || '';
  const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const coarsePointer = window.matchMedia ? window.matchMedia('(pointer:coarse)').matches : false;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|CriOS|FxiOS|EdgiOS/i.test(ua) || (hasTouch && coarsePointer) || (hasTouch && /Macintosh/i.test(ua));
  const photoChoice = document.querySelector('.photo-choice');
  if (!photoChoice) return;

  const style = document.createElement('style');
  style.textContent = `
    #desktopMediaBox{margin-top:10px;padding:12px;border:1px solid #d8d8d4;border-radius:14px;background:#f8fafc}
    #desktopMediaBox h3{margin:0 0 9px;font-size:15px}
    #desktopMediaControls{display:flex;gap:8px;flex-wrap:wrap}
    #desktopCameraDialog video{width:100%;max-height:55vh;background:#111;border-radius:14px;object-fit:contain}
    #desktopCameraStatus{margin:8px 0;color:#666;font-weight:600}
    #desktopVideoList{display:grid;gap:8px;margin-top:10px}
    .desktop-video-item{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px;border:1px solid #d8d8d4;border-radius:12px;background:#fff}
    .desktop-video-item span{flex:1;min-width:150px;font-weight:600}
  `;
  document.head.appendChild(style);

  if (isMobile) {
    photoChoice.classList.remove('hidden');
    photoChoice.style.display = 'flex';
    const choose = document.getElementById('choosePhotoBtn');
    const take = document.getElementById('takePhotoBtn');
    if (choose) { choose.classList.remove('hidden'); choose.style.display = ''; choose.textContent = '🖼️ Scegli dalla libreria'; }
    if (take) { take.classList.remove('hidden'); take.style.display = ''; take.textContent = '📷 Scatta foto'; }
    document.getElementById('desktopMediaBox')?.remove();
    return;
  }

  photoChoice.classList.add('hidden');

  const box = document.createElement('div');
  box.id = 'desktopMediaBox';
  box.innerHTML = `
    <h3>Fotocamera del PC</h3>
    <div id="desktopMediaControls">
      <button type="button" id="desktopPhotoBtn">📷 Scatta foto con webcam</button>
      <button type="button" id="desktopVideoBtn">🎥 Registra video con webcam</button>
    </div>
    <div id="desktopVideoList"></div>`;
  photoChoice.insertAdjacentElement('afterend', box);

  const dialog = document.createElement('dialog');
  dialog.id = 'desktopCameraDialog';
  dialog.innerHTML = `<div class="modal"><h2 id="desktopCameraTitle">Webcam</h2><video id="desktopCameraPreview" autoplay playsinline muted></video><div id="desktopCameraStatus">Avvio webcam…</div><div class="actions"><button type="button" id="desktopCameraCancel">Annulla</button><button type="button" class="primary" id="desktopCameraAction">Scatta</button></div></div>`;
  document.body.appendChild(dialog);

  const preview = document.getElementById('desktopCameraPreview');
  const status = document.getElementById('desktopCameraStatus');
  const action = document.getElementById('desktopCameraAction');
  const cancel = document.getElementById('desktopCameraCancel');
  const videoList = document.getElementById('desktopVideoList');
  let stream = null;
  let recorder = null;
  let chunks = [];
  let mode = 'photo';
  let workingVideos = [];

  function stopStream(){
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    preview.srcObject = null;
  }

  async function openCamera(nextMode){
    mode = nextMode;
    action.disabled = false;
    document.getElementById('desktopCameraTitle').textContent = mode === 'photo' ? 'Scatta foto con webcam' : 'Registra video con webcam';
    action.textContent = mode === 'photo' ? '📸 Scatta' : '● Avvia registrazione';
    action.dataset.recording = 'no';
    status.textContent = 'Avvio webcam…';
    dialog.showModal();
    try{
      stream = await navigator.mediaDevices.getUserMedia({video:true,audio:mode==='video'});
      preview.srcObject = stream;
      status.textContent = mode === 'photo' ? 'Webcam pronta' : 'Webcam e microfono pronti';
    }catch(err){
      status.textContent = 'Webcam non disponibile o autorizzazione negata.';
      action.disabled = true;
    }
  }

  function renderVideos(){
    videoList.innerHTML = '';
    workingVideos.forEach((v,i) => {
      const row = document.createElement('div');
      row.className = 'desktop-video-item';
      const label = document.createElement('span');
      label.textContent = `Video ${i+1}`;
      const play = document.createElement('button');
      play.type = 'button'; play.textContent = '▶ Guarda'; play.onclick = () => openBlob(v);
      const remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = 'Elimina'; remove.onclick = () => { if(confirm(`Eliminare il video ${i+1}?`)){ workingVideos.splice(i,1); renderVideos(); } };
      row.append(label,play,remove); videoList.appendChild(row);
    });
  }

  action.onclick = async () => {
    if (!stream) return;
    if (mode === 'photo'){
      const canvas = document.createElement('canvas');
      canvas.width = preview.videoWidth || 1280;
      canvas.height = preview.videoHeight || 720;
      canvas.getContext('2d').drawImage(preview,0,0,canvas.width,canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',0.88));
      const file = new File([blob],`webcam-${Date.now()}.jpg`,{type:'image/jpeg'});
      const dt = new DataTransfer(); dt.items.add(file);
      const input = document.getElementById('photoLibraryInput');
      input.files = dt.files;
      if (typeof handlePhoto === 'function') await handlePhoto(input);
      stopStream(); dialog.close();
      return;
    }
    if (action.dataset.recording === 'no'){
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => { if(e.data?.size) chunks.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunks,{type:recorder.mimeType || 'video/webm'});
        workingVideos.push({name:`video-webcam-${Date.now()}.webm`,type:blob.type,data:await blob.arrayBuffer(),created:new Date().toISOString()});
        renderVideos(); stopStream(); dialog.close();
      };
      recorder.start(); action.dataset.recording = 'yes'; action.textContent = '■ Ferma registrazione'; status.textContent = '● Registrazione video in corso…';
    }else{
      recorder.stop();
    }
  };

  cancel.onclick = () => { stopStream(); dialog.close(); };
  dialog.addEventListener('cancel',e => { e.preventDefault(); stopStream(); dialog.close(); });
  document.getElementById('desktopPhotoBtn').onclick = () => openCamera('photo');
  document.getElementById('desktopVideoBtn').onclick = () => openCamera('video');

  const previousOpenEditor = openEditor;
  openEditor = async function(id,date,time){
    await previousOpenEditor(id,date,time);
    workingVideos = Array.isArray(currentEvent?.videos) ? [...currentEvent.videos] : [];
    renderVideos();
  };

  const previousSaveEvent = saveEvent;
  saveEvent = async function(){
    if (!eventId.value) eventId.value = uid();
    const id = eventId.value;
    await previousSaveEvent();
    const data = await getData();
    const event = data.events.find(e => e.id === id);
    if (event){
      event.videos = [...workingVideos];
      await saveData(data);
    }
  };
  document.getElementById('saveBtn').onclick = saveEvent;
})();