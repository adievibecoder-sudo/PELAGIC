import {replaceShader} from './shader-patch.js';

// Exact support rejection for the legacy density, not a coarser raymarch.
// The cumulus contribution is identically zero at thermal <= -0.32.
// A contributing lobe has normalized radius < 1.32. Conservative maxima:
// h = 0.52 + 0.44*1.32 = 1.1008; |q.xy| = 0.7 + 0.62*1.32 = 1.5184.
export function cloudWorkShader(code,query){
  if(query.get('abCloudWork')==='off'||query.has('maCloud')||query.has('p0Cloud')||!code.includes('fn thermalShape('))return code;
  code=replaceShader(code,'  var field=-1.0;','  var field=-0.32;');
  code=replaceShader(code,'    let radius=size*(0.17+0.29*random.x)*pow(strength,0.333333);',`    // Bounds include all three lobes and their soft support.
    if(h<=-0.01 || h>1.101){continue;}
    let radius=size*(0.17+0.29*random.x)*pow(strength,0.333333);`);
  code=replaceShader(code,'    let core=1.0-length(q);',`    if(any(abs(q.xy)>vec2f(1.519))){continue;}
    let core=1.0-length(q);`);
  code=replaceShader(code,'  let shape=textureSampleLevel(cloudNoise,cloudNoiseSampler,q,lod);',`  var thermal=-1.0;
  if(strat<0.9999){thermal=thermalShape(world,altitude,cover,storm,layerDepth);}
  // Pure cumulus has no deck or stratus term outside thermal support.
  if(strat==0.0 && (storm==0.0 || cover<=0.65) && thermal<=-0.32){return 0.0;}
  let shape=textureSampleLevel(cloudNoise,cloudNoiseSampler,q,lod);`);
  code=replaceShader(code,'    let thermal=thermalShape(world,altitude,cover,storm,layerDepth);','    // Support was evaluated before the shape texture.');
  return code;
}

export function environmentSymmetryShader(code,query){
  if(query.get('abEnvWork')==='off'||!code.includes('const ENV: f32'))return code;
  const start=code.indexOf('  var L: vec3f;'),end=code.indexOf('\n}',start);
  if(start<0||end<0)throw Error('Environment symmetry splice contract changed');
  return code.slice(0,start)+/* wgsl */`
  // Each lower-hemisphere proxy ray is exactly a mirrored upper ray from the
  // same frozen cache snapshot. Write both once; publication stays atomic.
  if(face==3u || (face!=2u && id.y>=u32(ENV)/2u)){return;}
  let L=skyRadiance(dir,false,1.5708/ENV*1.5);
  let ci=max(dir.y,0.00001);
  let ct=sqrt(1.0-(1.0-ci*ci)/(1.333*1.333));
  let rs=(ci-1.333*ct)/(ci+1.333*ct);let rp=(1.333*ci-ct)/(1.333*ci+ct);
  let fresnel=0.5*(rs*rs+rp*rp);
  textureStore(dst,id.xy,face,vec4f(L,1));
  textureStore(dst,vec2u(id.x,u32(ENV)-1u-id.y),select(face,3u,face==2u),vec4f(L*fresnel,1));
`+code.slice(end);
}
