(function(){
  // Hover-play: swap thumbnail for a muted autoplaying YouTube embed, revert on leave.
  document.querySelectorAll('.vid[data-vid]').forEach(function(card){
    var holder=card.querySelector('.thumb');
    if(!holder) return;
    card.addEventListener('mouseenter',function(){
      if(holder.querySelector('iframe')) return;
      var f=document.createElement('iframe');
      f.src='https://www.youtube.com/embed/'+card.dataset.vid+'?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1';
      f.allow='autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen=true; f.loading='lazy';
      holder.appendChild(f);
    });
    card.addEventListener('mouseleave',function(){
      var f=holder.querySelector('iframe'); if(f) f.remove();
    });
  });
  // Carousel arrows
  document.querySelectorAll('.car-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var car=document.querySelector(btn.dataset.target);
      if(!car) return;
      var step=car.clientWidth*0.9;
      car.scrollBy({left:(btn.dataset.dir==='next'?step:-step),behavior:'smooth'});
    });
  });
})();
