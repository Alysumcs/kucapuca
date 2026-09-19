/* Interaktívna mapa okolia — Leaflet + OpenStreetMap (CARTO Positron) */
(function () {
  'use strict';
  if (!document.getElementById('map') || typeof L === 'undefined') return;

  /* Súradnice sú prevzaté z OpenStreetMap (Overpass API), poloha vily
     z pôvodného webu. Pláže sú zoradené podľa vzdialenosti od vily automaticky. */
  var VILA = [44.28995, 15.06214];

  var POI = [
    { id:'vila', cat:'vila', n:'Villa Kuca Puca', d:'Sepunatka 11/E, Vir', ll:VILA },

    /* --- pláže ---------------------------------------------------------- */
    { id:'pedinka',  cat:'plaz', n:'Pedinka',        d:'Oblázky · najbližšia pláž od vily',      ll:[44.28534,15.05845] },
    { id:'sapavac',  cat:'plaz', n:'Sapavac',        d:'Oblázky · pri centre Viru',              ll:[44.29355,15.07595] },
    { id:'jadroz',   cat:'plaz', n:'Jadro — západ',  d:'Oblázky · hlavná mestská pláž, požičovne a reštaurácie', ll:[44.29708,15.08243] },
    { id:'jadroi',   cat:'plaz', n:'Jadro — východ', d:'Jemný štrk · pokračovanie mestskej pláže', ll:[44.29730,15.08687] },
    { id:'radov',    cat:'plaz', n:'Radovanjica',    d:'Oblázky · plytká voda, vhodná pre deti', ll:[44.29779,15.09357] },
    { id:'miljk',    cat:'plaz', n:'Miljkovica',     d:'Malá zátoka na južnom pobreží',          ll:[44.29320,15.10920] },
    { id:'lucica',   cat:'plaz', n:'Lučica',         d:'Štrk · pokojnejšia zátoka',              ll:[44.30812,15.09306] },
    { id:'malas',    cat:'plaz', n:'Mala Slatina',   d:'Severovýchodné pobrežie, kaviarne',      ll:[44.30968,15.08343] },
    { id:'velikas',  cat:'plaz', n:'Velika Slatina', d:'Široká štrková pláž na severe',          ll:[44.31649,15.07339] },
    { id:'skrpin',   cat:'plaz', n:'Škrpinica',      d:'Severné pobrežie ostrova',               ll:[44.31790,15.06024] },
    { id:'bisk',     cat:'plaz', n:'Biskupljača',    d:'Severozápadné pobrežie, vhodná pre rodiny', ll:[44.31711,15.05588] },
    { id:'bura',     cat:'plaz', n:'Bura',           d:'Severozápadný cíp ostrova',              ll:[44.31974,15.05187] },
    { id:'zitna',    cat:'plaz', n:'Žitna',          d:'Východné pobrežie',                      ll:[44.30706,15.10283] },
    { id:'lakirka',  cat:'plaz', n:'Lakirka',        d:'Východné pobrežie',                      ll:[44.30420,15.11010] },
    { id:'straza',   cat:'plaz', n:'Straža',         d:'Skaly · dobré na šnorchlovanie',         ll:[44.30143,15.11426] },
    { id:'soldat',   cat:'plaz', n:'Soldatica',      d:'Štrk · juhovýchodné pobrežie',           ll:[44.29777,15.11905] },
    { id:'prezida',  cat:'plaz', n:'Gornja Prezida', d:'Oblázky · juhovýchod ostrova',           ll:[44.29448,15.12194] },
    { id:'sarina',   cat:'plaz', n:'Sarina',         d:'Juhovýchodné pobrežie',                  ll:[44.29180,15.12425] },
    { id:'skoljic',  cat:'plaz', n:'Školjić',        d:'Piesok · pri moste na pevninu',          ll:[44.28247,15.13609] },
    { id:'lanterna', cat:'plaz', n:'Lanterna',       d:'Západný cíp ostrova, pri majáku',        ll:[44.30312,15.02607] },
    { id:'ricina',   cat:'plaz', n:'Ričina',         d:'Severovýchodný cíp ostrova',             ll:[44.32906,15.13226] },

    /* --- na ostrove ----------------------------------------------------- */
    { id:'centrum',  cat:'mesto', n:'Centrum Vir',      d:'Obchody, reštaurácie, kaviarne',         ll:[44.30021,15.08652] },
    { id:'luka',     cat:'mesto', n:'Prístav Luka Vir', d:'Mólo, výletné lode a rybári',            ll:[44.29679,15.08478] },
    { id:'tommy',    cat:'mesto', n:'Supermarket Tommy',d:'Najbližšie väčšie potraviny',            ll:[44.30175,15.08125] },
    { id:'lekaren',  cat:'mesto', n:'Lekáreň Kapović',  d:'Lekáreň v centre Viru',                  ll:[44.30228,15.08378] },
    { id:'kastel',   cat:'mesto', n:'Kaštelina',        d:'Zvyšky pevnosti nad morom',              ll:[44.29111,15.07704] },
    { id:'majak',    cat:'mesto', n:'Maják Lanterna',   d:'Maják na západnom cípe ostrova',         ll:[44.30312,15.02618] },
    { id:'most',     cat:'mesto', n:'Virski most',      d:'Spojenie s pevninou — bez trajektu',     ll:[44.27958,15.12655] },

    /* --- výlety --------------------------------------------------------- */
    { id:'nin',      cat:'vylet', n:'Nin',              d:'Kráľovské mesto, soľné polia, piesočné pláže', ll:[44.24307,15.18403] },
    { id:'kalel',    cat:'vylet', n:'Kalelarga, Zadar', d:'Hlavná ulica starého mesta',             ll:[44.11530,15.22579] },
    { id:'organy',   cat:'vylet', n:'Morské organy',    d:'More, ktoré hrá — a západ slnka',        ll:[44.11704,15.22000] },
    { id:'trznica',  cat:'vylet', n:'Tržnica Zadar',    d:'Ovocie, zelenina a ranný rybí trh',      ll:[44.11570,15.22798] },
    { id:'pagmost',  cat:'vylet', n:'Paški most',       d:'Most na ostrov Pag',                     ll:[44.32517,15.25768] },
    { id:'pag',      cat:'vylet', n:'Pag — mesto',      d:'Staré mesto, čipka a paški sir',         ll:[44.44383,15.05447] },
    { id:'solana',   cat:'vylet', n:'Soľné polia Pag',  d:'Paška solana — soľ sa tu ťaží dodnes',   ll:[44.42258,15.08361] },
    { id:'novalja',  cat:'vylet', n:'Novalja, Pag',     d:'Mesto na severe ostrova Pag',            ll:[44.55612,14.88447] },
    { id:'zrce',     cat:'vylet', n:'Zrće, Pag',        d:'Známa plážová scéna pri Novalji',        ll:[44.53924,14.91461] }
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
  /* OpenStreetMap — bez API kľúča a bez registrácie.
     Tlmený vzhľad rieši CSS filter na .leaflet-tile-pane (viď style.css). */
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  map.on('click', function () { map.scrollWheelZoom.enable(); });

  window.KPMAP = map;   // pomôcka na ladenie

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
  var islandPOI = POI.filter(function (p) { return p.cat !== 'vylet'; });
  if (!villaOnly) map.fitBounds(L.latLngBounds(islandPOI.map(function (p) { return p.ll; })).pad(0.14));

  /* Leaflet si musí rozmery prepočítať, keď kontajner dostane skutočnú veľkosť
     (reveal animácia, načítanie fontov, zmena okna, otočenie telefónu).
     Bez toho sa vykreslí len časť dlaždíc a zvyšok ostane sivý. */
  function refresh() { map.invalidateSize({ animate: false }); }
  map.whenReady(refresh);
  [60, 250, 600, 1200].forEach(function (t) { setTimeout(refresh, t); });
  window.addEventListener('resize', refresh);
  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  if (window.ResizeObserver) new ResizeObserver(refresh).observe(host);
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) refresh(); });
    }, { threshold: 0.01 }).observe(host);
  }

  /* na kontakte iba mapka bez zoznamu */
  if (villaOnly) return;

  /* zoznam */
  var list = document.getElementById('poiList');
  function renderList(cat) {
    var items = POI.filter(function (p) { return cat === 'all' || p.cat === cat || p.id === 'vila'; })
      .slice().sort(function (a, b) {
        if (a.id === 'vila') return -1;
        if (b.id === 'vila') return 1;
        return km(VILA, a.ll) - km(VILA, b.ll);
      });
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
      var sel = c.dataset.cat === 'all' ? islandPOI : POI.filter(function (p) { return p.cat === c.dataset.cat || p.id === 'vila'; });
      map.flyToBounds(L.latLngBounds(sel.map(function (p) { return p.ll; })).pad(0.18), { duration: .8 });
    });
  });
})();
