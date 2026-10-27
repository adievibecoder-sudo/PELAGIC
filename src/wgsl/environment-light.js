import {replaceShader} from './shader-patch.js';

export function environmentLightShader(code,query){
  if(query.get('abEnvironment')!=='coupled')return code;
  if(code.includes('fn cloudDensityFiltered(')){
    code=replaceShader(code,'  let cover=clamp(coverage+(weather.a-0.5)*3.2+(cell.a-0.5)*0.65,0.0,1.0);',`  // An overcast storm must approach closed coverage. The old fixed-amplitude
  // weather offset could erase a bank even at coverage=1.
  let organization=mix(1.0,1.0-coverage,storm*smoothstep(.55,.95,coverage));
  let cover=clamp(coverage+((weather.a-.5)*3.2+(cell.a-.5)*.65)*organization,0.0,1.0);`);
    code=replaceShader(code,'    cumulus=max(cumulus,deck*storm*smoothstep(0.65,0.96,cover));',`    let overcast=storm*smoothstep(.65,.98,cover);
    let lowerDeck=profile*(.18+.45*shape.r)*overcast;
    cumulus=max(cumulus,max(deck*overcast,lowerDeck));`);
  }
  if(code.includes('fn reflectedEnvironment(')){
    // The near-sea haze sees cloud-covered radiance, not the clear-sky LUT
    // behind an opaque storm. This shares the existing acyclic angular cache.
    code=replaceShader(code,'  let fogCol = skyAtmo(hz);',
      '  let fogCol = textureSampleLevel(envCube,sampC,hz,2.0).rgb;');
    code=replaceShader(code,'  let T = exp(-max(F.fogExt.rgb, vec3f(F.fogExt.w)) * dist);',/* wgsl */`
  let rainColumn=textureSampleLevel(cloudShadow,sampC,shadowUV,0.0).b;
  let marineExtinction=vec3f(.000015+rainColumn*.00065);
  let T=exp(-max(F.fogExt.rgb,marineExtinction)*dist);`);
  }
  if(code.includes('fn nightStars(')){
    // Star radiance shares solar/lunar units and night exposure. The old .018
    // scale made a tiny star hundreds of times brighter than lunar sky.
    code=replaceShader(code,'*stars*0.018*F.solarDir.w',
      '*stars*0.00006*F.solarDir.w');
  }
  return code;
}
