(() => {
  const actions = document.querySelector('#eventDialog .actions');
  if (!actions || document.getElementById('exportHtmlBtn')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'exportHtmlBtn';
  button.textContent = '📤 Esporta nota in HTML';
  actions.insertBefore(button, actions.firstChild);

  const esc = value => String(value ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function safeName(value){
    return String(value || 'nota-agenda-elip')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-zA-Z0-9-_]+/g,'-')
      .replace(/^-+|-+$/g,'').slice(0,80) || 'nota-agenda-elip';
  }

  function toBytes(data){
    if (!data) return null;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    if (Array.isArray(data)) return new Uint8Array(data);
    if (data?.type === 'Buffer' && Array.isArray(data.data)) return new Uint8Array(data.data);
    return null;
  }

  function asDataUrl(item){
    const bytes = toBytes(item?.data);
    if (!bytes) return '';
    let binary = '';
    const chunk = 0x8000;
    for(let i=0;i<bytes.length;i+=chunk){
      binary += String.fromCharCode(...bytes.subarray(i, i+chunk));
    }
    return `data:${item.type || 'application/octet-stream'};base64,${btoa(binary)}`;
  }

  function mediaHtml(event){
    const photos = [];
    if (event.photo) photos.push(event.photo);
    if (Array.isArray(event.photos)) photos.push(...event.photos);
    const audios = Array.isArray(event.audios) && event.audios.length ? event.audios : (event.audio ? [event.audio] : []);
    const videos = Array.isArray(event.videos) ? event.videos : [];

    let html = '';
    if (photos.length){
      html += '<section><h2>Fotografie</h2><div class="gallery">';
      photos.forEach((p,i) => { const src=asDataUrl(p); if(src) html += `<figure><img src="${src}" alt="Fotografia ${i+1}"><figcaption>${esc(p.name || `Fotografia ${i+1}`)}</figcaption></figure>`; });
      html += '</div></section>';
    }
    if (audios.length){
      html += '<section><h2>Note vocali</h2>';
      audios.forEach((a,i) => { const src=asDataUrl(a); if(src) html += `<div class="media"><strong>Registrazione ${i+1}</strong><audio controls src="${src}"></audio></div>`; });
      html += '</section>';
    }
    if (videos.length){
      html += '<section><h2>Video</h2>';
      videos.forEach((v,i) => { const src=asDataUrl(v); if(src) html += `<div class="media"><strong>Video ${i+1}</strong><video controls playsinline src="${src}"></video></div>`; });
      html += '</section>';
    }
    return html;
  }

  function buildHtml(event){
    const title = event.title || 'Nota Agenda ELIP';
    return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
body{margin:0;background:#f3f4f6;color:#222;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}main{max-width:900px;margin:auto;background:#fff;min-height:100vh;padding:28px}.brand{font-weight:800;color:#287642;letter-spacing:.04em}.card{border:1px solid #ddd;border-radius:16px;padding:18px;margin:18px 0}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.meta div{background:#f7f7f5;border-radius:10px;padding:10px}.notes{white-space:pre-wrap;line-height:1.55}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.gallery figure{margin:0}.gallery img{width:100%;max-height:520px;object-fit:contain;background:#111;border-radius:12px}.gallery figcaption{padding:6px 2px;color:#666}.media{display:grid;gap:8px;margin:14px 0;padding:12px;border:1px solid #ddd;border-radius:12px}audio,video{width:100%;max-height:560px}h1{margin:.25em 0}h2{margin-top:28px}@media(max-width:600px){main{padding:18px}}
</style></head><body><main>
<div class="brand">AGENDA ELIP</div><h1>${esc(title)}</h1>
<div class="card meta"><div><strong>Data</strong><br>${esc(event.date || '')}</div><div><strong>Ora</strong><br>${esc(event.time || '')}</div><div><strong>Priorità</strong><br>${esc(event.priority || '')}</div><div><strong>Stato</strong><br>${esc(event.state || '')}</div></div>
<section class="card"><h2>Nota</h2><div class="notes">${esc(event.notes || 'Nessuna nota testuale.')}</div></section>
${mediaHtml(event)}
</main></body></html>`;
  }

  async function exportHtml(){
    const id = document.getElementById('eventId')?.value;
    if (!id){ alert('Salva prima la nota, poi riaprila per esportarla completa.'); return; }
    const data = await getData();
    const saved = data.events.find(e => e.id === id);
    if (!saved){ alert('Nota non trovata. Salvala nuovamente e riprova.'); return; }

    const event = {
      ...saved,
      title: document.getElementById('title')?.value?.trim() || saved.title,
      date: document.getElementById('date')?.value || saved.date,
      time: document.getElementById('time')?.value || saved.time,
      priority: document.getElementById('priority')?.value || saved.priority,
      state: document.getElementById('state')?.value || saved.state,
      notes: document.getElementById('eventNotes')?.value ?? saved.notes
    };

    const html = buildHtml(event);
    const fileName = `${safeName(event.title)}-${event.date || 'nota'}.html`;
    const file = new File([html], fileName, {type:'text/html;charset=utf-8'});

    try{
      if (navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
        await navigator.share({title:event.title || 'Nota Agenda ELIP', text:'Nota completa Agenda ELIP', files:[file]});
        return;
      }
    }catch(err){
      if (err?.name === 'AbortError') return;
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    alert('File HTML creato. Ora puoi allegarlo a WhatsApp.');
  }

  button.onclick = exportHtml;
})();