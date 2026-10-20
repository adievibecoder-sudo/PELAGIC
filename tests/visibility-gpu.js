import {WAVE_SHADOW_CORE,WAVE_HEIGHT_MAX,WAVE_HEIGHT_MIPS} from '../src/wgsl/wave-visibility.js';

export async function verifyWaveVisibility(device){
 const T=GPUTextureUsage,B=GPUBufferUsage,count=512;
 const heights=device.createTexture({size:[256,256,2],format:'rgba16float',mipLevelCount:WAVE_HEIGHT_MIPS,usage:T.TEXTURE_BINDING|T.STORAGE_BINDING|T.COPY_DST});
 const result=device.createBuffer({size:count*16,usage:B.STORAGE|B.COPY_SRC});
 const read=device.createBuffer({size:count*16,usage:B.MAP_READ|B.COPY_DST});
 const uniform=device.createBuffer({size:16,usage:B.UNIFORM|B.COPY_DST});
 const fp=new Float32Array(1),bits=new Uint32Array(fp.buffer);
 const half=v=>{fp[0]=v;const u=bits[0],e=((u>>>23)&255)-112;return e<=0?0:((u>>>16)&32768)|(e<<10)|((u>>>13)&1023);};
 const code=WAVE_SHADOW_CORE+`
 @group(0) @binding(0) var heights:texture_2d_array<f32>;
 @group(0) @binding(1) var linearClamp:sampler;
 @group(0) @binding(2) var<storage,read_write> output:array<vec4f>;
 @group(0) @binding(3) var<uniform> parameters:vec4f;
 @group(0) @binding(4) var unpruned:texture_2d_array<f32>;
 @compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
   let x=-48.0+(f32(id.x)+0.5)*96.0/512.0;
   let h=parameters.x*cos(x*0.196349540849);
   let L=normalize(vec3f(1,parameters.y,0));
   let point=vec3f(x,h,0);
   let hit=gravityReflectionHit(heights,linearClamp,point,vec2f(0),L,0u);
   let reference=gravityReflectionHit(unpruned,linearClamp,point,vec2f(0),L,0u);
   let difference=abs(hit-reference);
   output[id.x]=vec4f(gravityVisibility(heights,linearClamp,point,vec2f(0),L,0u),hit.w,max(max(difference.x,difference.y),max(difference.z,difference.w)),1);
 }`;
 const module=device.createShaderModule({code}),compilation=await module.getCompilationInfo();
 const errors=compilation.messages.filter(m=>m.type==='error').map(m=>m.message);
 if(errors.length)return {status:'FAIL',errors};
 const pipe=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
 const bg=device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[
  {binding:0,resource:heights.createView()},
  {binding:1,resource:device.createSampler({magFilter:'linear',minFilter:'linear'})},
  {binding:2,resource:{buffer:result}},{binding:3,resource:{buffer:uniform}},
  {binding:4,resource:heights.createView({baseMipLevel:0,mipLevelCount:1})}]});
 const maxModule=device.createShaderModule({code:WAVE_HEIGHT_MAX});
 const maxPipe=await device.createComputePipelineAsync({layout:'auto',compute:{module:maxModule,entryPoint:'main'}});
 const maxGroups=Array.from({length:WAVE_HEIGHT_MIPS-1},(_,m)=>device.createBindGroup({layout:maxPipe.getBindGroupLayout(0),entries:[
   {binding:0,resource:heights.createView({baseMipLevel:m,mipLevelCount:1})},
   {binding:1,resource:heights.createView({baseMipLevel:m+1,mipLevelCount:1})}]}));
 const cases=[];
 for(const [name,amplitude,tangent] of [['flat-grazing',0,0.08],['sine-grazing',2,0.12],['sine-high-sun',2,1.73],['flat-downward',0,-0.08],['sine-downward',2,-0.12]]){
  const data=new Uint16Array(256*256*2*4);
  for(let l=0;l<2;l++)for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const world=((x+.5)/256-.5)*(l?1024:128);
    data[((l*256+y)*256+x)*4]=half(amplitude*Math.cos(world*Math.PI/16));
  }
  device.queue.writeTexture({texture:heights},data,{bytesPerRow:2048,rowsPerImage:256},[256,256,2]);
  device.queue.writeBuffer(uniform,0,new Float32Array([amplitude,tangent,0,0]));
  const e=device.createCommandEncoder(),pass=e.beginComputePass();
  pass.setPipeline(maxPipe);
  for(let m=1;m<WAVE_HEIGHT_MIPS;m++){pass.setBindGroup(0,maxGroups[m-1]);pass.dispatchWorkgroups(Math.ceil((256>>m)/8),Math.ceil((256>>m)/8),2);}
  pass.setPipeline(pipe);pass.setBindGroup(0,bg);pass.dispatchWorkgroups(count/64);pass.end();e.copyBufferToBuffer(result,0,read,0,read.size);device.queue.submit([e.finish()]);
  await read.mapAsync(GPUMapMode.READ);const values=new Float32Array(read.getMappedRange());
  let clear=0,shadowed=0,incorrect=0,reflectionIncorrect=0,invalid=0,transition=0,min=1,max=0,maxPruningDifference=0;
  for(let i=0;i<count;i++){
   const x=-48+(i+.5)*96/count,h=amplitude*Math.cos(x*Math.PI/16),v=values[i*4],hit=values[i*4+1];min=Math.min(min,v);max=Math.max(max,v);
   maxPruningDifference=Math.max(maxPruningDifference,values[i*4+2]);
   let obstruction=-Infinity;
   for(let d=.75;d<=64;d+=.0625)obstruction=Math.max(obstruction,amplitude*Math.cos((x+d)*Math.PI/16)-h-d*tangent);
   if(!Number.isFinite(v)||v<0||v>1||!Number.isFinite(hit)||hit<0||hit>1)invalid++;
   // Exclude the finite-disc penumbra and the bounded atlas interpolation error.
   if(obstruction>.3){shadowed++;if(v>.2)incorrect++;if(hit<.8)reflectionIncorrect++;}
   else if(obstruction<-.15||amplitude===0){clear++;if(v<.8)incorrect++;if(hit>.2)reflectionIncorrect++;}
   else transition++;
  }
  read.unmap();cases.push({name,amplitude,wavelength:32,tangent,samples:count,clear,shadowed,transition,incorrect,reflectionIncorrect,invalid,min,max,maxPruningDifference,status:incorrect===0&&reflectionIncorrect===0&&invalid===0&&maxPruningDifference===0?'PASS':'FAIL'});
 }
 [heights,result,read,uniform].forEach(r=>r.destroy());
 return {status:cases.every(c=>c.status==='PASS')?'PASS':'FAIL',cases,
  reference:'Dense CPU analytic sinusoid intersection at 0.0625 m intervals. Not a duplicate of the logarithmic GPU ray traversal.',
  tolerance:'Classification only outside 0.15/0.30 m transition margins. Margins cover finite solar radius, 0.065 m near bias and far atlas interpolation error (~0.15 m for this wavelength).',
  limitations:'Manufactured one-dimensional waves. Production inversion at folds and two-dimensional storm silhouettes remain separate visual/numerical gates.'};
}
