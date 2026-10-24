// Conditional Gaussian mixture over actual FFT sub-footprints. No random ranks.
// Each child retains its unresolved second moment; child means carry the rest.
export const VISIBLE_SLOPES=/* wgsl */`
fn gaussianPhi(x:f32)->f32{return exp(-0.5*x*x)*0.3989422804;}
fn gaussianCDF(x:f32)->f32 {
  let t=1.0/(1.0+0.2316419*abs(x));
  let tail=gaussianPhi(x)*t*(0.31938153+t*(-0.35656378+t*(1.78147794+t*(-1.82125598+t*1.33027443))));
  return select(tail,1.0-tail,x>=0.0);
}
fn visibleSlope(u:f32,beta:f32)->f32 {
  let b=clamp(beta,-5.0,8.0);
  let normalization=max(b*gaussianCDF(b)+gaussianPhi(b),1e-8);
  var lo=-8.0;var hi=min(b,8.0);
  for(var i=0u;i<14u;i++){
    let x=(lo+hi)*0.5;
    let cdf=(b*gaussianCDF(x)+gaussianPhi(x))/normalization;
    if(cdf<u){lo=x;}else{hi=x;}
  }
  return (lo+hi)*0.5;
}
`;

export function footprintOpticsShader(code,query) {
  if(!code.includes('fn reflectedEnvironment('))return code;
  if(query.get('maGlints')==='footprint'){
    const start=code.indexOf('  let spec = sunE *'),end=code.indexOf('\n\n  // ---- sky reflection',start);
    if(start<0||end<0)throw Error('Footprint sunlight splice contract changed');
    code=code.slice(0,start)+/* wgsl */`
  var sunIntegral=0.0;
  for(var sample=0u;sample<4u;sample++){
    let offset=vec2f(select(-0.25,0.25,(sample&1u)!=0u),select(-0.25,0.25,sample>=2u));
    let q=xz+dxXZ*offset.x+dyXZ*offset.y;
    var slope=vec2f(0);var second=vec3f(0);
    for(var c=0u;c<6u;c++){
      let uv=cascadeUV(q,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins);
      let gain=select(1.0,amplitude,c>=3u);
      let dx=dxXZ*F.cascInvL[c>>2u][c&3u]*0.5;
      let dy=dyXZ*F.cascInvL[c>>2u][c&3u]*0.5;
      let m=textureSampleGrad(derivTex,sampR,uv,c,dx,dy).xy*gain;
      let v=textureSampleGrad(momTex,sampR,uv,c,dx,dy).xyz*(gain*gain);
      slope+=m;
      second+=vec3f(max(v.xy-m*m,vec2f(0)),v.z-m.x*m.y);
    }
    slope+=shortDisp.y*amplitudeGradient;
    let childSlope=A*slope;
    let childN=normalize(vec3f(-childSlope.x,1,-childSlope.y));
    let childT=normalize(vec3f(1,childSlope.x,0));
    let childB=normalize(cross(childT,childN));
    let map=mat2x2f(childT.x,childB.x,childT.z,childB.z)*inverseSqrt(1.0+dot(childSlope,childSlope))*A;
    let moment=map*mat2x2f(second.x,second.z,second.z,second.y)*transpose(map);
    let childCov=positiveCovariance(vec3f(moment[0][0],moment[1][1],moment[0][1])+vec3f(F.waterCol.w,F.waterCol.w,0));
    let childV=vec3f(dot(V,childT),dot(V,childN),dot(V,childB));
    let childL=vec3f(dot(Ld,childT),dot(Ld,childN),dot(Ld,childB));
    sunIntegral+=discReflection(V,Ld,childV,childL,childCov,SUN_ANG_R)*0.25;
  }
  let spec=sunE*sunIntegral+moonE*discReflection(V,F.moonDir.xyz,Vl,Ml,cov,F.celestial.y);
`+code.slice(end);
  }
  if(['facet','wave-path'].includes(query.get('maWater'))){
    const marker='  let downwelling=diffuseUp*0.94+sunE*max(Ld.y,0.0)*(1.0-fresnelWater(Ld.y))+moonE*max(F.moonDir.y,0.0)*(1.0-fresnelWater(F.moonDir.y));';
    if(!code.includes(marker))throw Error('Facet illumination splice contract changed');
    code=code.replace(marker,/* wgsl */`
  // Body photons travel metres. Filter the incident interface at their transport
  // scale instead of imprinting capillary normals on diffuse volume radiance.
  let transport=1.0/max(dot(aWater+bb*12.0,vec3f(0.2126,0.7152,0.0722)),0.001);
  var bodySlope=vec2f(0);
  for(var c=0u;c<6u;c++){
    let lod=clamp(log2(transport*TEX_N*F.cascInvL[c>>2u][c&3u]),0.0,8.0);
    bodySlope+=textureSampleLevel(derivTex,sampR,cascadeUV(xz,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins),c,lod).xy;
  }
  let normalBody=normalize(vec3f(-(A*bodySlope).x,1,-(A*bodySlope).y));
  let bodySun=max(dot(normalBody,Ld),0.0);
  let bodyMoon=max(dot(normalBody,F.moonDir.xyz),0.0);
  let incidentSky=textureSampleLevel(skyIrradiance,sampC,normalBody,0.0).rgb;
  let downwelling=incidentSky*0.94+sunE*bodySun*(1.0-fresnelWater(bodySun))+moonE*bodyMoon*(1.0-fresnelWater(bodyMoon));
`);
  }
  if(query.get('maWater')==='wave-path'){
    code=code.replace('  var body=subsurfaceReflectance*downwelling/(1.333*1.333);',/* wgsl */`
  let eta=1.0/1.333;
  let outgoing=-refract(-V,normalBody,eta);
  let toLight=-refract(-Ld,normalBody,eta);
  let molecular=2.0*min(bb,vec3f(0.0007,0.001,0.0015));
  let particle=12.0*max(bb-0.5*molecular,vec3f(0));
  let extinction=aWater+molecular+particle;
  let cosine=dot(-toLight,outgoing);
  let phase=molecular*(3.0/(16.0*PI))*(1.0+cosine*cosine)+particle*(1.0-0.70223624*0.70223624)/(4.0*PI*pow(max(1.0+0.70223624*0.70223624-2.0*0.70223624*cosine,1e-5),1.5));
  let muView=max(dot(outgoing,normalBody),0.1);
  let muLight=max(dot(toLight,normalBody),0.1);
  let point=vec3f(displacedXZ.x,in.height,displacedXZ.y);
  let pathLayer=select(0u,1u,max(abs(displacedXZ.x-F.camPos.x),abs(displacedXZ.y-F.camPos.z))>48.0);
  let spacing=waveMapSpan(pathLayer)/256.0;
  var directBody=vec3f(0);
  for(var channel=0u;channel<3u;channel++){
    let rate=extinction[channel]*(1.0+muView/muLight);
    var integral=0.0;
    for(var tap=0u;tap<4u;tap++){
      // Exponential importance quadrature is exact for the reference plane.
      let distance=-log(1.0-(f32(tap)+0.5)/4.0)/rate;
      let below=point-outgoing*distance;
      let planarPath=distance*muView/muLight;
      var pathToLight=planarPath;
      var valid=1.0;
      for(var iteration=0u;iteration<4u;iteration++){
        let entry=below+toLight*pathToLight;
        let h=atlasHeight(gravityHeight,sampC,entry.xz,F.camPos.xz,pathLayer);
        valid*=h.y;
        pathToLight=max(0.0,pathToLight+(h.x-entry.y)/max(toLight.y,0.2));
      }
      let entry=below+toLight*pathToLight;
      let hx=atlasHeight(gravityHeight,sampC,entry.xz+vec2f(spacing,0),F.camPos.xz,pathLayer);
      let lx=atlasHeight(gravityHeight,sampC,entry.xz-vec2f(spacing,0),F.camPos.xz,pathLayer);
      let hz=atlasHeight(gravityHeight,sampC,entry.xz+vec2f(0,spacing),F.camPos.xz,pathLayer);
      let lz=atlasHeight(gravityHeight,sampC,entry.xz-vec2f(0,spacing),F.camPos.xz,pathLayer);
      valid*=hx.y*lx.y*hz.y*lz.y;
      let entryN=normalize(vec3f(-(hx.x-lx.x)/(2.0*spacing),1,-(hz.x-lz.x)/(2.0*spacing)));
      let muAir=max(dot(entryN,Ld),0.0);
      let entryUV=(entry.xz-waveMapCentre(F.camPos.xz,pathLayer))/waveMapSpan(pathLayer)+0.5;
      let visibility=textureSampleLevel(waveShadow,sampC,entryUV,pathLayer,0.0).r;
      let beam=muAir*(1.0-fresnelWater(muAir))/max(dot(entryN,toLight),0.1)*visibility;
      let reference=bodySun*(1.0-fresnelWater(bodySun))/muLight*waveT.x;
      let correction=exp(clamp(-extinction[channel]*(pathToLight-planarPath),-20.0,5.0));
      integral+=mix(reference,beam*correction,valid)*0.25/rate;
    }
    directBody[channel]=sunIlluminance()[channel]*cloudT*phase[channel]*integral;
  }
  var body=(subsurfaceReflectance*incidentSky*0.94+directBody)*(eta*eta);
`);
    code=code.replace('  body += exp(-(aWater + bb*12.0)*crestPath) * sunE * k1 * 0.035;',
      '  // Direct transport uses the measured wave path; no additive crest glow.');
  }
  if(query.get('maReflection')==='visible'){
    const start=code.indexOf('  var reflected=vec3f(0);'),end=code.indexOf('  let Fr=clamp(',start);
    if(start<0||end<0)throw Error('Visible reflection splice contract changed');
    code=code.slice(0,start)+/* wgsl */`
  var reflected=vec3f(0);var fresnelSum=0.0;let weights=1.0;
  let stretch=vec2f(dot(Vl.xz,ch0),dot(Vl.xz,ch1));
  let sigma=max(length(stretch),1e-7);
  let axis=select(vec2f(1,0),stretch/sigma,dot(stretch,stretch)>1e-14);
  let perpendicular=vec2f(-axis.y,axis.x);
  let quantiles=array<f32,8>(-1.53412054,-0.88714656,-0.48877641,-0.15731068,0.15731068,0.48877641,0.88714656,1.53412054);
  for(var tap=0u;tap<8u;tap++){
    // Sample projected visible density directly. Normalizing sparse NDF taps
    // changes the distribution at grazing angles and can miss visible facets.
    let longitudinal=visibleSlope((f32(tap)+0.5)/8.0,Vl.y/sigma);
    let transverse=quantiles[((tap&1u)<<2u)|(tap&2u)|((tap&4u)>>2u)];
    let gaussian=axis*longitudinal+perpendicular*transverse;
    let off=ch0*gaussian.x+ch1*gaussian.y;
    let facet=normalize(nrm-tangent*off.x-bitangent*off.y);
    let nv=max(dot(facet,V),0.0);let rf=reflect(-V,facet);
    let f=fresnelWater(nv);
    let Rl=vec3f(dot(rf,tangent),dot(rf,nrm),dot(rf,bitangent));
    let visible=select(0.0,(1.0+lambdaSmith(Vl,cov))/(1.0+lambdaSmith(Vl,cov)+lambdaSmith(Rl,cov)),Rl.y>0.0);
    reflected+=reflectedEnvironment(vec3f(displacedXZ.x,in.height,displacedXZ.y),rf,envLod,body)*f*visible/8.0;
    fresnelSum+=f/8.0;
  }
`+code.slice(end);
    code=code.replace('fn foamCoverage(',VISIBLE_SLOPES+'fn foamCoverage(');
  }
  return code;
}
