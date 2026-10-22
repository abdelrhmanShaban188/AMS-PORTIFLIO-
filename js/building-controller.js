/* Continuous build, progressive tray geometry and accessible demo asset inspection. */
'use strict';
const portfolioModelController = (() => {
  function init(root=document){
    const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
    const scene=$('#model-scene'),model=$('#building-model'),tip=$('#tray-tooltip');
    const reducedMotion=window.matchMedia('(prefers-reduced-motion:reduce)');
    const assetList=[...portfolioTrayData.assets,...(portfolioTrayData.lights||[])];
    const assets=new Map(assetList.map(asset=>[asset.id,asset]));
    const duration={100:1800,200:2000,300:2300,350:3400,400:4200,500:7500};
    let angle=34,lod=100,cycle=0,pointer=null,renderFrame=null,world=null,discipline='electrical';
    let visible=true,orbit=!reducedMotion.matches,orbitFrame=null,orbitLast=0;
    let enabled=!reducedMotion.matches,timer=null,deadline=0,remaining=duration[100];
    let trayProgress=1,trayFrame=null,trayLast=null,trayPaint=0;
    let selected=null,pinned=false,hideTimer=null;
    const inspecting=()=>!tip.hidden;
    const active=()=>visible&&!document.hidden&&!inspecting();
    function status(){
      scene.dataset.buildEnabled=String(enabled);scene.dataset.cycle=String(cycle);
      $('#play-build').setAttribute('aria-pressed',String(enabled));
      $('#play-build').innerHTML=(enabled?'Pause build':'Resume build')+' <span aria-hidden="true">'+(enabled?'Ⅱ':'▷')+'</span>';
      $('#build-status').textContent=inspecting()?'Build held · inspecting '+selected:enabled?'Continuous build · automatic':'Build paused';
      world?.setState({playing:enabled,inspecting:inspecting()});
    }
    function highlight(){
      $$('.tray-item').forEach(item=>item.classList.toggle('is-selected',item.dataset.trayId===selected));
      scene.dataset.inspecting=String(inspecting());
      world?.setState({selected});
    }
    function render(transition=false){
      $('#building-content').innerHTML=portfolioVisualization.render(angle,lod,{trayProgress,selectedTrayId:selected});
      $('#model-angle').textContent=Math.round(angle)+'°';
      scene.dataset.trayProgress=trayProgress.toFixed(2);
      world?.setState({angle,lod,trayProgress,exploded:scene.dataset.exploded==='true',selected,discipline});
      if(transition&&!reducedMotion.matches){
        $('#building-content').animate([{opacity:.35,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:500});
        $$('#building-content .model-floor').forEach((floor,index)=>{
          const lift=scene.dataset.exploded==='true'?-index*10:0;
          floor.animate([{opacity:0,transform:'translateY('+(lift+25)+'px)'},{opacity:1,transform:'translateY('+lift+'px)'}],{duration:450,delay:index*50});
        });
      }
    }
    function queueRender(){if(renderFrame===null)renderFrame=requestAnimationFrame(()=>{render();renderFrame=null;});}
    function setAngle(next){angle=portfolioVisualization.clampAngle(next);queueRender();}
    function setExploded(open){
      const separated=open&&lod>=200;scene.dataset.exploded=String(separated);
      $('#model-explode').setAttribute('aria-pressed',String(separated));
      $('#model-explode span').textContent=separated?'Assemble floors':'Separate floors';
      world?.setState({exploded:separated});
    }
    function suspendBuild(){
      if(timer!==null){remaining=Math.max(100,deadline-performance.now());clearTimeout(timer);timer=null;}
    }
    function scheduleBuild(delay=remaining){
      clearTimeout(timer);timer=null;remaining=delay;status();
      if(!enabled||!active())return;
      deadline=performance.now()+remaining;
      timer=setTimeout(()=>{
        timer=null;
        const index=portfolioVisualization.levels.indexOf(lod);
        if(index===portfolioVisualization.levels.length-1)cycle++;
        chooseLOD(portfolioVisualization.levels[(index+1)%portfolioVisualization.levels.length],true);
      },remaining);
    }
    function trayTick(time){
      if(!enabled||!active()||trayProgress>=1){trayFrame=null;trayLast=null;return;}
      if(trayLast!==null)trayProgress=Math.min(1,trayProgress+(time-trayLast)/2500);
      trayLast=time;
      if(time-trayPaint>=60||trayProgress===1){queueRender();trayPaint=time;}
      if(trayProgress<1)trayFrame=requestAnimationFrame(trayTick);else{trayFrame=null;trayLast=null;}
    }
    function orbitTick(time){
      if(!orbit||!active()){orbitFrame=null;return;}
      if(time-orbitLast>=55){setAngle(angle+.16);orbitLast=time;}
      orbitFrame=requestAnimationFrame(orbitTick);
    }
    function setOrbit(value){
      orbit=value;$('#model-orbit').setAttribute('aria-pressed',String(value));
      $('#model-orbit').textContent=value?'Pause orbit':'Auto rotate';
      if(!value){cancelAnimationFrame(orbitFrame);orbitFrame=null;}
      else if(active()&&orbitFrame===null){orbitLast=performance.now();orbitFrame=requestAnimationFrame(orbitTick);}
    }
    function suspendActivity(){
      suspendBuild();cancelAnimationFrame(trayFrame);trayFrame=null;trayLast=null;
      cancelAnimationFrame(orbitFrame);orbitFrame=null;status();
      world?.setActive(false);
    }
    function resumeActivity(){
      if(!active())return;
      world?.setActive(true);
      scheduleBuild(remaining);
      if(enabled&&trayProgress<1&&trayFrame===null)trayFrame=requestAnimationFrame(trayTick);
      if(orbit&&orbitFrame===null)setOrbit(true);
    }
    function closeInspector(resume=true,returnFocus=false){
      clearTimeout(hideTimer);tip.hidden=true;selected=null;pinned=false;
      $('#tray-select').value='';highlight();status();
      if(returnFocus&&!$('#tray-access').hidden)$('#tray-select').focus();
      if(resume)resumeActivity();
    }
    function chooseLOD(level,automatic=false){
      suspendBuild();closeInspector(false);
      lod=portfolioVisualization.normalizeLOD(level);
      const description=portfolioVisualization.descriptions[lod];
      scene.dataset.lod=String(lod);
      scene.dataset.stage=lod>=500?'deliver':lod>=350?'coordinate':'design';
      $('#scene-label').textContent='LOD '+lod+' / '+description[0].toUpperCase();
      $('#scene-caption').setAttribute('aria-live',automatic?'off':'polite');
      $('#scene-caption').innerHTML=description[0]+'<small>LOD '+lod+' / ILLUSTRATIVE PROGRESSION</small>';
      $('#lod-description').textContent=lod===400?'Each floor becomes a drawing sheet with discipline symbols and a title block.':description[1];
      $$('.stage-dock button').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.lod)===lod)));
      $('#model-explode').disabled=lod<200;setExploded(lod===350||lod===400);
      $$('#model-disciplines button').forEach(button=>{button.disabled=lod<200;});
      $('#tray-access').hidden=lod!==500||discipline!=='electrical';
      cancelAnimationFrame(trayFrame);trayFrame=null;trayLast=null;
      trayProgress=enabled&&!reducedMotion.matches&&(lod===350||lod===400)?0:1;
      render(true);remaining=duration[lod];resumeActivity();
    }
    function positionTip(x,y){
      const offset=getComputedStyle(tip).position==='absolute'?tip.offsetParent?.getBoundingClientRect():null;
      const width=document.documentElement.clientWidth;
      const edges={left:offset?Math.max(10,offset.left+10):10,right:offset?Math.min(width-10,offset.right-10):width-10,top:offset?Math.max(10,offset.top+10):82,bottom:offset?Math.min(innerHeight-12,offset.bottom-12):innerHeight-12};
      tip.style.maxHeight=Math.max(100,edges.bottom-edges.top)+'px';
      const bounds=tip.getBoundingClientRect();
      const left=x+18+bounds.width>edges.right?x-bounds.width-18:x+18;
      tip.style.left=(Math.max(edges.left,Math.min(left,edges.right-bounds.width))-(offset?.left||0))+'px';
      tip.style.top=(Math.max(edges.top,Math.min(y+12,edges.bottom-bounds.height))-(offset?.top||0))+'px';
    }
    function inspect(id,x,y,pin=false){
      if(lod!==500||!assets.has(id))return;
      if(pinned&&selected!==id&&!pin)return;
      clearTimeout(hideTimer);selected=id;pinned=pinned||pin;suspendActivity();
      const asset=assets.get(id);$('#tray-tooltip-title').textContent=id;
      const rows=[['Type',asset.type],['Size',asset.widthMm+' × '+asset.heightMm+' mm'],['Length',asset.lengthMm+' mm'],['Manufacturer',asset.manufacturer],['Material',asset.material],...(asset.powerW?[['Power',asset.powerW+' W'],['Colour temperature',asset.cctK+' K']]:[['Thickness',asset.thicknessMm+' mm']]),['System',asset.system],['Location',asset.level]];
      const dl=$('#tray-tooltip-data');dl.replaceChildren();
      rows.forEach(([label,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);dl.append(row);});
      tip.hidden=false;$('#tray-select').value=id;highlight();status();world?.setActive(true);positionTip(x,y);
    }
    function delayedClose(){if(!pinned)hideTimer=setTimeout(()=>closeInspector(),240);}
    assetList.forEach(asset=>{
      const option=document.createElement('option');option.value=asset.id;
      option.textContent=asset.id+' · '+asset.widthMm+' × '+asset.heightMm+' mm';
      $('#tray-select').append(option);
    });
    $('#tray-select').addEventListener('change',event=>{
      if(!event.target.value){closeInspector();return;}
      const box=event.target.getBoundingClientRect();inspect(event.target.value,box.left+box.width/2,Math.min(box.top,innerHeight/2),true);
    });
    model.addEventListener('pointerover',event=>{
      const hit=event.target.closest('.tray-hit');if(hit&&event.pointerType!=='touch')inspect(hit.dataset.trayId,event.clientX,event.clientY);
    });
    model.addEventListener('pointerout',event=>{if(event.target.closest('.tray-hit'))delayedClose();});
    model.addEventListener('click',event=>{
      const hit=event.target.closest('.tray-hit');if(hit)inspect(hit.dataset.trayId,event.clientX,event.clientY,true);
    });
    model.addEventListener('focusin',event=>{
      const hit=event.target.closest('.tray-hit');if(!hit)return;
      const box=hit.getBoundingClientRect();inspect(hit.dataset.trayId,box.x+box.width/2,box.y+box.height/2);
    });
    model.addEventListener('focusout',event=>{if(event.target.closest('.tray-hit'))delayedClose();});
    model.addEventListener('keydown',event=>{
      const hit=event.target.closest('.tray-hit');
      if(hit&&(event.key==='Enter'||event.key===' ')){event.preventDefault();const box=hit.getBoundingClientRect();inspect(hit.dataset.trayId,box.x+box.width/2,box.y+box.height/2,true);}
    });
    tip.addEventListener('pointerenter',()=>clearTimeout(hideTimer));
    tip.addEventListener('pointerleave',delayedClose);
    tip.addEventListener('focusin',()=>clearTimeout(hideTimer));
    $('#close-tray-tooltip').addEventListener('click',()=>closeInspector(true,true));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&inspecting()){event.preventDefault();closeInspector(true,true);}});
    document.addEventListener('pointerdown',event=>{
      if(inspecting()&&!tip.contains(event.target)&&!event.target.closest('.tray-hit')&&!event.target.closest('.bim-canvas')&&!event.target.closest('#tray-access'))closeInspector();
    });
    $('#play-build').addEventListener('click',()=>{suspendBuild();enabled=!enabled;if(!enabled){cancelAnimationFrame(trayFrame);trayFrame=null;trayLast=null;}status();if(enabled)resumeActivity();});
    $('#model-orbit').addEventListener('click',()=>setOrbit(!orbit));
    $$('.stage-dock button').forEach(button=>button.addEventListener('click',()=>chooseLOD(button.dataset.lod)));
    $('#rotate-left').addEventListener('click',()=>{setOrbit(false);setAngle(angle-15);});
    $('#rotate-right').addEventListener('click',()=>{setOrbit(false);setAngle(angle+15);});
    $('#model-explode').addEventListener('click',()=>setExploded(scene.dataset.exploded!=='true'));
    $('#scene-reset').addEventListener('click',()=>{setOrbit(false);setAngle(34);chooseLOD(100);});
    $$('#model-disciplines button').forEach(button=>button.addEventListener('click',()=>{
      closeInspector();discipline=button.dataset.discipline;
      $$('#model-disciplines button').forEach(peer=>peer.setAttribute('aria-pressed',String(peer===button)));
      scene.dataset.discipline=discipline;world?.setState({discipline});
      $('#tray-access').hidden=lod!==500||discipline!=='electrical';
    }));
    model.addEventListener('pointerdown',event=>{
      if(event.button!==0||event.target.closest('.tray-hit'))return;
      closeInspector();setOrbit(false);pointer={x:event.clientX,y:event.clientY,angle};model.setPointerCapture(event.pointerId);
    });
    model.addEventListener('pointermove',event=>{
      if(!pointer)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
      if(Math.abs(dx)<6||Math.abs(dx)<Math.abs(dy))return;
      model.classList.add('is-dragging');setAngle(pointer.angle+dx*.45);
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>model.addEventListener(type,()=>{pointer=null;model.classList.remove('is-dragging');}));
    if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;if(visible)resumeActivity();else suspendActivity();
    }).observe(scene);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendActivity();else resumeActivity();});
    reducedMotion.addEventListener('change',event=>{
      if(event.matches){suspendBuild();enabled=false;trayProgress=1;cancelAnimationFrame(trayFrame);trayFrame=null;setOrbit(false);render();status();}
    });
    if(typeof portfolioBuilding3D!=='undefined')world=portfolioBuilding3D.create({container:scene,onInspect:inspect,onLeave:delayedClose,onRotate:value=>{setOrbit(false);setAngle(value);}});
    chooseLOD(100,true);setOrbit(orbit);
    return {chooseLOD};
  }
  return {init};
})();
