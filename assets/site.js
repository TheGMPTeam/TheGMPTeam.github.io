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
    }
    function render(){
      slides.forEach(function(s,i){
        var off=i-cur;
        if(off===0){
          s.style.transform='translate3d(0,0,0) scale(0.94)';
          s.style.opacity='1';
        } else {
          var mag=Math.abs(off);
          s.style.transform='translate3d('+(off*62)+'%,0,'+(-mag*220)+'px) rotateY('+(off*32)+'deg) scale(0.8)';
          s.style.opacity=mag===1?'0.45':(mag===2?'0.15':'0');
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
        f.src='https://www.youtube.com/embed/'+s.dataset.vid+'?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1';
        f.allow='autoplay; encrypted-media; picture-in-picture';
        f.allowFullscreen=true; f.loading='lazy';
        h.appendChild(f);
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
})();
