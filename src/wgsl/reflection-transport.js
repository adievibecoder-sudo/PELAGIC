import {replaceShader} from './shader-patch.js';

// Preserve the atlas coverage estimate, but shade at the first bracketed
// surface crossing rather than at an arbitrarily submerged march sample.
export function reflectionIntersectionShader(code){
  const start=code.indexOf('fn gravityReflectionHit(');
  if(start<0)return code;
  const end=code.indexOf('\n}',start)+2;
  let body=code.slice(start,end);
  body=replaceShader(body,'  var result=vec4f(0);',`  var result=vec4f(0);
  var previousDistance=0.0;var bracket=vec2f(0);var crossed=false;`);
  body=replaceShader(body,'    let hit=smoothstep(-width,width,difference);',`    if(!crossed && difference>=0.0){
      bracket=vec2f(previousDistance,distance);crossed=true;
    }
    let hit=smoothstep(-width,width,difference);`);
  body=replaceShader(body,'    distance*=1.35;','    previousDistance=distance;\n    distance*=1.35;');
  body=replaceShader(body,'  return result;',`  if(crossed){
    for(var refinement=0u;refinement<6u;refinement++){
      let middle=.5*(bracket.x+bracket.y);
      let h=atlasHeight(heights,linearClamp,point.xz+direction*middle,camera,layer);
      if(h.x>=originHeight+middle*tangent){bracket.y=middle;}else{bracket.x=middle;}
    }
    let distance=.5*(bracket.x+bracket.y);
    result=vec4f(point.xz+direction*distance,distance,result.w);
  }
  return result;`);
  return code.slice(0,start)+body+code.slice(end);
}

// Integrate the slope distribution once. Cubemap mips cover a quadrature cell,
// while the quadrature covers the remaining covariance; neither changes the FFT.
export function reflectionTransportShader(code,query){
  if(query.get('abReflection')==='intersection')return reflectionIntersectionShader(code);
  if(query.get('abReflection')==='energy'&&code.includes('fn reflectedEnvironment(')){
    code=replaceShader(code,'  var reflected=vec3f(0);var fresnelSum=0.0;var weights=0.0;',
      '  var reflected=vec3f(0);var fresnelSum=0.0;var escapedFresnel=0.0;var weights=0.0;');
    code=replaceShader(code,'    fresnelSum+=f*w;weights+=w;',
      '    fresnelSum+=f*w;escapedFresnel+=f*w*visible;weights+=w;');
    code=replaceShader(code,'    fresnelSum=f;weights=1.0;',
      '    fresnelSum=f;escapedFresnel=f;weights=1.0;');
    code=replaceShader(code,'  let Fr=clamp(fresnelSum/max(weights,1e-6),0.0,1.0);',`  let Fr=clamp(fresnelSum/max(weights,1e-6),0.0,1.0);
  // Bounded cavity closure: blocked first-bounce reflection enters the water
  // budget. Secondary reflected escape is omitted; the primary lobe is intact.
  let bodyTransmission=1.0-clamp(escapedFresnel/max(weights,1e-6),0.0,1.0);`);
    return replaceShader(code,'body * (1.0 - Fr)','body * bodyTransmission',2);
  }
  if(query.get('abReflection')!=='partition'||!code.includes('fn reflectedEnvironment('))return code;
  code=replaceShader(code,'  let sky=textureSampleLevel(envCube,sampC,ray,lod).rgb;',/* wgsl */`
  var sky=textureSampleLevel(envCube,sampC,ray,lod).rgb;
  // The lower cache contains one flat dielectric reflection, but no body term.
  // Supply the missing transmitted radiance without a recursive cache feedback.
  if(ray.y<0.0){sky+=bodyRadiance*(1.0-fresnelWater(-ray.y));}`);
  const start=code.indexOf('  // Five-point covariance quadrature');
  const end=code.indexOf('  if(weights<1e-5){',start);
  if(start<0||end<0)throw Error('Reflection quadrature splice contract changed');
  code=code.slice(0,start)+/* wgsl */`
  let ch0=vec2f(sqrt(cov.x),cov.z/sqrt(cov.x));
  let ch1=vec2f(0.0,sqrt(max(cov.y-cov.z*cov.z/cov.x,1e-7)));
  // Tensor Gauss-Hermite integrates each resolved cell centre. Allocate 1/4
  // of variance to mip filtering, 3/4 to centres, rather than two full lobes.
  let cellLod=clamp(envLod-1.0,0.0,ENV_MAXMIP);
  let positions=array<f32,3>(-1.5,0.0,1.5);
  let masses=array<f32,3>(1.0/6.0,2.0/3.0,1.0/6.0);
  var reflected=vec3f(0);var fresnelSum=0.0;var weights=0.0;
  for(var tap=0u;tap<9u;tap++){
    let x=tap%3u;let y=tap/3u;
    let off=ch0*positions[x]+ch1*positions[y];
    let facet=normalize(nrm-tangent*off.x-bitangent*off.y);
    let nv=max(dot(facet,V),0.0);
    let w=masses[x]*masses[y]*nv/max(dot(facet,nrm),.001);
    let rf=reflect(-V,facet);let f=fresnelWater(nv);
    let Rl=vec3f(dot(rf,tangent),dot(rf,nrm),dot(rf,bitangent));
    let visible=select(0.0,(1.0+lambdaSmith(Vl,cov))/(1.0+lambdaSmith(Vl,cov)+lambdaSmith(Rl,cov)),Rl.y>0.0);
    reflected+=reflectedEnvironment(vec3f(displacedXZ.x,in.height,displacedXZ.y),rf,cellLod,body)*f*w*visible;
    fresnelSum+=f*w;weights+=w;
  }
`+code.slice(end);
  return code;
}
