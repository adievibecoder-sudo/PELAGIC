// Reversible plane-parallel, optically deep single-scattering comparison.
// Diffuse illumination retains the existing empirical multiple-scattering closure.
// Direct multiple scattering and nonlocal transport through waves are not solved.
export function waterTransportShader(code,query) {
  if(query.get('maWater')!=='single-scatter'||!code.includes('fn reflectedEnvironment('))return code;
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
  return code.replace('fn foamCoverage(',/* wgsl */`
fn waterPhase(cosine:f32,molecular:vec3f,particles:vec3f)->vec3f {
  // Rayleigh molecular phase; HG particle backscatter fraction is exactly 1/12.
  let g=0.70223624;
  let phase=(1.0-g*g)/(4.0*PI*pow(max(1.0+g*g-2.0*g*cosine,1e-5),1.5));
  return molecular*(3.0/(16.0*PI))*(1.0+cosine*cosine)+particles*phase;
}
fn foamCoverage(`);
}
