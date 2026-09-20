/* Galéria apartmánu: hlavná fotka + pruh miniatúr. Bez závislostí. */
(function () {
  function init(gal) {
    var stage  = gal.querySelector('.gal-main');
    var cap    = gal.querySelector('.gal-cap');
    var count  = gal.querySelector('.gal-count');
    var thumbs = [].slice.call(gal.querySelectorAll('.gal-thumb'));
    if (!stage || !thumbs.length) return;
    var i = 0;

    function show(n, focus) {
      i = (n + thumbs.length) % thumbs.length;
      var t = thumbs[i];
      var src = t.getAttribute('data-src');
      var alt = t.getAttribute('data-alt') || '';
      var txt = t.getAttribute('data-cap') || '';
      stage.classList.add('fade');
      var img = new Image();
      img.onload = img.onerror = function () {
        stage.src = src; stage.alt = alt;
        if (cap) cap.textContent = txt;
        stage.classList.remove('fade');
      };
      img.src = src;
      if (count) count.textContent = (i + 1) + ' / ' + thumbs.length;
      thumbs.forEach(function (x, k) { x.classList.toggle('on', k === i); });
      t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (focus) t.focus({ preventScroll: true });
    }

    thumbs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k); });
    });
    var prev = gal.querySelector('.gal-nav.prev');
    var next = gal.querySelector('.gal-nav.next');
    if (prev) prev.addEventListener('click', function () { show(i - 1); });
    if (next) next.addEventListener('click', function () { show(i + 1); });

    gal.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); show(i - 1, true); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1, true); }
    });

    /* potiahnutie prstom po hlavnej fotke */
    var x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) show(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    }, { passive: true });

    show(0);
  }
  document.querySelectorAll('.gal').forEach(init);
})();
