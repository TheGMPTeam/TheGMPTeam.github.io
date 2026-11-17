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
    function prog(){ready++;if(ready>=4){open();}}
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
    var WSRC=(ivv&&ivv.getAttribute('src'))||'/assets/status/welcome.mp4';
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
    [ '/assets/status/idle4.mp4','/assets/status/idle5.mp4','/assets/status/idle6.mp4'].forEach(function(u){
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
    var SLOT=[];var i;for(i=1;i<=8;i++)SLOT.push(['idle',i]);for(i=1;i<=4;i++)SLOT.push(['walkon',i]);for(i=1;i<=4;i++)SLOT.push(['walkoff',i]);
    var IV=[],IA=[]; // entries: {u:URL, endGone:bool}
    window.__vgPool=IV;
    var shown=document.getElementById('mvid1'),buf=document.getElementById('mvid2');
    var mediaDead=false,probed=0,started=false;
    [shown,buf].forEach(function(x){x.addEventListener('error',function(){mediaDead=true;});});
    var pre=null,audioOn=false,lastEndGone=false,lastU='';
    var engineOn=!document.getElementById('splash');
    function maybeStart(){
      if(probed===SLOT.length&&!IV.length){mediaDead=true;return;}
      if(IV.length&&engineOn&&!started){started=true;startIdle();ensurePre();}
    }
    SLOT.forEach(function(s){
      var u='/assets/status/'+s[0]+s[1]+'.mp4';
      var v=document.createElement('video');v.preload='auto';v.muted=true;v.playsInline=true;
      v.addEventListener('loadeddata',function(){IV.push({u:u,endGone:s[0]==='walkoff'});maybeStart();});
      v.addEventListener('error',function(){probed++;maybeStart();});
      v.src=u;
    });
    // Hard pairs: 'b' plays ONLY immediately after 'a', and 'a' always hands to 'b'.
    // Board (idle2) -> Houser (idle3) per James 2026-11-17.
    var PAIRS=[{a:'/assets/status/idle2.mp4',b:'/assets/status/idle3.mp4'}];
    function has(u){for(var k=0;k<IV.length;k++)if(IV[k].u===u)return IV[k];return null;}
    function pick(){
      if(!IV.length)return null;
      var e=null,i;
      for(i=0;i<PAIRS.length;i++){if(lastU===PAIRS[i].a){e=has(PAIRS[i].b);break;}}
      if(!e){
        var pool;
        if(lastEndGone)pool=IV.filter(function(x){return x.u.indexOf('walkon')>=0;});
        else pool=IV.filter(function(x){return x.u.indexOf('walkon')<0;});
        pool=pool.filter(function(x){for(var k=0;k<PAIRS.length;k++)if(x.u===PAIRS[k].b)return false;return true;});
        if(!pool.length)pool=IV;
        var alt=pool.filter(function(x){return x.u!==lastU;});
        if(alt.length)pool=alt;
        e=pool[Math.floor(Math.random()*pool.length)];
      }
      lastU=e.u;lastEndGone=e.endGone;
      if(lastEndGone){try{document.dispatchEvent(new CustomEvent('vg:walkoff'));}catch(ev0){}}
      return e;
    }
    function ensurePre(){if(pre!==null)return;var e=pick();if(!e)return;buf.muted=true;buf.src=e.u;try{buf.load();}catch(e2){}pre=e;}
    function idleLoop(){
      if(!IV.length)return;
      if(pre===null)ensurePre();
      if(pre===null)return;
      var e=pre;pre=null;
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
      if(mediaDead||!engineOn||!started||!IV.length){return;}
      if(!shown.paused&&!shown.ended&&!shown.seeking)return;
      idleLoop();
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
    MENU.innerHTML='<div class="vgmi" data-a="skip">SKIP WELCOME</div><div class="vgmi" data-a="stop">STOP</div><div class="vgmi" data-a="resume">RESUME</div><div class="vgmi" data-a="mute">MUTE</div>';
    document.body.appendChild(MENU);
    function closeMenu(){MENU.style.display='none';}
    function openMenu(x,y){
      MENU.querySelector('[data-a="skip"]').textContent='SKIP WELCOME'+(vgSet().skipWelcome?' \u2713':'');
      MENU.querySelector('[data-a="mute"]').textContent=(window.__vgMuted?'UNMUTE':'MUTE')+(window.__vgMuted?' \u2713':'');
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
      if(!bub){bub=document.createElement('div');bub.id='vgbubble';document.body.appendChild(bub);}
      clearTimeout(hideT);
      bub.classList.add('on');
      var m=document.getElementById('mascot');
      if(m){m.classList.remove('vg-react');void m.offsetWidth;m.classList.add('vg-react');}
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
    document.addEventListener('mouseover',function(e){
      var t=e.target&&e.target.closest?e.target.closest('[data-tip]'):null;
      if(!t)return;
      var txt=t.getAttribute('data-tip');
      if(!txt||seen[txt])return;
      clearTimeout(hovT);
      hovT=setTimeout(function(){seen[txt]=1;speak(txt);},1300);
    });
    document.addEventListener('click',function(e){
      var t=e.target&&e.target.closest?e.target.closest('[data-say]'):null;
      if(t){speak(t.getAttribute('data-say'));return;}
      var c=e.target&&e.target.closest?e.target.closest('[data-tip]'):null;
      if(c){var txt=c.getAttribute('data-tip');seen[txt]=1;speak(txt);}
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
    // Chain-in-a-track + two meshed gears. Scroll position drives the rig:
    // links crawl through the track, big gear turns, small counter-gear turns
    // at 2x (half the teeth), all synced by requestAnimationFrame.
    chain.innerHTML='<div id="vgtrack"><div id="vglinks"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div id="vggears"><b id="vgpull">&#9881;</b><b id="vggear2">&#9881;</b></div>';
    host.appendChild(chain);
    var pull=document.getElementById('vgpull');
    var gear2=document.getElementById('vggear2');
    var links=document.getElementById('vglinks');
    var PITCH=11; // link height + margins, keeps the loop seamless
    function rig(){
      var y=window.pageYOffset||document.documentElement.scrollTop||0;
      if(REDUCE)return;
      links.style.transform='translateY('+(y%PITCH)+'px)';
      pull.style.transform='rotate('+(y*0.5)+'deg)';
      gear2.style.transform='rotate('+(-y*1.0)+'deg)';
    }
    var rigQueued=false;
    window.addEventListener('scroll',function(){
      if(rigQueued)return;
      rigQueued=true;
      requestAnimationFrame(function(){rigQueued=false;rig();});
    },{passive:true});
    rig();
    pull.addEventListener('click',function(ev){
      ev.stopPropagation();ev.preventDefault();
      if(!live())return;
      chain.classList.remove('vg-tug');void chain.offsetWidth;chain.classList.add('vg-tug');
      host.classList.remove('vg-react');void host.offsetWidth;host.classList.add('vg-react');
      setTimeout(scrollOn,REDUCE?0:360);
    });
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
    function poofSound(){
      if(window.__vgMuted)return;
      try{var a=new Audio('/assets/sfx/poof.mp3');a.volume=0.7;var p=a.play();if(p&&p.catch)p.catch(function(){});}catch(e){}
    }
    function playIn(v,u,next,err){
      v.muted=!!window.__vgMuted;v.src=u;
      v.onended=next;v.onerror=err;
      var p=v.play();if(p&&p.catch)p.catch(function(){v.muted=true;var p2=v.play();if(p2&&p2.catch)p2.catch(function(){err();});});
    }
    document.addEventListener('vg:walkoff',function(){
      var now=Date.now();
      if(busy||REDUCE||now-lastFire<60000){return;}
      var pool=window.__vgPool||[];
      var wons=[],woffs=[],k;
      for(k=0;k<pool.length;k++){
        if(pool[k].u.indexOf('walkon')>=0)wons.push(pool[k].u);
        else if(pool[k].u.indexOf('walkoff')>=0)woffs.push(pool[k].u);
      }
      if(!wons.length||!woffs.length)return;
      busy=true;lastFire=now;
      var P=document.createElement('div');P.id='vgportal';P.setAttribute('aria-hidden','true');
      var p1=document.createElement('video');p1.playsInline=true;p1.preload='auto';
      var p2=document.createElement('video');p2.playsInline=true;p2.preload='auto';p2.style.opacity='0';
      var puff=document.createElement('div');puff.id='vgpoof';
      for(k=0;k<8;k++){puff.appendChild(document.createElement('span'));}
      P.appendChild(p1);P.appendChild(p2);P.appendChild(puff);
      document.body.appendChild(P);
      requestAnimationFrame(function(){P.classList.add('open');});
      function cleanup(){
        P.classList.add('gone');
        setTimeout(function(){if(P.parentNode)P.parentNode.removeChild(P);busy=false;},450);
      }
      function smoke(){
        poofSound();
        P.classList.add('smoke');
        setTimeout(cleanup,850);
      }
      function leg2(){
        p1.style.opacity='0';
        playIn(p2,woffs[Math.floor(Math.random()*woffs.length)],smoke,cleanup);
      }
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
