(()=>{
  if(document.getElementById('agendaModernUI23')) return;
  const s=document.createElement('style'); s.id='agendaModernUI23';
  s.textContent=`
  :root{--elip:#287642;--elip-dark:#195b31;--surface:#fff;--canvas:#f3f6f4;--ink:#17211b;--soft:#68736c;--stroke:#dfe6e1;--shadow:0 8px 28px rgba(24,55,36,.08)}
  html,body{background:var(--canvas)!important;color:var(--ink)!important}
  .app{max-width:1800px;margin:0 auto;background:var(--canvas)}
  header{background:rgba(255,255,255,.94)!important;border:0!important;box-shadow:0 1px 0 var(--stroke);backdrop-filter:blur(18px)!important}
  .toolbar{padding:12px 18px!important;gap:8px!important;overflow-x:auto}
  .toolbar:before{content:'AGENDA ELIP';font-weight:900;letter-spacing:.055em;color:var(--elip);font-size:17px;margin-right:10px;white-space:nowrap}
  button{border:1px solid var(--stroke)!important;background:#fff!important;color:#34453a!important;border-radius:10px!important;padding:9px 13px!important;font-weight:650;box-shadow:0 1px 2px rgba(0,0,0,.025);transition:.16s ease}
  button:hover{transform:translateY(-1px);border-color:#bdcbc1!important;box-shadow:0 4px 12px rgba(24,55,36,.08)}
  button.primary,#newEvent{background:var(--elip)!important;color:#fff!important;border-color:var(--elip)!important;box-shadow:0 4px 12px rgba(40,118,66,.18)}
  .week-title{font-size:17px!important;color:#34453a;padding:0 18px 12px!important}
  .calendar-wrap{margin:14px 16px 0;border:1px solid var(--stroke);border-radius:16px;box-shadow:var(--shadow);overflow:auto!important;background:#fff!important}
  .calendar{background:#fff}
  .head{background:#f7faf8!important;color:#34453a;border-color:#e5ebe7!important;font-size:13px;letter-spacing:.01em}
  .time{background:#fbfcfb!important;color:#7a847d!important;border-color:#edf0ee!important;font-weight:600}
  .cell{border-color:#edf0ee!important;background:#fff;transition:background .12s ease}
  .cell:hover{background:#f8fbf9!important}
  .event{border-radius:7px!important;border-left:4px solid rgba(0,0,0,.16)!important;padding:7px 8px!important;font-weight:650!important;box-shadow:0 1px 3px rgba(0,0,0,.05);font-size:12.5px!important}
  .event.low{background:#e7f4e9!important;border-left-color:#4c9b60!important}.event.medium{background:#fff3cb!important;border-left-color:#d7a82c!important}.event.high{background:#fde3e3!important;border-left-color:#d94b4b!important}
  .notes-grid{gap:14px!important;padding:16px!important}
  .note-card{border:1px solid var(--stroke)!important;border-radius:14px!important;box-shadow:0 5px 18px rgba(24,55,36,.055);background:#fff!important}
  .note-card h3{padding:12px 14px!important;background:#f8faf8!important;color:#2d3b31!important;border-bottom:1px solid var(--stroke);font-size:14px!important}
  .note-card.green h3:before{content:'☎  '}.note-card.blue h3:before{content:'✎  '}.note-card.orange h3:before{content:'↗  '}
  .note-card textarea{min-height:100px!important;padding:13px!important;color:#26322a}
  .status{padding:4px 18px 18px!important;color:#7b857e!important}
  dialog{border-radius:18px!important;box-shadow:0 24px 80px rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.5)!important}
  dialog::backdrop{background:rgba(20,29,23,.42)!important;backdrop-filter:blur(3px)}
  .modal{padding:22px!important}.modal h2{font-size:22px;color:#1e3024}
  label{font-size:13px;color:#526057;margin-top:14px!important}
  input,select,textarea{border:1px solid #dce4de!important;border-radius:10px!important;padding:11px 12px!important;outline:none;transition:.15s}
  input:focus,select:focus,textarea:focus{border-color:#6ca47d!important;box-shadow:0 0 0 3px rgba(40,118,66,.10)}
  .actions{padding-top:10px;border-top:1px solid #eef1ef}
  #saveBtn{min-width:110px}
  @media(min-width:900px){.notes-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.calendar-wrap{width:calc(100% - 32px)}.calendar{width:100%!important;min-width:0!important;grid-template-columns:72px repeat(7,minmax(105px,1fr))!important}}
  @media(max-width:700px){.toolbar{padding:9px 10px!important}.toolbar:before{font-size:14px;margin-right:4px}.calendar-wrap{margin:8px 6px 0;border-radius:12px}.notes-grid{padding:10px!important}.week-title{font-size:15px!important;padding-bottom:9px!important}}
  `;
  document.head.appendChild(s);
})();