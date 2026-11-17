// main.js — composition root. One <script type="module"> per page.
// Load order: engine first (clip clock + pool), then everything else.

import './engine.js';
import './cues.js';
import './actions.js';
import './rig.js';
import './gaze.js';
import './portal.js';
import './pagefx.js';
import './menu.js';
import './enter.js';
import './assist.js';
import './carousel.js';

// scroll reveal: .wrap children fade+rise once on scroll-in
import { reduced } from './core.js';
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (reduced()) return;
  var els = document.querySelectorAll('section .wrap > *, header.hero .wrap > *');
  if (!els.length) return;
  Array.prototype.forEach.call(els, function (el) { el.classList.add('rv'); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  Array.prototype.forEach.call(els, function (el) { io.observe(el); });
})();
