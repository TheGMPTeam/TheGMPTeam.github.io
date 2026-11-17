(function(){
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
    [WSRC,'/assets/status/idle1.mp4','/assets/status/idle2.mp4','/assets/status/idle3.mp4'].forEach(function(u){
      var v=document.createElement('video');v.preload='auto';v.muted=true;
      v.addEventListener('loadeddata',prog);v.addEventListener('error',prog);
      v.src=u;
    });
    setTimeout(open,6000);
    s.addEventListener('click',function(){
      if(s.dataset.leaving){return;}
      s.dataset.leaving='1';
      var m=document.getElementById('mascot');
      var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduce){s.remove();document.dispatchEvent(new CustomEvent('vg:enter'));return;}
      // Saved SKIP preference: no welcome presentation, straight to the port.
      if(vgSet().skipWelcome){fastExit();return;}
      // 1) scanline sweep + glitch shatter
      s.classList.add('glitch');
      // 2) whole splash collapses into the port circle
      setTimeout(function(){
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
        (function tryP(mm){
          iv.muted=mm;
          var p=iv.play();
          if(p&&p.catch){p.catch(function(){if(!mm){tryP(true);}});}
        })(!!window.__vgMuted);
        var fin=false;
        function finish(){
          if(fin){return;}
          fin=true;
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
        var sk=intro.querySelector('.iskip');
        if(sk){sk.addEventListener('click',function(e){e.stopPropagation();e.preventDefault();var D=iv.duration||10.2;iv.currentTime=Math.min(D-0.05,iv.currentTime+3);});}
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
    var IV=['/assets/status/idle1.mp4','/assets/status/idle2.mp4','/assets/status/idle3.mp4'];
    var IA=['/assets/status/idle1.m4a','/assets/status/idle2.m4a','/assets/status/idle3.m4a'];
    var shown=document.getElementById('mvid1'),buf=document.getElementById('mvid2');
    var mediaDead=false;
    [shown,buf].forEach(function(x){x.addEventListener('error',function(){mediaDead=true;});});
    var q=[],pre=null,lastIdx=0,audioOn=false;
    function refill(){q=[0,1,2];for(var i=q.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=q[i];q[i]=q[j];q[j]=t;}}
    function blip(){if(!audioOn)return;try{var s=new Audio(IA[lastIdx]);s.volume=.85;var p=s.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}
    function ensurePre(){if(pre!==null)return;if(!q.length)refill();var i=q.pop();buf.muted=true;buf.src=IV[i];try{buf.load();}catch(e){}pre=i;}
    function idleLoop(){
      if(pre===null)ensurePre();
      var i=pre;pre=null;lastIdx=i;
      buf.muted=true;buf.style.opacity='0';
      if(buf.currentSrc.indexOf(IV[i])<0){buf.src=IV[i];}
      var pr=buf.play();if(pr&&pr.catch)pr.catch(function(){});
      buf.addEventListener('playing',function on(){
        buf.removeEventListener('playing',on);
        buf.style.opacity='1';shown.style.opacity='0';
        var t=shown;shown=buf;buf=t;
        blip();
        setTimeout(function(){try{buf.pause();}catch(e){}ensurePre();},450);
      },{once:true});
    }
    function arm(){audioOn=!window.__vgMuted;}
    document.addEventListener('click',arm,{once:true});
    document.addEventListener('keydown',arm,{once:true});
    if(window.__audioPrearmed){audioOn=true;}
    refill();
    var engineOn=!document.getElementById('splash');
    function startIdle(){
      var i0=q.pop();lastIdx=i0;shown.src=IV[i0];
      try{shown.load();}catch(e){}
      var p0=shown.play();if(p0&&p0.catch)p0.catch(function(){});
    }
    if(document.getElementById('splash')){
      // Home: port stays paused under the splash; vg:enter (fired when the
      // welcome presentation finishes its collapse) starts the idle loop.
      document.addEventListener('vg:enter',function(){
        engineOn=true;
        audioOn=!window.__vgMuted;
        startIdle();
      },{once:true});
    }else{
      startIdle();
    }
    ensurePre();
    setInterval(function(){
      if(mediaDead||!engineOn){return;}
      if(!shown.paused&&!shown.ended&&!shown.seeking)return;
      idleLoop();
    },1500);

    // Playback controls for the portholes: click = mute toggle, right-click = menu.
    window.vgCtl={
      skip:function(){
        // SKIP is a saved preference: toggles skipping the welcome presentation.
        var st=vgSet();st.skipWelcome=!st.skipWelcome;vgSave(st);
        var i=document.getElementById('intro'),v=document.getElementById('iv');
        if(i&&i.style.display!=='none'&&v&&!v.ended){v.currentTime=(v.duration||10.2)-0.05;}
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
