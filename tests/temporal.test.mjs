import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraJitter,temporalCamera,TEMPORAL_OFFSET,TEMPORAL_FLOATS} from '../src/temporal-camera.js';
import {FRAME_FLOATS,FRAME_BYTES,cascadeOrigin} from '../src/spatial-origin.js';
import {FRAME_WGSL} from '../src/wgsl/common.js';
import {temporalShader,oceanMotionShader} from '../src/wgsl/taa.js';
import {OCEAN} from '../src/wgsl/ocean.js';

const close=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
const frame=()=>{const f=new Float32Array(FRAME_FLOATS);f[0]=f[5]=1;f[11]=-1;f[14]=.05;f[17]=2;f[25]=.6;f[30]=-1;f[36]=1920;f[37]=1080;f[60]=32;f[61]=1.1;return f;};

test('temporal Frame extension has the WGSL uniform byte layout',()=>{
  const members=[...FRAME_WGSL.matchAll(/\w+:\s*(mat4x4f|vec4f|array<vec4f,\s*(\d+)>)/g)];
  const floats=members.reduce((s,m)=>s+(m[1]==='mat4x4f'?16:m[2]?4*Number(m[2]):4),0);
  assert.equal(floats,FRAME_FLOATS);assert.equal(FRAME_BYTES,floats*4);assert.equal(FRAME_FLOATS,TEMPORAL_OFFSET+TEMPORAL_FLOATS+28);
});

test('finite jitter sequences are centred; inverse-ray and history signs agree',()=>{
  for(const [sequence,count] of [['msaa4',4],['halton',8]]){
    const js=Array.from({length:count},(_,i)=>cameraJitter(i,1920,1080,sequence));
    close(js.reduce((s,j)=>s+j[0],0),0);close(js.reduce((s,j)=>s+j[1],0),0);
    const original=[.23,-.41],current=js[0],previous=js[1];
    const pixel=original.map((v,i)=>(v+current[i])*[.5,-.5][i]+.5);
    const history=pixel.map((v,i)=>v+(previous[i]-current[i])*[.5,-.5][i]);
    history.forEach((v,i)=>close(v,(original[i]+previous[i])*[.5,-.5][i]+.5));
    close((pixel[0]*2-1)-current[0],original[0]);close((1-pixel[1]*2)-current[1],original[1]);
  }
});

test('temporal snapshots retain old origins, chop, wind, exposure and reject cuts',()=>{
  const t=temporalCamera(),f=frame();f[16]=511;f.set([1,0,.4,1307],172);cascadeOrigin([0,0],f,128);
  assert.equal(t.write(f,[511,2,0],1/60,0).valid,false);
  f[16]=-511;f[19]=1/60;f[60]=16;f.set([1024,0],126);cascadeOrigin([1024,0],f,128);f[174]=.8;
  assert.equal(t.write(f,[513,2,0],1/60,0).valid,true);
  close(f[196],511);close(f[199],1.1);close(f[214],.4);close(f[225],2);
  assert.deepEqual(Array.from(f.subarray(200,212)),Array(12).fill(0));
  // The same absolute material point must have the same old local coordinate.
  close(f[16]+f[126],513);close(f[16]+f[126]-f[196],2);
  assert.equal(t.write(f,[700,2,0],1/60,0).valid,false);
  assert.equal(t.write(f,[700,2,0],1,0).valid,false);
  t.reset('resize');assert.equal(t.write(f,[700,2,0],1/60,0).valid,false);
});

test('MSAA shader is unchanged; motion reuses production geometry with sample interpolation',()=>{
  assert.equal(temporalShader(OCEAN,false),OCEAN);
  const motion=oceanMotionShader(OCEAN);
  assert.ok(motion.includes('@interpolate(perspective,sample)'));
  assert.ok(motion.includes('oldXZ=xz+F.worldOrigin.zw'));
  assert.ok(motion.includes('oldDerivatives,sampR,oldXZ,F.previousCamera.w'));
  assert.ok(motion.includes('let eff = spacing * (1.0 + mk);'));
});
