/* Procedural illustration, not a client BIM model or a field-verification claim. */
'use strict';
const portfolioVisualization = (() => {
  const levels = [100, 200, 300, 350, 400, 500];
  const clampAngle = value => {
    const angle = Number(value);
    return Number.isFinite(angle) ? ((angle % 360) + 360) % 360 : 45;
  };
  const normalizeLOD = value => levels.includes(Number(value)) ? Number(value) : 100;
  const descriptions = {
    100: ['Concept massing', 'The idea starts as a simple volume.'],
    200: ['Approximate systems', 'Floor plates and the primary building form.'],
    300: ['Detailed design', 'Defined geometry, facade and equipment.'],
    350: ['System coordination', 'Electrical routes and interfaces come together.'],
    400: ['Fabrication detail', 'Trays, supports and connections become visible.'],
    500: ['As-built information', 'Record information and asset locations. Field verification is a separate requirement.']
  };
  function render(angle = 45, requestedLOD = 100, options = {}) {
    const lod = normalizeLOD(requestedLOD), yaw = clampAngle(angle) * Math.PI / 180;
    const trayProgress=Math.max(0,Math.min(1,Number.isFinite(options.trayProgress)?options.trayProgress:1));
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const project = (x,y,z=0) => {
      const dx=x-145, dy=y-90;
      return [370+(dx*cos-dy*sin)*1.2,440+(dx*sin+dy*cos)*.56-z*1.05];
    };
    const point = p => project(...p).map(n=>n.toFixed(1)).join(',');
    const poly = (p,cls) => '<polygon class="'+cls+'" points="'+p.map(point).join(' ')+'"/>';
    const line = (p,cls,extra='') => '<polyline class="'+cls+'" points="'+p.map(point).join(' ')+'" '+extra+'/>';
    const dot = (x,y,z,r,cls) => {
      const p=project(x,y,z);
      return '<circle class="'+cls+'" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+r+'"/>';
    };
    const box = (x,y,z,w,d,h,cls='structure-surface') => {
      const xf=sin>=0?x+w:x, yf=cos>=0?y+d:y;
      return poly([[x,yf,z],[x+w,yf,z],[x+w,yf,z+h],[x,yf,z+h]],cls)+
        poly([[xf,y,z],[xf,y+d,z],[xf,y+d,z+h],[xf,y,z+h]],cls)+
        poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],'model-slab');
    };
    function cableTray(x,y,z,length,width,axis,id){
      const shape=Math.max(0,Math.min(1,(trayProgress-.28)/.58));
      const detail=Math.max(0,Math.min(1,(trayProgress-.65)/.35));
      const draw=Math.min(1,trayProgress/.4);
      const horizontal=axis==='x';
      const end=horizontal?[x+length,y,z]:[x,y+length,z];
      const left=horizontal?[[x,y-width/2,z],[x+length,y-width/2,z]]:[[x-width/2,y,z],[x-width/2,y+length,z]];
      const right=horizontal?[[x,y+width/2,z],[x+length,y+width/2,z]]:[[x+width/2,y,z],[x+width/2,y+length,z]];
      const selected=options.selectedTrayId===id?' is-selected':'';
      let result='<g class="tray-item'+selected+'" data-tray-id="'+id+'">';
      result+=line([[x,y,z],end],'tray-centerline','pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:'+(1-draw).toFixed(3)+'"');
      if(lod>=400){
        result+='<g class="tray-formed" opacity="'+shape.toFixed(3)+'">';
        result+=poly([left[0],left[1],[left[1][0],left[1][1],z+shape*3],[left[0][0],left[0][1],z+shape*3]],'tray-wall');
        result+=poly([right[0],right[1],[right[1][0],right[1][1],z+shape*3],[right[0][0],right[0][1],z+shape*3]],'tray-wall');
        result+=line(left,'tray-rail')+line(right,'tray-rail');
        result+='<g class="tray-rungs" opacity="'+detail.toFixed(3)+'">';
        for(let t=4;t<length;t+=9){
          const rung=horizontal?[[x+t,y-width/2,z],[x+t,y+width/2,z]]:[[x-width/2,y+t,z],[x+width/2,y+t,z]];
          result+=line(rung,'tray-support');
        }
        result+='</g></g>';
      }
      if(lod===500)result+=line([[x,y,z+2],horizontal?[x+length,y,z+2]:[x,y+length,z+2]],'tray-hit','role="button" tabindex="0" aria-label="Inspect demo tray '+id+'" data-tray-id="'+id+'"');
      return result+'</g>';
    }
    let svg='<defs><filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="ground-shade"><stop stop-color="#ffffff" stop-opacity=".06"/><stop offset="1" stop-color="#0c0c0c" stop-opacity="0"/></radialGradient></defs>';
    svg+='<ellipse cx="370" cy="465" rx="330" ry="135" fill="url(#ground-shade)"/><g class="model-ground">';
    for(let x=-110;x<=400;x+=30)svg+=line([[x,-100,0],[x,290,0]],'ground-grid');
    for(let y=-100;y<=290;y+=30)svg+=line([[-110,y,0],[400,y,0]],'ground-grid');
    svg+=poly([[-25,-25,0],[315,-25,0],[315,205,0],[-25,205,0]],'site-outline')+'</g>';
    svg+='<g class="model-podium">'+box(0,0,5,290,180,34)+'</g>';
    if(lod===100){
      svg+='<g class="lod-mass">'+box(25,24,40,232,125,162,'concept-surface')+'</g>';
      svg+=line([[25,24,207],[257,24,207],[257,149,207],[25,149,207],[25,24,207]],'concept-outline');
    }else{
      for(let floor=0;floor<6;floor++){
        const z=40+floor*27,x=floor>3?39:25,y=24,w=floor>3?204:232,d=125;
        svg+='<g class="model-floor" data-floor="'+floor+'" style="--lift:-'+floor*10+'px">';
        svg+=box(x,y,z,w,d,25);
        if(lod>=300){
          const yf=cos>=0?y+d+.3:y-.3, xf=sin>=0?x+w+.3:x-.3;
          for(let k=0;k<10;k++){
            const a=x+5+k*(w-8)/10,bw=(w-8)/10-5;
            svg+=poly([[a,yf,z+4],[a+bw,yf,z+4],[a+bw,yf,z+21],[a,yf,z+21]],'model-window');
          }
          for(let k=0;k<5;k++){
            const a=y+5+k*23;
            svg+=poly([[xf,a,z+4],[xf,a+17,z+4],[xf,a+17,z+21],[xf,a,z+21]],'model-window');
          }
          svg+=line([[x-4,y-4,z+25],[x+w+4,y-4,z+25],[x+w+4,y+d+4,z+25],[x-4,y+d+4,z+25],[x-4,y-4,z+25]],'structure-edge');
        }
        if(lod>=350){
          svg+='<g class="electrical-system">';
          svg+=line([[x+10,y+20,z+26],[x+180,y+20,z+26],[x+180,y+90,z+26],[x+30,y+90,z+26],[x+30,y+120,z+26]],'model-route','pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:'+(1-Math.min(1,trayProgress/.4)).toFixed(3)+'"');
          svg+=line([[x+20,y+47,z+26.5],[x+195,y+47,z+26.5],[x+195,y+110,z+26.5]],'model-route-secondary');
          const trayPrefix='CT-L'+String(floor+1).padStart(2,'0')+'-';
          svg+=cableTray(x+10,y+20,z+28,170,6,'x',trayPrefix+'01');
          svg+=cableTray(x+180,y+20,z+28,70,4,'y',trayPrefix+'02');
          svg+=cableTray(x+30,y+90,z+28,150,8,'x',trayPrefix+'03');
          for(const distance of [40,90,140]){
            svg+=line([[x+distance,y+20,z+26],[x+distance,y+67,z+26]],'model-route');
            svg+=dot(x+distance,y+67,z+26,2,'model-node');
            if(lod>=400){
              svg+=box(x+distance-4,y+63,z+26,8,8,2,'fixture-detail');
            }
          }
          if(lod>=400){
            svg+=box(x+7,y+14,z+5,7,11,13,'panel-detail');
          }
          svg+='</g>';
        }
        svg+='</g>';
      }
      if(lod>=300){
        svg+='<g class="model-floor model-roof" style="--lift:-60px">'+box(65,45,202,45,35,15)+box(145,48,202,55,30,12)+'</g>';
      }
      if(lod>=350)svg+=line([[40,44,8],[40,44,238]],'model-route model-riser');
      if(lod===500){
        svg+='<g class="asset-information">';
        [[40,44,100,'Panel'],[155,90,178,'Lighting'],[160,55,218,'Record data']].forEach((p,i)=>{
          const [sx,sy]=project(p[0],p[1],p[2]), ly=145+i*48;
          svg+='<circle class="asset-anchor" cx="'+sx.toFixed(1)+'" cy="'+sy.toFixed(1)+'" r="5"/><path class="asset-leader" d="M'+sx.toFixed(1)+' '+sy.toFixed(1)+' L610 '+ly+' H685"/><text class="asset-label" x="615" y="'+(ly-7)+'">'+p[3]+'</text>';
        });
        svg+='</g>';
      }
    }
    svg+='<text class="model-credit" x="85" y="590">ILLUSTRATIVE BIM PROGRESSION / LOD '+lod+'</text>';
    return svg;
  }
  return { render, clampAngle, normalizeLOD, levels, descriptions };
})();
