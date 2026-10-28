import {replaceShader} from './shader-patch.js';
import {CLOUD_LIGHT_PATH} from './cloud-light-path.js';

export function environmentLightShader(code,query){
  const sunset=query.get('abEnvironment')==='marine-sunset';
  const diffusion=sunset||query.get('abEnvironment')==='marine-diffuse';
  const marine=diffusion||query.get('abEnvironment')==='marine';
  if(!marine&&query.get('abEnvironment')!=='coupled')return code;
  if(code.includes('fn cloudDensityFiltered(')){
    code=replaceShader(code,'  let cover=clamp(coverage+(weather.a-0.5)*3.2+(cell.a-0.5)*0.65,0.0,1.0);',`  // An overcast storm must approach closed coverage. The old fixed-amplitude
  // weather offset could erase a bank even at coverage=1.
  let organization=mix(1.0,1.0-coverage,storm*smoothstep(.55,.95,coverage));
  let cover=clamp(coverage+((weather.a-.5)*3.2+(cell.a-.5)*.65)*organization,0.0,1.0);`);
    code=replaceShader(code,'    cumulus=max(cumulus,deck*storm*smoothstep(0.65,0.96,cover));',`    let overcast=storm*smoothstep(.65,.98,cover);
    let lowerDeck=profile*(.18+.45*shape.r)*overcast;
    cumulus=max(cumulus,max(deck*overcast,lowerDeck));`);
    if(marine){
      code=replaceShader(code,'  let baseHeight=F.cloudP.x+layerDepth*(0.025+0.14*cell.a);',`  var baseRelief=0.0;
  if(storm>0.001){
    let bank=textureSampleLevel(cloudNoise,cloudNoiseSampler,vec3f(world.x*.19,.23,world.z*.19),max(log2(max(footprint,.001)*24.32),0.0));
    baseRelief=storm*(.035+.22*bank.b);
  }
  let baseHeight=F.cloudP.x+layerDepth*(0.025+0.14*cell.a+baseRelief);`);
    }
  }
  if(marine&&code.includes('fn cloudLayers(')){
    if(!code.includes('fn cloudLightExtent('))code+=CLOUD_LIGHT_PATH;
    // The legacy geometric march ends inside deep storm banks at low Sun.
    // Keep its daytime result; cover the full occupied shell for storms.
    code=replaceShader(code,'      let sigma=F.cloudP.z*6.0;',`      let stormLighting=regionalTypes(p.xz).z*smoothstep(.65,.95,regionalCoverage(p.xz));
      var stormShadow=shadow;
      if(stormLighting>0.001){
        stormShadow=mix(shadow,cloudLightIntegral(p,F.sunDir.xyz,u32(F.control.y)*2u),stormLighting);
      }
      let sigma=F.cloudP.z*6.0;`);
    code=replaceShader(code,'      let optical=shadow*sigma;','      let optical=stormShadow*sigma;');
    code=replaceShader(code,'          moonOptical*=sigma;',`          if(stormLighting>0.001){
            moonOptical=mix(moonOptical,cloudLightIntegral(p,F.moonDir.xyz,u32(F.control.y)*2u),stormLighting);
          }
          moonOptical*=sigma;`);
    code=replaceShader(code,'fn cloudLayers(',/* wgsl */`
// Conservative diffuse slab transmission follows occupied column depth.
// Restricted to storm banks; ordinary daytime clouds keep their lighting.
fn stormDiffuseTransmission(p:vec3f,sigma:f32)->f32 {
  let altitude=p.y+dot(p.xz,p.xz)/(2.0*RG);
  let depth=max(F.cloudP.x+mix(F.regional.y,3.5,regionalWeight(p.xz))-altitude,0.0);
  var column=0.0;
  for(var i=0u;i<4u;i++){
    column+=cloudDensityFiltered(p+vec3f(0,depth*(f32(i)+.5)*.25,0),false,depth*.035)*depth*.25;
  }
  let transport=column*sigma*(1.0-(.85*.68+.15*(-.25)));
  return 1.0/(1.0+.75*transport);
}
fn cloudLayers(`);
    code=replaceShader(code,'      let light=ambient*mix(0.18,1.0,sqrt(height))+sun*(direct+multi)+lunar;',`      var diffuseEscape=mix(.18,1.0,sqrt(height));
      if(stormLighting>0.001){
        diffuseEscape=mix(diffuseEscape,stormDiffuseTransmission(p,sigma),stormLighting);
      }
      let light=ambient*diffuseEscape+sun*(direct+multi)+lunar;`);
    if(diffusion){
      // Direct beam attenuation follows the slanted Sun path. After scattering,
      // diffuse transport follows the cloud column, not that same beam path.
      code=replaceShader(code,'      let direct=exp(-optical)*phase;',`      var columnEscape=1.0;
      if(stormLighting>0.001){columnEscape=stormDiffuseTransmission(p,sigma);}
      let direct=exp(-optical)*phase;`);
      code=replaceShader(code,'      let light=ambient*diffuseEscape+sun*(direct+multi)+lunar;',`      let diffuseSolar=max(F.sunDir.y,0.0)*(1.0-exp(-optical))*columnEscape/PI;
      let scattered=mix(multi,diffuseSolar,stormLighting);
      let light=ambient*diffuseEscape+sun*(direct+scattered)+lunar;`);
      code=replaceShader(code,'          lunar=sampleTrans(radius,moonMu)*F.celestial.x*(exp(-moonOptical)*moonPhase+moonMulti);',`          let diffuseMoon=max(F.moonDir.y,0.0)*(1.0-exp(-moonOptical))*columnEscape/PI;
          lunar=sampleTrans(radius,moonMu)*F.celestial.x*(exp(-moonOptical)*moonPhase+mix(moonMulti,diffuseMoon,stormLighting));`);
      code=replaceShader(code,'diffuseEscape=mix(diffuseEscape,stormDiffuseTransmission(p,sigma),stormLighting);',
        'diffuseEscape=mix(diffuseEscape,columnEscape,stormLighting);');
    }
    if(sunset){
      code=replaceShader(code,'      let stormLighting=regionalTypes(p.xz).z*smoothstep(.65,.95,regionalCoverage(p.xz));',`      let stormBank=regionalTypes(p.xz).z*smoothstep(.65,.95,regionalCoverage(p.xz));
      // Extend complete light paths and column transport to grazing sunlight.
      // Preserve the verified ordinary daytime branch above 25 degrees.
      let grazingSun=1.0-smoothstep(.173648178,.422618262,F.sunDir.y);
      let stormLighting=max(stormBank,grazingSun);`);
    }
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
