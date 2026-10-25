import {replaceShader} from './shader-patch.js';

// Local two-interface single scattering. The resolved height field determines
// the illuminated entry flank; it cannot represent overturning or caustics.
export const CREST_TRANSPORT = /* wgsl */`
fn crestSurface(p:vec2f,layer:u32)->vec4f {
  let spacing=waveMapSpan(layer)/256.0;
  let h=atlasHeight(gravityHeight,sampC,p,F.camPos.xz,layer);
  let dx=atlasHeight(gravityHeight,sampC,p+vec2f(spacing,0),F.camPos.xz,layer);
  let lx=atlasHeight(gravityHeight,sampC,p-vec2f(spacing,0),F.camPos.xz,layer);
  let dz=atlasHeight(gravityHeight,sampC,p+vec2f(0,spacing),F.camPos.xz,layer);
  let lz=atlasHeight(gravityHeight,sampC,p-vec2f(0,spacing),F.camPos.xz,layer);
  return vec4f((vec2f(dx.x-lx.x,dz.x-lz.x)/(2.0*spacing)),h.x,h.y*dx.y*lx.y*dz.y*lz.y);
}

fn crestSunScatter(point:vec3f,V:vec3f,L:vec3f,extinction:vec3f,molecular:vec3f,particle:vec3f,layer:u32)->vec3f {
  let surface=crestSurface(point.xz,layer);
  let normal=normalize(vec3f(-surface.x,1,-surface.y));
  let outgoing=-refract(-V,normal,1.0/1.333);
  let incoming=-refract(-L,normal,1.0/1.333);
  let muV=max(dot(outgoing,normal),0.05);
  let muL=max(dot(incoming,normal),0.05);
  let rate=extinction*(1.0+muV/muL);
  let muAir=max(dot(normal,L),0.0);
  let planar=muAir*(1.0-fresnelWater(muAir))/muL;
  let phase=waterPhase(dot(-incoming,outgoing),molecular,particle);
  let referenceUV=(point.xz-waveMapCentre(F.camPos.xz,layer))/waveMapSpan(layer)+0.5;
  let referenceShadow=textureSampleLevel(waveShadow,sampC,referenceUV,layer,0.0).r;
  let referenceCloud=textureSampleLevel(cloudShadow,sampC,clamp((point.xz-F.camPos.xz)/40000.0+0.5,vec2f(.001),vec2f(.999)),0.0).r;
  let reference=phase*planar*referenceShadow*referenceCloud;
  var result=reference/rate;
  // Three RGB exponential-importance nodes. A plane is integrated exactly;
  // only the shape correction is quadrature-approximated.
  for(var tap=0u;tap<3u;tap++){
    let optical=-log(1.0-(f32(tap)+0.5)/3.0);
    let distance=optical/max(dot(rate,vec3f(.2126,.7152,.0722)),0.001);
    let sample=vec3f(point.x,surface.z,point.z)-outgoing*distance;
    let planarPath=distance*muV/muL;
    var entry=sample+incoming*planarPath;
    var toLight=incoming;
    var path=planarPath;
    var valid=surface.w;
    var entryNormal=normal;
    for(var iteration=0u;iteration<3u;iteration++){
      let s=crestSurface(entry.xz,layer);
      valid*=s.w;
      entryNormal=normalize(vec3f(-s.x,1,-s.y));
      toLight=-refract(-L,entryNormal,1.0/1.333);
      path=max(0.0,(s.z-sample.y)/max(toLight.y,0.15));
      entry=sample+toLight*path;
    }
    let end=crestSurface(entry.xz,layer);
    // Reject an unconverged or out-of-atlas ray instead of inventing light.
    valid*=end.w*(1.0-smoothstep(0.05,0.3,abs(entry.y-end.z)));
    let incident=max(dot(entryNormal,L),0.0);
    let beam=incident*(1.0-fresnelWater(incident))/max(dot(entryNormal,toLight),0.05);
    let shadowUV=clamp((entry.xz-F.camPos.xz)/40000.0+0.5,vec2f(.001),vec2f(.999));
    let cloud=textureSampleLevel(cloudShadow,sampC,shadowUV,0.0).r;
    let waveUV=(entry.xz-waveMapCentre(F.camPos.xz,layer))/waveMapSpan(layer)+0.5;
    let shadow=textureSampleLevel(waveShadow,sampC,waveUV,layer,0.0).r;
    let samplePhase=waterPhase(dot(-toLight,outgoing),molecular,particle);
    let changed=cloud*samplePhase*beam*shadow*exp(clamp(-extinction*(path-planarPath),vec3f(-20),vec3f(5)));
    // Importance PDF shared across RGB: retain its exact per-channel weight.
    let samplingRate=max(dot(rate,vec3f(.2126,.7152,.0722)),0.001);
    result+=valid*(changed-reference)*exp((vec3f(samplingRate)-rate)*distance)/(3.0*samplingRate);
  }
  return max(result,vec3f(0));
}
`;

export function crestTransportShader(code,query){
  if(query.get('abWater')!=='crest-path'||!code.includes('fn reflectedEnvironment('))return code;
  code=replaceShader(code,'fn reflectedEnvironment(',CREST_TRANSPORT+'fn reflectedEnvironment(');
  code=replaceShader(code,'  var body=subsurfaceReflectance*downwelling/(1.333*1.333);',/* wgsl */`
  var body=subsurfaceReflectance*downwelling/(1.333*1.333);
  let crestDistance=max(abs(displacedXZ.x-F.camPos.x),abs(displacedXZ.y-F.camPos.z));
  let transportBlend=1.0-smoothstep(80.0,120.0,crestDistance);
  if(transportBlend>0.0 && Ld.y>0.0){
    let molecular=waterMolecularScatter(bb);
    let particles=waterParticleScatter(bb);
    let extinction=aWater+molecular+particles;
    let layer=select(0u,1u,crestDistance>48.0);
    let direct=crestSunScatter(vec3f(displacedXZ.x,in.height,displacedXZ.y),V,Ld,extinction,molecular,particles,layer)*sunIlluminance();
    let diffuse=subsurfaceReflectance*(diffuseUp*0.94+moonE*max(F.moonDir.y,0.0)*(1.0-fresnelWater(F.moonDir.y)));
    body=mix(body,(diffuse+direct)/(1.333*1.333),transportBlend);
  }
`);
  return replaceShader(code,'  body += exp(-(aWater + bb*12.0)*crestPath) * sunE * k1 * 0.035;',
    '  // Geometry-conditioned transport replaces the additive crest glow.');
}
