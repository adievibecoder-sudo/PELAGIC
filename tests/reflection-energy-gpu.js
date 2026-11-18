import {OCEAN} from '../src/wgsl/ocean.js';
import {reflectionTransportShader} from '../src/wgsl/reflection-transport.js';

// Exercise the production quadrature/composition in a unit-radiance furnace.
// This checks its budget, not the cavity approximation's physical accuracy.
export async function reflectionEnergyChecks(device){
  const candidate=reflectionTransportShader(OCEAN,new URLSearchParams('abReflection=energy'));
  const helpers=OCEAN.slice(OCEAN.indexOf('fn fresnelWater('),OCEAN.indexOf('fn positiveCovariance('));
  const furnace=(source,name)=>{
    let block=source.slice(source.indexOf('  let ch0='),source.indexOf('  // ---- water body:'));
    block=block.replace('reflectedEnvironment(vec3f(displacedXZ.x,in.height,displacedXZ.y),rf,envLod,body)','vec3f(1)')
      .replace('textureSampleLevel(envCube,sampC,reflect(-V,ng),envLod).rgb','vec3f(1)');
    const composition=source.match(/  var col = ([^;]+);/)[1];
    return `fn ${name}(V:vec3f,cov:vec3f)->vec2f {
      let nrm=vec3f(0,1,0);let tangent=vec3f(1,0,0);let bitangent=vec3f(0,0,1);
      let rasterNormal=nrm;let Vl=V;let body=vec3f(1);let spec=vec3f(0);
      ${block}
      return vec2f((${composition}).x,Fr);
    }`;
  };
  const count=1024,B=GPUBufferUsage;
  const module=device.createShaderModule({code:helpers+furnace(OCEAN,'legacy')+furnace(candidate,'corrected')+/* wgsl */`
@group(0) @binding(0) var<storage,read_write> result:array<vec4f>;
@compute @workgroup_size(64) fn probe(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;let mu=.02+.98*f32(i%32u)/31.0;
  let angle=f32((i/32u)%8u)*.785398163;
  let V=vec3f(sqrt(1.0-mu*mu)*cos(angle),mu,sqrt(1.0-mu*mu)*sin(angle));
  let variance=array<f32,4>(1e-12,.0025,.025,.1)[i/256u];
  let cov=vec3f(variance,variance*.6,variance*.25);
  let a=legacy(V,cov);let b=corrected(V,cov);
  result[i]=vec4f(a.x,b.x,a.y,b.y);
}`});
  const info=await module.getCompilationInfo(),errors=info.messages.filter(m=>m.type==='error');
  if(errors.length)throw Error(errors.map(x=>x.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'probe'}});
  const result=device.createBuffer({size:count*16,usage:B.STORAGE|B.COPY_SRC});
  const read=device.createBuffer({size:result.size,usage:B.COPY_DST|B.MAP_READ});
  try{
    const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:result}}]});
    const enc=device.createCommandEncoder(),pass=enc.beginComputePass();
    pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(count/64);pass.end();
    enc.copyBufferToBuffer(result,0,read,0,read.size);device.queue.submit([enc.finish()]);
    await read.mapAsync(GPUMapMode.READ);const values=new Float32Array(read.getMappedRange());
    let legacyMaxLoss=0,furnaceError=0,smoothDifference=0,fresnelDifference=0,invalid=0;
    for(let i=0;i<count;i++){
      const [a,b,fa,fb]=values.subarray(i*4,i*4+4);
      legacyMaxLoss=Math.max(legacyMaxLoss,1-a);furnaceError=Math.max(furnaceError,Math.abs(1-b));
      if(i<256)smoothDifference=Math.max(smoothDifference,Math.abs(a-b));
      fresnelDifference=Math.max(fresnelDifference,Math.abs(fa-fb));
      invalid+=Number(![a,b,fa,fb].every(Number.isFinite)||a<0||a>1.000001||b<0||b>1.000001);
    }
    return {status:legacyMaxLoss>.01&&furnaceError<1e-6&&smoothDifference<1e-6&&fresnelDifference===0&&!invalid?'PASS':'FAIL',
      samples:count,legacyMaxLoss,furnaceError,smoothDifference,fresnelDifference,invalid,
      scope:'Extracted production reflection quadrature and final composition, constant unit environment/body, zero direct light. Smooth-limit and unchanged Fresnel controls. Does not validate secondary-bounce partition, refractive radiance units, or visual success.'};
  }finally{read.unmap();read.destroy();result.destroy();}
}
