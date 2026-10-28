import {replaceShader} from './shader-patch.js';

// Active breaking follows a gravity ridge. Residual bubbles follow material
// drift. The scalar occupancy field merges overlapping fronts without additive
// brightness; this is phase transport, not persistent discrete event identity.
export function breakingPhaseShader(code,query){
  const resident=query.get('abBreaking')==='phase-resident';
  if(!resident&&query.get('abBreaking')!=='phase-field'||!code.includes('struct FoamU {'))return code;
  code=replaceShader(code,'fn wrapIdx(',/* wgsl */`
fn gravityHeightPair(q:vec2f,spacing:f32)->vec2f {
  var h=vec2f(0);
  for(var c=0u;c<3u;c++){
    let invL=U.cascInvL[c>>2u][c&3u];
    let uv=cascadeUV(q,c,invL,U.waveOrigins);
    let lod=max(log2(max(.75,spacing)*256.0*invL),0.0);
    h+=vec2f(textureSampleLevel(dispTex,samp,uv,c,lod).y,
      textureSampleLevel(lastDisp,samp,uv,c,lod).y);
  }
  return h;
}
fn wrapIdx(`);
  code=replaceShader(code,'  let increment=select(0.0,max(signal-prev.b,0.0),hasHistory&&dt>0.0);',/* wgsl */`
  var activePrevious=vec4f(0);var ridgeSupport=0.0;
  if(dt>0.0 && signal>.001){
    let gap=length(vec2f(strain.x-strain.y,2.0*strain.z));
    let low=.5*(strain.x+strain.y-gap);
    let a=vec2f(strain.z,low-strain.x);let b=vec2f(low-strain.y,strain.z);
    let candidate=select(a,b,dot(b,b)>dot(a,a));
    let axis=candidate/max(length(candidate),1e-7);
    let spacing=max(.75,ts);
    let centre=gravityHeightPair(p,spacing);
    let plus=gravityHeightPair(p+axis*spacing,spacing);
    let minus=gravityHeightPair(p-axis*spacing,spacing);
    let gradient=(plus-minus)/(2.0*spacing);
    let curvature=(plus.x+minus.x-2.0*centre.x)/(spacing*spacing);
    if(gap>.03 && curvature<-.008){
      let speed=-(gradient.x-gradient.y)/(dt*curvature);
      let travel=speed*dt;
      // Reject ambiguous/crossing estimates instead of extending a front to
      // an unrelated ridge. No independently chosen wave propagation speed.
      if(abs(speed)<35.0 && abs(travel)<2.0*spacing){
        let ridgeDistance=abs(gradient.x/curvature);
        ridgeSupport=1.0-smoothstep(spacing,3.0*spacing,ridgeDistance);
        let activeSource=vec2f(g)-axis*travel/ts;
        if(all(activeSource>=vec2f(plo))&&all(activeSource<vec2f(plo+vec2i(RES-1)))){
          activePrevious=textureSampleLevel(prevTex,sampPrev,
            (vec2f(id.xy)+.5-axis*travel/ts)/f32(RES),lvl,0.0);
        }
      }
    }
  }
  let increment=select(0.0,max(signal-activePrevious.b,0.0),hasHistory&&dt>0.0)*ridgeSupport;`);
  code=replaceShader(code,'let fresh=1.0-(1.0-prev.g*survival)*exp(-U.p1.z*increment);',
    'let supportSurvival=exp(-dt*12.0*(1.0-ridgeSupport));\n  let fresh=select(prev.g,1.0-(1.0-activePrevious.g*survival*supportSurvival)*exp(-U.p1.z*increment),dt>0.0);');
  code=replaceShader(code,'let retired=prev.g*(1.0-survival);',
    'let retired=prev.g*(1.0-survival*supportSurvival);');
  if(resident){
    code=replaceShader(code,'  var activePrevious=vec4f(0);var ridgeSupport=0.0;',`  // A rejected phase estimate retires material-carried history continuously.
  // It must not erase the fraction which has not yet become residual foam.
  var activePrevious=prev;var ridgeSupport=0.0;var phaseHistory=false;`);
    code=replaceShader(code,'          activePrevious=textureSampleLevel(prevTex,sampPrev,',
      '          phaseHistory=true;\n          activePrevious=textureSampleLevel(prevTex,sampPrev,');
    code=replaceShader(code,'hasHistory&&dt>0.0)*ridgeSupport;',
      'hasHistory&&phaseHistory&&dt>0.0)*ridgeSupport;');
    code=replaceShader(code,'let retired=prev.g*(1.0-survival*supportSurvival);',
      'let retired=activePrevious.g*(1.0-survival*supportSurvival);');
  }
  return code;
}
