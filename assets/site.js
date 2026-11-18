(function(){
  // Smooth section reveal: children of .wrap inside <section>/<header> fade+rise on scroll-in.
  (function(){
    if(!('IntersectionObserver' in window))return;
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var els=document.querySelectorAll('section .wrap > *, header.hero .wrap > *');
    if(!els.length)return;
    Array.prototype.forEach.call(els,function(el){el.classList.add('rv');});
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target);}});
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    Array.prototype.forEach.call(els,function(el){io.observe(el);});
  })();

  // Porthole user settings (per browser, all pages): { skipWelcome, muted }
  function vgSet(){try{return JSON.parse(localStorage.getItem('vgset')||'{}');}catch(e){return{};}}
  function vgSave(s){try{localStorage.setItem('vgset',JSON.stringify(s));}catch(e){}}
  if(vgSet().muted){window.__vgMuted=true;}
  // 3D perspective coverflow: active video dead-center, neighbors angled back on Z.
  // Hover on the current slide injects a muted autoplaying YouTube embed; removed on leave/slide change.
  document.querySelectorAll('.car').forEach(function(car){
    var slides=Array.prototype.slice.call(car.querySelectorAll('.slide'));
    var dotsWrap=document.querySelector('.dots[data-car="'+car.id+'"]');
    var cur=0;
    slides.forEach(function(s,i){
      var b=document.createElement('button');
      b.className='dot-i'; b.type='button';
      b.setAttribute('aria-label','go to video '+(i+1));
      b.addEventListener('click',function(){ go(i); });
      if(dotsWrap) dotsWrap.appendChild(b);
    });
    var dots=dotsWrap?Array.prototype.slice.call(dotsWrap.children):[];
    function stop(){
      var f=car.querySelector('.slide .thumb iframe');
      if(f) f.remove();
      var b=car.querySelector('.slide .mute-btn');
      if(b) b.remove();
    }
    function render(){
      slides.forEach(function(s,i){
        var off=i-cur;
        if(off===0){
          s.style.transform='translate3d(0,0,0)';
          s.style.opacity='1';
        } else {
          var mag=Math.abs(off);
          if(mag<=2){
            var sgn=off>0?1:-1;
            // ring depth chosen so the rotated inner edge stays BEHIND the center plane:
            // edgeZ = z + (W/2)*sin(rot) < 0  ->  -240+~180=-60, -420+~254=-166
            var x=mag===1?46:82, z=mag===1?-240:-420, rot=mag===1?30:45;
            s.style.transform='translate3d('+(sgn*x)+'%,0,'+z+'px) rotateY('+(sgn*rot)+'deg)';
            s.style.opacity=mag===1?'0.55':'0.3';
          } else {
            var sgn2=off>0?1:-1;
            s.style.transform='translate3d('+(sgn2*120)+'%,0,-400px) rotateY('+(sgn2*55)+'deg)';
            s.style.opacity='0';
          }
        }
        s.style.zIndex=String(100-Math.abs(off));
        s.style.pointerEvents=off===0?'auto':'none';
        s.classList.toggle('current',off===0);
      });
      dots.forEach(function(d,i){ d.classList.toggle('on',i===cur); });
      var l=car.querySelector('.car-arrow.left'), r=car.querySelector('.car-arrow.right');
      if(l) l.classList.toggle('hide',cur===0);
      if(r) r.classList.toggle('hide',cur===slides.length-1);
      stop();
    }
    function go(i){ cur=Math.max(0,Math.min(slides.length-1,i)); render(); }
    car.querySelectorAll('.car-arrow').forEach(function(a){
      a.addEventListener('click',function(e){ e.stopPropagation(); go(cur+(a.dataset.dir==='next'?1:-1)); });
    });
    slides.forEach(function(s){
      s.addEventListener('mouseenter',function(){
        if(slides[cur]!==s) return;
        var h=s.querySelector('.thumb');
        if(!h||h.querySelector('iframe')) return;
        var f=document.createElement('iframe');
        f.src='https://www.youtube.com/embed/'+s.dataset.vid+'?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1';
        f.allow='autoplay; encrypted-media; picture-in-picture';
        f.allowFullscreen=true; f.loading='lazy';
        h.appendChild(f);
        // mute toggle overlay: small pill, click flips muted state via YouTube postMessage API
        var b=document.createElement('button');
        b.type='button'; b.className='mute-btn'; b.textContent='UNMUTE';
        var muted=true;
        b.addEventListener('click',function(ev){
          ev.stopPropagation(); ev.preventDefault();
          try{ f.contentWindow.postMessage(JSON.stringify({event:'command',func:muted?'unMute':'mute',args:[]}),'*'); }catch(err){}
          muted=!muted;
          b.textContent=muted?'UNMUTE':'MUTE';
          b.classList.toggle('on',!muted);
        });
        h.appendChild(b);
      });
    });
    car.addEventListener('mouseleave',stop);
    // touch swipe
    var tx=null;
    car.addEventListener('touchstart',function(e){ tx=e.touches[0].clientX; },{passive:true});
    car.addEventListener('touchend',function(e){
      if(tx===null) return;
      var dx=e.changedTouches[0].clientX-tx;
      if(Math.abs(dx)>40) go(cur+(dx<0?1:-1));
      tx=null;
    },{passive:true});
    document.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight') go(cur+1);
      if(e.key==='ArrowLeft') go(cur-1);
    });
    render();
  });

  // Home splash: ALWAYS shown (every load), no auto timer, click required to enter.
  // Stays up while reel + idle clips preload, then hints CLICK TO ENTER.
  // The side mascot port sits under the splash, paused, until the enter click
  // (the click gesture is what unlocks audio for the reel).
  (function(){
    var s=document.getElementById('splash');
    if(!s){window.__vgEntered=true;return;}
    // Corner port stays invisible until the welcome presentation lands in it.
    document.body.classList.add('vg-pre');
    document.addEventListener('vg:enter',function(){document.body.classList.remove('vg-pre');});
    var hint=s.querySelector('.splash-hint');
    if(hint){hint.textContent='LOADING SYSTEM...';}
    var ready=0,opened=false;
    function prog(){ready++;if(ready>=PRELOADS.length){open();}}
    function open(){if(opened)return;opened=true;window.__vgVidReady=true;if(hint){hint.textContent='CLICK TO ENTER';}
      // With SKIP WELCOME saved, the splash dismisses itself: no click needed.
      if(vgSet().skipWelcome){setTimeout(function(){if(!s.dataset.leaving){s.dataset.leaving='1';fastExit();}},1500);}
    }
    var ivv=document.getElementById('iv');
    function fastExit(){
      sfx('whoosh');
      s.style.transition='opacity .25s';
      s.classList.add('collapse');
      setTimeout(function(){
        s.remove();
        var mm=document.getElementById('mascot');
        if(mm){mm.classList.add('ignite');}
        document.dispatchEvent(new CustomEvent('vg:enter'));
      },280);
    }
    var WSRC=(ivv&&ivv.getAttribute('src'))||'/assets/status/welcome-home.mp4';
    // Transition sound effects (synthesized, local): glitch zap on click,
    // vacuum suck on collapse, power-on hum+pop when the welcome ignites.
    var SFXP={glitch:'/assets/sfx/glitch.mp3',whoosh:'/assets/sfx/whoosh.mp3',ignite:'/assets/sfx/ignite.mp3'};
    function sfx(n){
      if(window.__vgMuted||!SFXP[n])return;
      try{var a=new Audio(SFXP[n]);a.volume=0.75;var p=a.play();if(p&&p.catch)p.catch(function(){});}catch(e){}
    }
    if(vgSet().skipWelcome){
      // Skip mode: don't stall on media preloads the user opted out of.
      open();
    }else{
    var PRELOADS=['/assets/status/idle1.mp4','/assets/status/idle5.mp4','/assets/status/action1.mp4'];
    PRELOADS.forEach(function(u){
      var v=document.createElement('video');v.preload='auto';v.muted=true;
      v.addEventListener('loadeddata',prog);v.addEventListener('error',prog);
      v.src=u;
    });
    }
    setTimeout(open,6000);
    s.addEventListener('click',function(){
      if(s.dataset.leaving){return;}
      s.dataset.leaving='1';
      sfx('glitch');
      var m=document.getElementById('mascot');
      var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduce){s.remove();document.dispatchEvent(new CustomEvent('vg:enter'));return;}
      // Saved SKIP preference: no welcome presentation, straight to the port.
      if(vgSet().skipWelcome){fastExit();return;}
      // 1) scanline sweep + glitch shatter
      s.classList.add('glitch');
      // 2) whole splash collapses into the port circle
      setTimeout(function(){
        sfx('whoosh');
        var mc=m?m.getBoundingClientRect():{left:window.innerWidth-120,top:96,width:190,height:190};
        var cx=mc.left+mc.width/2,cy=mc.top+mc.height/2;
        var vw=window.innerWidth,vh=window.innerHeight;
        s.style.transformOrigin='50% 50%';
        s.style.transform='translate('+(cx-vw/2)+'px,'+(cy-vh/2)+'px) scale(.06)';
        s.classList.add('collapse');
      },580);
      // 3) full-screen welcome presentation, then it collapses into the port
      setTimeout(function(){
        s.remove();
        var intro=document.getElementById('intro');
        if(!intro){
          if(m){m.classList.add('ignite');}
          document.dispatchEvent(new CustomEvent('vg:enter'));
          return;
        }
        var iv=document.getElementById('iv');
        intro.style.display='flex';
        sfx('ignite');
        // SKIP must live outside the circular intro box: fixed positioning
        // inside a transformed ancestor is clipped by the porthole corners.
        var skb=intro.querySelector('.iskip');
        if(skb){document.body.appendChild(skb);}
        (function tryP(mm){
          iv.muted=mm;
          var p=iv.play();
          if(p&&p.catch){p.catch(function(){if(!mm){tryP(true);}});}
        })(!!window.__vgMuted);
        var fin=false;
        function finish(){
          if(fin){return;}
          fin=true;
          if(skb){skb.style.display='none';}
          if(!m){intro.remove();document.dispatchEvent(new CustomEvent('vg:enter'));return;}
          var mc=m.getBoundingClientRect();
          var small=window.innerWidth<=720;
          var size=small?120:190,top=small?84:88,right=small?12:24;
          var r0=intro.getBoundingClientRect();
          intro.classList.add('parked');
          intro.style.left='auto';intro.style.inset='auto';
          intro.style.transform='none';
          intro.style.top=top+'px';intro.style.right=right+'px';intro.style.width=size+'px';intro.style.height=size+'px';
          var r1=intro.getBoundingClientRect();
          intro.style.transformOrigin='top left';
          intro.style.transition='none';
          intro.style.transform='translate('+(r0.left-r1.left)+'px,'+(r0.top-r1.top)+'px) scale('+(r0.width/r1.width)+')';
          requestAnimationFrame(function(){requestAnimationFrame(function(){
            intro.style.transition='transform .9s cubic-bezier(.2,.7,.2,1)';
            intro.style.transform='translate(0px,0px) scale(1)';
          });});
          setTimeout(function(){
            intro.style.transition='opacity .5s';
            intro.style.opacity='0';
            setTimeout(function(){intro.remove();},550);
            m.classList.add('ignite');
            var vs=document.querySelectorAll('#mascot video');
            if(vs[0]){vs[0].classList.add('flick');}
            document.dispatchEvent(new CustomEvent('vg:enter'));
          },1000);
        }
        iv.addEventListener('ended',finish);
        iv.addEventListener('click',function(){window.__vgMuted=!window.__vgMuted;iv.muted=window.__vgMuted;});
        if(skb){skb.style.cursor='pointer';skb.addEventListener('click',function(e){e.stopPropagation();e.preventDefault();iv.currentTime=(iv.duration||15.0)-0.02;});}
      },1150);
    });
  })();

  // Site-wide assistant mascot: circular port playing shuffled idle clips forever,
  // double-buffered with crossfade so swaps have no dead gaps. Frames and sound are
  // separate tracks (silent mp4 + m4a sprite) so a speech layer can drive audio later.
  (function(){
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var host=document.getElementById('mascot');
    if(!host){
      host=document.createElement('div');host.id='mascot';host.setAttribute('aria-hidden','true');
      var a=document.createElement('video');a.id='mvid1';
      var b=document.createElement('video');b.id='mvid2';
      a.muted=true;b.muted=true;a.playsInline=true;b.playsInline=true;
      a.preload='auto';b.preload='auto';
      host.appendChild(a);host.appendChild(b);
      document.body.appendChild(host);
    }
    // Idle pool with WALK PAIRING. Filenames encode the role:
    //   idleN.mp4     -- starts and ends with the character present (neutral)
    //   walkonN.mp4   -- starts off-stage and walks in, ends present
    //   walkoffN.mp4  -- starts present, ends with the character gone
    // Pairing rules (James 2026-11-17): a walk-off ending must be followed by a
    // walk-on; walk-ons only follow walk-off endings (never an occupied stage);
    // when walk-ons run out after an empty ending, fall back to anything.
    // Drop files named that way on the CDN and they join automatically.
    // Pool roles (naming contract v2):
    //   idleN.mp4     neutral loops          -- rotation staple
    //   actionN.mp4   scene beats (page-fix, wave work) -- rotation guest,
    //                 never twice in a row, never adjacent to another action
    //   walkonN.mp4   enters stage           -- only after an empty stage
    //   walkoffN.mp4  exits stage            -- only from a present stage
    //   welcome-home.mp4 / welcome-videos.mp4 are NEVER probed into the pool:
    //   they belong to the enter presentation only.
    var SLOT=[];var i;for(i=1;i<=8;i++)SLOT.push(['idle',i]);for(i=1;i<=4;i++)SLOT.push(['walkon',i]);for(i=1;i<=4;i++)SLOT.push(['walkoff',i]);for(i=1;i<=5;i++)SLOT.push(['action',i]);
    var IV=[],IA=[]; // entries: {u:URL, endGone:bool, role:'idle'|'walkon'|'walkoff'|'action'}
    window.__vgPool=IV;
    var shown=document.getElementById('mvid1'),buf=document.getElementById('mvid2');
    var mediaDead=false,probed=0,started=false;
    [shown,buf].forEach(function(x){x.addEventListener('error',function(){mediaDead=true;});});
    var pre=null,audioOn=false,lastEndGone=false,lastU='',lastRole='';
    var paused=false,curEntry=null,exiting=false;
    var engineOn=!document.getElementById('splash');
    function maybeStart(){
      if(probed===SLOT.length&&!IV.length){mediaDead=true;return;}
      if(IV.length&&engineOn&&!started){started=true;startIdle();ensurePre();}
    }
    SLOT.forEach(function(s){
      var u='/assets/status/'+s[0]+s[1]+'.mp4';
      var v=document.createElement('video');v.preload='auto';v.muted=true;v.playsInline=true;
      v.addEventListener('loadeddata',function(){IV.push({u:u,endGone:s[0]==='walkoff',role:(s[0]==='action'&&(s[1]===4||s[1]===5))?'idle':s[0]});maybeStart();});
      v.addEventListener('error',function(){probed++;maybeStart();});
      v.src=u;
    });
    // v74: 'talk' clips -- the mascot addressing the viewer (open mouth,
    // presenting gesture). Never random rotation (pick() only admits
    // idle/walkon/walkoff roles); hover/click speech triggers them via
    // __vgForce. welcome-home = generic talk beat, welcome-videos = the
    // videos-page one.
    ['/assets/status/welcome-home.mp4','/assets/status/welcome-videos.mp4'].forEach(function(u){
      var v=document.createElement('video');v.preload='auto';v.muted=true;v.playsInline=true;
      v.addEventListener('loadeddata',function(){IV.push({u:u,endGone:false,role:'talk'});});
      v.addEventListener('error',function(){});
      v.src=u;
    });
    // Hard pairs: 'b' plays ONLY immediately after 'a', and 'a' always hands to 'b'.
    // Board->Houser retired 2026-11-17 when James pulled idle3 (Houser).
    var PAIRS=[];
    function has(u){for(var k=0;k<IV.length;k++)if(IV[k].u===u)return IV[k];return null;}
    function pick(){
      if(!IV.length)return null;
      // v70 loop: with a loop URL set, always hand back the same clip -- the
      // rotation engine becomes a single-clip looper (see __vgLoop).
      if(LOOPU){var le=has(LOOPU);if(le){lastU=le.u;lastEndGone=le.endGone;lastRole=le.role;return le;}}
      var e=null,i;
      for(i=0;i<PAIRS.length;i++){if(lastU===PAIRS[i].a){e=has(PAIRS[i].b);break;}}
      if(!e){
        var pool;
        if(lastEndGone)pool=IV.filter(function(x){return x.role==='walkon';});
        else pool=IV.filter(function(x){return x.role==='idle'||x.role==='walkoff';});
        // Actions (actionN) join ONLY when an interaction triggers them --
        // text glitch-fix plays action1, chain pull plays action2 -- via
        // __vgForce. EXCEPTION (v76d/v76h, James): action4 (lever+stage
        // lights) and action5 (hype jumps) load with role 'idle' and DO
        // rotate; their FX watchers key off the playing clip.
        pool=pool.filter(function(x){for(var k=0;k<PAIRS.length;k++)if(x.u===PAIRS[k].b)return false;return true;});
        if(!pool.length)pool=IV;
        var alt=pool.filter(function(x){return x.u!==lastU;});
        if(alt.length)pool=alt;
        e=pool[Math.floor(Math.random()*pool.length)];
      }
      lastU=e.u;lastEndGone=e.endGone;lastRole=e.role;
      return e;
    }
    function ensurePre(){if(pre!==null)return;var e=pick();if(!e)return;buf.muted=true;buf.src=e.u;try{buf.load();}catch(e2){}pre=e;}
    function forcePlay(u){
      var e=has(u);
      if(!e)return false;
      pre=e;
      idleLoop();
      return true;
    }
    window.__vgForce=forcePlay;
    // v70: status-tour loop -- force the pull-chain clip on REPEAT so the
    // rig's beat-sync demos continuously while the auto-tour scrolls.
    // Retries until the clip is probed into the pool; unloop restores the
    // normal idle rotation.
    var LOOPU=null;
    // v75.1: per-spot talk clips. Elements carry data-talk="/assets/talk/x.mp4";
    // hovering/clicking that spot forces THAT clip instead of the generic
    // welcome talk beat. Clips are probed into the pool at startup (role=talk,
    // never random rotation); missing files simply stay out and the generic
    // clip is the fallback, so the site can be wired before renders land.
    function registerTalk(u){
      if(!u||has(u))return;
      var v=document.createElement('video');v.preload='auto';v.muted=true;v.playsInline=true;
      v.addEventListener('loadeddata',function(){IV.push({u:u,endGone:false,role:'talk'});});
      v.addEventListener('error',function(){});
      v.src=u;
    }
    window.__vgRegisterTalk=registerTalk;
    function scanTalkSpots(){
      var els=document.querySelectorAll('[data-talk]'),k;
      for(k=0;k<els.length;k++)registerTalk(els[k].getAttribute('data-talk'));
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scanTalkSpots);else scanTalkSpots();
    window.__vgLoop=function(u){
      LOOPU=u;var tries=0;
      var iv=setInterval(function(){
        tries++;
        if(!LOOPU||tries>30){clearInterval(iv);return;}
        if(has(LOOPU)&&forcePlay(LOOPU)){clearInterval(iv);window.__vgLooping=true;}
      },600);
    };
    window.__vgUnloop=function(){LOOPU=null;window.__vgLooping=false;};
    function firstWalkon(){
      var w=IV.filter(function(x){return x.role==='walkon';});
      if(!w.length)return null;
      return w[Math.floor(Math.random()*w.length)].u;
    }
    function idleLoop(watchdog){
      if(!IV.length||paused)return;
      // EXIT THEATER (v46, James): the walk-off clip just ENDED on stage.
      // Stop rotation, pulse the empty port, run the page portal (walk-in ->
      // walk-out inside it, then removed); when it's done, the corner port
      // plays walk-in itself and the rotation resumes.
      // v76f (James 2026-11-19): portal fires ONLY at the rotation handoff
      // pause (watchdog sees the clip actually ended). endGone is a static
      // clip flag, so a hover-force during a walk-off used to launch the
      // portal mid-clip -- "firing before the pause". A force over an ended
      // walk-off just brings the mascot back; no portal that cycle.
      if(curEntry&&curEntry.endGone&&!watchdog){curEntry=null;}
      if(curEntry&&curEntry.endGone&&watchdog&&vgSet().portalFx!==false&&!exiting){
        exiting=true;paused=true;curEntry=null;pre=null;
        host.classList.add('vg-pulse');
        setTimeout(function(){host.classList.remove('vg-pulse');},1500);
        var enterU=firstWalkon();
        document.addEventListener('vg:portal-done',function(){
          exiting=false;paused=false;lastEndGone=false;
          if(enterU){forcePlay(enterU);}else{ensurePre();idleLoop();}
        },{once:true});
        try{document.dispatchEvent(new CustomEvent('vg:portal'));}catch(ev1){}
        return;
      }
      if(pre===null)ensurePre();
      if(pre===null)return;
      var e=pre;pre=null;curEntry=e;
      buf.muted=true;buf.style.opacity='0';
      if(buf.currentSrc.indexOf(e.u)<0){buf.src=e.u;}
      var pr=buf.play();if(pr&&pr.catch)pr.catch(function(){});
      buf.addEventListener('playing',function on(){
        buf.removeEventListener('playing',on);
        buf.style.opacity='1';shown.style.opacity='0';
        var t=shown;shown=buf;buf=t;
        try{shown.muted=!!window.__vgMuted;}catch(e2){}
        setTimeout(function(){try{buf.pause();}catch(e2){}ensurePre();},450);
      },{once:true});
    }
    function arm(){audioOn=!window.__vgMuted;try{shown.muted=!!window.__vgMuted;}catch(e){}}
    document.addEventListener('click',arm,{once:true});
    document.addEventListener('keydown',arm,{once:true});
    if(window.__audioPrearmed){audioOn=true;}
    function startIdle(){
      if(!IV.length)return;
      var e0=pick();if(!e0)return;
      curEntry=e0;
      try{shown.muted=!!window.__vgMuted;}catch(e){}
      shown.src=e0.u;
      try{shown.load();}catch(e){}
      var p0=shown.play();if(p0&&p0.catch)p0.catch(function(){});
    }
    if(document.getElementById('splash')){
      // Home: port stays paused under the splash; vg:enter (fired when the
      // welcome presentation finishes its collapse) starts the idle loop.
      document.addEventListener('vg:enter',function(){
        engineOn=true;
        audioOn=!window.__vgMuted;
        maybeStart();
      },{once:true});
    }else{
      maybeStart();
    }
    setInterval(function(){
      if(mediaDead||!engineOn||!started||!IV.length||paused){return;}
      if(!shown.paused&&!shown.ended&&!shown.seeking)return;
      // v71 watchdog guard kept for safety: __vgRev is never set since the
      // scroll->video engine was removed in v73, but the seek-state check
      // stays harmless.
      if(window.__vgRev)return;
      idleLoop(true);
    },1500);

    // Playback controls for the portholes: click = mute toggle, right-click = menu.
    window.vgCtl={
      skip:function(){
        // SKIP is a saved preference: toggles skipping the welcome presentation.
        var st=vgSet();st.skipWelcome=!st.skipWelcome;vgSave(st);
        var i=document.getElementById('intro'),v=document.getElementById('iv');
        if(i&&i.style.display!=='none'&&v&&!v.ended){v.currentTime=(v.duration||15.0)-0.05;}
      },
      stop:function(){
        var i=document.getElementById('intro'),v=i&&i.style.display!=='none'&&document.getElementById('iv');
        if(v){v.pause();return;}
        engineOn=false;try{shown.pause();buf.pause();}catch(e){}
      },
      resume:function(){
        var i=document.getElementById('intro'),v=i&&i.style.display!=='none'&&document.getElementById('iv');
        if(v){v.muted=!!window.__vgMuted;var p=v.play();if(p&&p.catch)p.catch(function(){});return;}
        engineOn=true;
        if(mediaDead||(!shown.paused&&!shown.ended))return;
        idleLoop();
      },
      mute:function(){
        var mm=!window.__vgMuted;window.__vgMuted=mm;audioOn=!mm;
        var st=vgSet();st.muted=mm;vgSave(st);
        var v=document.getElementById('iv');if(v){v.muted=mm;}
        try{shown.muted=mm;buf.muted=true;}catch(e){}
      }
    };
    var MENU=document.createElement('div');MENU.id='vgmenu';
    MENU.innerHTML='<div class="vgmi" data-a="skip">SKIP WELCOME</div><div class="vgmi" data-a="portal">PORTAL FX</div><div class="vgmi" data-a="hover">HOVER ACTIONS</div><div class="vgmi" data-a="stop">STOP</div><div class="vgmi" data-a="resume">RESUME</div><div class="vgmi" data-a="mute">MUTE</div>';
    document.body.appendChild(MENU);
    function closeMenu(){MENU.style.display='none';}
    function openMenu(x,y){
      MENU.querySelector('[data-a="skip"]').textContent='SKIP WELCOME'+(vgSet().skipWelcome?' \u2713':'');
      MENU.querySelector('[data-a="mute"]').textContent=(window.__vgMuted?'UNMUTE':'MUTE')+(window.__vgMuted?' \u2713':'');
      MENU.querySelector('[data-a="portal"]').textContent='PORTAL FX'+(vgSet().portalFx===false?'':' \u2713');
      MENU.querySelector('[data-a="hover"]').textContent='HOVER ACTIONS'+(vgSet().hoverOff?'':' \u2713');
      MENU.style.display='block';
      var w=MENU.offsetWidth,h=MENU.offsetHeight;
      MENU.style.left=Math.min(x,window.innerWidth-w-8)+'px';
      MENU.style.top=Math.min(y,window.innerHeight-h-8)+'px';
    }
    MENU.addEventListener('click',function(e){
      var it=e.target&&e.target.closest?e.target.closest('.vgmi'):null;
      if(!it)return;
      var a=it.getAttribute('data-a');
      if(a==='skip')window.vgCtl.skip();
      else if(a==='portal'){var ps=vgSet();ps.portalFx=ps.portalFx===false;vgSave(ps);}
      else if(a==='hover'){var hs=vgSet();hs.hoverOff=!(hs.hoverOff===true);vgSave(hs);}
      else if(a==='stop')window.vgCtl.stop();
      else if(a==='resume')window.vgCtl.resume();
      else window.vgCtl.mute();
      closeMenu();
    });
    document.addEventListener('mousedown',function(e){if(MENU.style.display==='block'&&!MENU.contains(e.target))closeMenu();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu();});
    document.addEventListener('contextmenu',function(e){
      var t=e.target&&e.target.closest?e.target.closest('#mascot,#intro,#splash'):null;
      if(!t)return;
      e.preventDefault();openMenu(e.clientX,e.clientY);
    });
    host.addEventListener('click',function(){window.vgCtl.mute();});
  })();

  // ---- Assistant layer (context-aware guide) ----
  // Sections/elements carry data-tip text; the mascot speaks them in a terminal
  // bubble as you reach, hover, or click them, and offers help when you go idle.
  // Copy lives in the page markup, not here: edit tips without touching JS.
  (function(){
    var REDUCE=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var bub=null,lastSay=0,COOLDOWN=25000,seen={},lastAct=Date.now(),helpOffered=0,hideT=null,hovT=null;
    function active(){
      var s=document.getElementById('splash');if(s&&s.style.display!=='none')return false;
      var i=document.getElementById('intro');if(i&&i.style.display!=='none')return false;
      if(document.body.classList.contains('vg-pre'))return false;
      return true;
    }
    function speak(txt,force){
      if(!txt||!active())return;
      var now=Date.now();
      if(!force&&now-lastSay<COOLDOWN)return;
      lastSay=now;
      var m=document.getElementById('mascot');
      if(m){m.classList.remove('vg-react');void m.offsetWidth;m.classList.add('vg-react');}
      // v75 (James): text bubbles ONLY while the mascot audio is muted.
      // Unmuted he speaks with his voice; a bubble on top of voiced speech
      // is noise. Hover/click still trigger the talking VIDEO animation --
      // only the text layer is gated.
      if(!bubAllowed())return;
      if(!bub){bub=document.createElement('div');bub.id='vgbubble';document.body.appendChild(bub);}
      clearTimeout(hideT);
      bub.classList.add('on');
      if(REDUCE){bub.textContent=txt;}
      else{
        var k=0;(function tw(){if(k<txt.length){bub.textContent=txt.slice(0,++k);if(window.__vgEye)window.__vgEye(k,true);setTimeout(tw,16);}})();
      }
      hideT=setTimeout(function(){bub.classList.remove('on');},2600+txt.length*40);
    }
    function act(){lastAct=Date.now();}
    ['scroll','keydown','click','mousemove','touchstart'].forEach(function(ev){
      document.addEventListener(ev,act,{passive:true});
    });
    function ioTips(){
      if(!('IntersectionObserver' in window))return;
      var io=new IntersectionObserver(function(en){
        en.forEach(function(e){
          if(!e.isIntersecting)return;
          var t=e.target.getAttribute('data-tip');
          if(!t||seen[t])return;
          seen[t]=1;speak(t);
        });
      },{threshold:0.55});
      var els=document.querySelectorAll('[data-tip-section]');
      for(var i=0;i<els.length;i++)io.observe(els[i]);
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ioTips);else ioTips();
    // v74 (James): hovering a spot makes the mascot ACTUALLY speak about it --
    // the presenting/talking clip joins on the port (welcome-videos on the
    // videos page, welcome-home elsewhere) alongside the bubble text. Users
    // who don't want hover actions get them OFF from the mascot's right-click
    // menu (HOVER TALK), persisted in the same vgset store as mute/skip.
    function hovOff(){try{return JSON.parse(localStorage.getItem('vgset')||'{}').hoverOff===true;}catch(e){return false;}}
    // Bubble text shows only while mascot audio is muted (toggle state lives
    // in vgset.muted and window.__vgMuted).
    function bubAllowed(){try{if(window.__vgMuted)return true;return JSON.parse(localStorage.getItem('vgset')||'{}').muted===true;}catch(e){return !!window.__vgMuted;}}
    function talkClip(){return /videos/.test(location.pathname)?'/assets/status/welcome-videos.mp4':'/assets/status/welcome-home.mp4';}
    document.addEventListener('mouseover',function(e){
      if(hovOff())return;
      // v76b: hover resolves the NEAREST [data-talk] spot under the pointer.
      // Before this, hovering a button inside a [data-tip] section always
      // played the SECTION clip (or its 404 fallback) — the button's own
      // data-talk only fired on click. Two handlers fought for one spot.
      var sp=e.target&&e.target.closest?e.target.closest('[data-talk]'):null;
      var t=sp||(e.target&&e.target.closest?e.target.closest('[data-tip]'):null);
      if(!t)return;
      var txt=t.getAttribute('data-say')||t.getAttribute('data-tip');
      if(!txt||seen[txt])return;
      clearTimeout(hovT);
      hovT=setTimeout(function(){seen[txt]=1;speak(txt,true);var u=t.getAttribute('data-talk')||talkClip();if(window.__vgForce&&!window.__vgForce(u))window.__vgForce(talkClip());},1300);
    });
    // v74: leaving the spot cancels a pending hover talk -- a timer that
    // fires after the pointer is gone reads as a random outburst.
    document.addEventListener('mouseout',function(e){
      var t=e.target&&e.target.closest?e.target.closest('[data-tip]'):null;
      if(t)clearTimeout(hovT);
    });
    document.addEventListener('click',function(e){
      var t=e.target&&e.target.closest?e.target.closest('[data-say]'):null;
      if(t){speak(t.getAttribute('data-say'),true);var u1=t.getAttribute('data-talk')||talkClip();if(window.__vgForce&&!window.__vgForce(u1))window.__vgForce(talkClip());return;}
      var c=e.target&&e.target.closest?e.target.closest('[data-tip]'):null;
      if(c){var txt=c.getAttribute('data-tip');seen[txt]=1;speak(txt,true);var u2=c.getAttribute('data-talk')||talkClip();if(window.__vgForce&&!window.__vgForce(u2))window.__vgForce(talkClip());}
    });
    setInterval(function(){
      if(helpOffered>=2||Date.now()-lastAct<45000)return;
      if(!active())return;
      helpOffered++;
      speak(helpOffered===1?'Need a hand? Hover anything on the page and I will talk. Right-click me for playback controls.':'Still there? The live fleet sim runs at /status.html, product demos at /videos.html.',true);
    },5000);
  })();

  // Real page interaction (v33): a pull-chain gear hangs off the port --
  // clicking it tugs, pops the mascot, and scrolls to the next section.
  // The mascot's "eye" sorts along its own bubble text while typing, and
  // sweeps real text lines on the page between speech. Port tilts toward
  // whatever it is looking at.
  (function(){
    var host=document.getElementById('mascot');
    if(!host)return;
    var REDUCE=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function live(){
      var sp=document.getElementById('splash');if(sp&&sp.style.display!=='none')return false;
      var it=document.getElementById('intro');if(it&&it.style.display!=='none')return false;
      if(document.body.classList.contains('vg-pre'))return false;
      return true;
    }
    function scrollOn(){
      var y=window.pageYOffset||document.documentElement.scrollTop||0;
      var secs=[].slice.call(document.querySelectorAll('section'));
      var nx=null,k;
      for(k=0;k<secs.length;k++){if(secs[k].offsetTop>y+40){nx=secs[k];break;}}
      var top=nx?(nx.offsetTop-70):0;
      try{window.scrollTo({top:top,left:0,behavior:REDUCE?'auto':'smooth'});}catch(e){window.scrollTo(0,top);}
    }
    var chain=document.createElement('div');chain.id='vgchain';chain.setAttribute('aria-hidden','true');
    // v72 (James 2026-11-17): photo-real assets. The right-edge scroller is
    // a seamless repeat-y photo chain (assets/chain.png); the corner
    // machines are real photo gears flood-keyed out of stock sheets
    // (assets/gear_*.png, transparent). Same physics as the drawn v71 rig:
    // chain travel (scrollY + beat tug) drives background-position, and the
    // gears rotate locked to that travel -- main photo gears (~116px on
    // screen, r=58px) set the pitch, secondaries counter-rotate at the
    // screen-radius ratio.
    chain.innerHTML='<div id="vgtrack"></div>';
    document.body.appendChild(chain);
    document.body.insertAdjacentHTML('beforeend',
      '<div class="vgsprocket t"><img class="p1" src="/assets/gear_main.png" alt=""><img class="p2" src="/assets/gear_dome.png" alt=""></div>'+
      '<div class="vgsprocket b"><img class="p1" src="/assets/gear_bronze.png" alt=""><img class="p2" src="/assets/gear_small.png" alt=""></div>');
    var gT=document.querySelector('.vgsprocket.t'),gB=document.querySelector('.vgsprocket.b');
    var gT1=gT.querySelector('.p1'),gT2=gT.querySelector('.p2');
    var gB1=gB.querySelector('.p1'),gB2=gB.querySelector('.p2');
    var CH=64; // chain tile period on screen (background-size: 64px)
    var lastTug=0;
    var K=360/(2*Math.PI*58); // 1px of chain travel = K deg of main gear
    function playing(){
      var mv=document.querySelectorAll('#mascot video'),k;
      for(k=0;k<mv.length;k++){
        var v=mv[k];
        if(!v.paused&&!v.ended&&v.readyState>=2&&v.currentTime<(v.duration||0)-0.05)return v;
      }
      return null;
    }
    function rig(tug){
      lastTug=tug||0;
      var pre=document.body.classList.contains('vg-pre')||(document.getElementById('splash')&&document.getElementById('splash').style.display!=='none')||(document.getElementById('intro')&&document.getElementById('intro').style.display!=='none');
      chain.style.display=pre?'none':'';
      gT.style.display=gB.style.display=pre?'none':'';
      if(REDUCE)return;
      var y=window.pageYOffset||document.documentElement.scrollTop||0;
      var pos=y+lastTug;
      var m=((pos%CH)+CH)%CH;
      chain.style.backgroundPosition='50% '+(-m)+'px'; // chain rides the page
      var a=pos*K; // gears locked to chain travel
      gT1.style.transform='rotate('+a+'deg)';
      gT2.style.transform='rotate('+(-a*58/46)+'deg)';
      gB1.style.transform='rotate('+a+'deg)';
      gB2.style.transform='rotate('+(-a*58/40)+'deg)';
    }
    // v70 clip-sync: while the pull-chain action clip (action2.mp4) is the
    // live port clip, the page rig reproduces the ON-VIDEO chain pulls at the
    // beats measured frame-by-frame from the video (2026-11-17, +/-0.125s):
    //   P1 grip 1.500  bottom 2.500  release 3.500
    //   P2 grip 3.875  bottom 4.500  release 5.375
    //   P3 grip 5.625  bottom 6.500  release 7.250
    //   P4 grip 7.625  bottom 8.375  (hand lets go; the chain STAYS DOWN)
    // Idle 0-1.375s, idle after ~8.5s. Cross-checked against right-column
    // (chain region) frame motion, which spikes exactly on these transitions.
    var BEATS=[[1.5,2.5,3.5],[3.875,4.5,5.375],[5.625,6.5,7.25],[7.625,8.375,8.5]];
    var TUGD=24,TUP=0.4;
    function tugAt(t){
      // piecewise from the measured beats: yank g->b (ease-in), pinned hold
      // b->r with slight strain, snap-up over 0.3s at release plus a small
      // spring overshoot dip; the LAST pull stays down until clip end.
      var o=0,i,g,b,r,f;
      for(i=0;i<BEATS.length;i++){
        g=BEATS[i][0];b=BEATS[i][1];r=BEATS[i][2];
        if(t<g)break;
        if(t<b){f=(t-g)/(b-g);o+=TUGD*(1-(1-f)*(1-f));}
        else if(i===BEATS.length-1||t<r){o+=TUGD*(1+0.1*Math.sin((t-b)*7));}
        else{f=(t-r)/0.3;if(f<1)o+=TUGD*(1-f);
          if(t<r+TUP)o+=-3*Math.sin(Math.PI*(t-r)/TUP);}
      }
      return o;
    }
    window.__vgTug=tugAt; // live debug/test handle (beat waveform)
    var CUES=[],FIRE=[];
    (function(){
      var k;for(k=0;k<BEATS.length;k++){
        CUES.push({t:BEATS[k][0],v:0.55});CUES.push({t:BEATS[k][1],v:0.7});
        if(k<BEATS.length-1)CUES.push({t:BEATS[k][2],v:0.5});
      }
      CUES.sort(function(a,b){return a.t-b.t;});FIRE=[];for(k=0;k<CUES.length;k++)FIRE.push(0);
    })();
    function clink(v){
      if(window.__vgFx){window.__vgFx('/assets/sfx/chainclink.mp3',v);return;}
      if(window.__vgMuted)return;
      try{var a=new Audio('/assets/sfx/chainclink.mp3');a.volume=v;var p=a.play();if(p&&p.catch)p.catch(function(){});}catch(e){}
    }
    var syncT=null,lastClipT=0,exitTug=0;
    function syncTick(){
      var v=playing();
      if(!v||!/action2/.test(v.currentSrc||v.src||'')){
        if(syncT){clearInterval(syncT);syncT=null;}
        exitTug=TUGD;chain.classList.remove('vg-sync');
        return;
      }
      var t=v.currentTime;
      if(t<lastClipT-0.5){for(var z=0;z<FIRE.length;z++)FIRE[z]=0;} // new pass
      lastClipT=t;
      for(var k=0;k<CUES.length;k++){
        var d=t-CUES[k].t;
        if(!FIRE[k]&&d>=0&&d<0.5){FIRE[k]=1;clink(CUES[k].v);}
      }
      chain.classList.add('vg-sync');
      rig(tugAt(t));
    }
    var rigQueued=false;
    document.addEventListener('vg:enter',function(){rig(0);});
    if(!REDUCE){
      // Interval-driven, not rAF: a single rAF chain dies silently in some
      // environments and throttles hard in background tabs.
      setInterval(function(){
        if(syncT){return;}
        if(exitTug>0.4){rig(exitTug);exitTug*=0.55;return;} // settle after P4
        var sv=playing();
        if(sv&&/action2/.test(sv.currentSrc||'')){
          syncT=setInterval(syncTick,80);lastClipT=sv.currentTime;syncTick();return;
        }
        rig(0);
      },400);
      // v73 (James 2026-11-17): the VIDEO is no longer driven by scroll.
      // Scrolling animates ONLY the gears/chain; mascot clips run at their
      // natural 1x. The one video->machine link that remains is the beat
      // tug: when action2 pulls its chain on-screen, the page gears tug too
      // (syncTick above). The old scroll-velocity playbackRate/reverse-scrub
      // engine is removed.
    }
    window.addEventListener('scroll',function(){
      if(rigQueued)return;
      rigQueued=true;
      requestAnimationFrame(function(){rigQueued=false;rig(lastTug);});
    },{passive:true});
    rig(0);
    // v76d (James 2026-11-19): action4 repurposed -- the lever throw now
    // joins the idle rotation (role 'idle' at pool load), and whenever it
    // plays the STAGE lights up: background brightness ramps up, holds a
    // beat, then dims back to normal. The clunk lands with the lights.
    var stageLit=false, stageArmed=false;
    (function(){ var d=document.createElement('div'); d.id='vgstagelight'; document.body.appendChild(d); })();
    // action4 is 10.1s: reaches the lever ~2s, grabs ~4s, THROWS ~5s, presents
    // to the end. Lights hit at clip-time 4.8s and hold through the present.
    setInterval(function(){
      if(!live())return;
      var v=playing();
      var isA4=v&&/action4/.test(v.currentSrc||v.src||'');
      if(isA4&&!stageArmed){stageArmed=true;return;}
      if(!isA4){stageArmed=false;return;}
      if(stageArmed&&!stageLit&&v.currentTime>=4.8){
        stageLit=true;
        document.body.classList.add('vg-stage');
        if(window.__vgFx)window.__vgFx('/assets/sfx/leverclunk.mp3',0.6);
        setTimeout(function(){document.body.classList.remove('vg-stage');},3400);
        setTimeout(function(){stageLit=false;},6400);
      }
    },250);
    // v76h (James 2026-11-19): action5 = hype JUMPS, also in the idle
    // rotation. Each measured landing bumps the whole page content
    // (sections/header/footer only -- fixed mascot/chain stay anchored).
    // Landings measured frame-accurate at 10fps (v76i fix): big jumps land
    // 1.05/3.45/4.85s, small hops land 1.65/4.05s. Each fire is offset
    // -0.1s so the bounce animation's peak (20% of 500ms) hits the squish.
    var JBEATS=[0.95,1.55,3.35,3.95,4.75],jfire=[],jLastT=-1,bounceT=null;
    setInterval(function(){
      if(!live())return;
      var v=playing();
      if(!v||!/action5/.test(v.currentSrc||v.src||'')){jfire=[];jLastT=-1;return;}
      var t=v.currentTime;
      if(t<jLastT-0.5){jfire=[];}
      jLastT=t;
      for(var k=0;k<JBEATS.length;k++){
        if(!jfire[k]&&t>=JBEATS[k]){
          jfire[k]=1;
          document.body.classList.add('vg-bounce');
          if(bounceT)clearTimeout(bounceT);
          bounceT=setTimeout(function(){document.body.classList.remove('vg-bounce');},520);
          if(window.__vgFx)window.__vgFx('/assets/sfx/poof.mp3',0.45);
        }
      }
    },120);
    // Clicking the page chain also makes the mascot grab ITS chain: the
    // pull-chain action clip (action2) is forced as the very next port clip.
    var PULLU='/assets/status/action2.mp4';
    // v64: clicking the mascot ITSELF asks it to do maintenance -- forces the
    // valve-wheel action clip (action3). Chain clicks stay exclusive to action2.
    var WHEELU='/assets/status/action3.mp4';
    host.addEventListener('click',function(e){
      if(!live()||REDUCE)return;
      if(e.target.closest&&e.target.closest('#vgchain'))return;
      if(!window.__vgForce)return;
      host.classList.add('vg-poke');
      setTimeout(function(){host.classList.remove('vg-poke');},380);
      if(window.__vgFx)window.__vgFx('/assets/sfx/chainclink.mp3',0.45);
      window.__vgForce(WHEELU);
    });
    // v65: hovering a CTA -- the mascot throws ITS lever: power-on presenting
    // beat (action4). Once per page load, 90s cooldown, never during intro/portal.
    var LEVERU='/assets/status/action4.mp4';
    var leverFired=false;
    function ctaHover(e){
      if(leverFired||!live()||REDUCE||!window.__vgForce)return;
      // v76c: spots that carry their own talk clip get the CLIP, not the
      // generic lever flourish (v65 predates per-spot data-talk; the two
      // forces fought for one port and the lever shadowed the talk).
      var spot=e&&e.target&&e.target.closest?e.target.closest('[data-talk]'):null;
      if(spot)return;
      var now=Date.now();
      if(window.__leverT&&now-window.__leverT<90000)return;
      leverFired=true;window.__leverT=now;
      // v76d: the clunk SFX now rides the stage-light watcher (fires when
      // the clip actually starts playing, rotation or force).
      window.__vgForce(LEVERU);
    }
    [].slice.call(document.querySelectorAll('.cta,.cards .card')).forEach(function(el){
      el.addEventListener('pointerenter',ctaHover);
      // touch flow: tapping a CTA navigates, so arm the flag; the mascot throws
      // the lever on ARRIVAL at the next page (watcher below).
      el.addEventListener('click',function(){
        if(REDUCE)return;
        try{sessionStorage.setItem('vgcta','1');}catch(e){}
      });
    });
    var arrival=setInterval(function(){
      var f=null;try{f=sessionStorage.getItem('vgcta');}catch(e){}
      if(!f){clearInterval(arrival);return;}
      if(live()&&window.__vgForce){
        try{sessionStorage.removeItem('vgcta');}catch(e){}
        clearInterval(arrival);
        window.__vgForce(LEVERU);
      }
    },1200);
    // v71: the chain is the scrollbar replacement -- DRAG it to scroll the
    // page. A tap (no drag) still asks the mascot for its pull-chain action.
    function chainTap(){
      if(window.__vgForce)window.__vgForce(PULLU);
      if(window.__vgFx){window.__vgFx('/assets/sfx/chainclink.mp3',0.7);}
      else if(!window.__vgMuted){try{var cc=new Audio('/assets/sfx/chainclink.mp3');cc.volume=0.7;var cp=cc.play();if(cp&&cp.catch)cp.catch(function(){});}catch(ea){}}
      chain.classList.remove('vg-tug');void chain.offsetWidth;chain.classList.add('vg-tug');
      host.classList.remove('vg-react');void host.offsetWidth;host.classList.add('vg-react');
      setTimeout(scrollOn,REDUCE?0:360);
    }
    var drag=null;
    chain.addEventListener('pointerdown',function(ev){
      if(!live())return;
      ev.preventDefault();
      drag={y:ev.clientY,sc:window.pageYOffset,moved:false};
      try{chain.setPointerCapture(ev.pointerId);}catch(e){}
    });
    chain.addEventListener('pointermove',function(ev){
      if(!drag)return;
      var dy=ev.clientY-drag.y;
      if(!drag.moved&&Math.abs(dy)>3)drag.moved=true;
      if(!drag.moved)return;
      var doc=document.documentElement;
      var max=Math.max(0,(doc.scrollHeight||document.body.scrollHeight)-window.innerHeight);
      try{window.scrollTo(0,Math.max(0,Math.min(max,drag.sc+dy)));}catch(e){}
    });
    chain.addEventListener('pointerup',function(ev){
      if(drag&&!drag.moved&&live())chainTap();
      drag=null;
    });
    chain.addEventListener('pointercancel',function(){drag=null;});
    // TEXT GLITCH-FIX event (v54): visible on-page text corrupts itself, the
    // mascot immediately plays the page-fix action clip, and the text repairs
    // WHILE the animation is still playing -- the mascot "fixes the browser".
    var glitchOn=false;
    function corrupt(t){
      var g='#%&@$/\\|<>~*+=?',out='',k,c;
      for(k=0;k<t.length;k++){c=t[k];if(c===' '&&Math.random()<0.85){out+=c;continue;}out+=(Math.random()<0.42?g.charAt(Math.floor(Math.random()*g.length)):c);}
      return out;
    }
    function glitchEvent(){
      window.__vgGlitchWhy='run';
      if(glitchOn){window.__vgGlitchWhy='already-running';return;}
      if(REDUCE){window.__vgGlitchWhy='reduced-motion';return;}
      // Never queue the fix animation over an in-flight portal FX: wait for
      // the portal to clear, then run (James v57).
      if(document.getElementById('vgportal')){window.__vgGlitchWhy='portal-busy-retry';setTimeout(glitchEvent,4000);return;}
      var els=[].slice.call(document.querySelectorAll('section h1,section h2,section h3,section p,.hero p,.hero h1,.hero h2')).filter(function(e){
        var t=e.textContent||'';return t.length>12&&t.length<170&&e.offsetParent&&e.children.length===0&&(!e.closest||!e.closest('#vgmenu'));
      });
      if(!els.length){window.__vgGlitchWhy='no-text-candidates';return;}
      if(!window.__vgForce){window.__vgGlitchWhy='no-force-seam';return;}
      if(!window.__vgForce('/assets/status/action1.mp4')){window.__vgGlitchWhy='action1-not-in-pool';return;} // mascot must be rolling the fix clip first
      var el=els[Math.floor(Math.random()*els.length)];
      var orig=el.textContent;
      glitchOn=true;
      if(window.__vgFx)window.__vgFx('/assets/sfx/glitch.mp3',0.5);
      // v62 LETTERS-FALL-OFF gag: instead of scrambling symbols (which could
      // leave residue), a few real letters detach and fall off the page. The
      // gap lasts exactly as long as the fix clip plays; when the clip ends
      // the letters drop back into place and the exact original text is
      // restored byte-for-byte.
      var chars=orig.split('');
      var cand=[],ci;
      for(ci=0;ci<chars.length;ci++){if(chars[ci]!==' '&&chars[ci]!=='\n')cand.push(ci);}
      // v76g (James 2026-11-19): MORE letters loosen before the fix lands --
      // was 2-5; now ~22% of the text (floor 6, cap 14).
      var nd=Math.max(6,Math.min(cand.length,Math.floor(cand.length*0.22),14));
      var dropped=[];
      for(ci=0;ci<nd&&cand.length;ci++){
        var at=Math.floor(Math.random()*cand.length);
        dropped.push(cand.splice(at,1)[0]);
      }
      dropped.sort(function(a,b){return a-b;});
      window.__vgGlitchWhy='dropped:'+dropped.length+' of '+chars.length;
      // build the letter spans and capture each doomed letter's box BEFORE removal
      el.innerHTML='';
      var spans=[];
      for(ci=0;ci<chars.length;ci++){
        var sp=document.createElement('span');
        sp.className='vgl';
        sp.textContent=chars[ci];
        el.appendChild(sp);
        spans.push(sp);
      }
      var fallers=[];
      dropped.forEach(function(idx){
        var sp=spans[idx];
        var r=sp.getBoundingClientRect();
        var f=document.createElement('span');
        f.className='vg-faller';
        f.textContent=chars[idx];
        f.style.left=Math.round(r.left)+'px';
        f.style.top=Math.round(r.top)+'px';
        f.style.fontSize=getComputedStyle(el).fontSize;
        document.body.appendChild(f);
        sp.classList.add('vg-hole');
        fallers.push(f);
        setTimeout(function(){if(f.parentNode)f.parentNode.removeChild(f);},1200);
      });
      // v63: repair is SYNCHRONIZED to the fix clip's own timeline. Each
      // letter's drop-back point is mapped to 35%-85% of action1's
      // currentTime -- the mascot repairs letters as it animates, and the
      // last ones land just as the clip ends.
      var th=[],j0;
      for(j0=0;j0<dropped.length;j0++){
        th.push(dropped.length===1?0.55:0.25+0.65*(j0/(dropped.length-1)));
      }
      var fixed=0,t0=Date.now();
      function mendLetter(j){
        var sp=spans[dropped[j]];
        sp.classList.remove('vg-hole');
        sp.classList.add('vg-dropin');
        fixed++;
        if(window.__vgFx)window.__vgFx('/assets/sfx/chainclink.mp3',0.45);
      }
      var iv=setInterval(function(){
        // progress clock = the action1 clip actually on stage
        var mv=document.querySelectorAll('#mascot video'),prog=-1,playing=false;
        for(var k2=0;k2<mv.length;k2++){
          var v=mv[k2];
          if(((v.currentSrc||v.src||'').indexOf('/action1.mp4')>=0)){
            var pr=(v.duration&&isFinite(v.duration))?v.currentTime/v.duration:0;
            if(pr>prog)prog=pr;
            if(!v.ended&&!v.paused&&pr<0.995)playing=true;
          }
        }
        var done=!playing&&prog>=0;
        if(Date.now()-t0>20000)done=true;
        if(prog>=0){
          for(var j1=0;j1<dropped.length;j1++){
            if(fixed<=j1&&prog>=th[j1])mendLetter(j1);
          }
        }
        if((done||prog>=0.995)&&fixed<dropped.length){
          while(fixed<dropped.length)mendLetter(fixed);
        }
        if(done||prog>=0.995){
          clearInterval(iv);
          setTimeout(function(){
            el.textContent=orig; // exact original, wrappers gone
            glitchOn=false;
          },700);
        }
      },250);
    }
    window.__vgGlitch=glitchEvent;
    (function schedule(){setTimeout(glitchEvent,60000+Math.random()*90000);})();
    var eye=document.createElement('span');eye.id='vgeye';document.body.appendChild(eye);
    var eyeT=null,tiltT=null;
    function eyeAt(x,y,h){
      eye.style.left=Math.round(x)+'px';eye.style.top=Math.round(y)+'px';eye.style.height=Math.round(h||14)+'px';
      eye.classList.add('on');
      clearTimeout(eyeT);eyeT=setTimeout(function(){eye.classList.remove('on');},300);
    }
    function tilt(dx){
      if(REDUCE)return;
      host.classList.remove('vg-look-l','vg-look-r');
      void host.offsetWidth;
      if(dx<-40)host.classList.add('vg-look-l');
      else if(dx>40)host.classList.add('vg-look-r');
      clearTimeout(tiltT);tiltT=setTimeout(function(){host.classList.remove('vg-look-l','vg-look-r');},1600);
    }
    // Bubble-sync: speak()'s typewriter calls this per character; the eye
    // sorts along the bubble text exactly where the next letter lands.
    window.__vgEye=function(k){
      var bub=document.getElementById('vgbubble');
      if(!bub||!bub.firstChild||!bub.classList.contains('on'))return;
      try{
        var n=Math.min(k,(bub.firstChild.length||txtlenSafe(k)));
        var r=document.createRange();
        r.setStart(bub.firstChild,Math.max(0,n-1));
        r.setEnd(bub.firstChild,n);
        var rc=r.getBoundingClientRect();
        if(rc.height){eyeAt(rc.right+2,rc.top,rc.height);tilt(1);}
      }catch(e){}
      function txtlenSafe(x){return x;}
    };
  })();


  // Portal event (v39): when the corner port picks a walk-off, a second
  // porthole bursts open mid-page; the mascot walks IN there, walks OUT,
  // then a smoke puff clears the portal away. Normal rotation never stops.
  (function(){
    var REDUCE=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lastFire=0,busy=false;
    // SFX that fire WITHOUT a user gesture (portal opens on its own during
    // rotation) are blocked by browser autoplay policy when played via new
    // Audio(). Web Audio through a context unlocked by the user's first
    // click/keydown works for the rest of the page's life. This is __vgFx.
    var AC=null,FB={};
    function ac(){
      if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}
      if(AC.state==='suspended'){try{AC.resume();}catch(e){}}
      return AC;
    }
    document.addEventListener('pointerdown',function(){ac();});
    document.addEventListener('keydown',function(){ac();});
    function bufp(u){
      if(FB[u])return FB[u];
      FB[u]=fetch(u).then(function(r){if(!r.ok)return null;return r.arrayBuffer();}).then(function(b){
        var a=ac();return a?a.decodeAudioData(b):null;
      }).catch(function(){return null;});
      return FB[u];
    }
    function audioEl(u,vol){try{var x=new Audio(u);x.volume=vol;var p=x.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}
    window.__vgFx=function(u,vol){
      if(window.__vgMuted)return;
      var a=ac();
      if(!a){audioEl(u,vol);return;}
      bufp(u).then(function(b){
        if(!b){audioEl(u,vol);return;}
        window.__vgFxN=(window.__vgFxN||0)+1;
        function go(){
          var s=a.createBufferSource();s.buffer=b;
          var g=a.createGain();g.gain.value=vol;
          s.connect(g);g.connect(a.destination);
          try{s.start();}catch(e){}
        }
        if(a.state!=='running'){try{var r=a.resume();if(r&&r.then)r.then(go);else go();}catch(e){go();}}
        else go();
      });
    };
    var humH=null;
    window.__vgFxLoop=function(u,vol){
      if(window.__vgMuted)return;
      var a=ac();if(!a)return;
      bufp(u).then(function(b){
        if(!b)return;
        window.__vgFxN=(window.__vgFxN||0)+1;
        function go(){
          var s=a.createBufferSource();s.buffer=b;s.loop=true;
          var g=a.createGain();g.gain.value=vol;
          s.connect(g);g.connect(a.destination);
          try{s.start();}catch(e){return;}
          humH={s:s};
        }
        if(a.state!=='running'){try{var r=a.resume();if(r&&r.then)r.then(go);else go();}catch(e){go();}}
        else go();
      });
    };
    window.__vgFxStop=function(){if(humH){try{humH.s.stop();}catch(e){}humH=null;}};
    function poofSound(){window.__vgFx('/assets/sfx/poof.mp3',0.7);}
    function playIn(v,u,next,err){
      // Portal legs START MUTED: an unmuted play() on a video element created
      // without a user gesture can return a promise that NEVER settles -- no
      // reject, no playback -- so the enter leg would silently never run
      // (the "portal shows but enter doesn't play" bug). Muted playback is
      // always allowed; we attempt the clip's own-audio unmute only once it
      // is actually rolling, and a watchdog re-kicks any stalled video.
      v.muted=true;v.src=u;
      try{v.load();}catch(e0){}
      v.onended=next;v.onerror=err;
      function go(){try{var p=v.play();if(p&&p.catch)p.catch(function(){err();});}catch(e1){err();}}
      go();
      var stall=setTimeout(function(){
        if(v.paused&&!v.ended){try{v.load();var q=v.play();if(q&&q.catch)q.catch(function(){err();});}catch(e2){err();}}
      },6000);
      v.addEventListener('playing',function(){
        clearTimeout(stall);
        if(!window.__vgMuted){try{v.muted=false;}catch(e3){v.muted=true;}}
      },{once:true});
    }
    function announceDone(){try{document.dispatchEvent(new CustomEvent('vg:portal-done'));}catch(e1){}}
    document.addEventListener('vg:portal',function(){
      if(vgSet().portalFx===false){announceDone();return;} // submenu toggle: OFF skips straight past
      var now=Date.now();
      if(busy||REDUCE||now-lastFire<20000){announceDone();return;}
      var pool=window.__vgPool||[];
      var wons=[],woffs=[],k;
      for(k=0;k<pool.length;k++){
        if(pool[k].role==='walkon')wons.push(pool[k].u);
        else if(pool[k].role==='walkoff')woffs.push(pool[k].u);
      }
      if(!wons.length||!woffs.length){announceDone();return;}
      busy=true;lastFire=now;
      var P=document.createElement('div');P.id='vgportal';P.setAttribute('aria-hidden','true');
      var p1=document.createElement('video');p1.playsInline=true;p1.preload='auto';
      var p2=document.createElement('video');p2.playsInline=true;p2.preload='auto';p2.style.opacity='0';
      var puff=document.createElement('div');puff.id='vgpoof';
      for(k=0;k<8;k++){puff.appendChild(document.createElement('span'));}
      P.appendChild(p1);P.appendChild(p2);P.appendChild(puff);
      P.appendChild(Object.assign(document.createElement('div'),{id:'vgpswirl'}));
      document.body.appendChild(P);
      requestAnimationFrame(function(){P.classList.add('open');});
      window.__vgFx('/assets/sfx/whoosh.mp3',0.55);
      setTimeout(function(){window.__vgFx('/assets/sfx/ignite.mp3',0.6);},280);
      window.__vgFxLoop('/assets/sfx/hum.mp3',0.22);
      function cleanup(){
        window.__vgFxStop();
        P.classList.add('gone');
        setTimeout(function(){if(P.parentNode)P.parentNode.removeChild(P);busy=false;announceDone();},450);
      }
      function smoke(){
        window.__vgFxStop();
        poofSound();
        P.classList.add('smoke');
        setTimeout(cleanup,850);
      }
      function leg2(){
        p1.style.opacity='0';
        p2.style.opacity='1'; // p2 starts hidden for the crossfade; without this the exit leg plays INVISIBLE
        window.__vgFx('/assets/sfx/ignite.mp3',0.4); // second portal throat opens
        playIn(p2,woffs[Math.floor(Math.random()*woffs.length)],smoke,cleanup);
      }
      // v46 order per James: inside the portal he ENTERS first (walk-on),
      // then walks OUT of the portal scene (walk-off); the puff clears the
      // portal; the corner port then plays its own enter and rotation resumes.
      playIn(p1,wons[Math.floor(Math.random()*wons.length)],leg2,cleanup);
    });
  })();

  // Full-page demo-reel background hook.
  // When real demo videos exist: drop the file into assets/brand/ and add its path to BG_VIDEOS.
  var BG_VIDEOS=[]; // e.g. ['/assets/brand/hero-reel.mp4']
  (function(){
    if(!BG_VIDEOS.length) return;
    var host=document.querySelector('.bg-media');
    if(!host) return;
    var v=host.querySelector('video');
    var i=0;
    function tryNext(){
      if(i>=BG_VIDEOS.length) return;
      var src=BG_VIDEOS[i++];
      var t=document.createElement('video');
      t.preload='auto';
      t.oncanplay=function(){ v.src=src; var p=v.play(); if(p) p.then(function(){ document.body.classList.add('has-bg-video'); }).catch(function(){}); };
      t.onerror=function(){ tryNext(); };
      t.src=src;
    }
    tryNext();
  })();
})();
