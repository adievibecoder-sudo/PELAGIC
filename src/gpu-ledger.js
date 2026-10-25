// Requested payload bytes, not physical residency, driver alignment or compositor VRAM.
export function gpuLedger(device){
  const live=new Map();let peak=0,next=0;
  function track(resource,bytes,kind,label){
    const id=next++;live.set(id,{kind,label:label||'unlabelled',bytes});
    peak=Math.max(peak,[...live.values()].reduce((s,v)=>s+v.bytes,0));
    const destroy=resource.destroy.bind(resource);
    resource.destroy=()=>{live.delete(id);destroy();};return resource;
  }
  return {
    buffer(d){return track(device.createBuffer(d),d.size,'buffer',d.label);},
    texture(d){
      const size=Array.isArray(d.size)?d.size:[d.size.width,d.size.height||1,d.size.depthOrArrayLayers||1];
      const bpp={r16float:2,r32float:4,rgba16float:8,rgba32float:16,rgba8unorm:4,depth32float:4}[d.format];
      if(!bpp)throw Error('Missing allocation format: '+d.format);
      let bytes=0;for(let m=0;m<(d.mipLevelCount||1);m++)bytes+=Math.max(1,size[0]>>m)*Math.max(1,(size[1]||1)>>m)*(d.dimension==='3d'?Math.max(1,(size[2]||1)>>m):(size[2]||1))*bpp*(d.sampleCount||1);
      return track(device.createTexture(d),bytes,'texture',d.label);
    },
    report(){return {liveBytes:[...live.values()].reduce((s,v)=>s+v.bytes,0),peakBytes:peak,allocations:[...live.values()],scope:'Renderer-owned buffer/texture payload requests. Excludes diagnostic readback helper allocations, pipelines, alignment, driver/browser/compositor and residency.'};}
  };
}
