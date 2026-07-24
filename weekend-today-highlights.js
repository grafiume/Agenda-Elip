(() => {
  if (document.getElementById('weekendTodayHighlightStyle')) return;

  const style = document.createElement('style');
  style.id = 'weekendTodayHighlightStyle';
  style.textContent = `
    .elip-saturday{background:#e6f3ff!important}
    .elip-sunday{background:#ffe7e7!important}
    .head.elip-saturday,.month-weekday.elip-saturday,.mini-head.elip-saturday{background:#cfe9ff!important;color:#155d8f!important}
    .head.elip-sunday,.month-weekday.elip-sunday,.mini-head.elip-sunday{background:#ffd2d2!important;color:#a51f1f!important}
    .elip-today{box-shadow:inset 0 0 0 3px #d93025!important;outline:0!important}
  `;
  document.head.appendChild(style);

  const pad = n => String(n).padStart(2,'0');
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  };
  const currentHourKey = () => `${pad(new Date().getHours())}:00`;

  function clearClasses(root=document){
    root.querySelectorAll('.elip-saturday,.elip-sunday,.elip-today').forEach(el=>{
      el.classList.remove('elip-saturday','elip-sunday','elip-today');
    });
  }

  function markWeek(){
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    const heads = calendar.querySelectorAll('.head:not(.corner)');
    heads[5]?.classList.add('elip-saturday');
    heads[6]?.classList.add('elip-sunday');

    const today = todayKey();
    const currentHour = currentHourKey();
    calendar.querySelectorAll('.cell[data-date]').forEach(cell=>{
      const d = new Date(`${cell.dataset.date}T12:00:00`);
      if (d.getDay() === 6) cell.classList.add('elip-saturday');
      if (d.getDay() === 0) cell.classList.add('elip-sunday');
      if (cell.dataset.date === today && cell.dataset.time === currentHour) {
        cell.classList.add('elip-today');
      }
    });
  }

  function markMonth(){
    document.querySelectorAll('.month-grid').forEach(grid=>{
      const heads = grid.querySelectorAll('.month-weekday');
      heads[5]?.classList.add('elip-saturday');
      heads[6]?.classList.add('elip-sunday');
      grid.querySelectorAll('.month-day').forEach((cell,index)=>{
        const col = index % 7;
        if (col === 5) cell.classList.add('elip-saturday');
        if (col === 6) cell.classList.add('elip-sunday');
        if (cell.classList.contains('today')) cell.classList.add('elip-today');
      });
    });
  }

  function markYear(){
    document.querySelectorAll('.year-month').forEach((card,monthIndex)=>{
      const heads = card.querySelectorAll('.mini-head');
      heads[5]?.classList.add('elip-saturday');
      heads[6]?.classList.add('elip-sunday');
      const yearText = document.getElementById('weekTitle')?.textContent || '';
      const match = yearText.match(/(\d{4})/);
      const year = match ? Number(match[1]) : new Date().getFullYear();
      card.querySelectorAll('.mini-day').forEach(dayEl=>{
        const day = Number(dayEl.textContent);
        if (!day) return;
        const d = new Date(year,monthIndex,day);
        if (d.getDay() === 6) dayEl.classList.add('elip-saturday');
        if (d.getDay() === 0) dayEl.classList.add('elip-sunday');
        if (dayEl.classList.contains('today')) dayEl.classList.add('elip-today');
      });
    });
  }

  let scheduled = false;
  function apply(){
    scheduled = false;
    clearClasses();
    markWeek();
    markMonth();
    markYear();
  }
  function schedule(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  }

  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',schedule);
  setInterval(schedule,60000);
  schedule();
})();