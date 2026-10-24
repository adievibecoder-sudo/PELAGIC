// Reversible plane-parallel, optically deep single-scattering comparison.
// Diffuse illumination retains the existing empirical multiple-scattering closure.
// Direct multiple scattering and nonlocal transport through waves are not solved.
export function waterTransportShader(code,query) {
  const mode=query.get('maWater');
  if(!['single-scatter','angular'].includes(mode)||!code.includes('fn reflectedEnvironment('))return code;
  const marker='  var body=subsurfaceReflectance*downwelling/(1.333*1.333);';
  if(code.split(marker).length!==2)throw Error('Water transport splice contract changed');
  code=code.replace(marker,/* wgsl */`
  let eta=1.0/1.333;
  let viewInWater=-refract(-V,nrm,eta);
  let sunInWater=refract(-Ld,nrm,eta);
  let moonInWater=refract(-F.moonDir.xyz,nrm,eta);
  let molecularBB=min(bb,vec3f(0.0007,0.001,0.0015));
  let molecularScatter=2.0*molecularBB;
  let particleScatter=12.0*max(bb-molecularBB,vec3f(0));
  let extinction=aWater+molecularScatter+particleScatter;
  let muV=max(dot(viewInWater,nrm),0.001);
  let muSun=max(-dot(sunInWater,nrm),0.001);
  let muMoon=max(-dot(moonInWater,nrm),0.001);
  let directSun=sunE*max(Ll.y,0.0)*(1.0-fresnelWater(Ll.y));
  let directMoon=moonE*max(Ml.y,0.0)*(1.0-fresnelWater(Ml.y));
  var body=(subsurfaceReflectance*diffuseUp*0.94+
    directSun*waterPhase(dot(sunInWater,viewInWater),molecularScatter,particleScatter)/(extinction*(muSun+muV))+
    directMoon*waterPhase(dot(moonInWater,viewInWater),molecularScatter,particleScatter)/(extinction*(muMoon+muV)))*(eta*eta);
  `);
  code=code.replace('  body += exp(-(aWater + bb*12.0)*crestPath) * sunE * k1 * 0.035;',
    '  // The direct scattering integral replaces the heuristic crest glow in this comparison.');
  if(mode==='angular'){
    code=code.replace('  let eta=1.0/1.333;',/* wgsl */`
  // Volume illumination integrates over a transport-scale interface, not each
  // capillary normal. Extinction sets that scale in metres.
  let transport=1.0/max(dot(aWater+12.0*bb,vec3f(.2126,.7152,.0722)),.001);
  var incidentSlope=vec2f(0);
  for(var c=0u;c<6u;c++){
    let lod=clamp(log2(transport*TEX_N*F.cascInvL[c>>2u][c&3u]),0.0,8.0);
    incidentSlope+=textureSampleLevel(derivTex,sampR,cascadeUV(xz,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins),c,lod).xy;
  }
  let ns=normalize(vec3f(-(A*incidentSlope).x,1,-(A*incidentSlope).y));
  let eta=1.0/1.333;`);
    code=code.replaceAll('refract(-V,nrm,eta)','refract(-V,ns,eta)')
      .replaceAll('refract(-Ld,nrm,eta)','refract(-Ld,ns,eta)')
      .replaceAll('refract(-F.moonDir.xyz,nrm,eta)','refract(-F.moonDir.xyz,ns,eta)')
      .replaceAll('dot(viewInWater,nrm)','dot(viewInWater,ns)')
      .replaceAll('dot(sunInWater,nrm)','dot(sunInWater,ns)')
      .replaceAll('dot(moonInWater,nrm)','dot(moonInWater,ns)')
      .replaceAll('max(Ll.y,0.0)*(1.0-fresnelWater(Ll.y))','max(dot(Ld,ns),0.0)*(1.0-fresnelWater(dot(Ld,ns)))')
      .replaceAll('max(Ml.y,0.0)*(1.0-fresnelWater(Ml.y))','max(dot(F.moonDir.xyz,ns),0.0)*(1.0-fresnelWater(dot(F.moonDir.xyz,ns)))');
    code=code.replace('  var body=(subsurfaceReflectance*diffuseUp*0.94+',/* wgsl */`
  let incidentT=normalize(vec3f(1,-ns.x/max(ns.y,.001),0));
  let incidentB=cross(incidentT,ns);
  var skyScatter=vec3f(0);
  for(var ring=0u;ring<2u;ring++){
    // Gauss-Legendre in cosine, four azimuths. Solid angle = pi/4 per tap.
    let mu=select(.2113248654,.7886751346,ring==1u);
    for(var azimuth=0u;azimuth<4u;azimuth++){
      let phi=(f32(azimuth)+.5*f32(ring))*PI*.5;
      let light=ns*mu+sqrt(1.0-mu*mu)*(incidentT*cos(phi)+incidentB*sin(phi));
      let direction=refract(-light,ns,eta);
      let muLight=max(-dot(direction,ns),.001);
      let incident=textureSampleLevel(envCube,sampC,light,1.0).rgb;
      skyScatter+=incident*mu*(1.0-fresnelWater(mu))*waterPhase(dot(direction,viewInWater),molecularScatter,particleScatter)/(extinction*(muLight+muV))*(PI*.25);
    }
  }
  // First-order angular transport only; multiple scattering is not represented.
  var body=(skyScatter+`);
  }
  return code.replace('fn foamCoverage(',/* wgsl */`
fn waterPhase(cosine:f32,molecular:vec3f,particles:vec3f)->vec3f {
  // Rayleigh molecular phase; HG particle backscatter fraction is exactly 1/12.
  let g=0.70223624;
  let phase=(1.0-g*g)/(4.0*PI*pow(max(1.0+g*g-2.0*g*cosine,1e-5),1.5));
  return molecular*(3.0/(16.0*PI))*(1.0+cosine*cosine)+particles*phase;
}
fn foamCoverage(`);
}
