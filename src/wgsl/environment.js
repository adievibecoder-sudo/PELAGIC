export const REGIONAL_AIR=/* wgsl */`
fn regionalFieldWeight(relativeKm:vec2f,front:vec4f,control:vec4f)->f32 {
  let d=relativeKm-front.xy;
  // Validated axes are half widths, in km; the 1 km UI width has a 0.5 km axis.
  let along=dot(d,control.xy)/max(front.z,0.5);
  let across=dot(d,vec2f(-control.y,control.x))/max(front.w,0.5);
  return (1.0-smoothstep(0.55,1.0,length(vec2f(along,across))))*control.z;
}
fn regionalFieldWind(relativeKm:vec2f,front:vec4f,control:vec4f,background:vec2f,air:vec4f)->vec2f {
  let weight=regionalFieldWeight(relativeKm,front,control);
  if(weight<=0.0){return background*air.x;}
  let angle=air.y*(.3*weight);
  let direction=vec2f(background.x*cos(angle)-background.y*sin(angle),
    background.x*sin(angle)+background.y*cos(angle));
  let phase=air.z+dot(relativeKm,control.xy)*1.3;
  let gust=1.0+.12*weight*sin(phase);
  return direction*(mix(air.x,22.0,weight)*gust);
}
`;

export const REGIONAL_WEATHER=REGIONAL_AIR+/* wgsl */`
fn regionalWeight(cameraRelativeKm:vec2f)->f32 {
  return regionalFieldWeight(cameraRelativeKm,F.front,F.frontControl);
}
fn regionalCoverage(p:vec2f)->f32{return mix(F.regional.x,0.98,regionalWeight(p));}
fn regionalTypes(p:vec2f)->vec3f{return mix(F.cloudWeights.xyz,vec3f(0,0,1),regionalWeight(p));}
fn precipitationSupport(p:vec2f)->f32 {
  let coverage=regionalCoverage(p);
  return mix(F.regional.z,0.8,regionalWeight(p))*smoothstep(0.55,0.90,coverage);
}
fn regionalAirWind(cameraRelativeKm:vec2f)->vec2f {
  return regionalFieldWind(cameraRelativeKm,F.front,F.frontControl,F.roughnessWind.xy,F.airWind);
}
`;
