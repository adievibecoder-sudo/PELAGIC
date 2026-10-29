import {FRAME_WGSL} from '../src/wgsl/common.js';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import {cloudWorkShader} from '../src/wgsl/cloud-work.js';
import {cloudOrganizationShader} from '../src/wgsl/cloud-organization.js';
import {REGIONAL_SEA} from '../src/wgsl/regional-sea.js';
import {BUBBLE_TRANSPORT} from '../src/wgsl/bubble-plumes.js';
import {bubblePlumeShader} from '../src/wgsl/bubble-plumes.js';
import {breakingEventsShader} from '../src/wgsl/breaking-events.js';
import {breakingPhaseShader} from '../src/wgsl/breaking-phase.js';
import {FOAM_UPDATE} from '../src/wgsl/sim.js';
import {FOAM_BYTES} from '../src/spatial-origin.js';
import {PATCHES,decodeHalf} from '../src/numerics.js';
import {REGIONAL_WEATHER} from '../src/wgsl/environment.js';
import {createEnvironment,environmentUniforms,airWindUniforms,sampleEnvironment} from '../src/environment.js';
import {regionalSeaUniforms} from '../src/regional-sea.js';
import {DEFAULTS} from '../src/settings.js';
import {FRAME_FLOATS} from '../src/spatial-origin.js';
import {roughnessUniforms} from '../src/wind-roughness.js';
import {PARTICLE_UPDATE,PARTICLE_COUNT} from '../src/wgsl/particles.js';

export async function regionalParticleChecks(device){
  const shader=device.createShaderModule({code:PARTICLE_UPDATE});
  const info=await shader.getCompilationInfo();
  if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
  const pipe=await device.createComputePipelineAsync({layout:'auto',compute:{module:shader,entryPoint:'main'}});
  const resources=[],buffer=(size,usage)=>{const b=device.createBuffer({size,usage});resources.push(b);return b;};
  const texture=(layers)=>{const t=device.createTexture({size:[4,4,layers],format:'rgba16float',usage:GPUTextureUsage.TEXTURE_BINDING});resources.push(t);return t;};
  const uniform=buffer(FRAME_FLOATS*4,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST);
  const particles=buffer(PARTICLE_COUNT*32,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC);
  const read=buffer(64*32,GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ);
  const array=texture(6).createView({dimension:'2d-array'}),weather=texture(1).createView();
  const sampler=device.createSampler({minFilter:'linear',magFilter:'linear'});
  const bg=device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[
    {binding:0,resource:{buffer:uniform}},{binding:1,resource:{buffer:particles}},
    ...[2,3,5,6].map(binding=>({binding,resource:array})),
    {binding:4,resource:sampler},{binding:7,resource:weather},{binding:8,resource:sampler}]});
  const state=createEnvironment({...DEFAULTS,frontEnabled:true,frontX:0,frontWidth:2,frontHeading:180,frontSpeed:0},30);
  const reports=[];
  try{
    // The same physical drops straddle an origin boundary. No source is active;
    // compare the production drag/position update against its analytic ODE step.
    for(const [cameraX,originX,deltaX] of [[510,0,0],[514,1024,1024]]){
      const f=new Float32Array(FRAME_FLOATS),data=new Float32Array(64*8),dt=Math.fround(1/60);
      environmentUniforms(state,{x:cameraX,z:0},f);roughnessUniforms(state,[originX,0],false,f);
      f.set([cameraX-originX,2,0,30],16);f[103]=dt;f.set([originX*.001,0,deltaX,0],124);
      f.set([128,1024],66);
      for(let k=0;k<64;k++)data.set([440+k*2,20,0,1,1,-2,.5,.02],k*8);
      device.queue.writeBuffer(uniform,0,f);device.queue.writeBuffer(particles,0,data);
      const enc=device.createCommandEncoder(),pass=enc.beginComputePass();pass.setPipeline(pipe);pass.setBindGroup(0,bg);pass.dispatchWorkgroups(1);pass.end();
      enc.copyBufferToBuffer(particles,0,read,0,data.byteLength);device.queue.submit([enc.finish()]);
      await read.mapAsync(GPUMapMode.READ);const actual=new Float32Array(read.getMappedRange()).slice();read.unmap();
      let velocityError=0,positionError=0,lifetimeError=0;
      for(let k=0;k<64;k++){
        const wind=sampleEnvironment(state,data[k*8],0).wind,drag=k%4===1?8:1.2,a=1-Math.exp(-dt*drag);
        const target=[wind[0]*.7,-9.81/drag,wind[1]*.7];
        for(let j=0;j<3;j++){
          const expected=data[k*8+4+j]+(target[j]-data[k*8+4+j])*a;
          velocityError=Math.max(velocityError,Math.abs(actual[k*8+4+j]-expected));
          positionError=Math.max(positionError,Math.abs(actual[k*8+j]-(data[k*8+j]-(j===0?deltaX:0)+expected*dt)));
        }
        lifetimeError=Math.max(lifetimeError,Math.abs(actual[k*8+3]-(1-dt)));
      }
      reports.push({cameraX,originX,velocityError,positionError,lifetimeError,
        status:velocityError<2e-5&&positionError<5e-5&&lifetimeError<1e-6?'PASS':'FAIL'});
    }
    return {status:reports.every(r=>r.status==='PASS')?'PASS':'FAIL',cases:reports,
      scope:'128 existing rain, spray and spindrift trajectories through the production compute shader, local front wind, camera travel and 1024m rebase. Flat zero source fields; not visual or emission-rate acceptance.'};
  }finally{resources.forEach(r=>r.destroy());}
}

export async function regionalFoamChecks(device){
  const n=64,B=GPUBufferUsage,T=GPUTextureUsage,resources=[];
  const buffer=(size,usage)=>{const b=device.createBuffer({size,usage});resources.push(b);return b;};
  const texture=(layers)=>{const t=device.createTexture({size:[n,n,layers],format:'rgba16float',usage:T.TEXTURE_BINDING|T.STORAGE_BINDING|T.COPY_SRC|T.COPY_DST});resources.push(t);return t;};
  const previous=texture(2),destination=texture(2),fields=texture(6);
  const uniform=buffer(FOAM_BYTES,B.UNIFORM|B.COPY_DST),read=buffer(n*n*2*8,B.COPY_DST|B.MAP_READ);
  const query=new URLSearchParams('abBreaking=phase-resident');
  const code=breakingPhaseShader(breakingEventsShader(FOAM_UPDATE,query),query).replace(/const RES: i32 = \d+;/,'const RES: i32 = 64;');
  const module=device.createShaderModule({code});
  const info=await module.getCompilationInfo();
  if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const sampler=device.createSampler({minFilter:'linear',magFilter:'linear',addressModeU:'repeat',addressModeV:'repeat'});
  const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{buffer:uniform},previous.createView(),destination.createView(),fields.createView(),fields.createView(),sampler,fields.createView()].map((resource,binding)=>({binding,resource}))});
  // Exactly representable affine residual coverage; bilinear advection has an
  // independent analytic answer. Empty wave fields isolate windage/current.
  const initial=new Uint16Array(n*n*2*4);
  for(let layer=0;layer<2;layer++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const value=.25+x/256+y/512;
    initial[((layer*n+y)*n+x)*4]=value<.5?0x3400+(value-.25)*4096:0x3800+(value-.5)*2048;
  }
  device.queue.writeTexture({texture:previous},initial,{bytesPerRow:n*8,rowsPerImage:n},[n,n,2]);
  const state=createEnvironment({...DEFAULTS,windSpeed:7,windDir:118,frontEnabled:true,frontX:0,frontZ:0,frontWidth:2,frontHeading:0,frontSpeed:0},30);
  const reports=[];let reference;
  try{
    for(const [cameraX,originX,enabled] of [[510,0,true],[514,1024,true],[514,1024,false]]){
      state.front.enabled=enabled;
      const bytes=new ArrayBuffer(FOAM_BYTES),f=new Float32Array(bytes),ii=new Int32Array(bytes),dt=Math.fround(1/24);
      for(let layer=0;layer<2;layer++){
        const spacing=layer===0?2:16,snap=Math.floor((cameraX-originX)/spacing);
        ii.set([snap,0,snap,0],layer*4);f[8+layer]=spacing;
      }
      f[10]=dt;f[12]=.83;f[13]=3;f[14]=5;f[15]=0;
      f.set(PATCHES,16);f.set(PATCHES.map(x=>1/x),24);
      const a=state.weather.windDir*Math.PI/180;
      const base=[Math.cos(a)*7*.03+.12,Math.sin(a)*7*.03-.04];
      f.set([...base,1],32);
      roughnessUniforms(state,[originX,0],false,f,48);
      regionalSeaUniforms(state,[originX,0],false,f,56);
      airWindUniforms(state,originX,0,f,68);device.queue.writeBuffer(uniform,0,bytes);
      const enc=device.createCommandEncoder(),pass=enc.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(8,8,2);pass.end();
      enc.copyTextureToBuffer({texture:destination},{buffer:read,bytesPerRow:n*8,rowsPerImage:n},[n,n,2]);device.queue.submit([enc.finish()]);
      await read.mapAsync(GPUMapMode.READ);const raw=new Uint16Array(read.getMappedRange()).slice();read.unmap();
      let error=0,rebaseError=0,localEffect=0,count=0;
      for(let y=8;y<24;y++)for(let x=8;x<24;x++){
        const layer=0,spacing=f[8],lo=ii[0]-32;
        const gx=lo+((x-lo)%64+64)%64,gz=-32+((y+32)%64+64)%64;
        const point=[originX+(gx+.5)*spacing,(gz+.5)*spacing];
        const wind=sampleEnvironment(state,...point).wind;
        const velocity=[.12+.03*wind[0],-.04+.03*wind[1]];
        const expected=.25+x/256+y/512-(velocity[0]/256+velocity[1]/512)*dt/spacing;
        const offset=((layer*n+y)*n+x)*4,actual=decodeHalf(raw[offset])+decodeHalf(raw[offset+3]);
        error=Math.max(error,Math.abs(actual-expected));
        localEffect=Math.max(localEffect,Math.hypot(velocity[0]-base[0],velocity[1]-base[1]));
        if(reference&&enabled){const other=decodeHalf(reference[offset])+decodeHalf(reference[offset+3]);rebaseError=Math.max(rebaseError,Math.abs(actual-other));}
        count++;
      }
      if(!reference)reference=raw;
      reports.push({cameraX,originX,enabled,count,error,rebaseError,localDriftChange:localEffect,status:error<2e-7&&rebaseError<2e-7&&(!enabled||localEffect>.01)?'PASS':'FAIL'});
    }
    return {status:reports.every(r=>r.status==='PASS')?'PASS':'FAIL',cases:reports,scope:'Production residual advection versus analytic affine transport; same world points at camera510/514 and origin0/1024, nonempty front and no-front controls. Not a mass-conservation or visual naturalism claim.'};
  }finally{resources.forEach(r=>r.destroy());}
}

export async function regionalWindChecks(device){
  const reports=[];
  for(const [windDir,heading,cameraX,time] of [[118,0,0,30],[359,1,512.1,120],
    [1,359,511.9,120],[0,180,1e6,864000],[180,0,-1e6,864000]]){
    const state=createEnvironment({...DEFAULTS,windDir,frontHeading:heading,frontEnabled:true,
      frontWidth:2,frontX:cameraX,frontSpeed:0},time);
    // Manufacture a far-world front after sanitization; UI front coordinates
    // are bounded and would otherwise silently make these empty-field tests.
    state.front.x=cameraX;
    const camera={x:cameraX,z:0},f=new Float32Array(FRAME_FLOATS);
    environmentUniforms(state,camera,f);roughnessUniforms(state,[0,0],false,f);
    const v=i=>'vec4f('+[...f.slice(i,i+4)].join(',')+')';
    const values=await compute(device,FRAME_WGSL+'var<private> F:Frame;'+REGIONAL_WEATHER+output+`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  F.front=${v(148)};F.frontControl=${v(152)};F.roughnessWind=${v(172)};F.airWind=${v(252)};
  let p=vec2f(f32(id.x%64u)*.04-1.28,f32(id.x/64u)*.5-16.0);
  let wind=regionalAirWind(p);result[id.x]=vec4f(wind,regionalWeight(p),0);
}`,4096);
    let error=0,inside=0;
    for(let k=0;k<4096;k++){
      const reference=sampleEnvironment(state,cameraX+(k%64*.04-1.28)*1000,(Math.floor(k/64)*.5-16)*1000);
      inside+=reference.frontWeight>.5;
      for(let c=0;c<2;c++)error=Math.max(error,Math.abs(values[k*4+c]-reference.wind[c]));
    }
    reports.push({windDir,heading,cameraX,time,inside,maxVelocityError:error,status:error<.0001&&inside>100?'PASS':'FAIL'});
  }
  return {cases:reports,status:reports.every(r=>r.status==='PASS')?'PASS':'FAIL',
    scope:'20480 native wind samples against CPU weather, front boundaries, heading wrap/opposition, 1000km coordinates and ten-day clock. Not particle visual acceptance.'};
}

async function compute(device,code,count){
  const module=device.createShaderModule({code});
  const info=await module.getCompilationInfo();
  if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
  const pipe=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const size=count*16,result=device.createBuffer({size,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});
  try{
    const bg=device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:result}}]});
    const enc=device.createCommandEncoder(),pass=enc.beginComputePass();pass.setPipeline(pipe);pass.setBindGroup(0,bg);
    pass.dispatchWorkgroups(Math.ceil(count/64));pass.end();enc.copyBufferToBuffer(result,0,read,0,size);
    device.queue.submit([enc.finish()]);await read.mapAsync(GPUMapMode.READ);
    const values=new Float32Array(read.getMappedRange()).slice();read.unmap();return values;
  }finally{result.destroy();read.destroy();}
}
const output='@group(0) @binding(0) var<storage,read_write> result:array<vec4f>;';

export async function cloudOrganizationChecks(device,mode='regional'){
  const query=new URLSearchParams({abClouds:mode});
  const condensate=['condensate','profile'].includes(mode);
  const slice=s=>s.slice(s.indexOf('fn hash3('),s.indexOf('fn cloudDensityFiltered('));
  const bounded=slice(cloudOrganizationShader(cloudWorkShader(CLOUD_VOLUME,query),query));
  const referenceQuery=new URLSearchParams(query);referenceQuery.set('abCloudWork','off');
  const reference=slice(cloudOrganizationShader(CLOUD_VOLUME,referenceQuery));
  // Remove the hash/noise prefix independently; five cells per axis include
  // all omitted neighbours without relying on the optimized support proof.
  const full=reference.slice(reference.indexOf('fn thermalShape(')).replace('thermalShape','thermalReference')
    .replace('var j=-1;j<=1','var j=-2;j<=2').replace('var i=-1;i<=1','var i=-2;i<=2');
  const values=await compute(device,FRAME_WGSL+'var<private> F:Frame;'+bounded+full+output+/* wgsl */`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  let k=id.x;let r=vec3f(hash3(vec3f(f32(k),7,13)),hash3(vec3f(31,f32(k),11)),hash3(vec3f(17,41,f32(k))));
  let angle=f32(k%31u)*.23;F.windP[0]=vec4f(cos(angle),sin(angle),0,0);
  F.cloudP.x=1.5;F.roughnessWind=vec4f(cos(angle),sin(angle),0,f32(1307u+k%17u));
  let depth=select(.3,5.0,k%2u==0u);let storm=f32(k%3u)*.5;
  let size=mix(3.6,7.0,storm);
  var world=vec3f((r.x-.5)*240.0,0,(r.z-.5)*240.0);
  if(k%4u==0u){
    let q=vec2f(floor(world.x/size)*size+select(-.0001,.0001,k%8u==0u),world.z);
    world=vec3f(.8574929257*q.x-.5144957554*q.y,0,.5144957554*q.x+.8574929257*q.y);
  }
  let altitude=1.5+(r.y*1.2-.1)*depth;
  let a=thermalShape(world,altitude,.85,storm,depth);
  let reference=thermalReference(world,altitude,.85,storm,depth);
  let b=${condensate?'vec2f(max(-.32,reference.x),reference.y)':'max(-.32,reference)'};
  F.roughnessWind.w+=1.0;let c=thermalShape(world,altitude,.85,storm,depth);
  result[k]=${condensate?'vec4f(a.x,b.x,max(abs(a.x-b.x),abs(a.y-b.y)),length(a-c))':'vec4f(a,b,abs(a-b),abs(a-c))'};
}`,65536);
  let error=0,changedSeed=0,occupied=0;
  for(let i=0;i<values.length;i+=4){error=Math.max(error,values[i+2]);changedSeed+=values[i+3]>.001;occupied+=values[i]>-.31999;}
  return {status:error<1e-6&&(mode==='profile'||changedSeed>100)?'PASS':'FAIL',samples:65536,maxSupportError:error,changedSeed,occupied,
    scope:'Native 3x3 versus unoptimized 5x5; cell boundaries, 17 seeds, rotated winds, 0.3/5 km depths and mixed storm families. Not visual acceptance.'};
}

function weight(x,z,width,length){
  const t=Math.max(0,Math.min(1,(Math.hypot(x/width,z/length)-.55)/.45));return 1-t*t*(3-2*t);
}
export async function regionalSeaChecks(device){
  const count=4096;
  const values=await compute(device,REGIONAL_SEA+output+/* wgsl */`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  let k=id.x;let q=vec2f(f32(k%128u)*24.0-1536.0,f32(k/128u)*1000.0-16000.0);
  let control=vec4f(1,0,select(12.0,60.0,k%2u==0u),64);
  let front=vec4f(0,0,500,15000);let energy=vec4f(.6,3.4,1,8);
  let a=regionalSea(q,front,control,energy);
  let dx=(regionalSea(q+vec2f(.25,0),front,control,energy).x-regionalSea(q-vec2f(.25,0),front,control,energy).x)*2.0;
  let dz=(regionalSea(q+vec2f(0,.25),front,control,energy).x-regionalSea(q-vec2f(0,.25),front,control,energy).x)*2.0;
  let shifted=regionalSea(q-vec2f(1024,0),front-vec4f(1024,0,0,0),control,energy);
  result[k]=vec4f(a.x*a.x,max(abs(a.y-dx),abs(a.z-dz)),abs(a.x-shifted.x),0);
}`,count);
  let quadratureError=0,gradientError=0,rebaseError=0,min=Infinity,max=0;
  for(let k=0;k<count;k++){
    const x=k%128*24-1536,z=Math.floor(k/128)*1000-16000,speed=k%2===0?60:12;
    let integral=0;
    for(let j=0;j<2048;j++){const t=(j+.5)*64/2048;integral+=weight(x+speed*t,z,500,15000)*Math.exp(-t/8)*(64/2048/8);}
    quadratureError=Math.max(quadratureError,Math.abs(values[k*4]-(.6+2.8*integral)));
    gradientError=Math.max(gradientError,values[k*4+1]);rebaseError=Math.max(rebaseError,values[k*4+2]);
    min=Math.min(min,values[k*4]);max=Math.max(max,values[k*4]);
  }
  return {status:quadratureError<.06&&gradientError<3e-6&&rebaseError<1e-6&&min>=.59999&&max<=3.40001?'PASS':'FAIL',samples:count,
    quadratureError,gradientError,rebaseError,minEnergy:min,maxEnergy:max,
    scope:'Worst minimum-width/maximum-speed front; independent dense time integral, derivative finite differences and origin shift. Energy-ratio error bound .06; no directional spectrum or weather-edit history claim.'};
}

export async function bubbleColumnChecks(device){
  const values=await compute(device,BUBBLE_TRANSPORT+output+/* wgsl */`
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  let k=id.x;let hz=select(select(24u,60u,k%3u==1u),120u,k%3u==2u);
  let gas=select(.002,.00002,k>=32u)*BUBBLE_STORAGE;
  var column=vec4f(quantizeToF16(gas),quantizeToF16(gas*.8),gas*.8-quantizeToF16(gas*.8),gas-quantizeToF16(gas));
  let paused=advanceBubbleColumn(column,1,0);let empty=advanceBubbleColumn(vec4f(0),0,1.0/f32(hz));
  for(var i=0u;i<2u*hz;i++){column=quantizeToF16(advanceBubbleColumn(column,0,1.0/f32(hz)));}
  result[k]=vec4f((column.r+column.a)/BUBBLE_STORAGE,(column.g+column.b)/max(column.r+column.a,1e-8),
    length(paused-vec4f(quantizeToF16(gas),quantizeToF16(gas*.8),gas*.8-quantizeToF16(gas*.8),gas-quantizeToF16(gas))),length(empty));
}`,64);
  let worstGas=0,worstDepth=0,paused=0,empty=0;
  for(let k=0;k<64;k++){
    const gas=k>=32?.00002:.002,depth=.8-.18*2;
    // Continuous solution while d>.1: g(t)=g0 exp(-.12t) d(t)/d0.
    const reference=gas*Math.exp(-.12*2)*depth/.8;
    worstGas=Math.max(worstGas,Math.abs(values[k*4]-reference)/gas);
    worstDepth=Math.max(worstDepth,Math.abs(values[k*4+1]-depth));paused=Math.max(paused,values[k*4+2]);empty=Math.max(empty,values[k*4+3]);
  }
  return {status:worstGas<.015&&worstDepth<.04&&paused===0&&empty===0?'PASS':'FAIL',worstGasRelativeToInitial:worstGas,worstDepthMetres:worstDepth,pausedError:paused,emptyError:empty,
    scope:'Production gas/depth transport at 24/60/120 Hz including binary16 storage, buoyancy/dissolution, pause and empty state. Clipmap advection/reset tested separately by rendered/native controls.'};
}

export async function runAB11Checks(){
  const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
  const device=await adapter.requestDevice();
  try{return {adapter:{vendor:adapter.info.vendor,architecture:adapter.info.architecture},clouds:await cloudOrganizationChecks(device),regional:await regionalSeaChecks(device),bubbles:await bubbleColumnChecks(device)};}
  finally{device.destroy();}
}

export async function bubbleClipmapChecks(device){
  const B=GPUBufferUsage,T=GPUTextureUsage,n=64,resources=[];
  const buffer=(size,usage)=>{const b=device.createBuffer({size,usage});resources.push(b);return b;};
  const texture=(layers)=>{const t=device.createTexture({size:[n,n,layers],format:'rgba16float',usage:T.TEXTURE_BINDING|T.STORAGE_BINDING|T.COPY_DST|T.COPY_SRC});resources.push(t);return t;};
  const fields=texture(6),history=[texture(4),texture(4)],ubo=buffer(FOAM_BYTES,B.UNIFORM|B.COPY_DST),read=buffer(n*n*4*8,B.MAP_READ|B.COPY_DST);
  const query=new URLSearchParams('abBubbles=plumes&abBreaking=phase-resident');
  const code=bubblePlumeShader(breakingPhaseShader(breakingEventsShader(FOAM_UPDATE,query),query),query).replace(/const RES: i32 = \d+;/,'const RES: i32 = 64;');
  const module=device.createShaderModule({code});
  const info=await module.getCompilationInfo();
  if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
  const pipe=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const sampler=device.createSampler({magFilter:'linear',minFilter:'linear',addressModeU:'repeat',addressModeV:'repeat'});
  const groups=history.map((t,i)=>device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:
    [{buffer:ubo},history[1-i].createView(),t.createView(),fields.createView(),fields.createView(),sampler,fields.createView()].map((resource,binding)=>({binding,resource}))}));
  // Exact half values: gas=2/1024 m, depth=.75 m. Residual channels start zero.
  const initial=new Uint16Array(n*n*4*4);
  for(let layer=2;layer<4;layer++)for(let y=20;y<44;y++)for(let x=16;x<28;x++){
    const k=((layer*n+y)*n+x)*4;initial[k]=0x4000;initial[k+1]=0x3e00;
  }
  const reports=[];
  try{
    for(const name of ['paused','advected','reset','empty']){
      const data=name==='empty'?new Uint16Array(initial.length):initial;
      for(const t of history)device.queue.writeTexture({texture:t},data,{bytesPerRow:n*8,rowsPerImage:n},[n,n,4]);
      const bytes=new ArrayBuffer(FOAM_BYTES),ii=new Int32Array(bytes),ff=new Float32Array(bytes);
      ii.set([32,32,32,32,32,32,32,32]);
      if(name==='reset')ii.set([32,32,-10000,-10000,32,32,-10000,-10000]);
      ff.set([1,1,name==='paused'?0:1/60,.22],8);ff.set([.83,3,5,0],12);
      ff.set(PATCHES,16);ff.set(PATCHES.map(x=>1/x),24);ff[32]=name==='advected'?60:0;
      device.queue.writeBuffer(ubo,0,bytes);
      const enc=device.createCommandEncoder(),pass=enc.beginComputePass();pass.setPipeline(pipe);let current=0;
      for(let i=0;i<8;i++){current=1-current;pass.setBindGroup(0,groups[current]);pass.dispatchWorkgroups(8,8,2);}pass.end();
      enc.copyTextureToBuffer({texture:history[current]},{buffer:read,bytesPerRow:n*8,rowsPerImage:n},[n,n,4]);device.queue.submit([enc.finish()]);await read.mapAsync(GPUMapMode.READ);
      const actual=new Uint16Array(read.getMappedRange());let mass=0,moment=0,surface=0,difference=0;
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const k=((2*n+y)*n+x)*4,g=(decodeHalf(actual[k])+decodeHalf(actual[k+3]))/1024;
        mass+=g;moment+=g*x;surface+=Math.abs(decodeHalf(actual[(y*n+x)*4]));
      }
      if(name==='paused')for(let i=0;i<actual.length;i++)difference+=actual[i]!==initial[i];
      read.unmap();
      const t=8/60,expectedMass=12*24*2/1024*Math.exp(-.12*t)*(.75-.18*t)/.75;
      const valid=name==='advected'?Math.abs(moment/mass-29.5)<.002&&Math.abs(mass/expectedMass-1)<.002:
        name==='paused'?difference===0:mass===0;
      reports.push({case:name,status:valid&&surface===0?'PASS':'FAIL',mass,centroidX:mass?moment/mass:null,surface,difference});
    }
    return reports;
  }finally{resources.forEach(r=>r.destroy());}
}
