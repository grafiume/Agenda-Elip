const CACHE='agenda-elip-v17';
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg','./audio-upgrade.js','./sync-upgrade.js','./calendar-upgrade.js','./agenda-view-upgrade.js','./mobile-editor-fix.js','./notification-upgrade.js','./hours-to-midnight.js','./responsive-layout.js','./image-paste-upgrade.js','./calendar-modes-upgrade.js','./desktop-camera-upgrade.js'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)))});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',event=>{
  if(event.request.mode==='navigate'){
    event.respondWith(fetch('./index.html',{cache:'no-store'}).then(async response=>{
      let html=await response.text();
      if(!html.includes('audio-upgrade.js')) html=html.replace('</body>','<script src="audio-upgrade.js?v=17"></script></body>');
      if(!html.includes('sync-upgrade.js')) html=html.replace('</body>','<script src="sync-upgrade.js?v=17"></script></body>');
      if(!html.includes('calendar-upgrade.js')) html=html.replace('</body>','<script src="calendar-upgrade.js?v=17"></script></body>');
      if(!html.includes('agenda-view-upgrade.js')) html=html.replace('</body>','<script src="agenda-view-upgrade.js?v=17"></script></body>');
      if(!html.includes('mobile-editor-fix.js')) html=html.replace('</body>','<script src="mobile-editor-fix.js?v=17"></script></body>');
      if(!html.includes('notification-upgrade.js')) html=html.replace('</body>','<script src="notification-upgrade.js?v=17"></script></body>');
      if(!html.includes('hours-to-midnight.js')) html=html.replace('</body>','<script src="hours-to-midnight.js?v=17"></script></body>');
      if(!html.includes('responsive-layout.js')) html=html.replace('</body>','<script src="responsive-layout.js?v=17"></script></body>');
      if(!html.includes('image-paste-upgrade.js')) html=html.replace('</body>','<script src="image-paste-upgrade.js?v=17"></script></body>');
      if(!html.includes('calendar-modes-upgrade.js')) html=html.replace('</body>','<script src="calendar-modes-upgrade.js?v=17"></script></body>');
      if(!html.includes('desktop-camera-upgrade.js')) html=html.replace('</body>','<script src="desktop-camera-upgrade.js?v=17"></script></body>');
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