/* Villa Kuca Puca — interakcie a scroll animácie */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- sticky header --- */
  var header = document.querySelector('.site-header');
  function onScrollHeader() {
    if (header) header.classList.toggle('stuck', window.scrollY > 8);
  }

  /* --- mobilná navigácia --- */
  var burger = document.querySelector('.burger');
  var mnav = document.querySelector('.mobile-nav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = mnav.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mnav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mnav.classList.remove('open');
        burger.classList.remove('open');
      });
    });
  }

  /* --- reveal pri scrollovaní --- */
  var rv = document.querySelectorAll('.rv');
  if (rv.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      rv.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      rv.forEach(function (el, i) {
        el.style.transitionDelay = (Math.min(i % 6, 4) * 70) + 'ms';
        io.observe(el);
      });
    }
  }

  /* --- veľké tvrdenia: slová sa rozsvecujú podľa scrollu --- */
  var statements = [].slice.call(document.querySelectorAll('.big-statement'));
  statements.forEach(function (el) {
    var nodes = [].slice.call(el.childNodes);
    el.innerHTML = '';
    nodes.forEach(function (n) {
      var accent = n.nodeType === 1 && (n.tagName === 'EM' || n.classList.contains('ac'));
      var text = n.textContent;
      if (!text) return;
      text.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) return;
        if (/^\s+$/.test(chunk)) { el.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span');
        s.className = 'w' + (accent ? ' ac' : '');
        s.textContent = chunk;
        el.appendChild(s);
      });
    });
  });

  function litWords() {
    var vh = window.innerHeight;
    statements.forEach(function (el) {
      var words = el.querySelectorAll('.w');
      if (!words.length) return;
      var r = el.getBoundingClientRect();
      // progres: 0 keď je blok pod ohybom, 1 keď je nad stredom obrazovky
      var start = vh * 0.85, end = vh * 0.28;
      var p = (start - r.top) / (start - end);
      p = Math.max(0, Math.min(1, p));
      var lit = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) {
        words[i].classList.toggle('lit', i < lit);
      }
    });
  }

  /* --- obrázok, ktorý sa pri scrollovaní roztiahne --- */
  var frames = [].slice.call(document.querySelectorAll('.zoomframe'));
  function zoomFrames() {
    if (window.innerWidth < 860) return;
    var vh = window.innerHeight;
    frames.forEach(function (f) {
      var r = f.getBoundingClientRect();
      var start = vh * 0.92, end = vh * 0.18;
      var p = (start - r.top) / (start - end);
      p = Math.max(0, Math.min(1, p));
      var minW = parseFloat(f.dataset.min || '70');
      f.style.width = (minW + (100 - minW) * p) + '%';
      f.style.borderRadius = (20 - 20 * p) + 'px';
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScrollHeader();
      if (!reduce) { litWords(); zoomFrames(); }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (reduce) {
    document.querySelectorAll('.big-statement .w').forEach(function (w) { w.classList.add('lit'); });
  }
  onScroll();

  /* --- rok v pätičke --- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
