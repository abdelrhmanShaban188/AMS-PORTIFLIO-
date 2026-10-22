/* Spatial navigation uses the owner's supplied 2D images, not invented 3D project models. */
'use strict';
const portfolioExplorer = (() => {
  function create({root,title,categoryName,onOpen}){
    const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    root.innerHTML='<div class="space-topline"><span>PROJECT SPACE</span><span>DRAG TO EXPLORE · SELECT A PROJECT</span></div><div class="space-viewport"><div class="space-floor" aria-hidden="true"></div><div class="space-cards"></div></div><div class="space-bottom"><div class="space-info" aria-live="polite"><p class="space-category"></p><h3></h3><p class="space-description"></p></div><div class="space-actions"><div class="space-step"><button type="button" class="icon-button" aria-label="Previous project">←</button><output class="space-count"></output><button type="button" class="icon-button" aria-label="Next project">→</button></div><button type="button" class="button space-enter">Enter project <span aria-hidden="true">↗</span></button></div></div><div class="space-index" role="group" aria-label="Select a project"></div>';
    const viewport=root.querySelector('.space-viewport'),cards=root.querySelector('.space-cards'),index=root.querySelector('.space-index');
    let projects=[],selected=0,drag=null,blockClick=false,ignoreClickUntil=0;
    function paint(fraction=0){
      const count=projects.length, radius=Math.min(viewport.clientWidth*.52,510);
      [...cards.children].forEach((card,i)=>{
        let delta=i-selected-fraction;
        if(delta>count/2)delta-=count;
        if(delta< -count/2)delta+=count;
        const phase=delta*.63,visible=Math.abs(delta)<3.2;
        card.style.transform='translate(-50%,-50%) translate3d('+(Math.sin(phase)*radius).toFixed(1)+'px,'+(Math.abs(delta)*12).toFixed(1)+'px,'+((Math.cos(phase)-1)*420).toFixed(1)+'px) rotateY('+(-delta*13).toFixed(1)+'deg)';
        card.style.opacity=visible?String(Math.max(.13,1-Math.abs(delta)*.28)):'0';
        card.style.zIndex=String(50-Math.round(Math.abs(delta)*10));
        card.classList.toggle('is-current',i===selected);
        card.inert=!visible;
        card.setAttribute('aria-pressed',String(i===selected));
        card.setAttribute('aria-label',(i===selected?'Enter ':'Focus ')+title(projects[i]));
      });
    }
    function focus(next){
      if(!projects.length)return;
      selected=(next+projects.length)%projects.length;
      const p=projects[selected];
      root.querySelector('.space-category').textContent=(p.location||'KSA')+' / '+categoryName(p.category);
      root.querySelector('h3').textContent=title(p);
      root.querySelector('.space-description').textContent=p.details;
      root.querySelector('.space-count').textContent=String(selected+1).padStart(2,'0')+' / '+String(projects.length).padStart(2,'0');
      [...index.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));
      root.querySelector('[aria-label="Previous project"]').disabled=root.querySelector('[aria-label="Next project"]').disabled=projects.length<2;
      paint();
    }
    function open(){onOpen(projects[selected]);}
    root.querySelector('[aria-label="Previous project"]').addEventListener('click',()=>focus(selected-1));
    root.querySelector('[aria-label="Next project"]').addEventListener('click',()=>focus(selected+1));
    root.querySelector('.space-enter').addEventListener('click',open);
    root.addEventListener('keydown',e=>{
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();focus(selected+(e.key==='ArrowRight'?1:-1));}
    });
    viewport.addEventListener('pointerdown',e=>{
      if(e.button!==0||projects.length<2)return;
      drag={x:e.clientX,y:e.clientY,dx:0};blockClick=false;
    });
    viewport.addEventListener('pointermove',e=>{
      if(!drag)return;
      const dx=e.clientX-drag.x;
      if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(e.clientY-drag.y))return;
      drag.dx=dx;blockClick=true;viewport.classList.add('is-dragging');
      if(!viewport.hasPointerCapture(e.pointerId))viewport.setPointerCapture(e.pointerId);
      paint(-dx/Math.max(150,viewport.clientWidth*.34));
    });
    function release(){
      if(!drag)return;
      const dx=drag.dx;drag=null;viewport.classList.remove('is-dragging');
      focus(selected+(Math.abs(dx)>45?(dx<0?1:-1):0));
      // The click following a drag must not open or refocus a card.
      if(blockClick){ignoreClickUntil=performance.now()+400;blockClick=false;}
    }
    viewport.addEventListener('pointerup',release);
    viewport.addEventListener('pointercancel',release);
    new ResizeObserver(()=>paint()).observe(viewport);
    return {setProjects(next){
      const old=projects[selected]?.id;projects=next;selected=Math.max(0,projects.findIndex(p=>p.id===old));
      cards.replaceChildren();index.replaceChildren();
      projects.forEach((p,i)=>{
        const card=document.createElement('button');
        card.type='button';card.className='space-card';
        card.innerHTML='<img src="assets/previews/project-'+p.id+'.webp" alt="'+esc(title(p))+'" width="1100" height="700" loading="lazy"><span class="space-card-label">'+String(i+1).padStart(2,'0')+' / '+esc(title(p))+'</span>';
        card.addEventListener('click',()=>{if(blockClick||performance.now()<ignoreClickUntil)return;i===selected?open():focus(i);});
        cards.append(card);
        const button=document.createElement('button');
        button.type='button';button.setAttribute('aria-label','Focus '+title(p));
        button.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span><span>'+esc(title(p))+'</span>';
        button.addEventListener('click',()=>focus(i));index.append(button);
      });
      focus(selected);
    }};
  }
  return {create};
})();
