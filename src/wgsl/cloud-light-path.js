// Opt-in quadrature experiment. Density, view samples and scattering stay unchanged.
export const CLOUD_LIGHT_PATH = /* wgsl */ `
fn cloudLightExtent(p:vec3f, light:vec3f)->f32 {
  // Use the same parabolic altitude as cloudDensityFiltered, avoiding cancellation
  // in a planet-radius sphere intersection close to a layer boundary.
  let altitude=p.y+dot(p.xz,p.xz)/(2.0*RG);
  let remaining=max(F.cloudP.x+F.weather.w-altitude,0.0);
  let a=dot(light.xz,light.xz)/(2.0*RG);
  let b=light.y+dot(p.xz,light.xz)/RG;
  if(a<1e-12){
    if(b>0.0){return remaining/b;}
    return max(altitude-F.cloudP.x,0.0)/max(-b,1e-8);
  }
  let root=sqrt(b*b+4.0*a*remaining);
  if(b>=0.0){return 2.0*remaining/max(root+b,1e-12);}
  return (root-b)/(2.0*a);
}
fn cloudLightSegment(lengthRay:f32, i:u32, count:u32)->vec2f {
  let range=log(1.0+lengthRay/0.06);
  let a=0.06*(exp(range*f32(i)/f32(count))-1.0);
  let b=0.06*(exp(range*f32(i+1u)/f32(count))-1.0);
  return vec2f((a+b)*0.5,b-a);
}
fn cloudLightIntegral(p:vec3f,light:vec3f,count:u32)->f32 {
  let lengthRay=cloudLightExtent(p,light);
  var integral=0.0;
  for(var j=0u;j<count;j++){
    let segment=cloudLightSegment(lengthRay,j,count);
    integral+=cloudDensityFiltered(p+light*segment.x,false,segment.y*0.35)*segment.y;
  }
  return integral;
}
`;

export function cloudLightPathShader(code, query) {
  if(query.get('maLightPath')!=='finite'||!code.includes('fn cloudLayers('))return code;
  const sunStart=code.indexOf('      var shadow=0.0;');
  const sunEnd=code.indexOf('      let sigma=',sunStart);
  const moonStart=code.indexOf('          var moonOptical=0.0;');
  const moonEnd=code.indexOf('          moonOptical*=sigma;',moonStart);
  if(sunStart<0||sunEnd<0||moonStart<0||moonEnd<0)throw Error('Cloud light splice contract changed');
  return code.slice(0,sunStart)+
    '      let shadow=cloudLightIntegral(p,F.sunDir.xyz,u32(F.control.y));\n'+
    code.slice(sunEnd,moonStart)+
    '          var moonOptical=cloudLightIntegral(p,F.moonDir.xyz,u32(F.control.y));\n'+
    code.slice(moonEnd)+CLOUD_LIGHT_PATH;
}
