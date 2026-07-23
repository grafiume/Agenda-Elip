(() => {
  const $id = id => document.getElementById(id);
  const dialog = $id('eventDialog');
  const saveButton = $id('saveBtn');
  if (!dialog || !saveButton) return;

  const style = document.createElement('style');
  style.textContent = `
    #eventDialog{width:min(96vw,560px);max-height:calc(100dvh - 18px);margin:auto}
    #eventDialog .modal{padding:14px;max-height:calc(100dvh - 18px);overflow-y:auto;-webkit-overflow-scrolling:touch}
    #eventDialog .modal h2{margin:0 0 8px;font-size:22px}
    #eventDialog label{margin:8px 0 4px}
    #eventDialog input,#eventDialog select,#eventDialog textarea{min-height:46px;padding:9px 10px}
    #eventDialog input[type="date"],#eventDialog input[type="time"]{width:100%;min-width:0;text-align:center;text-align-last:center;appearance:none;-webkit-appearance:none}
    #eventDialog .row{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:end}
    #eventDialog #eventNotes{height:84px;min-height:84px;max-height:150px;resize:vertical;overflow-y:auto}
    #eventDialog .attachments{gap:6px;margin-top:5px}
    #eventDialog .attachments button{padding:9px 10px}
    #eventDialog .actions{position:sticky;bottom:-14px;z-index:5;margin:12px -14px -14px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:rgba(255,255,255,.97);border-top:1px solid #ddd;flex-wrap:nowrap}
    #eventDialog .actions button{min-width:0;padding:10px 12px}
    #eventDialog #calendarBtn{flex:1;overflow:hidden;text-overflow:ellipsis}
    @media(max-width:430px){
      #eventDialog{width:calc(100vw - 12px);border-radius:15px}
      #eventDialog .modal{padding:12px}
      #eventDialog .actions{bottom:-12px;margin:10px -12px -12px;padding-left:12px;padding-right:12px}
      #eventDialog .photo-choice{display:grid;grid-template-columns:1fr 1fr}
      #eventDialog .photo-choice button{white-space:normal;line-height:1.15}
    }
  `;
  document.head.appendChild(style);

  async function saveEditedEvent() {
    const titleEl = $id('title');
    if (!titleEl?.value.trim()) {
      alert('Scrivi il nome dell’attività');
      return;
    }

    saveButton.disabled = true;
    const oldText = saveButton.textContent;
    saveButton.textContent = 'Salvataggio…';

    try {
      const data = await getData();
      const id = $id('eventId').value || uid();
      const old = data.events.find(item => item.id === id) || {};
      const existingAudios = Array.isArray(old.audios) ? old.audios : (old.audio ? [old.audio] : []);
      const audioRows = document.querySelectorAll('#audioList .audio-item');
      let audios = existingAudios;

      // audio-upgrade mantiene internamente le registrazioni; richiamiamo il suo salvataggio
      // solo quando sono presenti modifiche audio, altrimenti preserviamo quelle esistenti.
      if (typeof window.__agendaWorkingAudios !== 'undefined') audios = window.__agendaWorkingAudios;

      let photo = old.photo || null;
      const chosen = $id('photoLibraryInput')?.files?.[0] || $id('photoCameraInput')?.files?.[0];
      if (chosen) photo = {name: chosen.name || 'foto.jpg', type: chosen.type || 'image/jpeg', data: await chosen.arrayBuffer()};
      else if (typeof pendingPhoto !== 'undefined') photo = pendingPhoto;

      const updated = {
        ...old,
        id,
        title: titleEl.value.trim(),
        date: $id('date').value,
        time: $id('time').value,
        priority: $id('priority').value,
        state: $id('state').value,
        alarmOn: $id('alarmOn').value,
        alarmMinutes: Number($id('alarmMinutes').value || 0),
        notes: $id('eventNotes').value,
        photo,
        audios,
        audio: null,
        alarmShown: false,
        updated: new Date().toISOString(),
        created: old.created || new Date().toISOString()
      };

      const index = data.events.findIndex(item => item.id === id);
      if (index >= 0) data.events[index] = updated;
      else data.events.push(updated);

      await saveData(data);
      dialog.close();
      await render();
    } catch (error) {
      console.error(error);
      alert('Non è stato possibile salvare la modifica. Riprova.');
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = oldText;
    }
  }

  saveButton.onclick = saveEditedEvent;
})();