(() => {
  const $id = id => document.getElementById(id);

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function replacer(key, value) {
    if (value instanceof ArrayBuffer) {
      return { __agendaType: 'ArrayBuffer', base64: arrayBufferToBase64(value) };
    }
    if (ArrayBuffer.isView(value)) {
      return { __agendaType: 'ArrayBuffer', base64: arrayBufferToBase64(value.buffer) };
    }
    return value;
  }

  function reviver(key, value) {
    if (value && value.__agendaType === 'ArrayBuffer' && typeof value.base64 === 'string') {
      return base64ToArrayBuffer(value.base64);
    }
    return value;
  }

  function safeNameDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}-${String(d.getMinutes()).padStart(2,'0')}`;
  }

  function isAppleMobile() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1500);
  }

  async function exportAgenda() {
    try {
      const data = await getData();
      const packageData = {
        format: 'AgendaELIP',
        version: 3,
        exportedAt: new Date().toISOString(),
        device: navigator.userAgent,
        data
      };
      const json = JSON.stringify(packageData, replacer);
      if (!json || json.length < 20) throw new Error('Backup vuoto');

      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const filename = `AgendaELIP_${safeNameDate()}.agenda`;

      if (isAppleMobile() && navigator.share && typeof navigator.canShare === 'function') {
        try {
          const file = new File([blob], filename, { type: 'application/json' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: 'Backup Agenda ELIP', files: [file] });
            return;
          }
        } catch (shareError) {
          if (shareError?.name === 'AbortError') return;
        }
      }

      downloadBlob(blob, filename);
      setTimeout(() => alert('Backup Agenda ELIP esportato correttamente nella cartella Download.'), 250);
    } catch (error) {
      console.error('Errore esportazione Agenda ELIP:', error);
      alert(`Non è stato possibile esportare il backup. Dettaglio: ${error?.message || 'errore sconosciuto'}`);
    }
  }

  function mergeEvents(localEvents = [], incomingEvents = []) {
    const map = new Map();
    for (const event of localEvents) {
      if (event?.id) map.set(event.id, event);
    }
    for (const event of incomingEvents) {
      if (!event?.id) continue;
      const local = map.get(event.id);
      if (!local) {
        map.set(event.id, event);
        continue;
      }
      const localDate = Date.parse(local.updated || local.created || 0) || 0;
      const incomingDate = Date.parse(event.updated || event.created || 0) || 0;
      map.set(event.id, incomingDate >= localDate ? event : local);
    }
    return [...map.values()];
  }

  async function importAgenda(file) {
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw, reviver);
      if (!parsed || parsed.format !== 'AgendaELIP' || !parsed.data) {
        throw new Error('Formato non valido');
      }

      const local = await getData();
      const incoming = parsed.data;
      const merged = {
        ...local,
        ...incoming,
        events: mergeEvents(local.events, incoming.events),
        notes: { ...(local.notes || {}), ...(incoming.notes || {}) }
      };

      const localCount = local.events?.length || 0;
      const incomingCount = incoming.events?.length || 0;
      const mergedCount = merged.events.length;
      const ok = confirm(
        `Sincronizzare questo backup?\n\n` +
        `Agenda attuale: ${localCount} appuntamenti\n` +
        `File importato: ${incomingCount} appuntamenti\n` +
        `Totale dopo unione: ${mergedCount}\n\n` +
        `Gli appuntamenti con lo stesso identificativo non saranno duplicati.`
      );
      if (!ok) return;

      await saveData(merged);
      await render();
      alert(`Sincronizzazione completata. Ora ci sono ${mergedCount} appuntamenti.`);
    } catch (error) {
      alert('Il file non è un backup valido di Agenda ELIP oppure è danneggiato.');
    } finally {
      const input = $id('agendaImportInput');
      if (input) input.value = '';
    }
  }

  const toolbar = document.querySelector('.toolbar');
  if (!toolbar || $id('exportAgendaBtn')) return;

  const exportButton = document.createElement('button');
  exportButton.id = 'exportAgendaBtn';
  exportButton.type = 'button';
  exportButton.textContent = '📤 Esporta';
  exportButton.title = 'Crea un backup completo con appuntamenti, foto e registrazioni';

  const importButton = document.createElement('button');
  importButton.id = 'importAgendaBtn';
  importButton.type = 'button';
  importButton.textContent = '🔄 Importa / Sincronizza';
  importButton.title = 'Unisci un backup proveniente da iPhone o PC';

  const input = document.createElement('input');
  input.id = 'agendaImportInput';
  input.type = 'file';
  input.accept = '.agenda,.json,application/json';
  input.className = 'hidden';

  toolbar.append(exportButton, importButton, input);
  exportButton.onclick = exportAgenda;
  importButton.onclick = () => input.click();
  input.onchange = () => importAgenda(input.files?.[0]);

  const originalStatus = $id('status');
  if (originalStatus) {
    const help = document.createElement('div');
    help.style.marginTop = '6px';
    help.textContent = 'Per passare i dati tra iPhone e PC: Esporta sul primo dispositivo, poi Importa / Sincronizza sull’altro.';
    originalStatus.appendChild(help);
  }
})();