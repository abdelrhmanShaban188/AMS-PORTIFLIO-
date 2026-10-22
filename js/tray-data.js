/* Illustrative values only. Replace from an approved project submittal before using as real asset data. */
'use strict';
const portfolioTrayData = {
  isDemo: true,
  assets: Array.from({length:6},(_,floor)=>[0,1,2].map(segment=>({
    id:'CT-L'+String(floor+1).padStart(2,'0')+'-'+String(segment+1).padStart(2,'0'),
    level:'Level '+String(floor+1).padStart(2,'0'),
    type:'Ladder cable tray',
    widthMm:[300,200,450][segment],
    heightMm:[100,75,100][segment],
    lengthMm:[3000,1500,3000][segment],
    thicknessMm:1.5,
    manufacturer:'Example manufacturer',
    material:'Hot-dip galvanized steel',
    system:'Power distribution',
    dataStatus:'Illustrative values — not a project submittal'
  }))).flat()
};

// Demo lighting schedule; dimensions describe the asset, not drawing scale.
portfolioTrayData.lights=Array.from({length:6},(_,floor)=>Array.from({length:6},(_,index)=>({
  id:'LT-L'+String(floor+1).padStart(2,'0')+'-'+String(index+1).padStart(2,'0'),
  level:'Level '+String(floor+1).padStart(2,'0'), type:'Linear LED luminaire',
  widthMm:300,heightMm:70,lengthMm:1200,manufacturer:'Example manufacturer',
  material:'Aluminium housing / opal diffuser',system:'Lighting',powerW:36,cctK:4000,
  dataStatus:'Illustrative values — not a project submittal'
}))).flat();
