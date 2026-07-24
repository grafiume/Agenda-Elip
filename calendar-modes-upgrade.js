(() => {
  if (document.getElementById('agendaViewModes')) return;

  const toolbar = document.querySelector('.toolbar');
  const calendarWrap = document.querySelector('.calendar-wrap');
  const notesGrid = document.querySelector('.notes-grid');
  const titleEl = document.getElementById('weekTitle');
  const statusEl = document.getElementById('status');
  const oldHistoryBtn = document.getElementById('historyBtn');
  if (!toolbar || !calendarWrap || !titleEl) return;

  let mode = localStorage.getItem('agendaElipView') || 'week';
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const style = document.createElement('style');
  style.textContent = `
    .agenda-view-modes{display:flex;gap:6px;align-items:center}
    .agenda-view-modes button.active{background:#287642;color:#fff;border-color:#287642}
    #agendaAlternativeView{background:#fff;min-height:420px;padding:12px}
    .month-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-top:1px solid var(--line);border-left:1px solid var(--line)}
    .month-weekday,.month-day{border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
    .month-weekday{padding:9px 4px;text-align:center;font-weight:700;background:#f4f8f2}
    .month-day{min-height:112px;padding:6px;background:#fff;overflow:hidden;cursor:pointer}
    .month-day.other-month{background:#fafafa;color:#999}
    .month-day.today{box-shadow:inset 0 0 0 2px #287642}
    .month-day-number{font-weight:700;margin-bottom:5px}
    .month-event{display:block;width:100%;border:0;border-radius:7px;padding:5px 6px;margin:3px 0;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;color:#222}
    .month-event.low{background:var(--green)}.month-event.medium{background:var(--yellow)}.month-event.high{background:var(--red)}.month-event.done{text-decoration:line-through;opacity:.65}
    .month-more{font-size:12px;color:var(--muted);padding:2px}
    .year-grid{display:grid;grid-template-columns:repeat(3,minmax(240px,1fr));gap:12px}
    .year-month{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}
    .year-month h3{margin:0;padding:10px;text-align:center;background:#f4f8f2;cursor:pointer}
    .mini-grid{display:grid;grid-template-columns:repeat(7,1fr);padding:7px;gap:2px}
    .mini-head,.mini-day{text-align:center;font-size:11px;padding:4px 1px;border-radius:5px}
    .mini-head{font-weight:700;color:var(--muted)}
    .mini-day.has-events{background:#dfeedd;font-weight:700;cursor:pointer}
    .mini-day.today{outline:2px solid #287642}
    .history-panel{max-width:1050px;margin:0 auto}
    .history-filters{display:grid;grid-template-columns:2fr repeat(4,1fr);gap:8px;margin-bottom:12px}
    .history-results{display:grid;gap:9px}
    .history-card{border:1px solid var(--line);border-radius:13px;padding:12px;background:#fff;cursor:pointer}
    .history-card:hover{background:#fafafa}.history-card h3{margin:0 0 6px;font-size:16px}.history-meta{font-size:13px;color:var(--muted);margin-bottom:6px}.history-note{white-space:pre-wrap;overflow-wrap:anywhere}.history-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.history-badge{font-size:12px;background:#f0f0ed;border-radius:999px;padding:4px 7px}
    @media(max-width:850px){.year-grid{grid-template-columns:1fr}.history-filters{grid-template-columns:1fr 1fr}.month-day{min-height:82px;padding:4px}.month-event{font-size:10px;padding:4px}.month-weekday{font-size:12px}.agenda-view-modes button{padding:9px 8px}}
    @media(max-width:520px){.history-filters{grid-template-columns:1fr}.month-day{min-height:68px}.month-event{max-height:22px}.month-day-number{font-size:12px}}
  `;
  document.head.appendChild(style);

  const modes = document.createElement('div');
  modes.id = 'agendaViewModes';
  modes.className = 'agenda-view-modes';
  modes.innerHTML = `
    <button type="button" data-view="week">Settimana</button>
    <button type="button" data-view="month">Mese</button>
    <button type="button" data-view="year">Anno</button>
    <button type="button" data-view="history">Storico</button>`;
  toolbar.insertBefore(modes, document.getElementById('newEvent'));
  if (oldHistoryBtn) oldHistoryBtn.classList.add('hidden');

  const alt = document.createElement('div');
  alt.id = 'agendaAlternativeView';
  alt.className = 'hidden';
  calendarWrap.insertAdjacentElement('afterend', alt);

  const pad2 = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  const monthName = d => new Intl.DateTimeFormat('it-IT', {month:'long', year:'numeric'}).format(d);
  const fullDate = d => new Intl.DateTimeFormat('it-IT', {day:'2-digit', month:'long', year:'numeric'}).format(d);
  const priorityClass = p => ({Bassa:'low',Media:'medium',Alta:'high'}[p] || 'medium');

  function setVisibility(custom) {
    calendarWrap.classList.toggle('hidden', custom);
    alt.classList.toggle('hidden', !custom);
    if (notesGrid) notesGrid.classList.toggle('hidden', custom);
  }

  function activeButtons() {
    modes.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.view === mode));
  }

  async function renderMonth() {
    const data = await getData();
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const today = iso(new Date());
    titleEl.textContent = monthName(first).replace(/^./, c => c.toUpperCase());
    alt.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'month-grid';
    ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].forEach(n => {
      const h = document.createElement('div'); h.className='month-weekday'; h.textContent=n; grid.appendChild(h);
    });
    for (let i=0;i<42;i++) {
      const d = new Date(gridStart); d.setDate(gridStart.getDate()+i);
      const dateKey = iso(d);
      const cell = document.createElement('div');
      cell.className = 'month-day' + (d.getMonth()!==first.getMonth()?' other-month':'') + (dateKey===today?' today':'');
      const num = document.createElement('div'); num.className='month-day-number'; num.textContent=d.getDate(); cell.appendChild(num);
      const events = data.events.filter(e => e.date===dateKey && e.state!=='Archiviato').sort((a,b)=>(a.time||'').localeCompare(b.time||''));
      events.slice(0,3).forEach(e => {
        const b=document.createElement('button'); b.type='button'; b.className=`month-event ${priorityClass(e.priority)}${e.state==='Completato'?' done':''}`; b.textContent=`${e.time||''} ${e.title||''}`;
        b.onclick=ev=>{ev.stopPropagation();openEditor(e.id)}; cell.appendChild(b);
      });
      if(events.length>3){const more=document.createElement('div');more.className='month-more';more.textContent=`+${events.length-3} altre`;cell.appendChild(more)}
      cell.onclick=()=>openEditor(null,dateKey,'09:00');
      grid.appendChild(cell);
    }
    alt.appendChild(grid);
    statusEl.textContent = `Mese: ${data.events.filter(e=>e.date?.startsWith(`${first.getFullYear()}-${pad2(first.getMonth()+1)}`)).length} attività salvate`;
  }

  async function renderYear() {
    const data = await getData();
    const year = cursor.getFullYear();
    const today = iso(new Date());
    titleEl.textContent = `Anno ${year}`;
    alt.innerHTML='';
    const wrap=document.createElement('div');wrap.className='year-grid';
    for(let m=0;m<12;m++){
      const monthDate=new Date(year,m,1);const card=document.createElement('section');card.className='year-month';
      const h=document.createElement('h3');h.textContent=new Intl.DateTimeFormat('it-IT',{month:'long'}).format(monthDate).replace(/^./,c=>c.toUpperCase());h.onclick=()=>{cursor=new Date(year,m,1);setMode('month')};card.appendChild(h);
      const grid=document.createElement('div');grid.className='mini-grid';['L','M','M','G','V','S','D'].forEach(x=>{const e=document.createElement('div');e.className='mini-head';e.textContent=x;grid.appendChild(e)});
      const blank=(monthDate.getDay()+6)%7;for(let i=0;i<blank;i++){grid.appendChild(document.createElement('div'))}
      const days=new Date(year,m+1,0).getDate();
      for(let day=1;day<=days;day++){
        const d=new Date(year,m,day),key=iso(d);const count=data.events.filter(e=>e.date===key).length;const el=document.createElement('div');el.className='mini-day'+(count?' has-events':'')+(key===today?' today':'');el.textContent=day;el.title=count?`${count} attività`:'';el.onclick=()=>{cursor=new Date(year,m,1);setMode('month')};grid.appendChild(el);
      }
      card.appendChild(grid);wrap.appendChild(card);
    }
    alt.appendChild(wrap);
    statusEl.textContent=`Anno ${year}: ${data.events.filter(e=>e.date?.startsWith(String(year))).length} attività salvate`;
  }

  async function renderHistory() {
    const data=await getData();
    titleEl.textContent='Storico e ricerca';
    alt.innerHTML=`<div class="history-panel"><div class="history-filters">
      <input id="histSearch" placeholder="Cerca titolo o testo della nota">
      <input id="histFrom" type="date" title="Dal giorno">
      <input id="histTo" type="date" title="Al giorno">
      <select id="histState"><option value="">Tutti gli stati</option><option>Da fare</option><option>In corso</option><option>Completato</option><option>Archiviato</option></select>
      <select id="histAttach"><option value="">Tutti gli allegati</option><option value="photo">Con foto</option><option value="audio">Con audio</option><option value="media">Con foto o audio</option></select>
    </div><div id="histCount" class="status"></div><div id="histResults" class="history-results"></div></div>`;
    const search=document.getElementById('histSearch'),from=document.getElementById('histFrom'),to=document.getElementById('histTo'),state=document.getElementById('histState'),attach=document.getElementById('histAttach');
    const draw=()=>{
      const q=search.value.trim().toLocaleLowerCase('it');
      const list=[...data.events].filter(e=>{
        const text=`${e.title||''} ${e.notes||''}`.toLocaleLowerCase('it');
        return (!q||text.includes(q))&&(!from.value||e.date>=from.value)&&(!to.value||e.date<=to.value)&&(!state.value||e.state===state.value)&&(!attach.value||(attach.value==='photo'&&e.photo)||(attach.value==='audio'&&e.audio)||(attach.value==='media'&&(e.photo||e.audio)));
      }).sort((a,b)=>`${b.date||''}${b.time||''}`.localeCompare(`${a.date||''}${a.time||''}`));
      document.getElementById('histCount').textContent=`Trovate ${list.length} note/appuntamenti`;
      const results=document.getElementById('histResults');results.innerHTML='';
      list.forEach(e=>{
        const card=document.createElement('article');card.className='history-card';
        const date=e.date?fullDate(new Date(`${e.date}T12:00:00`)):'';
        card.innerHTML=`<h3>${escapeHtml(e.title||'Senza titolo')}</h3><div class="history-meta">${escapeHtml(date)} · ${escapeHtml(e.time||'')} · ${escapeHtml(e.state||'')}</div>${e.notes?`<div class="history-note">${escapeHtml(e.notes)}</div>`:''}<div class="history-badges">${e.photo?'<span class="history-badge">📷 Foto</span>':''}${e.audio?'<span class="history-badge">🎤 Audio</span>':''}<span class="history-badge">${escapeHtml(e.priority||'Media')}</span></div>`;
        card.onclick=()=>openEditor(e.id);results.appendChild(card);
      });
      if(!list.length) results.innerHTML='<div class="history-card">Nessun risultato con questi filtri.</div>';
    };
    [search,from,to,state,attach].forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',draw));draw();
    statusEl.textContent=`Archivio completo: ${data.events.length} attività`;
  }

  function escapeHtml(value){const d=document.createElement('div');d.textContent=String(value??'');return d.innerHTML}

  async function renderCurrent(){
    activeButtons();
    localStorage.setItem('agendaElipView',mode);
    if(mode==='week'){
      setVisibility(false);
      await render();
      return;
    }
    setVisibility(true);
    if(mode==='month') await renderMonth();
    else if(mode==='year') await renderYear();
    else await renderHistory();
  }

  function setMode(next){mode=next;renderCurrent()}
  modes.querySelectorAll('button').forEach(b=>b.onclick=()=>setMode(b.dataset.view));

  document.getElementById('prev').onclick=()=>{
    if(mode==='week'){weekStart.setDate(weekStart.getDate()-7);renderCurrent()}
    else if(mode==='month'){cursor.setMonth(cursor.getMonth()-1);renderCurrent()}
    else if(mode==='year'){cursor.setFullYear(cursor.getFullYear()-1);renderCurrent()}
  };
  document.getElementById('next').onclick=()=>{
    if(mode==='week'){weekStart.setDate(weekStart.getDate()+7);renderCurrent()}
    else if(mode==='month'){cursor.setMonth(cursor.getMonth()+1);renderCurrent()}
    else if(mode==='year'){cursor.setFullYear(cursor.getFullYear()+1);renderCurrent()}
  };
  document.getElementById('today').onclick=()=>{
    cursor=new Date();cursor.setHours(0,0,0,0);weekStart=startOfWeek(new Date());
    if(mode==='history') mode='week';
    renderCurrent();
  };
  document.getElementById('eventDialog')?.addEventListener('close',()=>{if(mode!=='week')setTimeout(renderCurrent,100)});

  setTimeout(renderCurrent,300);
})();