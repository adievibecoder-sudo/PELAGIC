import {TAA_RESOLVE,oceanMotionShader} from './wgsl/taa.js';

export async function createTAA({device,allocations,shader,frame,displacement,derivatives,previousDisplacement,previousDerivatives,sampler,ocean}){
  const motionModule=await shader(oceanMotionShader(ocean),'ocean sample motion');
  const motionPipe=await device.createRenderPipelineAsync({label:'ocean sample motion',layout:'auto',
    vertex:{module:motionModule,entryPoint:'vs',buffers:[{arrayStride:16,stepMode:'instance',attributes:[{shaderLocation:0,offset:0,format:'float32x4'}]}]},
    fragment:{module:motionModule,entryPoint:'fs',targets:[{format:'rgba16float'}]},primitive:{topology:'triangle-list',cullMode:'none'},
    depthStencil:{format:'depth32float',depthCompare:'equal',depthWriteEnabled:false},multisample:{count:4}});
  const bind=(pipeline,resources)=>device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:resources.map((resource,binding)=>({binding,resource}))});
  const motionBind=bind(motionPipe,[{buffer:frame},displacement.createView(),derivatives.createView(),sampler,previousDisplacement.createView(),previousDerivatives.createView()]);
  const module=await shader(TAA_RESOLVE,'short HDR history');
  const resolvePipe=await device.createComputePipelineAsync({label:'short HDR history',layout:'auto',compute:{module,entryPoint:'main'}});
  const linear=device.createSampler({magFilter:'linear',minFilter:'linear'});
  let resources=[],motionMS,histories=[],depths=[],bindings=[],depthView,width,height,index=0,latest=0;
  return {
    resize(w,h,current,depth){
      resources.forEach(t=>t.destroy());resources=[];width=w;height=h;index=0;latest=0;
      const texture=(label,format,usage,sampleCount=1)=>{const t=allocations.texture({label,size:[w,h],format,usage,sampleCount});resources.push(t);return t;};
      const U=GPUTextureUsage;
      motionMS=texture('sample-coherent ocean motion','rgba16float',U.RENDER_ATTACHMENT|U.TEXTURE_BINDING,4);
      histories=[0,1].map(i=>texture('HDR temporal history '+i,'rgba16float',U.TEXTURE_BINDING|U.STORAGE_BINDING|U.COPY_SRC));
      depths=[0,1].map(i=>texture('reverse-Z history '+i,'r32float',U.TEXTURE_BINDING|U.STORAGE_BINDING|U.COPY_SRC));
      depthView=depth.createView();
      bindings=[0,1].map(i=>bind(resolvePipe,[{buffer:frame},current.createView(),motionMS.createView(),depthView,
        histories[1-i].createView(),depths[1-i].createView(),linear,histories[i].createView(),depths[i].createView()]));
      return histories.map(t=>t.createView());
    },
    encode(encoder,{instances,indices,grid,nodeCount,timestamps}){
      const pass=encoder.beginRenderPass({label:'sample-coherent motion',colorAttachments:[{view:motionMS.createView(),loadOp:'clear',clearValue:{r:0,g:0,b:0,a:0},storeOp:'store'}],
        depthStencilAttachment:{view:depthView,depthReadOnly:true},timestampWrites:timestamps?.motion});
      pass.setPipeline(motionPipe);pass.setBindGroup(0,motionBind);pass.setVertexBuffer(0,instances);pass.setIndexBuffer(indices,'uint16');
      if(nodeCount)pass.drawIndexed(grid*grid*6,nodeCount);pass.end();
      const resolve=encoder.beginComputePass({label:'short HDR history',timestampWrites:timestamps?.resolve});
      resolve.setPipeline(resolvePipe);resolve.setBindGroup(0,bindings[index]);resolve.dispatchWorkgroups(Math.ceil(width/8),Math.ceil(height/8));resolve.end();
      latest=index;index=1-index;return latest;
    },
    get output(){return histories[latest];},
    get depth(){return depths[latest];},
  };
}
