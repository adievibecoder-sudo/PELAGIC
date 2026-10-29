export const REGIONAL_WEATHER=/* wgsl */`
fn regionalWeight(cameraRelativeKm:vec2f)->f32 {
  let d=cameraRelativeKm-F.front.xy;
  // Validated axes are half widths, in km; the 1 km UI width has a 0.5 km axis.
  let along=dot(d,F.frontControl.xy)/max(F.front.z,0.5);
  let across=dot(d,vec2f(-F.frontControl.y,F.frontControl.x))/max(F.front.w,0.5);
  return (1.0-smoothstep(0.55,1.0,length(vec2f(along,across))))*F.frontControl.z;
}
fn regionalCoverage(p:vec2f)->f32{return mix(F.regional.x,0.98,regionalWeight(p));}
fn regionalTypes(p:vec2f)->vec3f{return mix(F.cloudWeights.xyz,vec3f(0,0,1),regionalWeight(p));}
fn precipitationSupport(p:vec2f)->f32 {
  let coverage=regionalCoverage(p);
  return mix(F.regional.z,0.8,regionalWeight(p))*smoothstep(0.55,0.90,coverage);
}
fn regionalAirWind(cameraRelativeKm:vec2f)->vec2f {
  let weight=regionalWeight(cameraRelativeKm);
  let background=F.roughnessWind.xy;
  if(weight<=0.0){return background*F.airWind.x;}
  let angle=F.airWind.y*(.3*weight);
  let direction=vec2f(background.x*cos(angle)-background.y*sin(angle),
    background.x*sin(angle)+background.y*cos(angle));
  let phase=F.airWind.z+dot(cameraRelativeKm,F.frontControl.xy)*1.3;
  let gust=1.0+.12*weight*sin(phase);
  return direction*(mix(F.airWind.x,22.0,weight)*gust);
}
`;
