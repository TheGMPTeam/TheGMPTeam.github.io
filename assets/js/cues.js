// cues.js — cue table (SPEC C2): page FX keyed to the playing clip's OWN
// currentTime so sound/motion land on the mascot's measured beat times.
// Late cues (>0.4s) are skipped, never queued. Every fire logs to vg.cueLog.

import { vg, on, booted } from './core.js';
import './fx.js';

if (!booted('cues')) {

// beat times measured from frame QC of each clip
var CUES = {
  'action2': [ // chain pull
    { t: 0.8, act: 'cls', arg: { sel: '#vgchain', cls: 'vg-bright', ms: 900 } },
    { t: 2.2, act: 'cls', arg: { sel: '#vgchain', cls: 'vg-tug', ms: 600 } },
    { t: 2.2, act: 'sfx', arg: { u: '/assets/sfx/chainclink.mp3', vol: 0.9 } },
    { t: 4.2, act: 'cls', arg: { sel: '#vgchain', cls: 'vg-tug', ms: 600 } },
    { t: 4.2, act: 'sfx', arg: { u: '/assets/sfx/chainclink.mp3', vol: 0.9 } },
    { t: 7.6, act: 'cls', arg: { sel: '#vgchain', cls: 'vg-sway-off', ms: 1200 } }
  ],
  'action3': [ // valve wheel
    { t: 1.4, act: 'cls', arg: { sel: '#mascot', cls: 'poke', ms: 500 } },
    { t: 2.6, act: 'cls', arg: { sel: '#vggear2', cls: 'vg-spin', ms: 1600 } },
    { t: 2.6, act: 'cls', arg: { sel: '#vggear1', cls: 'vg-spin', ms: 1600 } },
    { t: 6.4, act: 'sfx', arg: { u: '/assets/sfx/chainclink.mp3', vol: 0.8 } }
  ],
  'action4': [ // lever throw
    { t: 1.6, act: 'cls', arg: { sel: '#vgchain', cls: 'vg-bright', ms: 900 } },
    { t: 3.9, act: 'sfx', arg: { u: '/assets/sfx/leverclunk.mp3', vol: 1 } },
    { t: 3.9, act: 'cls', arg: { sel: '#vggear1', cls: 'vg-jolt', ms: 500 } }
  ]
};

vg.cueLog = [];

function fire(name, cue, t) {
  vg.cueLog.push({ clip: name, t: cue.t, act: cue.act, at: Math.round(t * 100) / 100 });
  if (cue.act === 'sfx') { vg.fx(cue.arg.u, cue.arg.vol); return; }
  if (cue.act === 'cls') {
    var els = document.querySelectorAll(cue.arg.sel);
    Array.prototype.forEach.call(els, function (el) {
      el.classList.add(cue.arg.cls);
      setTimeout(function () { el.classList.remove(cue.arg.cls); }, cue.arg.ms);
    });
  }
}

on('vg:clip-start', function (e) {
  var u = e.detail.u, v = e.detail.v;
  var name = u.split('/').pop().replace('.mp4', '');
  var table = CUES[name];
  if (!table) return;
  var pending = table.map(function (c) { return { c: c, done: false }; });
  var iv = setInterval(function () {
    if (!v.isConnected || v.ended || v.paused) {
      // clip gone mid-play: kill remaining cues (no bleed into next clip)
      if (v.ended || !v.isConnected) clearInterval(iv);
      return;
    }
    var t = v.currentTime;
    pending.forEach(function (p) {
      if (p.done) return;
      if (t >= p.c.t) {
        p.done = true;
        if (t - p.c.t <= 0.4) fire(name, p.c, t);   // late cues: skipped
      }
    });
    if (pending.every(function (p) { return p.done; })) clearInterval(iv);
  }, 100);
  on('vg:clip-end', function () { clearInterval(iv); }, { once: true });
});

}
