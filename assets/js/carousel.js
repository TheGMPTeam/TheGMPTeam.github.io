// carousel.js — 3D coverflow reel (videos.html): active slide dead-center,
// neighbors angled back; hover injects muted YT embed with mute pill.
// Ported 1:1 from the legacy site.js block.

import { booted } from './core.js';

if (!booted('carousel')) init();

function init() {
  document.querySelectorAll('.car').forEach(function (car) {
    var slides = Array.prototype.slice.call(car.querySelectorAll('.slide'));
    var dotsWrap = document.querySelector('.dots[data-car="' + car.id + '"]');
    var cur = 0;
    slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.className = 'dot-i'; b.type = 'button';
      b.setAttribute('aria-label', 'go to video ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      if (dotsWrap) dotsWrap.appendChild(b);
    });
    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.children) : [];
    function stop() {
      var f = car.querySelector('.slide .thumb iframe');
      if (f) f.remove();
      var b = car.querySelector('.slide .mute-btn');
      if (b) b.remove();
    }
    function render() {
      slides.forEach(function (s, i) {
        var off = i - cur;
        if (off === 0) {
          s.style.transform = 'translate3d(0,0,0)';
          s.style.opacity = '1';
        } else {
          var mag = Math.abs(off);
          if (mag <= 2) {
            var sgn = off > 0 ? 1 : -1;
            var x = mag === 1 ? 46 : 82, z = mag === 1 ? -240 : -420, rot = mag === 1 ? 30 : 45;
            s.style.transform = 'translate3d(' + (sgn * x) + '%,0,' + z + 'px) rotateY(' + (sgn * rot) + 'deg)';
            s.style.opacity = mag === 1 ? '0.55' : '0.3';
          } else {
            var sgn2 = off > 0 ? 1 : -1;
            s.style.transform = 'translate3d(' + (sgn2 * 120) + '%,0,-400px) rotateY(' + (sgn2 * 55) + 'deg)';
            s.style.opacity = '0';
          }
        }
        s.style.zIndex = String(100 - Math.abs(off));
        s.style.pointerEvents = off === 0 ? 'auto' : 'none';
        s.classList.toggle('current', off === 0);
      });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
      var l = car.querySelector('.car-arrow.left'), r = car.querySelector('.car-arrow.right');
      if (l) l.classList.toggle('hide', cur === 0);
      if (r) r.classList.toggle('hide', cur === slides.length - 1);
      stop();
    }
    function go(i) { cur = Math.max(0, Math.min(slides.length - 1, i)); render(); }
    car.querySelectorAll('.car-arrow').forEach(function (a) {
      a.addEventListener('click', function (e) { e.stopPropagation(); go(cur + (a.dataset.dir === 'next' ? 1 : -1)); });
    });
    slides.forEach(function (s) {
      s.addEventListener('mouseenter', function () {
        if (slides[cur] !== s) return;
        var h = s.querySelector('.thumb');
        if (!h || h.querySelector('iframe')) return;
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube.com/embed/' + s.dataset.vid + '?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1';
        f.allow = 'autoplay; encrypted-media; picture-in-picture';
        f.allowFullscreen = true; f.loading = 'lazy';
        h.appendChild(f);
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'mute-btn'; b.textContent = 'UNMUTE';
        var muted = true;
        b.addEventListener('click', function (ev) {
          ev.stopPropagation(); ev.preventDefault();
          try { f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: muted ? 'unMute' : 'mute', args: [] }), '*'); } catch (err) {}
          muted = !muted;
          b.textContent = muted ? 'UNMUTE' : 'MUTE';
          b.classList.toggle('on', !muted);
        });
        h.appendChild(b);
      });
    });
    car.addEventListener('mouseleave', stop);
    var tx = null;
    car.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
      tx = null;
    }, { passive: true });
    render();
  });
}
