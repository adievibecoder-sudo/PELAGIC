import {WATER_LAYER} from '../src/wgsl/water-material.js';

// Independent thin-sheet adding reference, converged by halving sheet depth.
function adding(absorption,scatter,depth,steps=20){
  const dz=depth/2**steps;
  let r=scatter*dz,t=1-(absorption+scatter)*dz;
  for(let i=0;i<steps;i++){
    const den=1-r*r;
    const next=r+t*t*r/den;
    t=t*t/den;r=next;
  }
  return [r,t];
}

export async function verifyWaterLayer(device){
  const cases=[];
  for(const a of [0,.01,.08,.35])for(const s of [0,.03,.3,1])for(const d of [0,.5,3])cases.push([a,s,d,0]);
  const input=device.createBuffer({size:cases.length*16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});
  const output=device.createBuffer({size:cases.length*16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size:cases.length*16,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  device.queue.writeBuffer(input,0,new Float32Array(cases.flat()));
  const code=`const PI:f32=3.141592653589793;
${WATER_LAYER}
@group(0) @binding(0) var<storage,read> inputs:array<vec4f>;
@group(0) @binding(1) var<storage,read_write> outputs:array<vec4f>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  if(id.x>=arrayLength(&inputs)){return;}
  let p=inputs[id.x];let v=waterFiniteLayer(vec3f(p.x),vec3f(p.y),p.z);
  outputs[id.x]=vec4f(v.reflection.x,v.transmission.x,waterLayerReflectance(vec3f(p.x),vec3f(p.y),0.0,p.z).x,0);
}`;
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module:device.createShaderModule({code}),entryPoint:'main'}});
  const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:input}},{binding:1,resource:{buffer:output}}]});
  const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();
  pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(Math.ceil(cases.length/64));pass.end();
  encoder.copyBufferToBuffer(output,0,read,0,cases.length*16);device.queue.submit([encoder.finish()]);
  await read.mapAsync(GPUMapMode.READ);
  const values=new Float32Array(read.getMappedRange()).slice();
  read.unmap();input.destroy();output.destroy();read.destroy();
  let maxError=0,maxReferenceChange=0,maxEnergyExcess=0,maxHomogeneousChange=0;
  const failures=[];
  cases.forEach(([a,s,d],i)=>{
    const ref=adding(a,s,d),coarse=adding(a,s,d,19),r=values[i*4],t=values[i*4+1];
    const error=Math.max(Math.abs(r-ref[0]),Math.abs(t-ref[1]));
    const convergence=Math.max(Math.abs(ref[0]-coarse[0]),Math.abs(ref[1]-coarse[1]));
    const deep=adding(a,s,256)[0];
    // A conservative infinite substrate returns all incident energy; vacuum
    // has no diffuse reflection. Absorbing cases use the thick-sheet limit.
    const expected=a===0?(s>0?1:0):deep;
    const homogeneous=Math.abs(values[i*4+2]-expected);
    maxError=Math.max(maxError,error);maxReferenceChange=Math.max(maxReferenceChange,convergence);
    maxEnergyExcess=Math.max(maxEnergyExcess,r+t-1);maxHomogeneousChange=Math.max(maxHomogeneousChange,homogeneous);
    if(![r,t].every(Number.isFinite)||Math.min(r,t)<-1e-6||r+t>1.000002||error>3e-5||convergence>1e-5||homogeneous>5e-5)failures.push({a,s,d,r,t,error,convergence,homogeneous});
  });
  return {status:failures.length?'FAIL':'PASS',cases:cases.length,maxError,maxReferenceChange,maxEnergyExcess,maxHomogeneousChange,failures};
}
