// rig.js — chain + gears under the corner port. Body-level fixed anchor
// (escapes the port's overflow clip — D67 lesson). Crawl synced to the
// playing clip's clock + scroll layered on top. Click -> vg.trigger chain.

import { vg, on, off, booted, reduced } from './core.js';

if (!booted('rig')) {
  if (!reduced()) init();
}

function init() {
  var PITCH = 23, LINKS = 12;
  var chain = document.getElementById('vgchain');
  if (!chain) {
    chain = document.createElement('div');
    chain.id = 'vgchain';
    chain.innerHTML = '<div id="vgtrack"><div id="vglinks"></div></div>' +
      '<i id="vgpull"></i><i id="vggear1"></i><i id="vggear2"></i>' +
      '<span class="vg-pull-label">PULL</span>';
    document.body.appendChild(chain);   // NOT inside the port: clip lesson
  }
  var links = document.getElementById('vglinks');
  if (links && !links.children.length) {
    var h = '';
    for (var i = 0; i < LINKS * 2; i++) h += '<i></i>';
    links.innerHTML = h;
  }

  var crawl = 0, lastReal = 0;

  function host() { return document.getElementById('mascot'); }

  function anchor() {
    var m = host();
    if (!m) return;
    var mr = m.getBoundingClientRect();
    chain.style.position = 'fixed';
    chain.style.top = (mr.top + mr.height + 4) + 'px';
    chain.style.left = (mr.left + mr.width / 2 - 24) + 'px';
  }

  function rig() {
    anchor();
    var track = document.getElementById('vgtrack');
    if (!track || !links) return;
    var th = track.clientHeight || 118;
    var pos = (window.scrollY * 0.6 + crawl) % (PITCH * 2);
    Array.prototype.forEach.call(links.children, function (el, i) {
      el.style.transform = 'translateY(' + ((pos + i * PITCH * 2) % (th + PITCH * 2) - PITCH) + 'px) rotate(' + ((pos + i * PITCH * 2) * 4.2 % 360) + 'deg)';
    });
    var g1 = document.getElementById('vggear1'), g2 = document.getElementById('vggear2');
    var rot = (window.scrollY * 0.6 + crawl) * 4.2;
    if (g1) g1.style.transform = 'rotate(' + rot + 'deg)';
    if (g2) g2.style.transform = 'rotate(' + (-rot * 2) + 'deg)';
  }

  on('scroll', rig, { passive: true });
  on('vg:enter', rig);

  // interval (not rAF): chain crawl follows the clip clock. 400ms + CSS
  // transition keeps it smooth and survives tab throttling.
  setInterval(function () {
    var now = performance.now();
    if (lastReal) {
      var p = vg.playing && vg.playing();
      if (p) crawl += ((now - lastReal) / 1000) * PITCH * 0.85;
    }
    lastReal = now;
    rig();
  }, 400);

  var chainEl = document.getElementById('vgchain');
  if (chainEl) chainEl.addEventListener('click', function () {
    chainEl.classList.add('vg-tug');
    setTimeout(function () { chainEl.classList.remove('vg-tug'); }, 600);
  });

  rig();
  vg.rig = rig;
}
