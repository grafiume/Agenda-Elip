(() => {
  const dialog = document.getElementById('eventDialog');
  const photoLabel = [...dialog.querySelectorAll('label')].find(x => x.textContent.trim() === 'Fotografia');
  const photoChoices = dialog.querySelector('.photo-choice');
  if (!dialog || !photoChoices || document.getElementById('pasteImageZone')) return;

  const style = document.createElement('style');
  style.textContent = `
    #pasteImageZone{margin-top:9px;min-height:82px;border:2px dashed #b9c3cc;border-radius:12px;background:#f8fafc;padding:12px;display:flex;align-items:center;justify-content:center;text-align:center;color:#52606d;outline:none;cursor:text}
    #pasteImageZone:focus{border-color:#1670e8;background:#eef6ff;box-shadow:0 0 0 3px rgba(22,112,232,.12)}
    #pasteImageZone.has-image{border-style:solid;border-color:#287642;background:#eef8f1;color:#1f5f36}
    #pasteImagePreview{display:none;margin-top:8px;max-width:100%;max-height:180px;border-radius:10px;border:1px solid #d8d8d4;object-fit:contain;background:white}
    #pasteImageHint{font-size:13px;margin-top:5px;color:#667085}
  `;
  document.head.appendChild(style);

  const zone = document.createElement('div');
  zone.id = 'pasteImageZone';
  zone.contentEditable = 'true';
  zone.setAttribute('role','textbox');
  zone.setAttribute('aria-label','Incolla qui un’immagine');
  zone.innerHTML = '<div><strong>📋 Incolla immagine o schermata</strong><div id="pasteImageHint">PC: clicca qui e premi Ctrl+V · iPhone: pressione prolungata e scegli Incolla</div></div>';

  const preview = document.createElement('img');
  preview.id = 'pasteImagePreview';
  preview.alt = 'Anteprima immagine incollata';

  photoChoices.insertAdjacentElement('afterend', zone);
  zone.insertAdjacentElement('afterend', preview);

  async function setImageFile(file) {
    if (!file || !file.type?.startsWith('image/')) return false;
    pendingPhoto = {
      name: file.name || `immagine-incollata-${Date.now()}.png`,
      type: file.type || 'image/png',
      data: await file.arrayBuffer()
    };
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.style.display = 'block';
    zone.classList.add('has-image');
    zone.innerHTML = '<div><strong>✅ Immagine incollata</strong><div id="pasteImageHint">Puoi incollarne un’altra per sostituirla</div></div>';
    const photoName = document.getElementById('photoName');
    if (photoName) photoName.textContent = pendingPhoto.name;
    const openPhoto = document.getElementById('openPhoto');
    if (openPhoto) openPhoto.classList.remove('hidden');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  }

  zone.addEventListener('paste', async event => {
    const items = [...(event.clipboardData?.items || [])];
    const imageItem = items.find(item => item.type?.startsWith('image/'));
    if (!imageItem) return;
    event.preventDefault();
    const file = imageItem.getAsFile();
    await setImageFile(file);
  });

  document.addEventListener('paste', async event => {
    if (!dialog.open || zone.contains(document.activeElement)) return;
    const items = [...(event.clipboardData?.items || [])];
    const imageItem = items.find(item => item.type?.startsWith('image/'));
    if (!imageItem) return;
    event.preventDefault();
    await setImageFile(imageItem.getAsFile());
  });

  dialog.addEventListener('close', () => {
    zone.classList.remove('has-image');
    zone.innerHTML = '<div><strong>📋 Incolla immagine o schermata</strong><div id="pasteImageHint">PC: clicca qui e premi Ctrl+V · iPhone: pressione prolungata e scegli Incolla</div></div>';
    preview.removeAttribute('src');
    preview.style.display = 'none';
  });
})();