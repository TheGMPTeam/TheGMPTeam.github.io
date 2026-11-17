// gaze.js — eye overlay inside the port: pupils track the cursor with an
// 8px deadzone, vertical damping 0.85, smoothing k=1-exp(-dt/90ms).
// Retracts while the assistant bubble types (assist.js calls vg.eye).
// Ported from the research P2 math (BEDROCK interactive-mascot-research).

import { vg, on, booted, reduced } from './core.js';

if (!booted('gaze')) {
  if (!reduced()) init();
}

function init() {
  var host = document.getElementById('mascot');
  if (!host) return;
  var wrap = document.createElement('div');
  wrap.id = 'vgeyes';
  wrap.innerHTML = '<i class="vgpupil l"></i><i class="vgpupil r"></i>';
  host.appendChild(wrap);
  var pupils = wrap.querySelectorAll('.vgpupil');

  var tx = 0, ty = 0, cx = 0, cy = 0, retracted = 0, last = 0, seen = false;

  on('mousemove', function (e) {
    var mr = host.getBoundingClientRect();
    var px = e.clientX - (mr.left + mr.width / 2);
    var py = e.clientY - (mr.top + mr.height * 0.38); // eye line ~38% down
    var d = Math.sqrt(px * px + py * py) || 1;
    var DEAD = 8;
    if (d < DEAD) { tx = 0; ty = 0; return; }
    var R = mr.width * 0.14; // max pupil travel
    tx = (px / d) * R;
    ty = (py / d) * R * 0.85 * 0.6; // vertical damping
    seen = true;
  }, { passive: true });

  setInterval(function () {
    var now = performance.now();
    var dt = last ? now - last : 40;
    last = now;
    if (!seen) return;
    var k = 1 - Math.exp(-dt / 90);
    cx += (tx - cx) * k;
    cy += (ty - cy) * k;
    if (retracted > now) { cx *= 0.2; cy *= 0.2; }
    Array.prototype.forEach.call(pupils, function (p) {
      p.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
    });
  }, 40);

  // typing hook: assist drives eye shimmer + brief retract per char
  vg.eye = function (k, typing) {
    if (typing) retracted = performance.now() + 220;
    wrap.classList.toggle('blink', !!k && k % 7 === 0);
  };

  // hide overlay when the port itself is hidden
  new MutationObserver(function () {
    var v = getComputedStyle(host).visibility;
    wrap.style.visibility = v === 'hidden' ? 'hidden' : 'visible';
  }).observe(host, { attributes: true, attributeFilter: ['class', 'style'] });

  on('vg:enter', function () { wrap.classList.add('on'); });
  if (!document.getElementById('splash')) wrap.classList.add('on');
}
