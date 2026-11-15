(function(){
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
            var x=mag===1?52:98, z=mag===1?-100:-260, rot=mag===1?34:50;
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

  // Splash overlay: shows once per session; click, keypress, or 3.2s timer dismisses it.
  (function(){
    var s=document.getElementById('splash');
    if(!s) return;
    if(sessionStorage.getItem('splashSeen')==='1'){ s.remove(); return; }
    var done=false;
    function dismiss(){
      if(done) return; done=true;
      sessionStorage.setItem('splashSeen','1');
      s.classList.add('out');
      setTimeout(function(){ s.remove(); },900);
    }
    s.addEventListener('click',dismiss);
    document.addEventListener('keydown',dismiss,{once:true});
    setTimeout(dismiss,3200);
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
