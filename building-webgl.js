/* Original procedural BIM study. No client geometry or verified asset claims. */
'use strict';
const portfolioBuilding3D = (() => {
  function create({container,onInspect,onLeave,onRotate}) {
    if(typeof THREE==='undefined')return null;
    const T=THREE, reduce=matchMedia('(prefers-reduced-motion:reduce)');
    const canvas=document.createElement('canvas');
    canvas.className='bim-canvas';canvas.setAttribute('aria-label','Interactive three-dimensional building. Drag to orbit; use the tray list to inspect assets.');
    canvas.setAttribute('role','img');
    let renderer;
    try {renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}
    catch {return null;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
    renderer.setClearColor(0x0c0c0c,0);
    renderer.outputColorSpace=T.SRGBColorSpace;
    const scene=new T.Scene();scene.fog=new T.FogExp2(0x0c0c0c,.006);
    const camera=new T.PerspectiveCamera(34,1,.1,260);
    const building=new T.Group(),site=new T.Group(),drawings=new T.Group();
    scene.add(site,building,drawings);
    const state={lod:100,angle:34,exploded:false,trayProgress:1,selected:null,discipline:'all',playing:true,inspecting:false};
    let currentAngle=34,currentSpread=0,currentScale=.97,currentTarget=20;
    let active=true,frame=null,last=0,phase=0,dirtyUntil=0,drag=null,lastPointer=null,hovered=null;
    let lost=false,width=1,height=1,stageAge=0;
    const levels=[],trays=[],picks=[],billboards=[];
    const materials=[],geometries=[];
    const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
    const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
    const lineMaterial=(color,opacity=1)=>{
      const m=new T.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});materials.push(m);return m;
    };
    const fillMaterial=(color,opacity=.1)=>{
      const m=new T.MeshBasicMaterial({color,transparent:true,opacity,side:T.DoubleSide,depthWrite:false});materials.push(m);return m;
    };
    function lines(parent,points,material){
      const g=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));geometries.push(g);
      const l=new T.LineSegments(g,material);parent.add(l);return l;
    }
    function box(parent,x,y,z,w,h,d,fill,edge){
      const geometry=new T.BoxGeometry(w,h,d);geometries.push(geometry);
      if(fill){const m=new T.Mesh(geometry,fill);m.position.set(x,y,z);parent.add(m);}
      if(edge){const e=new T.EdgesGeometry(geometry);geometries.push(e);const l=new T.LineSegments(e,edge);l.position.set(x,y,z);parent.add(l);}
    }
    // A stable survey point field and perspective grid, all in the owner's palette.
    const grid=new T.GridHelper(130,52,0x888888,0x888888);
    grid.material.transparent=true;grid.material.opacity=.10;grid.material.depthWrite=false;site.add(grid);
    let seed=1901;
    function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
    const positions=[];
    for(let i=0;i<7000;i++){
      const x=(random()-.5)*90,z=(random()-.5)*90;
      if(Math.abs(x)<14&&Math.abs(z)<11)continue;
      positions.push(x,random()*.42-.2,z);
    }
    const pointGeometry=new T.BufferGeometry();pointGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometries.push(pointGeometry);
    const pointMaterial=new T.PointsMaterial({color:0xcccccc,size:.21,transparent:true,opacity:.6,depthWrite:false});materials.push(pointMaterial);
    const survey=new T.Points(pointGeometry,pointMaterial);site.add(survey);
    const contextEdge=lineMaterial(0x888888,.065);
    box(site,-38,8,-30,14,16,19,null,contextEdge);box(site,34,5,-42,20,10,18,null,contextEdge);
    box(site,-28,3,30,10,6,14,null,contextEdge);
    const footprint=lineMaterial(0x888888,.3);
    lines(site,[[-15,.05,-12],[15,.05,-12],[15,.05,-12],[15,.05,12],[15,.05,12],[-15,.05,12],[-15,.05,12],[-15,.05,-12]],footprint);
    const podiumEdge=lineMaterial(0xcccccc,.5),podiumFill=fillMaterial(0x888888,.075);
    box(building,0,2.2,0,25,4.4,20,podiumFill,podiumEdge);
    const podiumGrid=[];
    for(let x=-12.5;x<=12.5;x+=2.5)podiumGrid.push([x,0,-10],[x,4.4,-10],[x,0,10],[x,4.4,10]);
    for(let z=-10;z<=10;z+=2.5)podiumGrid.push([-12.5,0,z],[-12.5,4.4,z],[12.5,0,z],[12.5,4.4,z]);
    lines(building,podiumGrid,lineMaterial(0xbbbbbb,.27));
    const concept=new T.Group();building.add(concept);
    const conceptFill=fillMaterial(0x888888,.10),conceptEdge=lineMaterial(0xffffff,.45);
    box(concept,0,19.3,0,17,29.8,14,conceptFill,conceptEdge);
    const conceptGuide=lineMaterial(0xe31e24,.45);
    lines(concept,[[-8.5,4.4,7.8],[-8.5,34.2,7.8],[-9,4.4,7.8],[-8,4.4,7.8],[-9,34.2,7.8],[-8,34.2,7.8]],conceptGuide);
    for(let floor=0;floor<6;floor++){
      const group=new T.Group();building.add(group);
      const w=floor<3?17:floor<5?14.5:12.2,d=floor<3?14:floor<5?12.5:11;
      const frameMat=lineMaterial(0xcccccc,.36),slabMat=fillMaterial(0x888888,.13);
      const facadeMat=lineMaterial(0xaaaaaa,.21),glassMat=fillMaterial(0x888888,.04);
      const mepMat=lineMaterial(0xe31e24,.75),fixtureMat=fillMaterial(0xe31e24,.7);
      const structure=new T.Group(),facade=new T.Group(),mep=new T.Group();group.add(structure,facade,mep);
      box(structure,0,.12,0,w,.24,d,slabMat,frameMat);
      box(structure,0,4.85,0,w,.16,d,null,frameMat);
      const frameLines=[];
      for(const x of [-w/2,0,w/2])for(const z of [-d/2,d/2])frameLines.push([x,.25,z],[x,4.8,z]);
      for(const z of [-d/2,0,d/2])for(const x of [-w/2,w/2])frameLines.push([x,.25,z],[x,4.8,z]);
      lines(structure,frameLines,frameMat);
      box(structure,-1,2.3,0,3.4,4.4,3.1,fillMaterial(0x888888,.08),lineMaterial(0x888888,.25));
      box(facade,0,2.55,0,w,4.4,d,glassMat,null);
      const mullions=[];
      for(let i=0;i<=12;i++){
        const x=-w/2+w*i/12;
        for(const z of [-d/2,d/2])mullions.push([x,.35,z],[x,4.75,z]);
      }
      for(let i=0;i<=8;i++){
        const z=-d/2+d*i/8;
        for(const x of [-w/2,w/2])mullions.push([x,.35,z],[x,4.75,z]);
      }
      for(const y of [1.55,3.45])mullions.push([-w/2,y,-d/2],[w/2,y,-d/2],[-w/2,y,d/2],[w/2,y,d/2],[-w/2,y,-d/2],[-w/2,y,d/2],[w/2,y,-d/2],[w/2,y,d/2]);
      lines(facade,mullions,facadeMat);
      const verticals=[];
      for(const x of [-w*.32,w*.32]){
        verticals.push([x,.4,-d*.22],[x,4.15,-d*.22],[x,4.15,-d*.22],[x,4.15,d*.25]);
        box(mep,x,4.1,d*.25,.7,.12,.38,fixtureMat,null);
        box(mep,x,.8,-d*.22,.5,1.2,.26,fillMaterial(0x888888,.2),mepMat);
      }
      lines(mep,verticals,mepMat);
      const prefix='CT-L'+String(floor+1).padStart(2,'0')+'-';
      addTray(mep,[-w/2+1,4.35,-d/2+1.6],w-2,.5,'x',prefix+'01',floor);
      addTray(mep,[w/2-1,4.35,-d/2+1.6],d-3.2,.36,'z',prefix+'02',floor);
      addTray(mep,[-w/2+1,4.35,d/2-1.6],w-2,.72,'x',prefix+'03',floor);
      const tag=document.createElement('span');tag.className='bim-floor-tag';tag.setAttribute('aria-hidden','true');
      tag.textContent='L'+String(floor+1).padStart(2,'0')+' / ELECTRICAL';container.append(tag);
      levels.push({group,w,d,floor,structure,facade,mep,frameMat,slabMat,facadeMat,glassMat,mepMat,fixtureMat,tag});
    }
    function addTray(parent,start,length,w,axis,id,floor){
      const group=new T.Group();group.position.set(...start);parent.add(group);
      if(axis==='z')group.rotation.y=-Math.PI/2;
      const material=fillMaterial(0xe31e24,.8),edge=lineMaterial(0xdddddd,.75),centerMaterial=lineMaterial(0xe31e24,.9);
      const formed=new T.Group();group.add(formed);
      box(formed,length/2,.12,-w/2,length,.22,.055,material,edge);
      box(formed,length/2,.12,w/2,length,.22,.055,material,edge);
      const rungCount=Math.ceil((length-.2)/.6),rungGeometry=new T.BoxGeometry(.055,.05,w);geometries.push(rungGeometry);
      const rungs=new T.InstancedMesh(rungGeometry,material,rungCount),rungMatrix=new T.Matrix4();
      for(let i=0;i<rungCount;i++){rungMatrix.makeTranslation(.2+i*.6,.025,0);rungs.setMatrixAt(i,rungMatrix);}
      rungs.instanceMatrix.needsUpdate=true;formed.add(rungs);
      const centerGeometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(length,0,0)]);geometries.push(centerGeometry);
      const center=new T.Line(centerGeometry,centerMaterial);group.add(center);
      const pickGeometry=new T.BoxGeometry(length,.65,w+.45);geometries.push(pickGeometry);
      const pickMaterial=new T.MeshBasicMaterial({visible:false});materials.push(pickMaterial);
      const hit=new T.Mesh(pickGeometry,pickMaterial);hit.position.set(length/2,.1,0);hit.userData.trayId=id;group.add(hit);picks.push(hit);
      trays.push({id,floor,group,formed,material,edge,center,centerMaterial,length,rungs,rungCount});
    }
    // Illustrative drawing planes appear beside the fabrication model.
    const drawingTexture=makeDrawingTexture();
    const drawingFill=new T.MeshBasicMaterial({map:drawingTexture,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});materials.push(drawingFill);
    for(let i=0;i<6;i++){
      const plane=new T.Mesh(new T.PlaneGeometry(6.4,4.5),drawingFill);geometries.push(plane.geometry);
      plane.position.set(15+(i%2)*6.3,8+Math.floor(i/2)*4.6,-1);drawings.add(plane);billboards.push(plane);
    }
    function makeDrawingTexture(){
      const c=document.createElement('canvas');c.width=440;c.height=300;const ctx=c.getContext('2d');
      ctx.fillStyle='#111111';ctx.fillRect(0,0,440,300);ctx.strokeStyle='#e31e24';ctx.lineWidth=2;ctx.strokeRect(3,3,434,294);
      ctx.strokeStyle='#888888';ctx.lineWidth=1;ctx.strokeRect(35,37,370,200);
      for(const x of [35,125,215,305,405]){ctx.beginPath();ctx.moveTo(x,37);ctx.lineTo(x,237);ctx.stroke();}
      for(const y of [37,105,172,237]){ctx.beginPath();ctx.moveTo(35,y);ctx.lineTo(405,y);ctx.stroke();}
      ctx.strokeStyle='#e31e24';ctx.beginPath();ctx.moveTo(55,65);ctx.lineTo(380,65);ctx.lineTo(380,210);ctx.lineTo(55,210);ctx.stroke();
      ctx.fillStyle='#bbbbbb';ctx.font='13px monospace';ctx.fillText('ELECTRICAL / ILLUSTRATIVE PLAN',22,275);
      const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
    }
    const scan=new T.Group();building.add(scan);
    const scanMaterial=lineMaterial(0xe31e24,.3);
    lines(scan,[[-9,0,-7.5],[9,0,-7.5],[9,0,-7.5],[9,0,7.5],[9,0,7.5],[-9,0,7.5],[-9,0,7.5],[-9,0,-7.5]],scanMaterial);
    const raycaster=new T.Raycaster(),mouse=new T.Vector2();
    function updateModel(dt){
      if(state.playing&&!state.inspecting)stageAge+=dt;
      const damp=reduce.matches?1:1-Math.exp(-dt*7);
      let delta=((state.angle-currentAngle+540)%360)-180;
      currentAngle+=delta*damp;
      currentSpread+=(Number(state.exploded)-currentSpread)*damp;
      currentTarget+=((state.exploded?26:20)-currentTarget)*damp;
      currentScale+=((state.lod===100?.94:1)-currentScale)*damp;building.scale.setScalar(currentScale);
      concept.visible=state.lod===100;
      const structureFactor=state.discipline==='all'||state.discipline==='structure'?1:.26;
      const architectureFactor=state.discipline==='all'||state.discipline==='architecture'?1:.07;
      const electricalFactor=state.discipline==='all'||state.discipline==='electrical'?1:.1;
      for(const level of levels){
        const f=level.floor;
        const growth=state.lod===200&&state.playing&&!reduce.matches?ease((stageAge-f*.13)/.85):1;
        level.group.visible=state.lod>=200&&growth>.001;
        level.group.position.set(Math.sin(f*1.25)*currentSpread*1.25,4.4+f*(5+currentSpread*2.2),Math.cos(f*1.25)*currentSpread*.6);
        level.group.scale.y=.015+growth*.985;
        level.frameMat.opacity=.57*structureFactor;
        level.slabMat.opacity=(state.lod>=350?.1:.17)*structureFactor;
        level.facade.visible=state.lod>=300;
        const facadeReveal=state.lod===300&&state.playing&&!reduce.matches?ease(stageAge/.8):1;
        level.facadeMat.opacity=(state.lod>=350?.34:.42)*architectureFactor*facadeReveal;
        level.glassMat.opacity=(state.lod>=350?.018:.045)*architectureFactor*facadeReveal;
        level.mep.visible=state.lod>=300;
        level.mepMat.opacity=(state.lod>=350?.64:.25)*electricalFactor;
        level.fixtureMat.opacity=(state.lod>=350?.8:.35)*electricalFactor;
        level.tag.hidden=!(currentSpread>.6&&state.lod>=350&&f%2===1);
        if(!level.tag.hidden){
          const p=new T.Vector3(-level.w/2,3.2,level.d/2).applyMatrix4(level.group.matrixWorld).project(camera);
          level.tag.style.left=((p.x*.5+.5)*width)+'px';level.tag.style.top=((-p.y*.5+.5)*height)+'px';
        }
      }
      for(const tray of trays){
        const progress=state.lod>=500?1:state.lod>=350?clamp(state.trayProgress*1.18-tray.floor*.026):0;
        const draw=clamp(progress/.42),form=ease((progress-.24)/.5),detail=ease((progress-.6)/.4);
        tray.group.visible=state.lod>=350;
        tray.center.geometry.attributes.position.setX(1,tray.length*draw);tray.center.geometry.attributes.position.needsUpdate=true;
        tray.centerMaterial.opacity=.8*electricalFactor;
        tray.formed.visible=state.lod>=400&&form>.001;
        tray.formed.scale.set(1,Math.max(.01,form),1);
        const selected=state.selected===tray.id;
        tray.material.color.setHex(selected?0xffffff:0xe31e24);
        tray.edge.color.setHex(selected?0xffffff:0xcccccc);
        tray.material.opacity=form*(selected?1:.6)*electricalFactor;
        tray.edge.opacity=form*(selected?1:.45)*electricalFactor;
        tray.rungs.count=Math.floor(tray.rungCount*detail);
      }
      drawings.visible=state.lod===400&&state.discipline!=='structure';
      drawingFill.opacity=.95*(state.playing&&!reduce.matches?ease(stageAge/.65):1);
      scan.visible=state.playing&&!state.inspecting&&!reduce.matches;
      scan.position.y=3+(phase%7)/7*(state.exploded?46:32);
      scanMaterial.opacity=.12+Math.sin(phase*1.2)*.055;
      pointMaterial.opacity=.56+(state.playing&&!reduce.matches?Math.sin(phase*.35)*.04:0);
      const distance=(87+18*currentSpread)*(width<440?1.09:1);
      const yaw=currentAngle*Math.PI/180,elevation=width<440?.18:.21;
      camera.position.set(Math.sin(yaw)*distance,currentTarget+distance*elevation,Math.cos(yaw)*distance);
      camera.lookAt(0,currentTarget,0);camera.updateMatrixWorld();
      billboards.forEach((p,i)=>{const offset=15.2+(i%2)*7.3;p.position.set(Math.cos(yaw)*offset,9.8+Math.floor(i/2)*5.2,-Math.sin(yaw)*offset);p.quaternion.copy(camera.quaternion);});
      // Update matrices before raycasting or projecting tags after a package move.
      building.updateMatrixWorld(true);
      container.dataset.cameraAngle=((currentAngle%360+360)%360).toFixed(1);
      container.dataset.renderLod=String(state.lod);
      container.dataset.trayTargets=String(picks.length);
    }
    function tick(now){
      frame=null;if(lost||!active||document.hidden)return;
      if(now-last<32){frame=requestAnimationFrame(tick);return;}
      const dt=Math.min(.06,(now-last)/1000||.032);last=now;
      if(state.playing&&!state.inspecting&&!reduce.matches)phase+=dt;
      updateModel(dt);renderer.render(scene,camera);
      if((state.playing&&!state.inspecting&&!reduce.matches)||now<dirtyUntil)frame=requestAnimationFrame(tick);
    }
    function requestDraw(){dirtyUntil=performance.now()+1300;if(active&&frame===null)frame=requestAnimationFrame(tick);}
    function pick(x,y){
      if(state.lod!==500||state.discipline==='structure'||state.discipline==='architecture')return null;
      const rect=canvas.getBoundingClientRect();mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);
      scene.updateMatrixWorld(true);raycaster.setFromCamera(mouse,camera);
      return raycaster.intersectObjects(picks,false)[0]?.object.userData.trayId||null;
    }
    canvas.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,angle:state.angle,moved:false};
    });
    canvas.addEventListener('pointermove',event=>{
      lastPointer={x:event.clientX,y:event.clientY};
      if(drag){
        const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
        if(Math.abs(dx)>6&&Math.abs(dx)>Math.abs(dy)){
          drag.moved=true;canvas.classList.add('is-dragging');canvas.setPointerCapture(event.pointerId);
          if(hovered){hovered=null;onLeave();}onRotate(drag.angle+dx*.4);
        }
        return;
      }
      if(event.pointerType==='touch')return;
      const id=pick(event.clientX,event.clientY);
      canvas.classList.toggle('is-over-tray',Boolean(id));
      if(id!==hovered){hovered=id;if(id)onInspect(id,event.clientX,event.clientY,false);else onLeave();}
    });
    canvas.addEventListener('pointerup',event=>{
      const moved=drag?.moved;drag=null;canvas.classList.remove('is-dragging');
      if(!moved){const id=pick(event.clientX,event.clientY);if(id)onInspect(id,event.clientX,event.clientY,true);}
      if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointercancel',()=>{drag=null;canvas.classList.remove('is-dragging');});
    canvas.addEventListener('pointerleave',()=>{lastPointer=null;hovered=null;if(!drag)onLeave();});
    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();lost=true;canvas.hidden=true;container.classList.remove('has-webgl');container.dataset.renderer='svg-fallback';
      levels.forEach(level=>level.tag.hidden=true);cancelAnimationFrame(frame);frame=null;
    });
    const resize=new ResizeObserver(()=>{
      width=Math.max(1,container.clientWidth);height=Math.max(1,container.clientHeight-40);
      camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);requestDraw();
    });
    container.prepend(canvas);container.classList.add('has-webgl');container.dataset.renderer='webgl';
    resize.observe(container);
    function setState(next){if(next.lod!==undefined&&next.lod!==state.lod)stageAge=0;Object.assign(state,next);requestDraw();}
    function setActive(value){active=value;if(value)requestDraw();else{cancelAnimationFrame(frame);frame=null;}}
    requestDraw();
    return {setState,setActive,dispose(){resize.disconnect();cancelAnimationFrame(frame);renderer.dispose();materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());drawingTexture.dispose();levels.forEach(l=>l.tag.remove());canvas.remove();container.classList.remove('has-webgl');}};
  }
  return {create};
})();
