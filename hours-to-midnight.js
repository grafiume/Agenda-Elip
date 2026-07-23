(() => {
  const oldRender = render;
  render = async function(){
    await oldRender();
    const cal = document.getElementById('calendar');
    if (!cal) return;
    const times = [...cal.querySelectorAll('.time')].map(x => x.textContent.trim());
    if (times.includes('23:00') && times.includes('24:00')) return;

    const data = await getData();
    const today = isoDate(new Date());
    const currentHour = new Date().getHours();
    cal.innerHTML = '<div class="head corner"></div>';
    const names = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];

    for(let d=0; d<7; d++){
      const x = new Date(weekStart); x.setDate(x.getDate()+d);
      const isToday = isoDate(x)===today;
      cal.insertAdjacentHTML('beforeend', `<div class="head ${d>4?'weekend':''} ${isToday?'today-col':''}">${names[d]}<br>${pad(x.getDate())}</div>`);
    }

    for(let h=8; h<=23; h++){
      const current = h===currentHour;
      cal.insertAdjacentHTML('beforeend', `<div class="time ${current?'current-hour':''}">${pad(h)}:00</div>`);
      for(let d=0; d<7; d++){
        const x = new Date(weekStart); x.setDate(x.getDate()+d);
        const day = isoDate(x), isToday = day===today;
        const box = document.createElement('div');
        box.className='cell '+(d>4?'weekend ':'')+(isToday?'today-col ':'')+(isToday&&current?'current-hour':'');
        box.dataset.date=day; box.dataset.time=pad(h)+':00';
        data.events.filter(e=>e.date===day&&Number((e.time||'00:00').slice(0,2))===h&&e.state!=='Archiviato').forEach(e=>{
          const b=document.createElement('button');
          b.className='event '+({Bassa:'low',Media:'medium',Alta:'high'}[e.priority]||'medium')+(e.state==='Completato'?' done':'');
          b.textContent=e.time+' '+e.title;
          b.onclick=ev=>{ev.stopPropagation();openEditor(e.id)};
          box.appendChild(b);
        });
        box.onclick=()=>openEditor(null,box.dataset.date,box.dataset.time);
        cal.appendChild(box);
      }
    }

    cal.insertAdjacentHTML('beforeend','<div class="time closing-time">24:00</div>');
    for(let d=0; d<7; d++) cal.insertAdjacentHTML('beforeend','<div class="cell closing-cell"></div>');
    const status=document.getElementById('status');
    if(status) status.textContent=`Attività: ${data.events.length} • Agenda 08:00–24:00 • Salvataggio locale`;
  };
  setTimeout(render,100);
})();