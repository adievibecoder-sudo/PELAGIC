// Bounded onset proxy, not an overturning-fluid or Barthelemy criterion.
// Reuse foam g for event activity and b for the previous compression signal.
import {replaceShader} from './shader-patch.js';
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
  if(!['events','onset','fold','crest','gravity'].includes(mode))return code;
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
    if(['onset','fold','crest','gravity'].includes(mode))code=code.replace('f=min(f+(1.0-f)*(1.0-exp(-dt*U.p1.z*fresh)),1.0);',
      'f=1.0-(1.0-f)*exp(-U.p1.z*increment);');
    if(mode==='fold')code=code.replace('let signal=smoothstep(0.04,0.28,compression)*activity*U.p1.w;',
      'let signal=max(-eigen,0.0)*activity*U.p1.w;');
    if(mode==='crest')code=code.replace('let signal=smoothstep(0.04,0.28,compression)*activity*U.p1.w;',/* wgsl */`
  // For one deep-water mode, 1-eigen = chop*k*a. Map the limiting Stokes
  // steepness 0.443 into the existing deformation variable. Mixed seas still
  // need a validated breaking criterion; this is a stricter crest proxy.
  let limit=max(1.0-0.443*U.drift.z,0.001);
  let signal=max(1.0-eigen/limit,0.0)*activity*U.p1.w;`);
    if(mode==='gravity'){
      code=replaceShader(code,'  var slope = vec2f(0.0);','  var slope = vec2f(0.0);\n  var gravityStrain=vec3f(0);');
      code=replaceShader(code,'      slope += d.xy;','      slope += d.xy;\n      if(c<3u){gravityStrain+=vec3f(d.z,d.w,a.w);}',1);
      code=replaceShader(code,'  let signal=smoothstep(0.04,0.28,compression)*activity*U.p1.w;',/* wgsl */`
  let strain=gravityStrain/max(U.drift.z,.1);
  let steepness=-.5*(strain.x+strain.y-sqrt((strain.x-strain.y)*(strain.x-strain.y)+4.0*strain.z*strain.z));
  // Broadband onset closure between spilling onset and limiting Stokes
  // steepness. Excludes capillary strain; not a nonlinear overturning solve.
  let signal=smoothstep(.28,.443,steepness)*activity*U.p1.w;`);
    }
    return code.replace('vec4f(stored, fresh, J, f-stored)','vec4f(stored, fresh, signal, f-stored)');
  }
  if(mode==='gravity'&&code.includes('fn reflectedEnvironment(')){
    code=replaceShader(code,'  var cov = vec3f(0.0);','  var cov = vec3f(0.0);\n  var gravityStrain=vec3f(0);');
    code=replaceShader(code,'    jxz += av.w;','    jxz += av.w;\n    if(c<3u){gravityStrain+=vec3f(dv.z,dv.w,av.w);}');
    const marker='  let fresh=smoothstep(0.04,0.28,1.0-smoothstep(0.18,0.65+0.009*min(F.windP[0].z,25.0),compression))*min(F.foamP.z,1.0);';
    code=replaceShader(code,marker,/* wgsl */`
  let strain=gravityStrain/max(F.windP[1].y,.1);
  let steepness=-.5*(strain.x+strain.y-sqrt((strain.x-strain.y)*(strain.x-strain.y)+4.0*strain.z*strain.z));
  // Same band-limited criterion outside the persistent clipmaps. Fade the
  // instantaneous far-field proxy into the actual event memory near the viewer.
  let fresh=clamp(fwl.g+(1.0-w1)*smoothstep(.28,.443,steepness)*min(F.foamP.z,1.0),0.0,1.0);`);
  }
  return code;
}
