// assist.js — context-aware guide layer: elements carry data-tip copy in
// the markup; the mascot speaks it in a terminal bubble on hover/arrival/
// click (once per element, 25s cooldown), and offers help after idle.
// Typing drives the gaze overlay via vg.eye.

import { vg, booted, reduced } from './core.js';

if (!booted('assist')) init();

function init() {
  var RED = reduced();
  var bub = null, lastSay = 0, COOLDOWN = 25000, seen = {}, lastAct = Date.now(), hideT = null, hovT = null;

  function active() {
    var s = document.getElementById('splash');
    if (s && s.style.display !== 'none') return false;
    var i = document.getElementById('intro');
    if (i && i.style.display !== 'none') return false;
    if (document.body.classList.contains('vg-pre')) return false;
    return true;
  }

  function speak(txt, force) {
    if (!txt || !active()) return;
    var now = Date.now();
    if (!force && now - lastSay < COOLDOWN) return;
    lastSay = now;
    if (!bub) { bub = document.createElement('div'); bub.id = 'vgbubble'; document.body.appendChild(bub); }
    clearTimeout(hideT);
    bub.classList.add('on');
    var m = document.getElementById('mascot');
    if (m) { m.classList.remove('vg-react'); void m.offsetWidth; m.classList.add('vg-react'); }
    if (RED) { bub.textContent = txt; }
    else {
      var k = 0;
      (function tw() {
        if (k < txt.length) {
          bub.textContent = txt.slice(0, ++k);
          if (vg.eye) vg.eye(k, true);
          setTimeout(tw, 16);
        }
      })();
    }
    hideT = setTimeout(function () { bub.classList.remove('on'); }, 2600 + txt.length * 40);
  }
  vg.say = speak;

  function act() { lastAct = Date.now(); }
  ['scroll', 'keydown', 'click', 'mousemove', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, act, { passive: true });
  });

  function tips() {
    // arrival: sections with data-tip-section speak when scrolled into view
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          var t = e.target.getAttribute('data-tip-section');
          if (t) speak(t);
        });
      }, { threshold: 0.35 });
      Array.prototype.forEach.call(document.querySelectorAll('[data-tip-section]'), function (el) { io.observe(el); });
    }
    // hover/click: [data-tip] elements
    Array.prototype.forEach.call(document.querySelectorAll('[data-tip]'), function (el) {
      el.addEventListener('mouseenter', function () {
        if (seen[el.__tipid]) return;
        clearTimeout(hovT);
        hovT = setTimeout(function () {
          if (seen[el.__tipid]) return;
          seen[el.__tipid] = 1;
          speak(el.getAttribute('data-tip'));
        }, 700);
      });
      el.addEventListener('mouseleave', function () { clearTimeout(hovT); });
    });
    // idle help offer
    setInterval(function () {
      if (Date.now() - lastAct > 45000 && active()) {
        lastAct = Date.now();
        speak('Need a hand? Hover anything, or pull the chain.', true);
      }
    }, 15000);
  }

  // stable ids for tip elements
  var n = 0;
  Array.prototype.forEach.call(document.querySelectorAll('[data-tip],[data-tip-section]'), function (el) { el.__tipid = ++n; });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tips);
  else tips();
}
