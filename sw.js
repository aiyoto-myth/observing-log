/* Offline copy of the app for dark sites with no signal: answer from the cache at once, refresh it in the background.
   Only the app page itself is cached (any ?via= / ?bought= URL maps to it); other pages go to the network. */
var C = 'olog-78b887374b';
var APP = new URL('./', self.location).pathname;   // /observing-log/
self.addEventListener('install', function(e){ e.waitUntil(caches.open(C).then(function(c){ return c.addAll(['./', './manifest.webmanifest', './icon-192.png']); })); self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k.indexOf('olog-')===0 && k!==C; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  if(u.origin !== self.location.origin) return;
  var isApp = u.pathname === APP || u.pathname === APP + 'index.html';
  var isMan = u.pathname === APP + 'manifest.webmanifest';
  if(!isApp && !isMan) return;
  var key = isApp ? './' : './manifest.webmanifest';
  e.respondWith(caches.open(C).then(function(c){
    return c.match(key).then(function(hit){
      var net = fetch(e.request).then(function(r){ if(r && r.ok && r.type==='basic') c.put(key, r.clone()); return r; });
      if(hit){ e.waitUntil(net.catch(function(){})); return hit; }
      return net;
    });
  }));
});
