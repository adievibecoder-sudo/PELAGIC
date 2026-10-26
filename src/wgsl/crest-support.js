// Crest coordinates are in the FFT's undisplaced parameter domain. Compression
// supplies a ridge axis; height curvature distinguishes a crest from a trough.
export const CREST_SUPPORT=/* wgsl */`
struct CrestSample {slope:vec2f,strain:vec3f};
struct CrestSupport {q:vec2f,axis:vec2f,steepness:f32,curvature:f32,residual:f32,valid:f32};
fn compressionAxis(s:vec3f)->vec3f {
  let gap=length(vec2f(s.x-s.y,2.0*s.z));
  let low=.5*(s.x+s.y-gap);
  let a=vec2f(s.z,low-s.x);let b=vec2f(low-s.y,s.z);
  let v=select(a,b,dot(b,b)>dot(a,a));
  return vec3f(v/max(length(v),1e-8),gap);
}
fn projectGravityCrest(start:vec2f,maxTravel:f32)->CrestSupport {
  var q=start;var axis=vec2f(1,0);var curvature=0.0;
  for(var iteration=0u;iteration<3u;iteration++){
    let sample=gravityCrestSample(q);let eig=compressionAxis(sample.strain);
    axis=eig.xy;
    let plus=gravityCrestSample(q+axis*.35).slope;
    let minus=gravityCrestSample(q-axis*.35).slope;
    curvature=dot(plus-minus,axis)/.7;
    // Near equal compression has no unique ridge; do not bridge a crossing.
    if(eig.z<.03 || curvature>=-.01){return CrestSupport(q,axis,0,curvature,0,0);}
    let step=clamp(-dot(sample.slope,axis)/curvature,-maxTravel,maxTravel);
    let trial=q+axis*step;
    if(distance(trial,start)>maxTravel){return CrestSupport(q,axis,0,curvature,abs(step),0);}
    q=trial;
  }
  let sample=gravityCrestSample(q);let eig=compressionAxis(sample.strain);
  axis=eig.xy;
  curvature=dot(gravityCrestSample(q+axis*.35).slope-gravityCrestSample(q-axis*.35).slope,axis)/.7;
  let steepness=-.5*(sample.strain.x+sample.strain.y-eig.z);
  let residual=abs(dot(sample.slope,axis));
  let valid=select(0.0,1.0,eig.z>=.03 && curvature<-.01 && residual<.035);
  return CrestSupport(q,axis,steepness,curvature,residual,valid);
}
`;

export const GRAVITY_CREST_SAMPLING=/* wgsl */`
fn gravityCrestSample(q:vec2f)->CrestSample {
  var slope=vec2f(0);var strain=vec3f(0);
  for(var c=0u;c<3u;c++){
    let invL=F.cascInvL[c>>2u][c&3u];
    // Resolve metre-scale ridges, not every capillary wrinkle. Both fields use
    // the same footprint, preserving their relative phase under filtering.
    let lod=max(log2(.75*f32(textureDimensions(derivatives).x)*invL),0.0);
    let uv=cascadeUV(q,c,invL,F.waveOrigins);
    let d=textureSampleLevel(disp,samp,uv,c,lod);
    let b=textureSampleLevel(derivatives,samp,uv,c,lod);
    slope+=b.xy;strain+=vec3f(b.z,b.w,d.w);
  }
  return CrestSample(slope,strain/max(F.windP[1].y,.1));
}
`;
