# TALK_PLAN.md — hover-spot talking clips: full per-action plan

v1, 2026-11-17 (MacNode + James). Governs the 22 hover/click spots wired in
v76 (data-talk attrs). One clip per spot. Pipeline: vg-say (PocketTTS alba ref
audio + MiniMax H3 r2v on the 3060, --default-device 0) -> QC -> deploy ->
engine staging. NOTHING deploys without passing every gate below.

## Generation spec (every clip)
- Voice: PocketTTS `alba` (same as welcome/idle clips) -> mp3 -> ref_audios
  (exclusive audio source).
- Prompt (node 156, per job via vg-say --emotion/--look): base talking prompt
  + SPEECH paragraph with the exact line as `<d>[English] line</d> (S1)` +
  Delivery: <emotion> + GAZE sentence (left/right/center per table) +
  affirmative anatomy lock (two arms/two legs, rigid skin knobs).
- GPU: RTX 3060 only (policy 2026-11-17; 5060 Ti = Strata + nightly n8n).
- Seeds: up to 6 attempts, fresh seed per attempt (seed lottery).

## QC gates (per clip, all mandatory)
1. Audio: whisper tiny F1 >= 0.6 AND every --require word verbatim in the
   transcript (guard fixed 2026-11-17; was dead code). Use --asr small for
   brand-word lines if tiny keeps mangling.
2. Video: frames at 2s / mid / last -> vision check: mascot present every
   frame, mouth animating, exactly 2 arms + 2 legs (watch headband stubs +
   leg columns), hands clean, no ghosts/dupes, background stable.
3. Staging: gaze direction matches this table (head/body toward the stated
   side). Wrong gaze = fail, re-roll with same seed once then new seed.
4. Deploy-process: ffmpeg -c:v copy -c:a aac 128k
   -af loudnorm=I=-16:TP=-1.5:LRA=11 -movflags +faststart
   -> assets/talk/<slug>.mp4 (H.264+AAC mp4 contract).

## Site staging (where the clip plays + which way he looks)
- Desktop (>=820px): on trigger the port circle (190px) glides from its corner
  home to the ANCHOR below; portal FX ring opens at the anchor; clip plays in
  the port; muted-state bubble docks beside the port; on clip end the portal
  closes and the port glides home, idle rotation resumes.
- ANCHOR rules: gaze=left spots -> port anchored just RIGHT of the spot
  (port left edge = spot right edge + 8px, top aligned to spot top, clamped to
  viewport). gaze=right spots (right-column cards) -> port just LEFT of the
  spot, mirrored. Hero/section spots -> corner home position, gaze left.
- Mobile (<820px): no re-stage; corner port; only gaze=left/center clips used.
- data-look="left|right|center" attribute on each spot drives the engine;
  clips are rendered to match their spot's data-look.

## The 22 actions
| # | slug | page/spot | line (TTS) | emotion | look | anchor |
|---|------|-----------|------------|---------|------|--------|
| 1 | videos-reel | videos hero tip | Two real demos in the reel: VirusGPT and Command Center. Everything else is archive. | proud, informative | left | corner |
| 2 | home-movements | index movements section | Four movements. Draft three was shorter. We kept the long one. | wry, amused | left | right of section |
| 3 | game-worlds | games worlds section | Seven beta worlds, one universe. Main world first. | steady, confident | left | right of section |
| 4 | game-pitch | games pitch block | That pitch is word for word from the game page. | amused | left | right of block |
| 5 | home-grid | index hero tip | This is the GMP grid. The little guy in the corner? Rendered on our own rig. | playful, welcoming | left | corner |
| 6 | prod-billboard | products sim section | This page is the billboard. The real cockpit is LAN-only. | dry, reassuring | left | right of section |
| 7 | game-train | games feature card | The Train Game. Live on Roblox now, seven beta worlds deep. | proud announcement | left | right of card |
| 8 | prod-vbvcode | products VBVCODE card (col2) | VBVCODE is our in-house voice stack. Training now, shipping soon. | excited, forward-looking | left | right of card |
| 9 | game-main | games CTA (data-say) | Main world loads first. Steam era, old rails, real freight. Enjoy. | warm invitation | left | right of CTA |
| 10 | home-elephant | index CTA (data-say) | Start with the grid map, then the demo reel. That is how we would eat this elephant. | brisk, cheerful | left | right of CTA |
| 11 | home-rig | index THE RIG section | THE RIG is the workstation behind everything you are watching. The mascot clips render on its GPUs. | proud, weighty | left | right of section |
| 12 | prod-nexus | products NEXUS card (col2) | NEXUS is our agent mesh: one brain per machine, shared memory, no SaaS. | crisp, technical | left | right of card |
| 13 | prod-shorts | products Shorts card (col1) | Scene scripts here, renders there, and a human approves before anything ships. | calm, procedural | left | right of card |
| 14 | prod-comfyui | products ComfyUI card (col3) | Two GPUs, one queue: the mascot you are watching came out of this fleet. | warm pride | RIGHT | left of card |
| 15 | prod-fleet | products Fleet sim card (col2) | What you are looking at right now IS the sim. The real cockpit never leaves the LAN. | reassuring | left | right of card |
| 16 | prod-virusgpt | products VirusGPT card (col1) | VirusGPT runs fully offline, on your box. No cloud, no keys, no telemetry. | confident, firm | left | right of card |
| 17 | prod-trains | products Train Game card (col3) | Steam era on Roblox. Seven beta worlds and a tycoon in the forge. | adventurous | RIGHT | left of card |
| 18 | game-king | games King class section | The King class in this section was rendered in Blender. The same build rolls in-game. | reverent | left | right of section |
| 19 | prod-blender | products Blender card (col1) | That locomotive was modeled in Blender and driven into Roblox over MCP. Wild, right? | delighted | left | right of card |
| 20 | game-tracks | games roadmap section | Trains, cargo, profiles, AutoTrack: all running. Road, air, water and tycoon are next. | brisk roadmap | left | right of section |
| 21 | prod-nine | products hero tip | Nine offerings. Click any card and I open the spec sheet. | brisk, welcoming | left | corner |
| 22 | prod-probe | products grid-header section | Every card probes for its own clip. Drop a video at assets/products and it auto-plays. | matter-of-fact, wink | left | right of header |

Status: #1 audio-passed pre-gaze (0.69, regenerate with --look left before
deploy). All others queued in todo 45.2-45.22. Status page has no hover spots
yet; adding spots there is a separate item when the set lands.

## Engine work (wire phase, after clips pass)
- data-look attrs on all 22 spots (matches table).
- Port re-anchor + portal open/close choreography (reuse #vgportal visuals at
  dynamic position; PORTAL FX submenu toggle already gates FX).
- HOVER ACTIONS toggle already gates hover triggers; bubble docks beside the
  staged port position.
