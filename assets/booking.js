/* ==========================================================================
   Villa Kuca Puca — rezervačný modul (prototyp)

   Zdroj pravdy pre nasadený web je data/bookings.json. Pri prvom otvorení si ho
   prehliadač načíta a odvtedy pracuje s kópiou v localStorage. Admin aj verejná
   obsadenosť čítajú to isté.

   Napojenie na skutočnú databázu = prepísať load(), save() a boot() na volania
   API. Zvyšok kódu (kalendár, platby, šablóny správ) ostáva bez zmeny.
   ========================================================================== */
window.KP = (function () {
  'use strict';

  var KEY = 'kp_bookings_v1';
  var PIN = '0000';            // demo PIN do admin časti — zmeň si ho tu

  var KONTAKT = {
    nazov: 'Villa Kuca Puca',
    majitel: 'Marek Náhlik',
    adresa: 'Sepunatka 11/E, 23234 Vir, Chorvátsko',
    tel: '+421 904 226 700',
    telRaw: '+421904226700',
    email: 'hello@kucapuca.sk',
    checkin: '15:00',
    checkout: '10:00',
    zalohaPct: 30
  };

  var APARTMENTS = [
    { id: 'app1', name: 'Kuca', code: 'APP1', cap: '6+1', price: 150 },
    { id: 'app2', name: 'Puca', code: 'APP2', cap: '4+1', price: 130 }
  ];
  var MONTHS = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December'];
  var DOW = ['Po','Ut','St','Št','Pi','So','Ne'];

  var SEED = [
    { id:'s1', apt:'app1', from:'2026-06-13', to:'2026-06-20', name:'Rodina Horváthová', status:'busy', guests:6, price:1050, paid:1050, email:'horvath@example.com', phone:'+421903111222', note:'', confirmedAt:'2026-02-11' },
    { id:'s2', apt:'app1', from:'2026-07-04', to:'2026-07-18', name:'Kováčovci',        status:'busy', guests:7, price:2100, paid:630,  email:'kovac@example.com',   phone:'+421905333444', note:'dva týždne', confirmedAt:'2026-03-02' },
    { id:'s3', apt:'app1', from:'2026-08-01', to:'2026-08-15', name:'Rodina Tóthová',    status:'busy', guests:6, price:2100, paid:0,    email:'toth@example.com',    phone:'',              note:'', confirmedAt:'' },
    { id:'s4', apt:'app1', from:'2026-08-22', to:'2026-08-29', name:'Predbežná opcia',   status:'opt',  guests:5, price:1050, paid:0,    email:'',                    phone:'',              note:'čaká na potvrdenie', confirmedAt:'' },
    { id:'s5', apt:'app2', from:'2026-06-20', to:'2026-06-27', name:'Novákovci',         status:'busy', guests:4, price:910,  paid:910,  email:'novak@example.com',   phone:'+421907555666', note:'', confirmedAt:'2026-02-20' },
    { id:'s6', apt:'app2', from:'2026-07-11', to:'2026-07-25', name:'Baloghovci',        status:'busy', guests:5, price:1820, paid:546,  email:'balogh@example.com',  phone:'',              note:'', confirmedAt:'2026-03-15' },
    { id:'s7', apt:'app2', from:'2026-08-08', to:'2026-08-22', name:'Rodina Šimková',    status:'busy', guests:4, price:1820, paid:0,    email:'simkova@example.com', phone:'',              note:'', confirmedAt:'' },
    { id:'s8', apt:'app2', from:'2026-09-05', to:'2026-09-12', name:'Opcia — firma',     status:'opt',  guests:4, price:910,  paid:0,    email:'',                    phone:'',              note:'teambuilding', confirmedAt:'' }
  ];

  /* --- dátumové pomôcky ------------------------------------------------- */
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parse(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmt(s) { var d = parse(s); return d.getDate() + '. ' + (d.getMonth() + 1) + '. ' + d.getFullYear(); }
  function fmtShort(s) { var d = parse(s); return d.getDate() + '. ' + (d.getMonth() + 1) + '.'; }
  function fmtTight(s) { var d = parse(s); return d.getDate() + '.' + (d.getMonth() + 1) + '.'; }
  function osob(n) { return n === 1 ? '1 osoba' : (n < 5 ? n + ' osoby' : n + ' osob'); }
  function nights(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }

  /* --- peniaze ---------------------------------------------------------- */
  function eur(v) { return Math.round(+v || 0).toLocaleString('sk-SK').replace(/ /g, ' ') + ' €'; }
  function price(b) { return +b.price || 0; }
  function paid(b) { return +b.paid || 0; }
  function due(b) { return Math.max(0, price(b) - paid(b)); }
  function deposit(b) { return Math.round(price(b) * KONTAKT.zalohaPct / 100); }
  function payState(b) {
    if (!price(b)) return 'none';
    if (paid(b) <= 0) return 'unpaid';
    if (paid(b) + 0.5 < price(b)) return 'deposit';
    return 'paid';
  }
  var PAY_LABEL = { none: 'bez ceny', unpaid: 'nezaplatené', deposit: 'záloha', paid: 'zaplatené' };

  function apt(id) {
    return APARTMENTS.filter(function (a) { return a.id === id; })[0] || APARTMENTS[0];
  }

  /* --- úložisko --------------------------------------------------------- */
  var cache = null;

  function normalize(list) {
    return (list || []).map(function (b) {
      return {
        id: b.id || uid(), apt: b.apt || 'app1', from: b.from, to: b.to,
        name: b.name || '', status: b.status === 'opt' ? 'opt' : 'busy',
        guests: +b.guests || 0, price: +b.price || 0, paid: +b.paid || 0,
        email: b.email || '', phone: b.phone || '',
        note: b.note || '', confirmedAt: b.confirmedAt || ''
      };
    });
  }

  function load() {
    if (cache) return cache;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var v = JSON.parse(raw); cache = normalize(Array.isArray(v) ? v : []); return cache; }
    } catch (e) {}
    cache = normalize(SEED);
    return cache;
  }
  function save(list) {
    cache = normalize(list);
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) {}
  }
  function reset() { cache = null; try { localStorage.removeItem(KEY); } catch (e) {} booted = false; }

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
        cache = normalize(Array.isArray(v) ? v : SEED);
        try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) {}
        flush();
      });
  }
  function uid() { return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* --- šablóny potvrdení ------------------------------------------------ */
  function bezDiakritiky(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ľĽ]/g, 'l').replace(/[đĐ]/g, 'd');
  }

  function sprava(b) {
    var a = apt(b.id ? b.apt : 'app1');
    var n = nights(b.from, b.to);
    var opcia = b.status === 'opt';
    var riadky = [
      ['Apartmán', a.name + ' (' + a.code + '), kapacita ' + a.cap],
      ['Termín', fmt(b.from) + ' od ' + KONTAKT.checkin + ' — ' + fmt(b.to) + ' do ' + KONTAKT.checkout],
      ['Počet nocí', String(n)]
    ];
    if (b.guests) riadky.push(['Počet osôb', String(b.guests)]);
    if (price(b)) {
      riadky.push(['Cena celkom', eur(price(b))]);
      riadky.push(['Zaplatené', eur(paid(b))]);
      riadky.push(['Zostáva doplatiť', due(b) ? eur(due(b)) + ' (pri príchode)' : '0 € — uhradené v plnej výške']);
    }
    var w = Math.max.apply(null, riadky.map(function (r) { return r[0].length; })) + 2;
    var tabulka = riadky.map(function (r) { return r[0] + ':' + ' '.repeat(w - r[0].length) + r[1]; }).join('\n');

    var subject = (opcia ? 'Predbežná rezervácia' : 'Potvrdenie rezervácie') +
      ' — ' + KONTAKT.nazov + ' (' + fmtShort(b.from) + ' – ' + fmt(b.to) + ')';

    var body =
      'Dobrý deň' + (b.name ? ', ' + b.name : '') + ',\n\n' +
      (opcia
        ? 'ďakujeme za dopyt. Termín vám držíme ako predbežnú opciu — potvrdíme ho hneď, ako sa dohodneme na detailoch.'
        : 'potvrdzujeme vašu rezerváciu vo Ville Kuca Puca na ostrove Vir.') + '\n\n' +
      tabulka + '\n\n' +
      'Adresa: ' + KONTAKT.adresa + '\n' +
      'Parkovanie je priamo pri dome, bez poplatku.\n\n' +
      (due(b) && !opcia ? 'Zvyšok sumy môžete uhradiť pri príchode.\n\n' : '') +
      'Ak budete čokoľvek potrebovať, ozvite sa na ' + KONTAKT.tel + '.\n\n' +
      'Tešíme sa na vás,\n' + KONTAKT.majitel + '\n' + KONTAKT.nazov + '\n' + KONTAKT.email;

    var sms = bezDiakritiky(
      KONTAKT.nazov + ': ' + (opcia ? 'termin drzime ako opciu' : 'rezervacia potvrdena') + ', ' +
      a.name + ' ' + fmtTight(b.from) + '-' + fmtTight(b.to) + parse(b.to).getFullYear() +
      (b.guests ? ', ' + osob(b.guests) : '') + '. ' +
      (price(b) ? 'Cena ' + Math.round(price(b)) + ' EUR, zaplatene ' + Math.round(paid(b)) + ' EUR' +
        (due(b) ? ', zostava ' + Math.round(due(b)) + ' EUR' : '') + '. ' : '') +
      'Sepunatka 11/E, Vir. Tel ' + KONTAKT.telRaw
    );

    return { subject: subject, body: body, sms: sms };
  }

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
    var startDow = (first.getDay() + 6) % 7;
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
      var fill = '', tip = '';
      if (o && (o.am || o.pm)) {
        var am = o.am ? colorOf(o.am) : 'transparent';
        var pm = o.pm ? colorOf(o.pm) : 'transparent';
        if (o.am && o.pm) {
          fill = 'background:' + (o.am === o.pm ? am : 'linear-gradient(135deg,' + am + ' 0 50%,' + pm + ' 50% 100%)');
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
    var from = opts.allYear ? 0 : 3;
    var to = opts.allYear ? 11 : 9;
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
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  return {
    KEY: KEY, PIN: PIN, APARTMENTS: APARTMENTS, MONTHS: MONTHS, KONTAKT: KONTAKT,
    load: load, save: save, boot: boot, reset: reset, uid: uid,
    iso: iso, parse: parse, fmt: fmt, fmtShort: fmtShort, fmtTight: fmtTight, nights: nights,
    eur: eur, price: price, paid: paid, due: due, deposit: deposit,
    payState: payState, PAY_LABEL: PAY_LABEL, apt: apt, sprava: sprava,
    occupancyMap: occupancyMap, renderCalendars: renderCalendars, toast: toast
  };
})();
