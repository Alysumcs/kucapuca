/* Jednoduchý lightbox pre galérie */
(function () {
  'use strict';
  var all = [].slice.call(document.querySelectorAll('.gallery img, .car-item img, .gal-stage img'));
  if (!all.length) return;
  var imgs = all;      // aktuálne viditeľná sada, prepočíta sa pri otvorení
  var i = 0;

  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = '<img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="><div class="cap"></div>' +
    '<button class="close" aria-label="Zavrieť">✕</button>' +
    '<button class="prev" aria-label="Predchádzajúca">‹</button>' +
    '<button class="next" aria-label="Nasledujúca">›</button>';
  document.body.appendChild(lb);
  var big = lb.querySelector('img'), cap = lb.querySelector('.cap');

  function show(n) {
    i = (n + imgs.length) % imgs.length;
    big.src = imgs[i].currentSrc || imgs[i].src;
    big.alt = imgs[i].alt || '';
    cap.textContent = (imgs[i].alt || '') + '  ·  ' + (i + 1) + ' / ' + imgs.length;
  }
  function open(n) { show(n); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }

  /* listujeme len v tej galérii, na ktorú sa kliklo, a len v práve viditeľných fotkách */
  function visible(scope) {
    return all.filter(function (im) {
      if (im.closest('.gallery, .carousel') !== scope) return false;
      var f = im.closest('figure');
      return !(f && f.hidden) && im.offsetParent !== null;
    });
  }
  all.forEach(function (im) {
    im.addEventListener('click', function () {
      imgs = visible(im.closest('.gallery, .carousel'));
      var n = imgs.indexOf(im);
      open(n < 0 ? 0 : n);
    });
  });
  lb.querySelector('.close').onclick = close;
  lb.querySelector('.prev').onclick = function (e) { e.stopPropagation(); show(i - 1); };
  lb.querySelector('.next').onclick = function (e) { e.stopPropagation(); show(i + 1); };
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === big) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
})();
