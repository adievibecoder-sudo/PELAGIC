import test from 'node:test';
import assert from 'node:assert/strict';
import {integrate} from '../src/numerics.js';
import {footprintOpticsShader} from '../src/wgsl/footprint-optics.js';
import {OCEAN,SKY_BG} from '../src/wgsl/ocean.js';

const phi=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
const cdf=x=>integrate(phi,-10,x,1024);
test('projected Gaussian visible-slope distribution integrates to one',()=>{
  for(const beta of [-3,-1,0,.3,1,3,6]){
    const normalization=beta*cdf(beta)+phi(beta);
    const mass=integrate(x=>(beta-x)*phi(x),-10,beta,4096);
    assert.ok(Math.abs(mass/normalization-1)<2e-7);
    // The visible population shifts towards the viewer, even at grazing.
    const mean=integrate(x=>x*(beta-x)*phi(x),-10,beta,4096)/mass;
    assert.ok(mean<0);
    assert.ok(Math.abs(mean+cdf(beta)/normalization)<2e-6);
  }
});
test('conditional slope mixtures retain both within-cell and between-cell energy',()=>{
  const cells=[{mean:-.2,variance:.012},{mean:.4,variance:.035},{mean:.1,variance:.002},{mean:-.3,variance:.018}];
  const mean=cells.reduce((s,c)=>s+c.mean,0)/cells.length;
  const variance=cells.reduce((s,c)=>s+c.variance+(c.mean-mean)**2,0)/cells.length;
  const density=x=>cells.reduce((s,c)=>s+phi((x-c.mean)/Math.sqrt(c.variance))/Math.sqrt(c.variance),0)/cells.length;
  assert.ok(Math.abs(integrate(density,-3,3)-1)<1e-10);
  assert.ok(Math.abs(integrate(x=>(x-mean)**2*density(x),-3,3)-variance)<1e-10);
});
test('new optics preserve default shader and unrelated sky stages',()=>{
  assert.equal(footprintOpticsShader(OCEAN,new URLSearchParams()),OCEAN);
  assert.equal(footprintOpticsShader(SKY_BG,new URLSearchParams('maGlints=footprint&maWater=facet&maReflection=visible')),SKY_BG);
});
