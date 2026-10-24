// Finite-facet diagnostic: preserve expected linear radiance, inspect whether
// averaging the slope population before tone mapping erases glitter contrast.
// Correlation-area and Gaussian-rank closures require temporal validation.
import {glintCorrelation} from '../glint-correlation.js';
import {CONFIG} from './common.js';
import {expectShaderMarkers} from './shader-patch.js';
export const GLINT_STATISTICS=/* wgsl */`
fn normalCDF(x:f32)->f32 {
  let z=abs(x);let t=1.0/(1.0+0.2316419*z);
  let tail=0.39894228*exp(-0.5*z*z)*t*(0.31938153+t*(-0.35656378+t*(1.78147794+t*(-1.82125598+t*1.33027443))));
  return clamp(select(tail,1.0-tail,x>=0.0),0.0000001,0.9999999);
}
fn finiteGlintWeight(expected:f32,rank:f32)->f32 {
  if(expected>=16.0){return 1.0;}
  let mean=max(expected,0.00001);
  var probability=exp(-mean);var cdf=probability;var count=0u;
  for(var k=1u;k<40u;k++){
    if(rank<=cdf){break;}
    count=k;probability*=mean/f32(k);cdf+=probability;
  }
  return mix(f32(count)/mean,1.0,smoothstep(8.0,16.0,expected));
}
`;

export function finiteGlintsShader(code,query) {
  const mode=query.get('maGlints');
  if(!['finite','coherent','conditional'].includes(mode)||!code.includes('fn reflectedEnvironment('))return code;
  expectShaderMarkers(code,'Finite glitter',['  var cov = vec3f(0.0);','    s += dv.xy;','  let spec = sunE *','fn foamCoverage(']);
  code=code.replace('  var cov = vec3f(0.0);','  var cov = vec3f(0.0);\n  var glintRank=0.5;');
  code=code.replace('    s += dv.xy;',/* wgsl */`
    if(c==5u){
      // A displaced phase sample decorrelates the rank from the local mean
      // normal. Subtracting that mean collapses the rank at resolved LODs.
      // The Gaussian marginal belongs to a simulation texel. Bilinear
      // interpolation narrows that marginal and biases rare-event counts.
      let cell=vec2i(floor(fract(uv+vec2f(0.381966,0.618034))*TEX_N));
      let raw=textureLoad(derivTex,cell,i32(c),0).x;
      let variance=textureSampleLevel(momTex,sampR,uv,c,8.0).x;
      glintRank=normalCDF(raw/sqrt(max(variance,1e-8)));
    }
    s += dv.xy;`);
  code=code.replace('  let spec = sunE *',/* wgsl */`
  let discCov=sourceCovariance(Vl,Ll);
  let discSlopeArea=4.0*PI*sqrt(max(discCov.x*discCov.y-discCov.z*discCov.z,0.0));
  let pixelArea=abs(dxXZ.x*dyXZ.y-dxXZ.y*dyXZ.x)*max(jac,0.18);
  let population=max(pixelArea/max(F.roughnessOffset.z,1e-8),1.0);
  let expected=population*min(pdf*discSlopeArea,1.0);
  // A sub-cell footprint sees one correlated facet, not a continuous slope
  // population. The filtered normal alone does not resolve that population.
  let glitter=finiteGlintWeight(expected,glintRank);
  let spec = glitter*sunE *`);
  if(['coherent','conditional'].includes(mode)){
    // Fixed-sea diagnostics: these constants describe the initial URL spectrum.
    // Live sea-state transitions require refreshed covariance, not these trials.
    const correlation=glintCorrelation(CONFIG);
    code=code.replace('let raw=textureLoad(derivTex,cell,i32(c),0).x;',/* wgsl */`
      let phase=fract(uv+vec2f(0.381966,0.618034));
      let f=fract(phase*TEX_N-0.5);
      let weights=vec4f((1.0-f.x)*(1.0-f.y),f.x*(1.0-f.y),(1.0-f.x)*f.y,f.x*f.y);
      let correlations=vec4f(${correlation.neighbours.map(x=>x.toFixed(9)).join(',')});
      let varianceScale=dot(weights,weights)+2.0*(
        (weights.x*weights.y+weights.z*weights.w)*correlations.x+
        (weights.x*weights.z+weights.y*weights.w)*correlations.y+
        weights.x*weights.w*correlations.z+weights.y*weights.z*correlations.w);
      let raw=textureSampleLevel(derivTex,sampR,phase,c,0.0).x/sqrt(max(varianceScale,0.0001));
`);
    code=code.replace('  let glitter=finiteGlintWeight(expected,glintRank);',/* wgsl */`
  // Conservative rank-space exposure comparison, not exact shutter transport.
  // Width uses the initial spectrum's RMS slope frequency and a 1/60 s shutter.
  let shutterWidth=min(1.0,${correlation.rmsFrequency.toFixed(9)}*(1.0/60.0)*0.39894228);
  let glitter=filteredGlintWeight(expected,glintRank,shutterWidth);
`);
    code=code.replace('fn foamCoverage(',FILTERED_GLINTS+'fn foamCoverage(');
    if(mode==='conditional'){
      code=code.replace('let glitter=filteredGlintWeight(expected,glintRank,shutterWidth);',
        `let glitter=conditionalGlintWeight(expected,glintRank,vec3f(${correlation.shutterCorrelation.map(x=>x.toFixed(9)).join(',')}));`);
      code=code.replace('fn foamCoverage(',CONDITIONAL_GLINTS+'fn foamCoverage(');
    }
  }
  return code.replace('fn foamCoverage(',GLINT_STATISTICS+'fn foamCoverage(');
}

export const FILTERED_GLINTS=/* wgsl */`
fn quantileIntegral(mean:f32,start:f32,finish:f32)->f32 {
  var p=exp(-mean);var low=0.0;var high=p;var integral=0.0;
  for(var k=0u;k<40u;k++){
    integral+=f32(k)*max(0.0,min(finish,high)-max(start,low));
    if(high>=finish){break;}
    low=high;p*=mean/f32(k+1u);high+=p;
  }
  return integral;
}
fn filteredGlintWeight(expected:f32,rank:f32,width:f32)->f32 {
  if(expected>=16.0||width>=0.9999){return 1.0;}
  let mean=max(expected,0.00001);let w=clamp(width,0.0001,1.0);
  let start=fract(rank-w*.5);let finish=start+w;
  let integral=quantileIntegral(mean,start,min(finish,1.0))+quantileIntegral(mean,0.0,max(finish-1.0,0.0));
  return mix(integral/(w*mean),1.0,smoothstep(8.0,16.0,expected));
}
`;

export const CONDITIONAL_GLINTS=/* wgsl */`
fn inverseNormal(p:f32)->f32 {
  let tail=min(p,1.0-p);
  if(tail<.02425){
    let q=sqrt(-2.0*log(max(tail,1e-8)));
    let a=((((-.00778489400243*q-.322396458041)*q-2.40075827716)*q-2.54973253934)*q+4.37466414146)*q+2.93816398270;
    let b=(((.00778469570904*q+.322467129070)*q+2.44513413714)*q+3.75440866191)*q+1.0;
    return select(-a/b,a/b,p<.5);
  }
  let q=p-.5;let r=q*q;
  let a=((((-39.6968302867*r+220.946098425)*r-275.928510447)*r+138.357751867)*r-30.6647980661)*r+2.50662827746;
  let b=((((-54.4760987982*r+161.585836858)*r-155.698979860)*r+66.8013118877)*r-13.2806815529)*r+1.0;
  return a*q/b;
}
fn conditionalGlintWeight(expected:f32,rank:f32,correlation:vec3f)->f32 {
  if(expected>=16.0){return 1.0;}
  let mean=max(expected,.00001);let z=inverseNormal(rank);
  let variance=sqrt(max(vec3f(1)-correlation*correlation,vec3f(1e-6)));
  let weights=vec3f(.4679139346,.3607615730,.1713244924);
  var probability=exp(-mean);var cdf=probability;var count=0.0;
  // Conditional Gaussian exposure kernel. Integrating over the stationary
  // Gaussian marginal preserves the Poisson mean for every shutter sample.
  for(var k=1u;k<40u;k++){
    if(cdf>=.9999999){break;}
    let threshold=inverseNormal(cdf);
    let x=(correlation*z-vec3f(threshold))/variance;
    count+=dot(vec3f(normalCDF(x.x),normalCDF(x.y),normalCDF(x.z)),weights);
    probability*=mean/f32(k);cdf+=probability;
  }
  return mix(count/mean,1.0,smoothstep(8.0,16.0,expected));
}
`;
