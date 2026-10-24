import {WIND_ROUGHNESS,GAUSSIAN_STRESS} from '../src/wgsl/wind-roughness.js';
import {GLINT_STATISTICS,FILTERED_GLINTS,CONDITIONAL_GLINTS} from '../src/wgsl/finite-glints.js';
import {VISIBLE_SLOPES} from '../src/wgsl/footprint-optics.js';
import {CLOUD_COLLISION} from '../src/wgsl/cloud-transport.js';
import {EMISSION_HAZARD} from '../src/wgsl/breaking-events.js';

export async function verifyAppearance(device){
  const count=65536,B=GPUBufferUsage,results=[];
  const code=WIND_ROUGHNESS+GAUSSIAN_STRESS+GLINT_STATISTICS+FILTERED_GLINTS+CONDITIONAL_GLINTS+VISIBLE_SLOPES+CLOUD_COLLISION+EMISSION_HAZARD+/* wgsl */`
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
    let filteredMeans=array<f32,4>(0.01,0.1,1.0,8.0);
    for(var c=0u;c<4u;c++){output[(10u+c)*65536u+i]=vec4f(filteredGlintWeight(filteredMeans[c],rank,0.692),filteredGlintWeight(filteredMeans[c],rank,1.0),0,0);}
    let beta=array<f32,4>(-1,0,1,6);
    for(var c=0u;c<4u;c++){output[14u*65536u+i][c]=visibleSlope(rank,beta[c]);}
    let stress=stressRoughness(q,w,offset);
    let sx=(stressRoughness(q+vec2f(.125,0),w,offset).x-stressRoughness(q-vec2f(.125,0),w,offset).x)/.25;
    let sy=(stressRoughness(q+vec2f(0,.125),w,offset).x-stressRoughness(q-vec2f(0,.125),w,offset).x)/.25;
    output[15u*65536u+i]=vec4f(stress.x*stress.x,abs(stress.y-sx),abs(stress.z-sy),stressRoughness(q,vec4f(1,0,0,1307),offset).x);
    for(var c=0u;c<4u;c++){output[16u*65536u+i][c]=conditionalGlintWeight(filteredMeans[c],rank,vec3f(.978812882,.849160677,.723048511));}
  }`;
  const module=device.createShaderModule({code});
  const info=await module.getCompilationInfo();
  if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
  const output=device.createBuffer({size:count*17*16,usage:B.STORAGE|B.COPY_SRC});
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
  for(const [c,mean] of [.01,.1,1,8].entries()){
    let sum=0,max=0,fullError=0;
    for(let i=0;i<count;i++){const p=((10+c)*count+i)*4;sum+=values[p];max=Math.max(max,values[p]);fullError=Math.max(fullError,Math.abs(values[p+1]-1));}
    const average=sum/count;
    results.push({name:'Filtered glitter mean '+mean,average,max,fullError,status:Math.abs(average-1)<.0001&&fullError===0?'PASS':'FAIL'});
  }
  for(const [c,beta] of [-1,0,1,6].entries()){
    let sum=0,invalid=0,mass=0,moment=0;
    for(let i=0;i<count;i++){const value=values[(14*count+i)*4+c];sum+=value;if(!Number.isFinite(value)||value>beta+.002)invalid++;}
    for(let j=0;j<100000;j++){const x=-10+(beta+10)*(j+.5)/100000,w=(beta-x)*Math.exp(-x*x/2);mass+=w;moment+=x*w;}
    const average=sum/count,expected=moment/mass;
    results.push({name:'Visible Gaussian slope beta '+beta,average,expected,invalid,status:!invalid&&Math.abs(average-expected)<.003?'PASS':'FAIL'});
  }
  let stressEnergy=0,stressGradient=0,stressIdentity=0,stressInvalid=0;
  for(let i=0;i<count;i++){
    const p=(15*count+i)*4;stressEnergy+=values[p];stressGradient=Math.max(stressGradient,values[p+1],values[p+2]);
    stressIdentity=Math.max(stressIdentity,Math.abs(values[p+3]-1));
    if(!Number.isFinite(values[p])||values[p]<=0)stressInvalid++;
  }
  stressEnergy/=count;
  results.push({name:'Gaussian stress energy and analytic gradient',energy:stressEnergy,gradientError:stressGradient,identityError:stressIdentity,invalid:stressInvalid,
    status:Math.abs(stressEnergy-1)<.025&&stressGradient<.001&&stressIdentity===0&&!stressInvalid?'PASS':'FAIL'});
  for(const [c,mean] of [.01,.1,1,8].entries()){
    let sum=0,invalid=0;
    for(let i=0;i<count;i++){const v=values[(16*count+i)*4+c];sum+=v;if(!Number.isFinite(v)||v<0)invalid++;}
    const average=sum/count;
    results.push({name:'Conditional shutter glitter mean '+mean,average,invalid,status:!invalid&&Math.abs(average-1)<.002?'PASS':'FAIL'});
  }
  read.unmap();read.destroy();output.destroy();
  return {status:results.every(r=>r.status==='PASS')?'PASS':'FAIL',results,
    scope:'GPU numerical closures. Uniform-rank glint expectation does not establish actual FFT rank distribution, temporal stability or observational calibration.'};
}
