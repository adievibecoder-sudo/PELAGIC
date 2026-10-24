import {FOAM_TEX} from '../src/wgsl/sim.js';
import {SUN_DISC} from '../src/wgsl/sun-disc.js';
import {CUBE_COORDINATES} from '../src/wgsl/cube-filter.js';
import {WATER_OPTICS} from '../src/wgsl/water-optics.js';

export async function shaderAuditChecks(device){
  const count=4096,B=GPUBufferUsage;
  const foam=FOAM_TEX.slice(0,FOAM_TEX.lastIndexOf('@compute')).replace('@group(0) @binding(0) var dst: texture_storage_2d<rgba8unorm, write>;','');
  const code=foam+SUN_DISC+CUBE_COORDINATES+WATER_OPTICS+/* wgsl */`
  @group(0) @binding(0) var<storage,read_write> output:array<vec4f>;
  @compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
    let t=(f32(id.x)+.5)/4096.0;
    var seam=0.0;var derivative=0.0;
    for(var k=0u;k<2u;k++){
      let period=select(29,61,k==1u);let eps=1.0/65536.0;
      for(var axis=0u;axis<2u;axis++){
        let p=select(vec2f(0,t),vec2f(t,0),axis==1u);
        let shift=select(vec2f(1,0),vec2f(0,1),axis==1u);
        let a=bubbles(p,period,37u,.06,.45);let b=bubbles(p+shift,period,37u,.06,.45);
        seam=max(seam,abs(a-b));
        let left=(a-bubbles(p-shift*eps,period,37u,.06,.45))/eps;
        let right=(bubbles(p+shift*eps,period,37u,.06,.45)-a)/eps;
        derivative=max(derivative,abs(left-right));
      }
    }
    output[id.x]=vec4f(seam,derivative,0,0);
    if(id.x<7u){
      let up=sunDiscDirection(vec3f(0,1,0),id.x);let down=sunDiscDirection(vec3f(0,-1,0),id.x);
      output[4096u+id.x]=vec4f(up,length(down));
    }
    var cubeError=0.0;
    for(var face=0u;face<6u;face++){
      let dir=cubeDirection(face,vec2f(t*1.2-.1,fract(t*17.0)*1.2-.1));
      let address=cubeAddress(dir);let back=cubeDirection(u32(address.z),address.xy);
      cubeError=max(cubeError,length(normalize(dir)-normalize(back)));
    }
    let mu=2.0*t-1.0;
    let bb=vec3f(.002,.004,.008);
    output[8192u+id.x]=vec4f(waterPhase(mu,waterMolecularScatter(bb),waterParticleScatter(bb)),cubeError);
  }`;
  const module=device.createShaderModule({code});const info=await module.getCompilationInfo();
  if(info.messages.some(x=>x.type==='error'))throw Error(info.messages.map(x=>x.message).join('\n'));
  const pipe=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const out=device.createBuffer({size:count*3*16,usage:B.STORAGE|B.COPY_SRC});
  const read=device.createBuffer({size:out.size,usage:B.MAP_READ|B.COPY_DST});
  const group=device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:out}}]});
  const e=device.createCommandEncoder(),p=e.beginComputePass();p.setPipeline(pipe);p.setBindGroup(0,group);p.dispatchWorkgroups(count/64);p.end();
  e.copyBufferToBuffer(out,0,read,0,out.size);device.queue.submit([e.finish()]);await read.mapAsync(GPUMapMode.READ);
  const values=new Float32Array(read.getMappedRange());let seam=0,derivative=0,cubeError=0;const integral=[0,0,0],backscatter=[0,0,0];
  for(let i=0;i<count;i++){
    seam=Math.max(seam,values[i*4]);derivative=Math.max(derivative,values[i*4+1]);cubeError=Math.max(cubeError,values[(8192+i)*4+3]);
    for(let c=0;c<3;c++){integral[c]+=values[(8192+i)*4+c]*4*Math.PI/count;if(i<count/2)backscatter[c]+=values[(8192+i)*4+c]*4*Math.PI/count;}
  }
  const ring=[0,0,0];let finite=true;
  for(let i=0;i<7;i++)for(let k=0;k<4;k++){
    const value=values[(4096+i)*4+k];finite&&=Number.isFinite(value);if(i>0&&k<3)ring[k]+=value/6;
  }
  const expected=[.002,.004,.008],molecular=[.0007,.001,.0015];
  const total=expected.map((bb,i)=>2*molecular[i]+12*(bb-molecular[i]));
  const energyError=Math.max(...integral.map((x,i)=>Math.abs(x/total[i]-1)));
  const backscatterError=Math.max(...backscatter.map((x,i)=>Math.abs(x/expected[i]-1)));
  const results=[{name:'Foam odd-period boundary values',seam,maxOneSidedDerivativeDifference:derivative,status:seam<.0002?'PASS':'FAIL'},
    {name:'Solar zenith/nadir finite basis and sixfold symmetry',finite,ring,status:finite&&Math.hypot(ring[0],ring[2])<1e-8?'PASS':'FAIL'},
    {name:'Cubemap cross-face directional round trip',maxError:cubeError,status:cubeError<1e-6?'PASS':'FAIL'},
    {name:'Shared water scattering energy/backscatter conventions',energyError,backscatterError,status:energyError<.0001&&backscatterError<.00001?'PASS':'FAIL'}];
  read.unmap();read.destroy();out.destroy();return {results,status:results.every(x=>x.status==='PASS')?'PASS':'FAIL'};
}
