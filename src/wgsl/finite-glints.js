// Finite-facet diagnostic: preserve expected linear radiance, inspect whether
// averaging the slope population before tone mapping erases glitter contrast.
// Correlation-area and Gaussian-rank closures require temporal validation.
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
  if(query.get('maGlints')!=='finite'||!code.includes('fn reflectedEnvironment('))return code;
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
  return code.replace('fn foamCoverage(',GLINT_STATISTICS+'fn foamCoverage(');
}
