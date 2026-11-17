// actions.js — trigger registry: one gesture -> one clip, with guards.
// Replaces the legacy per-block trigger wiring (D2/D5: no double-fire,
// URLs named once). Manual seam: vg.trigger('chain'|'poke'|'cta').

import { vg, on, booted, vgSet } from './core.js';
import './fx.js';

if (!booted('actions')) {

var A = {
  chain: { clip: '/assets/status/action2.mp4', sfx: '/assets/sfx/chainclink.mp3', cool: 30 },
  poke:  { clip: '/assets/status/action3.mp4', sfx: '/assets/sfx/bubble.mp3', cool: 45 },
  cta:   { clip: '/assets/status/action4.mp4', sfx: null, cool: 90 }
}
var last = {};

function fire(name) {
  var a = A[name];
  if (!a || !vg.force) return false;
  var now = Date.now();
  if (last[name] && now - last[name] < a.cool * 1000) return false;
  if (vg.state.portal) return false;         // never mid-portal
  if (!vg.force(a.clip)) return false;
  last[name] = now;
  if (a.sfx) vg.fx(a.sfx, 0.8);
  return true;
}
vg.trigger = fire;

// gesture bindings
on('DOMContentLoaded', bind);
if (document.readyState !== 'loading') bind();
var bound = false;
function bind() {
  if (bound) return; bound = true;
  var host = document.getElementById('mascot');
  if (host) host.addEventListener('click', function () { fire('poke'); });
  var chain = document.getElementById('vgchain');
  if (chain) chain.addEventListener('click', function () { fire('chain'); });
  var cta = document.querySelectorAll('.cta, .cards .card');
  Array.prototype.forEach.call(cta, function (el) {
    el.addEventListener('mouseenter', function () { fire('cta'); });
    el.addEventListener('touchstart', function () {
      try { sessionStorage.setItem('vg-arm-cta', '1'); } catch (e) {}
    }, { passive: true });
  });
  // touch flow: tap armed on the previous page -> fire on arrival once
  try {
    if (sessionStorage.getItem('vg-arm-cta') === '1') {
      sessionStorage.removeItem('vg-arm-cta');
      setTimeout(function () { fire('cta'); }, 2500);
    }
  } catch (e) {}
}

}
