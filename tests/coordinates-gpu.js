import {WAVE_COORDINATES} from '../src/wgsl/coordinates.js';
import {cascadeOrigin,modulo} from '../src/spatial-origin.js';
import {PATCHES} from '../src/numerics.js';

export async function verifyCoordinates(device) {
  const B=GPUBufferUsage,count=3072;
  const input=device.createBuffer({size:count*16,usage:B.STORAGE|B.COPY_DST});
  const output=device.createBuffer({size:count*16,usage:B.STORAGE|B.COPY_SRC});
  const read=device.createBuffer({size:count*16,usage:B.MAP_READ|B.COPY_DST});
  const uniform=device.createBuffer({size:48,usage:B.UNIFORM|B.COPY_DST});
  const code=WAVE_COORDINATES+`
  struct Origins {value:array<vec4f,3>};
  @group(0) @binding(0) var<storage,read> points:array<vec4f>;
  @group(0) @binding(1) var<storage,read_write> result:array<vec4f>;
  @group(0) @binding(2) var<uniform> origins:Origins;
  @compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
    let p=points[id.x];let uv=cascadeUV(p.xy,id.x%6u,p.z,origins.value);
    result[id.x]=vec4f(fract(uv),sin(fract(uv)*6.28318530718));
  }`;
  const module=device.createShaderModule({code}),info=await module.getCompilationInfo();
  if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[input,output,uniform].map((buffer,binding)=>({binding,resource:{buffer}}))});
  const cases=[];
  for(const origin of [[0,0],[1024,-1024],[100352,-100352],[1000000512,-1000000512]]) {
    const points=new Float32Array(count*4),expected=[];
    for(let i=0;i<count;i++) {
      const x=(i/count-.5)*1024,z=Math.sin(i*.73)*511.9,L=Math.fround(PATCHES[i%6]);
      points.set([x,z,1/L,0],i*4);
      expected.push([modulo(origin[0]+x,L)/L,modulo(origin[1]+z,L)/L]);
    }
    device.queue.writeBuffer(input,0,points);device.queue.writeBuffer(uniform,0,cascadeOrigin(origin));
    const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();
    pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(count/64);pass.end();
    encoder.copyBufferToBuffer(output,0,read,0,read.size);device.queue.submit([encoder.finish()]);
    await read.mapAsync(GPUMapMode.READ);const actual=new Float32Array(read.getMappedRange());
    let maxPositionError=0,maxSineError=0,invalid=0;
    for(let i=0;i<count;i++)for(let axis=0;axis<2;axis++) {
      const value=actual[i*4+axis],target=expected[i][axis];
      maxPositionError=Math.max(maxPositionError,Math.abs(modulo(value-target+.5,1)-.5)*Math.fround(PATCHES[i%6]));
      maxSineError=Math.max(maxSineError,Math.abs(actual[i*4+2+axis]-Math.sin(target*2*Math.PI)));
      if(!Number.isFinite(value))invalid++;
    }
    read.unmap();cases.push({origin,samples:count,maxPositionError,maxSineError,invalid,status:maxPositionError<.00012&&maxSineError<.0025&&!invalid?'PASS':'FAIL'});
  }
  [input,output,read,uniform].forEach(x=>x.destroy());
  return {status:cases.every(x=>x.status==='PASS')?'PASS':'FAIL',cases,
    tolerance:'0.12 mm phase-equivalent position error and 0.0025 unit-sinusoid amplitude error. Bounds cover f32 local-coordinate rounding, inverse length and UV multiply/add across 512 m; CPU reference uses double global modulo.',
    scope:'Production UV helper on native GPU, six cascade periods, global origins through 1e9 m. Does not validate remote atmosphere precision or all material motion across rebases.'};
}
