// View diagnostics isolate optical occupancy from the production light model.
export function cloudAppearanceShader(code,query){
  const mode=query.get('maCloudView');
  if(!['opacity','neutral'].includes(mode)||!code.includes('fn skyRadiance('))return code;
  // Runtime branch retains auto-layout resources even when observing only opacity.
  if(mode==='opacity')return code.replace(
    'if(withSun){L+=sunDisk(dir)*tr;}',
    'if(withSun){L+=sunDisk(dir)*tr;} if(F.post.w>=0.0){L=vec3f(cl.a);}')
    .replace('L=mix(L,volumeWater(dir,200.0,surfaceAtLens),waterFraction(in.pos.xy));',
    'if(F.post.w>=0.0){L=vec3f(cl.a);}\n  L=mix(L,volumeWater(dir,200.0,surfaceAtLens),waterFraction(in.pos.xy));');
  return code.replace('let light=ambient*mix(0.18,1.0,sqrt(height))+sun*(direct+multi)+lunar;',
    'let light=select(ambient*mix(0.18,1.0,sqrt(height))+sun*(direct+multi)+lunar,vec3f(0.6+0.4*exp(-optical)),F.post.w>=0.0);')
    .replace('let aerial=exp(-t*(0.008+F.atmo.x*0.003));','let aerial=select(exp(-t*(0.008+F.atmo.x*0.003)),1.0,F.post.w>=0.0);');
}
