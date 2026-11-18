import {WAVE_SHADOW_CORE} from '../src/wgsl/wave-visibility.js';
import {reflectionIntersectionShader} from '../src/wgsl/reflection-transport.js';
import {decodeHalf} from '../src/numerics.js';

export async function reflectionIntersectionChecks(device){
  const count=256,T=GPUTextureUsage,B=GPUBufferUsage;
  const heights=device.createTexture({size:[256,256,2],format:'rgba16float',usage:T.TEXTURE_BINDING|T.COPY_DST});
  const result=device.createBuffer({size:count*32,usage:B.STORAGE|B.COPY_SRC});
  const read=device.createBuffer({size:result.size,usage:B.COPY_DST|B.MAP_READ});
  const uniform=device.createBuffer({size:16,usage:B.UNIFORM|B.COPY_DST});
  const old=WAVE_SHADOW_CORE.slice(WAVE_SHADOW_CORE.indexOf('fn gravityReflectionHit(')).replace('fn gravityReflectionHit(','fn legacyHit(');
  const code=reflectionIntersectionShader(WAVE_SHADOW_CORE)+old+/* wgsl */`
@group(0) @binding(0) var heights:texture_2d_array<f32>;
@group(0) @binding(1) var samp:sampler;
@group(0) @binding(2) var<storage,read_write> result:array<vec4f>;
@group(0) @binding(3) var<uniform> settings:vec4f;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  let x=-40.0+2.5*f32(id.x%32u);let z=(f32(id.x/32u)-3.5)*4.0;
  let angle=f32(id.x%4u)*1.57079632679+.31;
  let ray=normalize(vec3f(cos(angle),settings.x,sin(angle)));
  let point=vec3f(x,atlasHeight(heights,samp,vec2f(x,z),vec2f(0),0u).x,z);
  result[id.x*2u]=legacyHit(heights,samp,point,vec2f(0),ray,0u);
  result[id.x*2u+1u]=gravityReflectionHit(heights,samp,point,vec2f(0),ray,0u);
}`;
  const module=device.createShaderModule({code}),info=await module.getCompilationInfo();
  const errors=info.messages.filter(x=>x.type==='error').map(x=>x.message);
  if(errors.length)throw Error(errors.join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[
    {binding:0,resource:heights.createView()},{binding:1,resource:device.createSampler({minFilter:'linear',magFilter:'linear'})},
    {binding:2,resource:{buffer:result}},{binding:3,resource:{buffer:uniform}}]});
  const fp=new Float32Array(1),bits=new Uint32Array(fp.buffer);
  const half=v=>{fp[0]=v;const u=bits[0],e=((u>>>23)&255)-112;return e<=0?0:((u>>>16)&32768)|(e<<10)|((u>>>13)&1023);};
  const cases=[];
  try{
    for(const [name,amplitude,crossing,tangent] of [['flat-up',0,0,.12],['flat-down',0,0,-.08],['swell-grazing',2,0,.06],['crossing-down',2,.8,-.3]]){
      const data=new Uint16Array(256*256*2*4),field=new Float32Array(256*256*2);
      for(let l=0;l<2;l++)for(let z=0;z<256;z++)for(let x=0;x<256;x++){
        const span=l?1024:128,wx=((x+.5)/256-.5)*span,wz=((z+.5)/256-.5)*span;
        const i=(l*256+z)*256+x,v=half(amplitude*Math.cos(wx*Math.PI/16)+crossing*Math.sin(wz*Math.PI/20));
        data[i*4]=v;field[i]=decodeHalf(v);
      }
      const height=(x,z)=>{
        const l=Math.abs(x)>62.72||Math.abs(z)>62.72?1:0,span=l?1024:128;
        const u=x/span+.5,v=z/span+.5;
        if(u<.005||u>.995||v<.005||v>.995)return null;
        const qx=u*256-.5,qz=v*256-.5,ix=Math.floor(qx),iz=Math.floor(qz),a=qx-ix,b=qz-iz;
        const at=(dx,dz)=>field[(l*256+iz+dz)*256+ix+dx];
        return ((1-a)*at(0,0)+a*at(1,0))*(1-b)+((1-a)*at(0,1)+a*at(1,1))*b;
      };
      device.queue.writeTexture({texture:heights},data,{bytesPerRow:2048,rowsPerImage:256},[256,256,2]);
      device.queue.writeBuffer(uniform,0,new Float32Array([tangent,0,0,0]));
      const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();
      pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(count/64);pass.end();
      encoder.copyBufferToBuffer(result,0,read,0,read.size);device.queue.submit([encoder.finish()]);
      await read.mapAsync(GPUMapMode.READ);const values=new Float32Array(read.getMappedRange().slice(0));read.unmap();
      let hits=0,missed=0,falseHits=0,coverageDifference=0,invalid=0,legacyMaxError=0,refinedMaxError=0,maxHeightResidual=0;
      for(let i=0;i<count;i++){
        const x=-40+2.5*(i%32),z=(Math.floor(i/32)-3.5)*4,angle=i%4*Math.PI/2+.31,dx=Math.cos(angle),dz=Math.sin(angle);
        const origin=height(x,z)+.065;
        const difference=d=>{const h=height(x+dx*d,z+dz*d);return h===null?null:h-origin-d*tangent;};
        let root=null;
        for(let d=.03125;d<400;d+=.03125){
          const f=difference(d);if(f===null)break;
          if(f>=0){let lo=d-.03125,hi=d;for(let k=0;k<24;k++){const m=(lo+hi)*.5;if(difference(m)>=0)hi=m;else lo=m;}root=(lo+hi)*.5;break;}
        }
        const legacy=values.subarray(i*8,i*8+4),refined=values.subarray(i*8+4,i*8+8);
        coverageDifference=Math.max(coverageDifference,Math.abs(legacy[3]-refined[3]));
        if([...refined].some(x=>!Number.isFinite(x)))invalid++;
        if(refined[3]>=.5&&root!==null){
          hits++;legacyMaxError=Math.max(legacyMaxError,Math.abs(legacy[2]-root));refinedMaxError=Math.max(refinedMaxError,Math.abs(refined[2]-root));
          maxHeightResidual=Math.max(maxHeightResidual,Math.abs(difference(refined[2])));
        }else if(root!==null)missed++;
        else if(refined[3]>=.5)falseHits++;
        if(name==='flat-up'&&refined[3]!==0)invalid++;
      }
      cases.push({name,hits,missed,falseHits,coverageDifference,invalid,legacyMaxError,refinedMaxError,maxHeightResidual,
        status:!invalid&&!missed&&!falseHits&&coverageDifference===0&&refinedMaxError<.12&&maxHeightResidual<.035?'PASS':'FAIL'});
    }
  }finally{[heights,result,read,uniform].forEach(x=>x.destroy());}
  return {status:cases.every(c=>c.status==='PASS')?'PASS':'FAIL',samples:count*cases.length,cases,
    reference:'Independent 0.03125m CPU first-crossing scan with bisection against bilinear decoded binary16 height fields.',
    scope:'First-hit location and unchanged coverage on flat, swell and crossing controls. Does not certify inverted FFT atlases, silhouette completeness or visual quality.'};
}
