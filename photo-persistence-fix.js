(() => {
  const photoChoice = document.querySelector('.photo-choice');
  if (photoChoice) {
    photoChoice.classList.remove('hidden');
    photoChoice.style.display = 'flex';

    const choose = document.getElementById('choosePhotoBtn');
    const take = document.getElementById('takePhotoBtn');
    if (choose) {
      choose.classList.remove('hidden');
      choose.style.display = '';
      choose.textContent = '🖼️ Scegli dalla libreria';
    }
    if (take) {
      take.classList.remove('hidden');
      take.style.display = '';
      take.textContent = '📷 Scatta foto';
    }
  }

  if (typeof saveEvent !== 'function') return;

  const previousSaveEvent = saveEvent;
  saveEvent = async function () {
    if (!document.getElementById('title')?.value.trim()) {
      alert('Scrivi il nome dell’attività');
      return;
    }

    const eventIdInput = document.getElementById('eventId');
    if (eventIdInput && !eventIdInput.value) eventIdInput.value = uid();
    const savedId = eventIdInput?.value;
    const photoToSave = pendingPhoto || null;

    await previousSaveEvent();

    if (!savedId || !photoToSave) return;
    const data = await getData();
    const event = data.events.find(item => item.id === savedId);
    if (!event) return;

    event.photo = {
      name: photoToSave.name || `immagine-${Date.now()}.png`,
      type: photoToSave.type || 'image/png',
      data: photoToSave.data
    };
    await saveData(data);
  };

  const saveButton = document.getElementById('saveBtn');
  if (saveButton) saveButton.onclick = saveEvent;
})();