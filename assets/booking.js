/* ==========================================================================
   Villa Kuca Puca — rezervačný modul (prototyp)
   Dáta sú uložené v prehliadači (localStorage). Admin aj verejná stránka
   čítajú ten istý kľúč, takže zmena v admine sa hneď prejaví v obsadenosti.
   Neskôr stačí nahradiť KP.load()/KP.save() volaním na API WordPress pluginu.
   ========================================================================== */
window.KP = (function () {
  'use strict';

  var KEY = 'kp_bookings_v1';
  var PIN = '0000';            // demo PIN do admin časti — zmeň si ho tu
  var APARTMENTS = [
    { id: 'app1', name: 'Kuca', code: 'APP1', cap: '6+1', price: 150 },
    { id: 'app2', name: 'Puca', code: 'APP2', cap: '4+1', price: 130 }
  ];
  var MONTHS = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December'];
  var DOW = ['Po','Ut','St','Št','Pi','So','Ne'];

  var SEED = [
    { id: 's1', apt: 'app1', from: '2026-06-13', to: '2026-06-20', name: 'Rodina Horváthová', status: 'busy', note: '6 osôb' },
    { id: 's2', apt: 'app1', from: '2026-07-04', to: '2026-07-18', name: 'Kováčovci', status: 'busy', note: 'dva týždne' },
    { id: 's3', apt: 'app1', from: '2026-08-01', to: '2026-08-15', name: 'Rodina Tóthová', status: 'busy', note: '' },
    { id: 's4', apt: 'app1', from: '2026-08-22', to: '2026-08-29', name: 'Predbežná opcia', status: 'opt', note: 'čaká na zálohu' },
    { id: 's5', apt: 'app2', from: '2026-06-20', to: '2026-06-27', name: 'Novákovci', status: 'busy', note: '4 osoby' },
    { id: 's6', apt: 'app2', from: '2026-07-11', to: '2026-07-25', name: 'Baloghovci', status: 'busy', note: '' },
    { id: 's7', apt: 'app2', from: '2026-08-08', to: '2026-08-22', name: 'Rodina Šimková', status: 'busy', note: '' },
    { id: 's8', apt: 'app2', from: '2026-09-05', to: '2026-09-12', name: 'Opcia — firma', status: 'opt', note: 'teambuilding' }
  ];

  /* --- dátumové pomôcky ------------------------------------------------- */
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parse(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmt(s) { var d = parse(s); return d.getDate() + '. ' + (d.getMonth() + 1) + '. ' + d.getFullYear(); }
  function nights(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }

  /* --- úložisko --------------------------------------------------------- */
  var cache = null;

  function load() {
    if (cache) return cache;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var v = JSON.parse(raw); cache = Array.isArray(v) ? v : []; return cache; }
    } catch (e) {}
    cache = SEED.slice();
    return cache;
  }

  /* Prvé načítanie: ak v prehliadači ešte nič nie je, vezmeme data/bookings.json
     z repozitára (to je zdroj pravdy, ktorý nasadíš na Vercel). */
  var booted = false, queue = [];
  function flush() { booted = true; queue.splice(0).forEach(function (f) { f(); }); }
  function boot(cb) {
    if (booted) { cb(); return; }
    queue.push(cb);
    if (queue.length > 1) return;
    try { if (localStorage.getItem(KEY)) { load(); flush(); return; } } catch (e) {}
    fetch('data/bookings.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : SEED; })
      .catch(function () { return SEED; })
      .then(function (v) {
        cache = Array.isArray(v) ? v : SEED.slice();
        try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) {}
        flush();
      });
  }
  function save(list) {
    cache = list;
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }
  function reset() { cache = null; try { localStorage.removeItem(KEY); } catch (e) {} booted = false; }
  function uid() { return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* --- mapa obsadenosti: dátum -> {am, pm} ------------------------------- */
  function occupancyMap(list, aptId) {
    var map = {};
    list.filter(function (b) { return b.apt === aptId; }).forEach(function (b) {
      var d = parse(b.from), end = parse(b.to);
      if (end < d) return;
      while (d <= end) {
        var k = iso(d);
        if (!map[k]) map[k] = { am: null, pm: null, ref: [] };
        var first = k === b.from, last = k === b.to;
        if (!first) map[k].am = b.status;
        if (!last) map[k].pm = b.status;
        if (first && last) { map[k].pm = b.status; }
        map[k].ref.push(b);
        d = new Date(d.getTime() + 86400000);
      }
    });
    return map;
  }

  /* --- vykreslenie kalendára ------------------------------------------- */
  function colorOf(status) { return status === 'opt' ? 'var(--gold)' : 'var(--ink)'; }

  function renderMonth(year, month, map) {
    var first = new Date(year, month, 1);
    var startDow = (first.getDay() + 6) % 7;          // Po = 0
    var daysIn = new Date(year, month + 1, 0).getDate();
    var todayIso = iso(new Date());

    var html = '<div class="month"><h4>' + MONTHS[month] + '</h4><div class="dow">' +
      DOW.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="days">';

    for (var i = 0; i < startDow; i++) html += '<div class="day pad"></div>';

    for (var day = 1; day <= daysIn; day++) {
      var key = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var dow = (new Date(year, month, day).getDay() + 6) % 7;
      var cls = 'day' + (dow >= 5 ? ' we' : '') + (key === todayIso ? ' today' : '');
      var o = map[key];
      var fill = '';
      var tip = '';
      if (o && (o.am || o.pm)) {
        var am = o.am ? colorOf(o.am) : 'transparent';
        var pm = o.pm ? colorOf(o.pm) : 'transparent';
        if (o.am && o.pm) {
          fill = 'background:' + (o.am === o.pm ? am : 'linear-gradient(135deg,' + am + ' 0 50%,' + pm + ' 50% 100%)');
          if (o.am === 'busy' && o.pm === 'busy') cls += ' full-busy';
        } else {
          fill = 'background:linear-gradient(135deg,' + am + ' 0 50%,' + pm + ' 50% 100%)';
        }
        if (o.am === 'busy' && o.pm === 'busy') cls += ' busy';
        tip = ' title="' + o.ref.map(function (b) { return (b.name || 'Rezervácia') + ' · ' + fmt(b.from) + ' – ' + fmt(b.to); }).join(' / ').replace(/"/g, '') + '"';
      }
      html += '<div class="' + cls + '"' + tip + '><span class="fill" style="' + fill + '"></span><span class="num">' + day + '</span></div>';
    }
    return html + '</div></div>';
  }

  function renderCalendars(container, year, opts) {
    opts = opts || {};
    var list = load();
    var from = opts.allYear ? 0 : 3;     // apríl
    var to = opts.allYear ? 11 : 9;      // október
    container.innerHTML = APARTMENTS.map(function (a) {
      var map = occupancyMap(list, a.id);
      var months = '';
      for (var m = from; m <= to; m++) months += renderMonth(year, m, map);
      return '<div class="apt-cal"><div class="hd"><h3>' + a.name +
        ' <span style="color:var(--muted);font-size:14px;font-weight:400">' + a.code + '</span></h3>' +
        '<span>Kapacita ' + a.cap + ' · od ' + a.price + ' €/noc</span></div>' +
        '<div class="months">' + months + '</div></div>';
    }).join('');
  }

  /* --- toast ------------------------------------------------------------ */
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  return {
    KEY: KEY, PIN: PIN, APARTMENTS: APARTMENTS, MONTHS: MONTHS,
    load: load, save: save, boot: boot, reset: reset, uid: uid, iso: iso, parse: parse, fmt: fmt, nights: nights,
    occupancyMap: occupancyMap, renderCalendars: renderCalendars, toast: toast
  };
})();
