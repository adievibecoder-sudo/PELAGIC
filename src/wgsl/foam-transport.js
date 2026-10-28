import {replaceShader} from './shader-patch.js';

// Conservative two-flux slab limit: R=tau/(1+tau), T=1/(1+tau).
// Reuses the existing active/residual optical-depth proxies and coverage.
// Bubble absorption, anisotropy and a measured thickness calibration remain open.
export function foamTransportShader(code,query){
  if(query.get('abFoamPattern')==='bubbles'&&code.includes('fn foamCoverage(')){
    code=replaceShader(code,'max(length(dpdx(uv)),length(dpdy(uv)))*10.0;',
      'max(length(dpdx(uv)),length(dpdy(uv)))*61.0;');
  }
  const relief=['relief','skin','volume'].includes(query.get('abFoam'));
  if(!relief&&query.get('abFoam')!=='transport'||!code.includes('fn reflectedEnvironment('))return code;
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
  if(['handoff','population','phase-field','phase-resident'].includes(query.get('abBreaking'))){
    // The event field controls occupied area. Fresh patches retain their slab
    // thickness instead of becoming transparent again as coverage decreases.
    code=replaceShader(code,'let activeTau=5.0*freshK*bubbleThickness;',
      'let activeTau=5.0*bubbleThickness;');
  }
  if(relief){
    const base=['body','layered','volume','slab','transport','angular'].includes(query.get('abWater'))?'volumeNormal':'select(-rasterNormal,rasterNormal,rasterNormal.y>=0.0)';
    code=replaceShader(code,'  let foamAmb=diffuseN/PI;',/* wgsl */`
  // Fresh bubbly rafts damp capillary detail. Their relief is bounded shading,
  // not displaced geometry; residual films retain the underlying water normal.
  let foamBase=${base};
  // Reuse the active population's scale and modulo origin across rebases.
  let mound=textureSample(foamTex,sampR,material*.29+F.patternOrigins[0].xy).b;
  let reliefHeight=(.045+.055*mound)*(1.0-exp(-6.0*fwl.g));
  let dxWorld=dpdx(in.rel);let dyWorld=dpdy(in.rel);
  let planeCross=cross(dxWorld,dyWorld);
  let reciprocal=1.0/max(dot(planeCross,planeCross),1e-10);
  var reliefGradient=(cross(dyWorld,planeCross)*dpdx(reliefHeight)+
    cross(planeCross,dxWorld)*dpdy(reliefHeight))*reciprocal;
  reliefGradient*=min(1.0,.45/max(length(reliefGradient),1e-5));
  let frothNormal=normalize(foamBase-reliefGradient);
  let activeShare=activeCoverage*ra/max(foamMask,.001);
  let foamNormal=normalize(mix(nrm,frothNormal,clamp(activeShare,0.0,1.0)));
  let foamAmb=textureSampleLevel(skyIrradiance,sampC,foamNormal,0.0).rgb/PI;`);
    code=replaceShader(code,'let foamLit=foamAlb*((sunE*max(dot(nrm,Ld),0.0)+moonE*max(dot(nrm,F.moonDir.xyz),0.0))/PI+foamAmb);',
      'let foamLit=foamAlb*((sunE*max(dot(foamNormal,Ld),0.0)+moonE*max(dot(foamNormal,F.moonDir.xyz),0.0))/PI+foamAmb);');
  }
  return replaceShader(code,'  col = mix(col, foamLit, foamMask * 0.95);','  col = mix(col, foamLit, foamMask);');
}
