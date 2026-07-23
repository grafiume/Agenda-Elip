(() => {
  const style = document.createElement('style');
  style.textContent = `
    .head.today-col{background:#dceeff!important;color:#075aa6!important;box-shadow:inset 0 -4px 0 #1670e8}
    .head.today-col::before{content:'OGGI';display:inline-block;font-size:10px;line-height:1;background:#1670e8;color:#fff;border-radius:999px;padding:4px 6px;margin-right:5px;vertical-align:middle}
    .cell.today-col{background:#f3f9ff!important;box-shadow:inset 2px 0 0 rgba(22,112,232,.18),inset -2px 0 0 rgba(22,112,232,.18)}
    .time.current-hour{background:#fff1f0!important;color:#b42318!important;font-weight:800;position:relative}
    .time.current-hour::before{content:'●';font-size:10px;margin-right:5px;color:#d93025}
    .cell.current-hour{background:#fff9e8!important;border-top:2px solid #e33d2e;border-bottom:2px solid #e33d2e}
    .cell.today-col.current-hour{background:#fff3cf!important;box-shadow:inset 4px 0 0 #d93025,inset -2px 0 0 rgba(22,112,232,.25)}
    .closing-time{height:34px!important;border-bottom:2px solid #999!important;background:#fafafa!important;font-weight:700}
    .closing-cell{height:34px!important;border-bottom:2px solid #999!important;background:#fafafa!important}
    .closing-cell.today-col{background:#eef7ff!important}
  `;
  document.head.appendChild(style);

  render = async function(){
    const data = await getData();
    const cal = $('calendar');
    const today = isoDate(new Date());
    const currentHour = new Date().getHours();
    cal.innerHTML = '<div class="head corner"></div>';
    const names = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];

    for(let d=0; d<7; d++){
      const x = new Date(weekStart);
      x.setDate(x.getDate()+d);
      const isToday = isoDate(x) === today;
      cal.insertAdjacentHTML('beforeend', `<div class="head ${d>4?'weekend':''} ${isToday?'today-col':''}">${names[d]}<br>${pad(x.getDate())}</div>`);
    }

    for(let h=8; h<=23; h++){
      const isCurrentHour = h === currentHour;
      cal.insertAdjacentHTML('beforeend', `<div class="time ${isCurrentHour?'current-hour':''}">${pad(h)}:00</div>`);
      for(let d=0; d<7; d++){
        const x = new Date(weekStart);
        x.setDate(x.getDate()+d);
        const dayIso = isoDate(x);
        const isToday = dayIso === today;
        const evs = data.events.filter(e => e.date===dayIso && Number(e.time.slice(0,2))===h && e.state!=='Archiviato');
        const box = document.createElement('div');
        box.className = 'cell '+(d>4?'weekend ':'')+(isToday?'today-col ':'')+(isToday&&isCurrentHour?'current-hour':'');
        box.dataset.date = dayIso;
        box.dataset.time = pad(h)+':00';
        evs.forEach(e => {
          const b = document.createElement('button');
          b.className = 'event '+({Bassa:'low',Media:'medium',Alta:'high'}[e.priority]||'medium')+(e.state==='Completato'?' done':'');
          b.textContent = e.time+' '+e.title;
          b.onclick = ev => { ev.stopPropagation(); openEditor(e.id); };
          box.appendChild(b);
        });
        box.onclick = () => openEditor(null,box.dataset.date,box.dataset.time);
        cal.appendChild(box);
      }
    }

    cal.insertAdjacentHTML('beforeend','<div class="time closing-time">24:00</div>');
    for(let d=0; d<7; d++){
      const x = new Date(weekStart);
      x.setDate(x.getDate()+d);
      const isToday = isoDate(x) === today;
      cal.insertAdjacentHTML('beforeend', `<div class="cell closing-cell ${isToday?'today-col':''}"></div>`);
    }

    const end = new Date(weekStart);
    end.setDate(end.getDate()+6);
    $('weekTitle').textContent = fmtDate(weekStart)+' – '+fmtDate(end);
    $('status').textContent = `Attività: ${data.events.length} • Agenda 08:00–24:00 • Salvataggio locale`;
    document.querySelectorAll('[data-note]').forEach(t => t.value = data.notes[t.dataset.note] || '');
  };

  setInterval(() => render(), 60000);
})();
