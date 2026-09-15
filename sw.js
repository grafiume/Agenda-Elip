const CACHE='agenda-elip-v23';
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg','./audio-upgrade.js','./sync-upgrade.js','./agenda-view-upgrade.js','./mobile-editor-fix.js','./notification-upgrade.js','./hours-to-midnight.js','./responsive-layout.js','./image-paste-upgrade.js','./calendar-modes-upgrade.js','./desktop-camera-upgrade.js','./export-html-upgrade.js','./photo-persistence-fix.js','./weekend-today-highlights.js','./home-cleanup.js','./modern-ui-v23.js'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)))});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',event=>{
  if(event.request.mode==='navigate'){
    event.respondWith(fetch('./index.html',{cache:'no-store'}).then(async response=>{
      let html=await response.text();
      const mods=['audio-upgrade.js','sync-upgrade.js','agenda-view-upgrade.js','mobile-editor-fix.js','notification-upgrade.js','hours-to-midnight.js','responsive-layout.js','image-paste-upgrade.js','calendar-modes-upgrade.js','desktop-camera-upgrade.js','export-html-upgrade.js','photo-persistence-fix.js','weekend-today-highlights.js','home-cleanup.js','modern-ui-v23.js'];
      for(const mod of mods){if(!html.includes(mod)) html=html.replace('</body>',`<script src="${mod}?v=23"></script></body>`)}
      return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request)));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){if('focus' in client)return client.focus();}
    if(clients.openWindow)return clients.openWindow('./');
  }));
});