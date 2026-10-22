// Regression checks for continuous orbit and genuinely different LOD geometry.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'js/visualization.js'),'utf8')+';globalThis.model=portfolioVisualization;',context);
const model=context.model;
assert.equal(model.clampAngle(405),45);
assert.equal(model.clampAngle(-45),315);
assert.equal(model.clampAngle(0),0);
assert.equal(model.normalizeLOD(999),100);
const geometry=Object.fromEntries(model.levels.map(lod=>[lod,model.render(45,lod)]));
assert.match(geometry[100],/lod-mass/);
assert.doesNotMatch(geometry[100],/data-floor=/);
assert.match(geometry[200],/data-floor="5"/);
assert.doesNotMatch(geometry[200],/class="model-window"/);
assert.match(geometry[300],/class="model-window"/);
assert.doesNotMatch(geometry[300],/class="model-route"/);
assert.match(geometry[350],/electrical-system/);
assert.doesNotMatch(geometry[350],/tray-support/);
assert.match(geometry[400],/tray-support/);
assert.doesNotMatch(geometry[400],/asset-information/);
assert.match(geometry[500],/asset-information/);
for(const lod of model.levels){
  for(const angle of [0,45,90,135,180,225,270,315,359]){
    const svg=model.render(angle,lod);
    assert.doesNotMatch(svg,/NaN|Infinity|undefined/);
    for(const match of svg.matchAll(/points="([^"]+)"/g)){
      assert.ok(match[1].split(/[ ,]+/).every(value=>Number.isFinite(Number(value))));
    }
  }
}
assert.notEqual(model.render(45,400),model.render(225,400),'Back-side orbit must change the model.');
vm.runInContext(fs.readFileSync(path.join(root,'js/tray-data.js'),'utf8')+';globalThis.trays=portfolioTrayData;',context);
const records=context.trays.assets;
assert.equal(records.length,18);
assert.equal(context.trays.isDemo,true);
const ids=[...model.render(45,500).matchAll(/class="tray-hit".*?data-tray-id="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,18);
assert.ok(ids.every(id=>records.some(record=>record.id===id)));
assert.ok(records.every(record=>record.widthMm>0&&record.heightMm>0&&record.lengthMm>0&&record.manufacturer==='Example manufacturer'));
assert.doesNotMatch(model.render(45,400),/class="tray-hit"/);
assert.notEqual(model.render(45,400,{trayProgress:0}),model.render(45,400,{trayProgress:1}));
assert.match(model.render(45,400,{trayProgress:0}),/stroke-dashoffset:1.000/);
assert.match(model.render(45,400,{trayProgress:1}),/stroke-dashoffset:0.000/);
console.log('PASS: six distinct LOD states, full 360° wrapping and finite geometry at 54 angle/LOD combinations.');
console.log('PASS: progressive tray construction and 18 unique LOD 500 hit targets matched to explicit demo records.');
