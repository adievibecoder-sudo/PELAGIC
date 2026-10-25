import {replaceShader} from './shader-patch.js';

// Conservative two-flux slab limit: R=tau/(1+tau), T=1/(1+tau).
// Reuses the existing active/residual optical-depth proxies and coverage.
// Bubble absorption, anisotropy and a measured thickness calibration remain open.
export function foamTransportShader(code,query){
  if(query.get('abFoamPattern')==='bubbles'&&code.includes('fn foamCoverage(')){
    code=replaceShader(code,'max(length(dpdx(uv)),length(dpdy(uv)))*10.0;',
      'max(length(dpdx(uv)),length(dpdy(uv)))*61.0;');
  }
  if(query.get('abFoam')!=='transport'||!code.includes('fn reflectedEnvironment('))return code;
  code=replaceShader(code,'  let foamAlb = vec3f(mix(0.48,0.66,freshK)) * (0.85 + 0.15 * bub);',/* wgsl */`
  let bubbleThickness=0.85+0.15*bub;
  let activeTau=5.0*freshK*bubbleThickness;
  let residualTau=1.8*sqrt(max(cover,0.0))*bubbleThickness;
  let ra=activeTau/(1.0+activeTau);
  let rr=residualTau/(1.0+residualTau);
  let together=(activeTau+residualTau)/(1.0+activeTau+residualTau);
  // Integrate separate and overlapping patches; reflection plus transmission
  // stays one even where the active and residual populations overlap.
  foamMask=activeCoverage*(1.0-residualCoverage)*ra+
    residualCoverage*(1.0-activeCoverage)*rr+activeCoverage*residualCoverage*together;
  let foamAlb=vec3f(1);
`);
  return replaceShader(code,'  col = mix(col, foamLit, foamMask * 0.95);','  col = mix(col, foamLit, foamMask);');
}
