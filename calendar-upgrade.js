(() => {
  const actions = document.querySelector('#eventDialog .actions');
  if (!actions || document.getElementById('calendarBtn')) return;

  const SHORTCUT_NAME = 'Agenda ELIP Calendario';
  const button = document.createElement('button');
  button.id = 'calendarBtn';
  button.type = 'button';
  button.textContent = '📅 Aggiungi automaticamente';
  actions.insertBefore(button, actions.firstChild);

  const pad2 = n => String(n).padStart(2, '0');
  const esc = value => String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  function readEvent() {
    const title = document.getElementById('title').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const notes = document.getElementById('eventNotes').value || '';
    const alarmOn = document.getElementById('alarmOn').value === 'yes';
    const alarmMinutes = Math.max(0, Number(document.getElementById('alarmMinutes').value || 0));

    if (!title) throw new Error('Scrivi prima il nome dell’attività.');
    if (!date || !time) throw new Error('Inserisci data e ora dell’appuntamento.');

    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      title,
      date,
      time,
      start: `${date}T${time}:00`,
      end: `${end.getFullYear()}-${pad2(end.getMonth() + 1)}-${pad2(end.getDate())}T${pad2(end.getHours())}:${pad2(end.getMinutes())}:00`,
      notes,
      alarmOn,
      alarmMinutes,
      source: 'Agenda ELIP'
    };
  }

  function isAppleMobile() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function runShortcut(eventData) {
    const payload = encodeURIComponent(JSON.stringify(eventData));
    const url = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=text&text=${payload}`;
    window.location.href = url;
  }

  function localStamp(date, time) {
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    return `${y}${pad2(m)}${pad2(d)}T${pad2(hh)}${pad2(mm)}00`;
  }

  function addMinutes(date, time, minutes) {
    const dt = new Date(`${date}T${time}:00`);
    dt.setMinutes(dt.getMinutes() + minutes);
    return `${dt.getFullYear()}${pad2(dt.getMonth() + 1)}${pad2(dt.getDate())}T${pad2(dt.getHours())}${pad2(dt.getMinutes())}00`;
  }

  function utcNow() {
    const d = new Date();
    return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
  }

  function buildIcs(data) {
    const uidValue = `${document.getElementById('eventId').value || Date.now()}@agenda-elip`;
    const lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Agenda ELIP//IT','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
      `UID:${esc(uidValue)}`,
      `DTSTAMP:${utcNow()}`,
      `DTSTART;TZID=Europe/Rome:${localStamp(data.date, data.time)}`,
      `DTEND;TZID=Europe/Rome:${addMinutes(data.date, data.time, 60)}`,
      `SUMMARY:${esc(data.title)}`,
      `DESCRIPTION:${esc(data.notes)}`,
      'STATUS:CONFIRMED'
    ];
    if (data.alarmOn) lines.push('BEGIN:VALARM', `TRIGGER:-PT${data.alarmMinutes}M`, 'ACTION:DISPLAY', `DESCRIPTION:${esc(data.title)}`, 'END:VALARM');
    lines.push('END:VEVENT','END:VCALENDAR');
    return lines.join('\r\n');
  }

  async function fallbackIcs(data) {
    const ics = buildIcs(data);
    const safeTitle = (data.title || 'appuntamento').replace(/[^a-z0-9àèéìòù _-]/gi, '').trim().replace(/\s+/g, '-');
    const file = new File([ics], `${safeTitle || 'appuntamento'}.ics`, { type: 'text/calendar' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title: 'Aggiungi al Calendario', files: [file] });
      return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function sendToCalendar() {
    try {
      const eventData = readEvent();
      if (isAppleMobile()) {
        runShortcut(eventData);
      } else {
        await fallbackIcs(eventData);
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      alert(error?.message || 'Non è stato possibile creare l’evento nel Calendario.');
    }
  }

  button.addEventListener('click', sendToCalendar);
})();