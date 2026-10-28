import test from 'node:test';
import assert from 'node:assert/strict';
import {FIRST_FLUX_TABLE,MIN_WATER_COSINE,waterSkyTransportShader} from '../src/wgsl/water-sky-transport.js';
import {OCEAN,SKY_BG} from '../src/wgsl/ocean.js';
import {waterCoefficients} from '../src/water-coefficients.js';

// Independent midpoint integration in polar angle, not the LUT's cosine grid.
function reference(muLight){
  const result=[0,0],g=.70223624;
  for(let i=0;i<192;i++)for(let j=0;j<256;j++){
    const theta=(i+.5)*Math.PI/384,mu=Math.cos(theta),phi=(j+.5)*Math.PI/128;
    const c=-muLight*mu+Math.sqrt(1-muLight*muLight)*Math.sin(theta)*Math.cos(phi);
    const w=mu/(muLight+mu)*Math.sin(theta)*Math.PI/384*Math.PI/128;
    result[0]+=3/(16*Math.PI)*(1+c*c)*w;
    result[1]+=(1-g*g)/(4*Math.PI*(1+g*g-2*g*c)**1.5)*w;
  }
  return result;
}
test('cached first-collision flux agrees with independent angular integration',()=>{
  for(const x of [0,.5,3.75,8.3,16.5,24.8,31.75,32]){
    const i=Math.min(Math.floor(x),31),t=x-i;
    const actual=FIRST_FLUX_TABLE[i].map((v,c)=>v*(1-t)+FIRST_FLUX_TABLE[i+1][c]*t);
    const expected=reference(MIN_WATER_COSINE+(1-MIN_WATER_COSINE)*x/32);
    for(let c=0;c<2;c++)assert.ok(Math.abs(actual[c]/expected[c]-1)<.001,`${x}/${c}`);
  }
});
test('directional and diffuse budgets stay nonnegative across optical controls',()=>{
  for(const turbidity of [0,.25,2])for(const cdom of [0,.07,1])for(const mineral of [0,.3,3]){
    const {absorption:a,backscatter:bb}=waterCoefficients(turbidity,cdom,mineral);
    for(const flux of FIRST_FLUX_TABLE)for(let c=0;c<3;c++){
      const mol=2*Math.min(bb[c],[.0007,.001,.0015][c]),part=12*(bb[c]-mol/2);
      const first=(mol*flux[0]+part*flux[1])/(a[c]+mol+part);
      const ratio=bb[c]/(a[c]+bb[c]),reflectance=Math.PI*(.0949*ratio+.0794*ratio*ratio);
      const share=Math.min(1,reflectance/Math.max(first,1e-8)),remainder=Math.max(reflectance-first*share,0);
      assert.ok(share>=0&&share<=1&&remainder>=0);
      assert.ok(Math.abs(first*share+remainder-reflectance)<1e-12);
    }
  }
});
test('angular sky variant preserves geometry and existing opt-in paths',()=>{
  const q=new URLSearchParams('abWater=angular');
  const source=waterSkyTransportShader(OCEAN,q);
  const fragment=OCEAN.indexOf('fn fresnelWater(');
  assert.equal(source.slice(0,fragment),OCEAN.slice(0,fragment));
  assert.equal(waterSkyTransportShader(SKY_BG,q),SKY_BG);
  assert.equal(waterSkyTransportShader(OCEAN,new URLSearchParams('abWater=transport')),OCEAN);
  assert.equal(q.get('abWater'),'angular');
  assert.match(source,/waterAngularSky\(volumeNormal,outgoing/);
});
