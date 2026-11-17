// pagefx.js — text glitch-fix event: letters detach (ember fall), holes
// persist while action1 plays, drop back synced to action1's OWN
// timeline (35-85% window), byte-exact restore (chars never mutated).
// Auto-schedules 60-150s after load; defers while the portal runs.

import { vg, on, booted, reduced } from './core.js';
import './fx.js';

if (!booted('pagefx')) {
  init();
}

function init() {
  var RED = reduced();
  var glitchOn = false;

  function glitchEvent() {
    vg.why.glitch = 'run';
    if (glitchOn) { vg.why.glitch = 'already-running'; return; }
    if (RED) { vg.why.glitch = 'reduced-motion'; return; }
    if (vg.state.portal) { vg.why.glitch = 'portal-busy-retry'; setTimeout(glitchEvent, 4000); return; }
    var els = [];
    var all = document.querySelectorAll('section .wrap p, section .wrap h1, section .wrap h2, section .wrap li, header.hero .wrap p, header.hero .wrap h1');
    Array.prototype.forEach.call(all, function (e) {
      if (e.children.length === 0 && e.textContent.trim().length >= 24) els.push(e);
    });
    if (!els.length) { vg.why.glitch = 'no-text-candidates'; return; }
    if (!vg.force) { vg.why.glitch = 'no-force-seam'; return; }
    if (!vg.force('/assets/status/action1.mp4')) { vg.why.glitch = 'action1-not-in-pool'; return; }

    glitchOn = true;
    // pick one element, pick 3-7 letters
    var el = els[Math.floor(Math.random() * els.length)];
    var orig = el.textContent;
    var frag = document.createDocumentFragment();
    var spans = [];
    for (var i = 0; i < orig.length; i++) {
      var sp = document.createElement('span');
      sp.className = 'vgl';
      sp.textContent = orig[i];
      spans.push(sp);
      frag.appendChild(sp);
    }
    el.textContent = '';
    el.appendChild(frag);
    var idxs = [];
    var want = 3 + Math.floor(Math.random() * 5);
    var letters = [];
    spans.forEach(function (sp, j) { if (/\S/.test(sp.textContent)) letters.push(j); });
    while (idxs.length < want && letters.length) {
      var j = letters.splice(Math.floor(Math.random() * letters.length), 1)[0];
      idxs.push(j);
    }
    idxs.sort(function (a, b) { return a - b; });
    var dropped = idxs.map(function (j) {
      var sp = spans[j];
      var r = sp.getBoundingClientRect();
      var f = document.createElement('span');
      f.className = 'vg-faller';
      f.textContent = sp.textContent;
      f.style.position = 'fixed';
      f.style.left = r.left + 'px';
      f.style.top = r.top + 'px';
      document.body.appendChild(f);
      sp.classList.add('vg-hole');
      setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1400);
      return { j: j, sp: sp };
    });
    vg.why.glitch = 'dropped:' + dropped.length + ' of ' + letters.length;

    // repair clock: mapped to action1 progress, not wall time
    function mend(d) {
      d.sp.classList.remove('vg-hole');
      d.sp.classList.add('vg-dropin');
      vg.fx('/assets/sfx/chainclink.mp3', 0.5);
    }
    var iv = setInterval(function () {
      var p = vg.playing && vg.playing();
      if (p && p.u.indexOf('action1') >= 0) {
        var prog = p.t / (p.d || 1);
        if (prog < 0.35) return;
        var k = Math.min(1, (prog - 0.35) / 0.5);   // 35-85% window
        var want2 = Math.round(k * dropped.length);
        var fixed = 0;
        dropped.forEach(function (d) { if (d.done) fixed++; });
        var next = 0;
        while (fixed < want2 && next < dropped.length) {
          if (!dropped[next].done) { dropped[next].done = true; mend(dropped[next]); fixed++; }
          next++;
        }
      } else {
        // fix clip already over: finish any remaining mends, then idle-poll
        dropped.forEach(function (d) { if (!d.done) { d.done = true; mend(d); } });
      }
    }, 240);

    setTimeout(function () {
      clearInterval(iv);
      dropped.forEach(function (d) { if (!d.done) mend(d); });
      // byte-exact restore: spans were never mutated, just relabel
      setTimeout(function () {
        el.textContent = orig;
        glitchOn = false;
        vg.why.glitch = 'restored';
      }, 900);
    }, 16500);
  }

  vg.glitch = glitchEvent;
  setTimeout(glitchEvent, 60000 + Math.random() * 90000);
}
