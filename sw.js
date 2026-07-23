const CACHE='agenda-elip-v7';
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg','./audio-upgrade.js','./sync-upgrade.js','./calendar-upgrade.js','./agenda-view-upgrade.js'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)))});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',event=>{
  if(event.request.mode==='navigate'){
    event.respondWith(fetch('./index.html',{cache:'no-store'}).then(async response=>{
      let html=await response.text();
      if(!html.includes('audio-upgrade.js')) html=html.replace('</body>','<script src="audio-upgrade.js?v=7"></script></body>');
      if(!html.includes('sync-upgrade.js')) html=html.replace('</body>','<script src="sync-upgrade.js?v=7"></script></body>');
      if(!html.includes('calendar-upgrade.js')) html=html.replace('</body>','<script src="calendar-upgrade.js?v=7"></script></body>');
      if(!html.includes('agenda-view-upgrade.js')) html=html.replace('</body>','<script src="agenda-view-upgrade.js?v=7"></script></body>');
      return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
