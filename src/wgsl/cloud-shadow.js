// Sea-to-cloud rays use the same parabolic altitude as the density field.
export const CLOUD_SHADOW_PATH=/* wgsl */`
fn cloudShadowInterval(p:vec3f, light:vec3f)->vec2f {
  let altitude=p.y+dot(p.xz,p.xz)/(2.0*RG);
  let a=dot(light.xz,light.xz)/(2.0*RG);
  let b=light.y+dot(p.xz,light.xz)/RG;
  if(b<=0.0){return vec2f(0);}
  let heights=max(vec2f(F.cloudP.x,F.cloudP.x+F.weather.w)-altitude,vec2f(0));
  // Stable positive roots, including the vertical-ray limit a=0.
  return 2.0*heights/(sqrt(vec2f(b*b)+4.0*a*heights)+b);
}
fn integratedCloudShadow(p:vec3f,light:vec3f,count:u32)->f32 {
  let interval=cloudShadowInterval(p,light);
  let ds=(interval.y-interval.x)/f32(count);
  var od=0.0;
  for(var j=0u;j<count;j++){
    od+=cloudDensity(p+light*(interval.x+(f32(j)+0.5)*ds),true)*ds;
  }
  return exp(-od*F.cloudP.z*6.0)*iceTransmittance(p,light);
}
`;

export function cloudShadowShader(code,query){
  const count={curved12:12,curved48:48,curved96:96,reference512:512}[query.get('abShadow')];
  if(!count||!code.includes('fn cloudShadowFor('))return code;
  const begin=code.indexOf('fn cloudShadowFor('),end=code.indexOf('fn cloudShadowAt(',begin);
  if(end<0)throw Error('Cloud shadow splice contract changed');
  return code.slice(0,begin)+CLOUD_SHADOW_PATH+`
fn cloudShadowFor(p:vec3f,light:vec3f)->f32{return integratedCloudShadow(p,light,${count}u);}
`+code.slice(end);
}
