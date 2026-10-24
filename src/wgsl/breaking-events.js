// Bounded onset proxy, not an overturning-fluid or Barthelemy criterion.
// Reuse foam g for event activity and b for the previous compression signal.
export const EMISSION_HAZARD=/* wgsl */`
fn emissionProbability(referenceProbability:f32,dt:f32)->f32 {
  let p=clamp(referenceProbability,0.0,1.0);
  if(dt<=0.0||p<=0.0){return 0.0;}
  if(p>=1.0){return 1.0;}
  // Preserve the historical population at 60 Hz; integrate its hazard at the
  // actual timestep. Repeated failed trials must not depend on frame rate.
  return 1.0-pow(1.0-p,dt*60.0);
}
`;
export function breakingEventsShader(code,query) {
  const mode=query.get('maBreaking');
  if(!['events','onset','fold','crest'].includes(mode))return code;
  if(code.includes('struct FoamU {')){
    const start=code.indexOf('  let inject = smoothstep('),end=code.indexOf('  // Carry binary16',start);
    if(start<0||end<0)throw Error('Breaking-event splice contract changed');
    code=code.slice(0,start)+/* wgsl */`
  let hasHistory=all(source>=vec2f(plo))&&all(source<vec2f(plo+vec2i(RES-1)));
  let signal=smoothstep(0.04,0.28,compression)*activity*U.p1.w;
  let increment=select(0.0,max(signal-prev.b,0.0),hasHistory&&dt>0.0);
  // Positive compression increments initiate finite events. Relaxing crests
  // cannot continually reset activity; residual foam keeps its longer lifetime.
  let survival=exp(-dt*1.6);
  let fresh=1.0-(1.0-prev.g*survival)*exp(-U.p1.z*increment);
  var f=(prev.r+prev.a)*exp(-dt*U.p0.w);
  f=min(f+(1.0-f)*(1.0-exp(-dt*U.p1.z*fresh)),1.0);
`+code.slice(end);
    if(['onset','fold','crest'].includes(mode))code=code.replace('f=min(f+(1.0-f)*(1.0-exp(-dt*U.p1.z*fresh)),1.0);',
      'f=1.0-(1.0-f)*exp(-U.p1.z*increment);');
    if(mode==='fold')code=code.replace('let signal=smoothstep(0.04,0.28,compression)*activity*U.p1.w;',
      'let signal=max(-eigen,0.0)*activity*U.p1.w;');
    if(mode==='crest')code=code.replace('let signal=smoothstep(0.04,0.28,compression)*activity*U.p1.w;',/* wgsl */`
  // For one deep-water mode, 1-eigen = chop*k*a. Map the limiting Stokes
  // steepness 0.443 into the existing deformation variable. Mixed seas still
  // need a validated breaking criterion; this is a stricter crest proxy.
  let limit=max(1.0-0.443*U.drift.z,0.001);
  let signal=max(1.0-eigen/limit,0.0)*activity*U.p1.w;`);
    return code.replace('vec4f(stored, fresh, J, f-stored)','vec4f(stored, fresh, signal, f-stored)');
  }
  return code;
}
