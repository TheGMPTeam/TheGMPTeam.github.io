# TheGMPTeam Studios — Full Site Spec v1

Written 2026-11-17 after a full audit + code review of the v69c engine.
This is the contract for the modular rebuild. Plain vanilla JS, no build
step, no framework, GitHub Pages-compatible (static files + ES modules).

---

## 1. Inventory (audited 2026-11-17)

Pages (5): index (splash+intro+welcome), status (HUD, no splash), games,
products, videos (carousel live here only). Shared: site.css, site.js,
footer/nav markup duplicated per page (rebuild keeps this; Pages-static
constraint, templating is out of scope).

Clips (12, h264 384x576, 670-1554kbps, ~19MB total):
  idle1 15.1s | idle2 15.1s | idle5 10.5s
  walkon1 5.1s | walkon2 15.1s | walkoff1 10.0s
  action1 15.1s (page fix) | action2 10.1s (chain pull)
  action3 10.1s (valve wheel) | action4 10.1s (lever throw)
  welcome-home 15.0s | welcome-videos 10.2s (enter theater only, never pooled)

SFX (9, /assets/sfx/): glitch, whoosh, ignite, hum, poof, bubble,
chainclink, leverclunk + per-clip embedded audio in the mp4s.

Engine: assets/site.js 966 lines, one IIFE with 8 sub-closures glued by
56 window.__vg* globals. site.css ~290 lines with version layering
(duplicate selectors: #mascot x3, html x2, #mascot video x2, #vgchain x2).

## 2. Behavior spec (current, as-is — the rebuild must preserve all of it)

S1 Splash (index, videos): always shown, click to enter. Circle porthole.
   SKIP WELCOME saved => auto-dismiss 1.5s, no theater.
   Enter theater: glitch SFX -> scanline/glitch shatter -> collapse into
   port circle (whoosh) -> centered intro circle ignite (ignite SFX) ->
   page-specific welcome clip with SKIP (one-click jump to end) ->
   FLIP shrink into corner -> port ignite -> idle rotation.
S2 Engine: pool auto-probed from naming contract (see C1). Double-buffer
   crossfade swaps, no gaps. Rotation forever; walk pairing; actions are
   trigger-only (never random). Idle pool must never repeat immediately.
S3 Actions + triggers:
   text-glitch event (auto 60-150s) -> action1 -> letters fall off,
   repair synced to clip timeline 35-85%, byte-exact restore.
   chain click -> action2. mascot click -> action3 (+pop SFX).
   CTA/product hover (once per page, 90s cool) -> action4 (+leverclunk).
S4 Chain rig: fixed-position chain under corner port (body-level, escapes
   the port's overflow clip), scroll layers + video-crawl (0.85 links/s
   while any clip plays, interval 400ms + CSS transition), gears mesh
   bottom, click = tug -> action2.
S5 Portal exit theater: after walkoff ends: pulse empty port -> portal
   overlay (enter leg + exit leg, hum loop, conic rim) -> corner plays
   walk-on -> rotation resumes. Toggle: PORTAL FX. Cooldown 20s.
S6 Assistant layer: data-tip sections/elements -> terminal bubble
   typewriter on hover/scroll-arrival/click (25s cooldown, once per
   section), help-offer after idle, tips typing drives eye shimmer.
S7 Gaze caret overlay: eyes track mouse w/ exponential smoothing,
   retract while typing, hide when port hidden.
S8 Menu: right-click on mascot/intro/splash -> SKIP / PORTAL FX / STOP /
   RESUME / MUTE (toggles persist in localStorage vgset).
S9 Scroll reveal: .wrap children fade-rise via IntersectionObserver,
   honors prefers-reduced-motion everywhere.
S10 Sound: clip audio embedded; SFX via WebAudio (unlocks on first
   gesture); mute is saved and global; music-free rule for all clips.

## 3. Defect registry (from code review, by blast radius)

D1 FIXED 1a92908: splash preload gate counted 4 but listed 3 (idle4
   pulled) -> every splash load burned the 6s fallback + one 404.
D2 mascot single click fires BOTH mute-toggle and action3 (two closures,
   one gesture). Rebuild: one click = one action (action3; mute moves to
   menu/dblclick).
D3 engine ticker polls every 1500ms to detect clip end -> up to 1.5s
   dead air window between clips on slow swaps. Rebuild: 'ended' event
   drives the swap.
D4 56 window.__vg* globals: cross-closure coupling; one typo = whole
   block death, no lifecycle. Rebuild: one event bus, zero globals
   except a single window.vg namespace for probes.
D5 trigger->clip URLs hardcoded in 3 places ('/assets/status/action2.mp4'
   appears x3). Rebuild: action registry, URLs named once.
D6 cue timing is per-block ad hoc (leverclunk on hover, clink on click) —
   NOT synced to the clips' actual beats. Rebuild: cue table (C2).
D7 CSS duplicate selectors from version accretion; no layering order.
   Rebuild: one pass, sections ordered, zero duplicates.
D8 arrival-watcher intervals run until their flag is found; on pages
   where the flag never comes they spin forever. Rebuild: capped retries.
D9 anti-repeat is depth-1 only (research P4 loop-killer unimplemented).
D10 no teardown of timers/listeners on pagehide (minor for static pages,
   fixed free by module structure).

## C1. Naming contract v2 (unchanged)
idleN / walkonN / walkoffN / actionN in /assets/status/, engine probes
1..8/1..4/1..4/1..4. Pairing: walkoff end -> walkon next; walkon only
from empty stage; actions trigger-only; welcome-* never pooled.

## C2. Cue table v1 (NEW — the "match hands/eyes/gears/sounds" contract)

While a clip plays, the clip's OWN currentTime schedules page-side cues
so page FX hit on the exact beat the mascot's hands move. Times measured
from frame QC of each clip:

action2 (chain pull, 10.1s):
  0.8s  arms reach        -> page chain: links brighten
  2.2s  pull 1 (hand down) -> chain tug + chainclink.mp3 + gear jolt
  4.2s  pull 2             -> chain tug + chainclink + gear jolt
  7.6s  release            -> chain sway decays
action3 (valve wheel, 10.1s):
  1.4s  grip               -> mascot poke pop
  2.6s  wheel starts       -> gear spin burst (CSS class 1.6s)
  6.4s  wheel stops        -> clunk (chainclunk via detent)
action4 (lever throw, 10.1s):
  1.6s  reach              -> chain links brighten
  3.9s  THROW (measured)   -> leverclunk.mp3 + page gear jolt
  8.2s  reset              -> nothing
action1 (page fix, 15.1s): repair window cues EXIST (35-85% mend map,
  keep as-is, express through the cue scheduler instead of bespoke code).
Gaze cues: gaze overlay points at the rig during action2/3/4 reach beats.

Implementation: cues.js — a scheduler ticked by the engine's rAF watch;
entry = {clip, t, act, arg}; fires once per play; late cues (>0.4s) are
skipped, never queued (old-cue rule).

## 4. Module architecture (the rebuild; ship M1->M3, old engine stays until green)

assets/js/main.js        composition root, boots the rest
assets/js/core.js        bus (emit/on), vgset, probe surface (window.vg)
assets/js/engine.js      pool, pairing, double-buffer, ended-driven swaps
assets/js/cues.js        cue table + scheduler (C2)
assets/js/actions.js     trigger registry: gesture -> play(clip) + gates
assets/js/fx.js          WebAudio play/loop/unlock
assets/js/rig.js         chain + gears, crawl, tug, click->action2
assets/js/gaze.js        eye overlay (deadzone, damping, typing retract)
assets/js/portal.js      exit theater + portal visuals
assets/js/pagefx.js      letter-drop glitch + timeline-synced repair
assets/js/enter.js       splash + intro theater
assets/js/assist.js      tips layer + bubble
assets/js/menu.js        context menu + controls

Rules: ES modules over script type=module; each module <150 lines; bus
events replace every __vg* seam; probe seam = exactly one object
(window.vg.{force,fx,glitch,pool,why}) for CDP verification; every module
idempotent under double-boot; teardown on pagehide.

Deploy plan: ship modules behind a new main.js include; site.js stays as
fallback until the module set passes the same CDP probes the legacy
engine passed (each module gets its probe). Cut over by swapping one
script tag; revert = one line.

## 5. Verification standard (every module before cutover)
CDP probe per behavior: pool count, ended-swap latency <300ms, cue fire
times vs currentTime, chain transforms change during playback, glitch
byte-exact restore, portal legs roll unmuted, menu toggles persist.
