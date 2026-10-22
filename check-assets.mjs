// Validate the exact filename case that GitHub Pages requires.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'js/data.js'),'utf8')+';globalThis.data=portfolioData;',context);
const data=context.data;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let errors=[];
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
if(ids.length!==new Set(ids).size)errors.push('Duplicate HTML IDs.');
if(/href=""/.test(html))errors.push('An empty link was found.');
const script=fs.readdirSync(path.join(root,'js')).filter(file=>file.endsWith('.js')).map(file=>fs.readFileSync(path.join(root,'js',file),'utf8')).join('\n');
for(const match of script.matchAll(/\$\('#([a-zA-Z][\w-]*)'\)/g)){
  if(!ids.includes(match[1]))errors.push('Script refers to missing ID: '+match[1]);
}
const paths=new Set(['.nojekyll']);
for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const value=match[1];
  if(value.startsWith('#')){
    if(!html.includes('id="'+value.slice(1)+'"'))errors.push('Missing anchor: '+value);
  }else if(!/^[a-z]+:|^\/\//i.test(value))paths.add(decodeURIComponent(value));
}
data.projects.forEach(p=>{
  p.images.forEach(image=>{if(!/^https?:/.test(image))paths.add('assets/images/'+image);});
  paths.add('assets/previews/project-'+p.id+'.webp');
});
function exact(relative){
  let dir=root;
  for(const segment of relative.split('/')){
    if(!fs.existsSync(dir)||!fs.readdirSync(dir).includes(segment))return false;
    dir=path.join(dir,segment);
  }
  return fs.statSync(dir).isFile();
}
paths.forEach(p=>{if(!exact(p))errors.push('Missing or incorrectly cased asset: '+p);});
if(data.projects.length!==15)errors.push('Expected all 15 original projects and tools.');
if(!html.includes('mailto:'+data.personalInfo.email))errors.push('Email does not match source data.');
if(!html.includes(data.personalInfo.linkedIn))errors.push('LinkedIn does not match source data.');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else if(process.argv.includes('--manifest')) console.log(JSON.stringify([...paths].sort()));
else console.log('PASS: '+paths.size+' local paths, all anchors, filename case, 15 projects/tools and contact identity.');
