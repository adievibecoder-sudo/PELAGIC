import {WIND_ROUGHNESS} from '../src/wgsl/wind-roughness.js';
import {GLINT_STATISTICS} from '../src/wgsl/finite-glints.js';
import {CLOUD_COLLISION} from '../src/wgsl/cloud-transport.js';
import {EMISSION_HAZARD} from '../src/wgsl/breaking-events.js';

export async function verifyAppearance(device){
  const count=65536,B=GPUBufferUsage,results=[];
  const code=WIND_ROUGHNESS+GLINT_STATISTICS+CLOUD_COLLISION+EMISSION_HAZARD+/* wgsl */`
  @group(0) @binding(0) var<storage,read_write> output:array<vec4f>;
  @compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
    let i=id.x;let rank=(f32(i)+0.5)/65536.0;
    let means=array<f32,8>(0.01,0.1,0.5,1.0,4.0,8.0,12.0,16.0);
    for(var c=0u;c<8u;c++){output[c*65536u+i]=vec4f(finiteGlintWeight(means[c],rank),0,0,0);}
    let q=vec2f(f32(i%256u)*96.0+17.1,f32(i/256u)*32.0+3.7);
    let w=vec4f(1,0,0.85,1307);let offset=vec4f(0);
    let a=windRoughness(q,w,offset);
    let dx=(windRoughness(q+vec2f(0.125,0),w,offset).x-windRoughness(q-vec2f(0.125,0),w,offset).x)/0.25;
    let dy=(windRoughness(q+vec2f(0,0.125),w,offset).x-windRoughness(q-vec2f(0,0.125),w,offset).x)/0.25;
    output[8u*65536u+i]=vec4f(a.x*a.x,abs(a.y-dx),abs(a.z-dy),windRoughness(q,vec4f(1,0,0,1307),offset).x);
    if(i<8u){
      let tau=array<f32,8>(0,0.001,0.049,0.051,0.5,2,10,100);
      output[9u*65536u+i]=vec4f(collisionFraction(tau[i]),0,0,0);
    }
    if(i<3u){
      let rates=array<f32,3>(20,30,60);
      let p=emissionProbability(0.01,1.0/rates[i]);
      output[9u*65536u+8u+i]=vec4f(pow(1.0-p,rates[i]),0,0,0);
    }
  }`;
  const module=device.createShaderModule({code});
  const info=await module.getCompilationInfo();
  if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
  const output=device.createBuffer({size:count*10*16,usage:B.STORAGE|B.COPY_SRC});
  const read=device.createBuffer({size:output.size,usage:B.MAP_READ|B.COPY_DST});
  const pipe=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const group=device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:output}}]});
  const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();
  pass.setPipeline(pipe);pass.setBindGroup(0,group);pass.dispatchWorkgroups(count/64);pass.end();
  encoder.copyBufferToBuffer(output,0,read,0,read.size);device.queue.submit([encoder.finish()]);
  await read.mapAsync(GPUMapMode.READ);const values=new Float32Array(read.getMappedRange());
  for(const [c,mean] of [0.01,0.1,0.5,1,4,8,12,16].entries()){
    let sum=0,invalid=0;
    for(let i=0;i<count;i++){const v=values[(c*count+i)*4];sum+=v;if(!Number.isFinite(v)||v<0)invalid++;}
    const average=sum/count,tolerance=4/(count*mean)+.00001;
    results.push({name:'Poisson mean '+mean,average,tolerance,invalid,status:!invalid&&Math.abs(average-1)<tolerance?'PASS':'FAIL'});
  }
  let energy=0,gradientError=0,identityError=0,invalid=0;
  for(let i=0;i<count;i++){
    const p=(8*count+i)*4;energy+=values[p];gradientError=Math.max(gradientError,values[p+1],values[p+2]);identityError=Math.max(identityError,Math.abs(values[p+3]-1));
    for(let j=0;j<4;j++)if(!Number.isFinite(values[p+j]))invalid++;
  }
  energy/=count;
  results.push({name:'Wind field energy and analytic gradient',energy,gradientError,identityError,invalid,
    status:Math.abs(energy-1)<.01&&gradientError<.0002&&identityError===0&&!invalid?'PASS':'FAIL'});
  let collisionError=0;
  for(const [i,tau] of [0,.001,.049,.051,.5,2,10,100].entries()){
    // Independent numerical integration of the conditional free-path density.
    let mass=0,moment=0;
    for(let j=0;j<20000;j++){const x=(j+.5)/20000,w=Math.exp(-tau*x);mass+=w;moment+=x*w;}
    collisionError=Math.max(collisionError,Math.abs(values[(9*count+i)*4]-moment/mass));
  }
  results.push({name:'Beer-weighted collision location',maxAbsoluteError:collisionError,status:collisionError<.00002?'PASS':'FAIL'});
  const survival=[0,1,2].map(i=>values[(9*count+8+i)*4]),expectedSurvival=.99**60;
  results.push({name:'Emission survival at 20/30/60 Hz',survival,expectedSurvival,
    status:survival.every(x=>Math.abs(x-expectedSurvival)<.00001)?'PASS':'FAIL'});
  read.unmap();read.destroy();output.destroy();
  return {status:results.every(r=>r.status==='PASS')?'PASS':'FAIL',results,
    scope:'GPU numerical closures. Uniform-rank glint expectation does not establish actual FFT rank distribution, temporal stability or observational calibration.'};
}
