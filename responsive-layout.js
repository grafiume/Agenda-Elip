(() => {
  const style = document.createElement('style');
  style.id = 'agenda-responsive-layout';
  style.textContent = `
    html,body,.app{width:100%;max-width:none;overflow-x:hidden}
    header{width:100%}
    .calendar-wrap{width:100%;max-width:none;overflow-x:auto;overflow-y:visible;background:#fff}
    .calendar{
      width:100%;
      min-width:0;
      grid-template-columns:68px repeat(7,minmax(0,1fr)) !important;
    }
    .head,.time,.cell{min-width:0}
    .event{width:100%;max-width:100%;overflow:hidden}
    @media (min-width:900px){
      .calendar-wrap{overflow-x:hidden}
      .calendar{min-width:100%}
    }
    @media (max-width:899px){
      .calendar{min-width:964px;grid-template-columns:68px repeat(7,128px) !important}
    }
  `;
  document.head.appendChild(style);

  function scrollToCurrentHour() {
    const current = document.querySelector('.time.current-hour');
    if (!current) return;
    const header = document.querySelector('header');
    const offset = (header?.offsetHeight || 0) + 10;
    const top = current.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  const todayBtn = document.getElementById('today');
  if (todayBtn) {
    todayBtn.addEventListener('click', () => setTimeout(scrollToCurrentHour, 180));
  }

  window.addEventListener('resize', () => {
    const calendar = document.getElementById('calendar');
    if (calendar) calendar.style.width = '100%';
  });

  setTimeout(() => {
    const calendar = document.getElementById('calendar');
    if (calendar) calendar.style.width = '100%';
  }, 300);
})();
