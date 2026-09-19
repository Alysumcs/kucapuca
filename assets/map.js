/* Interaktívna mapa okolia — Leaflet + OpenStreetMap (CARTO Positron) */
(function () {
  'use strict';
  if (!document.getElementById('map') || typeof L === 'undefined') return;

  var VILA = [44.28637, 15.06807];

  var POI = [
    { id:'vila',    cat:'vila',  n:'Villa Kuca Puca',  d:'Sepunatka 11/E, Vir',                         ll:VILA },
    { id:'pedinka', cat:'plaz',  n:'Pláž Pedinka',     d:'Najbližšia pláž — pešo za pár minút',         ll:[44.28836,15.05440] },
    { id:'jadro',   cat:'plaz',  n:'Pláž Jadro',       d:'Štrk s piesočnatým dnom, požičovne, reštaurácie', ll:[44.29709,15.08191] },
    { id:'radov',   cat:'plaz',  n:'Radovanjica',      d:'Kamenná pláž, plytká voda, občerstvenie',     ll:[44.29779,15.09335] },
    { id:'lucica',  cat:'plaz',  n:'Lučica',           d:'Štrk a kameň, pokojnejšia zátoka',            ll:[44.30625,15.08978] },
    { id:'malas',   cat:'plaz',  n:'Mala Slatina',     d:'Rodinná pláž, kaviarne, požičovňa vybavenia', ll:[44.30967,15.08336] },
    { id:'velikas', cat:'plaz',  n:'Velika Slatina',   d:'Široká štrková pláž na severe ostrova',       ll:[44.31616,15.07124] },
    { id:'bisk',    cat:'plaz',  n:'Biskupljača',      d:'Štrková pláž, vhodná pre rodiny',             ll:[44.31423,15.05622] },
    { id:'centrum', cat:'mesto', n:'Centrum Vir',      d:'Obchody, lekáreň, reštaurácie, trh',          ll:[44.30446,15.06749] },
    { id:'most',    cat:'mesto', n:'Virski most',      d:'Spojenie s pevninou — bez trajektu',          ll:[44.27958,15.12655] },
    { id:'nin',     cat:'vylet', n:'Nin',              d:'Kráľovské mesto, soľné polia, piesočné pláže',ll:[44.24307,15.18403] },
    { id:'trznica', cat:'vylet', n:'Tržnica Zadar',    d:'Ovocie, zelenina a ranný rybí trh',           ll:[44.11570,15.22798] },
    { id:'kalel',   cat:'vylet', n:'Kalelarga, Zadar', d:'Hlavná ulica starého mesta',                  ll:[44.11530,15.22579] },
    { id:'organy',  cat:'vylet', n:'Morské organy',    d:'More, ktoré hrá — a západ slnka',             ll:[44.11704,15.22000] }
  ];

  function km(a, b) {
    var R = 6371, t = Math.PI / 180;
    var dLat = (b[0]-a[0])*t, dLon = (b[1]-a[1])*t;
    var x = Math.sin(dLat/2)**2 + Math.cos(a[0]*t)*Math.cos(b[0]*t)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
  }
  function fmtKm(v) { return v < 1 ? Math.round(v*1000) + ' m' : (v < 10 ? v.toFixed(1) : Math.round(v)) + ' km'; }

  var host = document.getElementById('map');
  var villaOnly = host.dataset.mode === 'vila';

  var map = L.map('map', { scrollWheelZoom: false, zoomControl: true })
    .setView(villaOnly ? VILA : [44.27, 15.12], villaOnly ? 14 : 11);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(map);
  map.on('click', function () { map.scrollWheelZoom.enable(); });

  var ICON = { vila:'★', plaz:'≈', mesto:'●', vylet:'◆' };
  var markers = {};
  (villaOnly ? POI.filter(function (p) { return p.cat === 'vila' || p.id === 'pedinka' || p.id === 'centrum'; }) : POI).forEach(function (p) {
    var m = L.marker(p.ll, {
      icon: L.divIcon({ className: '', html: '<div class="kp-pin ' + p.cat + '">' + ICON[p.cat] + '</div>',
                        iconSize: [28,28], iconAnchor: [14,14], popupAnchor: [0,-14] })
    }).addTo(map);
    var dist = p.id === 'vila' ? '' : '<br><span style="color:#8C90A0">' + fmtKm(km(VILA, p.ll)) + ' od vily</span>';
    m.bindPopup('<b>' + p.n + '</b><br>' + p.d + dist);
    markers[p.id] = m;
  });
  if (!villaOnly) map.fitBounds(L.latLngBounds(POI.map(function (p) { return p.ll; })).pad(0.12));

  /* na kontakte iba mapka bez zoznamu */
  if (villaOnly) return;

  /* zoznam */
  var list = document.getElementById('poiList');
  function renderList(cat) {
    var items = POI.filter(function (p) { return cat === 'all' || p.cat === cat || p.id === 'vila'; });
    list.innerHTML = items.map(function (p) {
      return '<button class="poi" data-cat="' + p.cat + '" data-id="' + p.id + '">' +
        '<span class="dot"></span><span><b>' + p.n + '</b><small>' + p.d + '</small></span>' +
        '<span class="km">' + (p.id === 'vila' ? 'vila' : fmtKm(km(VILA, p.ll))) + '</span></button>';
    }).join('');
    list.querySelectorAll('.poi').forEach(function (el) {
      el.addEventListener('click', function () {
        var p = POI.filter(function (x) { return x.id === el.dataset.id; })[0];
        list.querySelectorAll('.poi').forEach(function (x) { x.classList.remove('active'); });
        el.classList.add('active');
        map.flyTo(p.ll, p.cat === 'vylet' ? 13 : 15, { duration: .8 });
        markers[p.id].openPopup();
      });
    });
  }
  renderList('all');

  document.querySelectorAll('.map-filters .chip').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('.map-filters .chip').forEach(function (x) { x.classList.remove('on'); });
      c.classList.add('on');
      renderList(c.dataset.cat);
      var sel = c.dataset.cat === 'all' ? POI : POI.filter(function (p) { return p.cat === c.dataset.cat || p.id === 'vila'; });
      map.flyToBounds(L.latLngBounds(sel.map(function (p) { return p.ll; })).pad(0.18), { duration: .8 });
    });
  });
})();
