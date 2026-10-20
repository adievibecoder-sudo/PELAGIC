import test from 'node:test';
import assert from 'node:assert/strict';
import {lambertPhase,lunarLight,twilightExposure} from '../src/celestial-light.js';

test('lunar disc irradiance follows independently integrated projected Lambert sphere',()=>{
 const n=131072;
 for(const degrees of [0,30,60,90,120,150,175]){
  const alpha=degrees*Math.PI/180;let integral=0;
  for(let i=0;i<n;i++){
   const r=Math.sqrt((i+.5)/n),phi=i*2.399963229728653;
   integral+=Math.max(0,r*Math.cos(phi)*Math.sin(alpha)+Math.sqrt(1-r*r)*Math.cos(alpha));
  }
  integral/=n;
  assert.ok(Math.abs(integral-lambertPhase(alpha)*2/3)<.00002,`${degrees}: ${integral}`);
 }
 const full=lunarLight([0,1,0],[0,-1,0],384400);
 assert.equal(full.phase,1);assert.equal(full.irradiance,.000055);
 assert.equal(lunarLight([0,1,0],[0,1,0],384400).phase,0);
});

test('twilight adaptation is continuous across the former minus-seven-degree switch',()=>{
 assert.ok(Math.abs(twilightExposure(-7+1e-6)-twilightExposure(-7-1e-6))<.00002);
 assert.equal(twilightExposure(10),1);assert.ok(Math.abs(twilightExposure(-20)-500)<1e-10);
 let previous=1;for(let h=0;h>=-20;h-=.01){const value=twilightExposure(h);assert.ok(value>=previous);previous=value;}
});
