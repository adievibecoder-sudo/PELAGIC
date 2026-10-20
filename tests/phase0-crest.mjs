// Eulerian measure matters: horizontally displaced samples are not equally spaced.
import fs from 'node:fs';
import assert from 'node:assert/strict';
function field(ka,lambda,harmonic){
 const n=16384,points=[];let weight=0,mean=0;
 for(let j=0;j<n;j++){
  const q=(j+.5)*2*Math.PI/n,x=q-lambda*ka*Math.sin(q),J=1-lambda*ka*Math.cos(q);
  const y=ka*Math.cos(q)+harmonic*.5*ka*ka*Math.cos(2*q);
  points.push({x,y,J});weight+=J;mean+=J*y;
 }
 mean/=weight;const v=points.reduce((s,p)=>s+p.J*(p.y-mean)**2,0)/weight;
 return{ka,lambda,harmonic,mean,variance:v,skewness:points.reduce((s,p)=>s+p.J*(p.y-mean)**3,0)/weight/v**1.5,minJacobian:1-lambda*ka,points:points.filter((_,i)=>i%32===0).map(p=>[p.x,p.y-mean])};
}
const cases=[];for(const ka of [.1,.2,.3])for(const [name,lambda,h] of [['linear',0,0],['choppy',1,0],['Stokes-second-order',0,1],['naive-both',1,1]])cases.push({name,...field(ka,lambda,h)});
assert.ok(Math.abs(cases[0].skewness)<1e-12);
assert.ok(cases[3].skewness>cases[1].skewness);
const output={scope:'Unidirectional k=1 m^-1 model cross-sections and dx-weighted Eulerian moments. Stokes expression valid only as weakly nonlinear expansion; no random-sea or hydrodynamic validation.',cases,decision:'Choppiness already changes Eulerian skewness. Adding a full second-order harmonic on top double-counts part of crest sharpening. Fit a common target under Eulerian measure before combining. A roller cannot be inferred from this single-valued surface: event onset, dissipated-energy allocation and multivalued immersion remain unresolved.'};
fs.mkdirSync('evidence/v04-p0-science',{recursive:true});fs.writeFileSync('evidence/v04-p0-science/crest.json',JSON.stringify(output,null,2)+'\n');
const colors=['#718a9b','#1890a2','#d88b34','#bf4d55'];
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="650" viewBox="0 0 1600 650"><rect width="1600" height="650" fill="#f4f1e9"/><g font-family="monospace" fill="#152c36"><text x="60" y="45" font-size="24">Phase 0: Eulerian crest shape, ka=0.2; manufactured 1-D example</text>';
for(const [i,c] of cases.filter(c=>c.ka===.2).entries()){
 const points=c.points.map(([x,y])=>[60+x/(2*Math.PI)*1480,340-y*900].join(',')).join(' ');
 svg+=`<polyline points="${points}" fill="none" stroke="${colors[i]}" stroke-width="3"/><text x="60" y="${520+i*27}" font-size="19" fill="${colors[i]}">${c.name}: skewness ${c.skewness.toFixed(4)}, min J ${c.minJacobian.toFixed(2)}</text>`;
}
svg+='</g></svg>';fs.writeFileSync('evidence/v04-p0-science/crest.svg',svg);
console.log(cases.map(({name,ka,skewness})=>({name,ka,skewness})));
