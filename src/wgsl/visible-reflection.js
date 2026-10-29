import {replaceShader} from './shader-patch.js';

const normalPDF=x=>Math.exp(-.5*x*x)/Math.sqrt(2*Math.PI);
const normalCDF=x=>{
  const t=1/(1+.2316419*Math.abs(x));
  const tail=normalPDF(x)*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return x<0?tail:1-tail;
};
const nodes=[.0694318442,.3300094782,.6699905218,.9305681558];
export function visibleSlopeQuantile(t,p){
  // Projected Gaussian density: (t-x) phi(x), x<t. Its integral is
  // t Phi(x)+phi(x); normalize by t Phi(t)+phi(t).
  const normalization=t*normalCDF(t)+normalPDF(t);
  let lo=-9,hi=Math.min(t,9);
  for(let i=0;i<56;i++){
    const x=(lo+hi)*.5,cdf=(t*normalCDF(x)+normalPDF(x))/normalization;
    if(cdf<p)lo=x;else hi=x;
  }
  return (lo+hi)*.5;
}
export const VISIBLE_SLOPES=Array.from({length:65},(_,i)=>nodes.map(p=>visibleSlopeQuantile(i===64?1e8:i/(64-i),p)));
export const VISIBLE_QUADRATURE=/* wgsl */`
fn visibleSlopeNodes(t:f32)->vec4f {
  let table=array<vec4f,65>(${VISIBLE_SLOPES.map(v=>'vec4f('+v.join(',')+')').join(',')});
  let coordinate=64.0*t/(1.0+t);
  let lower=min(u32(coordinate),63u);
  return mix(table[lower],table[lower+1u],coordinate-f32(lower));
}
`;

export function visibleReflectionShader(code,query){
  if(query.get('abReflection')!=='visible'||!code.includes('fn reflectedEnvironment('))return code;
  code=replaceShader(code,'fn reflectedEnvironment(',VISIBLE_QUADRATURE+'fn reflectedEnvironment(');
  const start=code.indexOf('  // Five-point covariance quadrature'),end=code.indexOf('  if(weights<1e-5){',start);
  if(start<0||end<0)throw Error('Visible reflection splice contract changed');
  const legacy=code.slice(start,end);
  const loop=legacy.slice(legacy.indexOf('  for(var tap='));
  return code.slice(0,start)+/* wgsl */`
  let ch0=vec2f(sqrt(cov.x),cov.z/sqrt(cov.x));
  let ch1=vec2f(0.0,sqrt(max(cov.y-cov.z*cov.z/cov.x,1e-7)));
  var reflected=vec3f(0);var fresnelSum=0.0;var weights=0.0;
  if(Vl.y>0.0){
    let projected=vec2f(dot(Vl.xz,ch0),dot(Vl.xz,ch1));
    let sigma=length(projected);
    let direction=select(vec2f(1,0),projected/max(sigma,1e-8),sigma>1e-8);
    let across=vec2f(-direction.y,direction.x);
    let longitudinal=visibleSlopeNodes(min(Vl.y/max(sigma,1e-8),1e6));
    let masses=vec4f(.1739274226,.3260725774,.3260725774,.1739274226);
    for(var tap=0u;tap<8u;tap++){
      let standard=direction*longitudinal[tap/2u]+across*select(-1.0,1.0,(tap&1u)==1u);
      let off=ch0*standard.x+ch1*standard.y;
      let facet=normalize(nrm-tangent*off.x-bitangent*off.y);
      let nv=max(dot(facet,V),0.0);
      let rf=reflect(-V,facet);let f=fresnelWater(nv);let w=masses[tap/2u]*.5;
      let Rl=vec3f(dot(rf,tangent),dot(rf,nrm),dot(rf,bitangent));
      let visible=select(0.0,(1.0+lambdaSmith(Vl,cov))/(1.0+lambdaSmith(Vl,cov)+lambdaSmith(Rl,cov)),Rl.y>0.0);
      reflected+=reflectedEnvironment(vec3f(displacedXZ.x,in.height,displacedXZ.y),rf,envLod,body)*f*w*visible;
      fresnelSum+=f*w;weights+=w;
    }
  }else{
`+loop+'  }\n'+code.slice(end);
}
