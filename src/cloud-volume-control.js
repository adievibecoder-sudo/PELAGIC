export async function loadCloudVolumeControl(device,allocations,query){
  if(query.get('maCloud')!=='volume')return null;
  const base='./assets/experiments/wdas-cloud/';
  const read=async name=>{const response=await fetch(base+name);if(!response.ok)throw Error('Cloud control unavailable: '+name);return response;};
  const metadata=await (await read('metadata.json')).json();
  const data=await (await read('density.r16f')).arrayBuffer();
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('');
  if(digest!==metadata.sha256)throw Error('Cloud control asset hash mismatch');
  const texture=allocations.texture({label:'WDAS authored cloud control',size:metadata.levels[0].size,dimension:'3d',format:'r16float',mipLevelCount:metadata.levels.length,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
  for(const [mipLevel,level] of metadata.levels.entries()){
    device.queue.writeTexture({texture,mipLevel},new Uint8Array(data,level.offset,level.bytes),{bytesPerRow:level.size[0]*2,rowsPerImage:level.size[1]},level.size);
  }
  const view=texture.createView();
  const bindings=new Map();
  return {metadata,payloadBytes:data.byteLength,bind(pass,pipeline){
    let group=bindings.get(pipeline);
    if(!group){group=device.createBindGroup({layout:pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:view}]});bindings.set(pipeline,group);}
    pass.setBindGroup(1,group);
  }};
}
