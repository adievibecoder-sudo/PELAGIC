import {SIM_INIT} from '../src/wgsl/sim.js';
import {windDirectionShader} from '../src/wgsl/wind-direction.js';
import {hybridWindDirection} from '../src/sea-spectrum.js';

export async function windDirectionChecks(device){
  const count=4096,B=GPUBufferUsage;
  const source=windDirectionShader(SIM_INIT,new URLSearchParams('abDirection=equilibrium'));
  const code=source.slice(0,source.indexOf('@compute'))+/* wgsl */`
@group(0) @binding(2) var<storage,read_write> result:array<vec4f>;
@compute @workgroup_size(64) fn probe(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;let k=exp2(-3.0+f32(i%32u)*.45);
  let theta=-PI+2.0*PI*(f32(i/32u)+.5)/128.0;
  let U=select(7.0,30.0,i%2u==1u);let fetch=90000.0;
  let wp=22.0*pow(GRAV*GRAV/(U*fetch),1.0/3.0);
  let candidate=hybridWindDirection(theta,k,U,wp);
  let legacy=donelanBanner(wrapAngle(theta),omegaOf(k),wp);
  let opposite=hybridWindDirection(theta+PI,k,U,wp);
  let oldOpposite=donelanBanner(wrapAngle(theta+PI),omegaOf(k),wp);
  result[i]=vec4f(candidate,legacy,candidate/(candidate+opposite),legacy/(legacy+oldOpposite));
}`;
  const module=device.createShaderModule({code}),info=await module.getCompilationInfo();
  const errors=info.messages.filter(x=>x.type==='error');
  if(errors.length)throw Error(errors.map(x=>x.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'probe'}});
  const result=device.createBuffer({size:count*16,usage:B.STORAGE|B.COPY_SRC});
  const read=device.createBuffer({size:result.size,usage:B.COPY_DST|B.MAP_READ});
  try{
    const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:2,resource:{buffer:result}}]});
    const enc=device.createCommandEncoder(),pass=enc.beginComputePass();
    pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(count/64);pass.end();
    enc.copyBufferToBuffer(result,0,read,0,result.size);device.queue.submit([enc.finish()]);
    await read.mapAsync(GPUMapMode.READ);const values=new Float32Array(read.getMappedRange());
    let parity=0,longWave=0,travellingSplit=0,invalid=0;
    for(let i=0;i<count;i++){
      const k=2**(-3+(i%32)*.45),theta=-Math.PI+2*Math.PI*(Math.floor(i/32)+.5)/128;
      parity=Math.max(parity,Math.abs(values[i*4]-hybridWindDirection(k,theta,i%2?30:7,90000)));
      if(k<=1)longWave=Math.max(longWave,Math.abs(values[i*4]-values[i*4+1]));
      travellingSplit=Math.max(travellingSplit,Math.abs(values[i*4+2]-values[i*4+3]));
      invalid+=Number(!Number.isFinite(values[i*4])||values[i*4]<0);
    }
    return {status:parity<3e-6&&longWave===0&&travellingSplit<3e-6&&invalid===0?'PASS':'FAIL',
      samples:count,parityAbsolute:parity,longWaveDifference:longWave,travellingSplitDifference:travellingSplit,invalid,
      scope:'Production angular function against double-precision CPU; unchanged long-wave density and opposing-direction energy fraction. Angular quadrature/radial energy tested separately; finite-grid realization energy is not exactly conserved.'};
  }finally{read.unmap();read.destroy();result.destroy();}
}
