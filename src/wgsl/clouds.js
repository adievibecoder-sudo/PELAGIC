// Original finite-volume cloud approximation. Distances in kilometres; extinction in 1/km.
// Front-to-back Beer integration with sampled self-shadowing. Not a fluid cloud simulation.
export const CLOUD_VOLUME = /* wgsl */ `
@group(0) @binding(5) var cloudNoise:texture_3d<f32>;
@group(0) @binding(6) var cloudNoiseSampler:sampler;
fn hash3(p: vec3f) -> f32 {
  var q=fract(p*0.1031);
  q+=dot(q,q.yzx+33.33);
  return fract((q.x+q.y)*q.z);
}
fn noise3(p: vec3f) -> f32 {
  let i=floor(p); let f=fract(p); let u=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash3(i),hash3(i+vec3f(1,0,0)),u.x),mix(hash3(i+vec3f(0,1,0)),hash3(i+vec3f(1,1,0)),u.x),u.y),
    mix(mix(hash3(i+vec3f(0,0,1)),hash3(i+vec3f(1,0,1)),u.x),mix(hash3(i+vec3f(0,1,1)),hash3(i+vec3f(1,1,1)),u.x),u.y),u.z);
}
fn filteredNoise(p:vec3f, footprint:f32)->f32 {
  return mix(noise3(p),0.5,smoothstep(0.25,0.85,footprint));
}
fn thermalShape(world:vec3f,altitude:f32,coverage:f32,storm:f32)->f32 {
  let size=mix(3.6,7.0,storm);
  let cell=floor(world.xz/size);
  var field=-1.0;
  for(var j=-1;j<=1;j++){for(var i=-1;i<=1;i++){
    let id=cell+vec2f(f32(i),f32(j));
    let random=vec3f(hash3(vec3f(id,13.7)),hash3(vec3f(id.yx,29.3)),hash3(vec3f(id,71.9)));
    let strength=smoothstep(random.z-0.12,random.z+0.12,coverage);
    if(strength<0.01){continue;}
    let centre=(id+0.2+random.xy*0.6)*size;
    let depth=F.weather.w*(0.20+0.64*random.y*random.y);
    let bottom=F.cloudP.x+F.weather.w*(0.015+0.08*random.x);
    let h=(altitude-bottom)/max(depth,0.15);
    let radius=size*(0.17+0.29*random.x)*pow(strength,0.333333);
    let bend=F.windP[0].xy*h*h*depth*0.18;
    let q=vec3f((world.xz-centre-bend)/radius,(h-0.30)/0.52);
    let core=1.0-length(q);
    let turret=1.0-length(vec3f((q.xy-(random.xy-0.5)*0.95)/(0.44+random.x*0.25),(h-0.52)/0.44));
    let side=1.0-length(vec3f((q.xy+(random.yx-0.5)*1.4)/0.62,(h-0.31)/0.39));
    let lobe=max(max(core,turret),side);
    let base=smoothstep(-0.01,0.055,h);
    field=max(field,mix(-1.0,lobe,base));
  }}
  return field;
}
fn cloudDensityFiltered(p: vec3f, detail: bool, footprint:f32) -> f32 {
  let altitude=p.y+dot(p.xz,p.xz)/(2.0*RG);
  if(altitude<F.cloudP.x || altitude>F.cloudP.x+F.weather.w){return 0.0;}
  let drift=vec3f(F.windP[0].x,0.0,F.windP[0].y)*F.cloudP.w*F.windP[0].z*0.00065;
  let world=p+vec3f(F.camPos.x*0.001+F.worldOrigin.x,0,F.camPos.z*0.001+F.worldOrigin.y)-drift;
  let strat=select(0.0,1.0,F.weather.z>0.5 && F.weather.z<1.5);
  let storm=step(1.5,F.weather.z);
  // Separate mesoscale organisation from billows. Local depth and cloud base
  // vary across each bank instead of sharing one repeated horizontal profile.
  let weather=textureSampleLevel(cloudNoise,cloudNoiseSampler,vec3f(world.x*0.008,0.31,world.z*0.008),max(log2(max(footprint,0.001)*1.024),0.0));
  let cell=textureSampleLevel(cloudNoise,cloudNoiseSampler,vec3f(world.x*0.047,0.67,world.z*0.047),max(log2(max(footprint,0.001)*6.016),0.0));
  let cover=clamp(F.cloudP.y+(weather.a-0.5)*3.2+(cell.a-0.5)*0.65,0.0,1.0);
  let baseHeight=F.cloudP.x+F.weather.w*(0.025+0.14*cell.a);
  let depth=F.weather.w*mix(0.48+0.48*weather.r,0.22+0.15*cell.r,strat);
  let h=(altitude-baseHeight)/max(depth,0.1);
  if((strat>0.5 && (h<0.0 || h>1.0)) || cover<0.001){return 0.0;}
  let profile=smoothstep(0.0,0.075,h)*(1.0-smoothstep(mix(0.6,0.7,storm),1.0,h));
  let scale=vec3f(mix(0.62,0.24,storm),mix(0.60,0.42,strat),mix(0.62,0.24,storm));
  let shear=vec3f(F.windP[0].x,0,F.windP[0].y)*(h*h*0.13*F.weather.w);
  let q=(world+shear)*scale;
  let lod=max(log2(max(footprint,0.001)*max(scale.x,scale.y)*128.0),0.0);
  let shape=textureSampleLevel(cloudNoise,cloudNoiseSampler,q,lod);
  let base=clamp((shape.r-0.5)*2.8+0.68-(1.0-shape.g)*0.12,0.0,1.0);
  let probability=cover*profile;
  var density=clamp((base-(1.0-probability))/max(probability,0.05),0.0,1.0);
  if(strat<0.5){
    let thermal=thermalShape(world,altitude,cover,storm);
    let billow=(shape.r-0.5)*3.4+(shape.g-0.4)*0.65;
    density=clamp((thermal+billow)*2.0,0.0,1.0)*smoothstep(-0.32,0.06,thermal);
    // Storm banks merge into a connected lower deck as coverage approaches one.
    let deck=clamp((base-(1.0-cover*profile))*2.6,0.0,1.0);
    density=max(density,deck*storm*smoothstep(0.65,0.96,cover));
  }
  if(density>0.0){
    let erosion=textureSampleLevel(cloudNoise,cloudNoiseSampler,q*2.83+vec3f(0.17,0.31,0.59),lod+1.5).b;
    let carve=(1.0-erosion)*mix(0.42,0.07,strat)*mix(1.3,0.65,smoothstep(0.0,0.3,h));
    density=clamp((density-carve)/(1.0-carve),0.0,1.0);
  }
  return density;
}
fn cloudDensity(p:vec3f,detail:bool)->f32{return cloudDensityFiltered(p,detail,0.0);}
fn cloudShadowFor(p: vec3f,light:vec3f) -> f32 {
  if(light.y<0.01){return 1.0;}
  let start=max(0.0,(F.cloudP.x-p.y)/light.y);
  let lengthRay=min(30.0,F.weather.w/max(light.y,0.03));
  var od=0.0;
  for(var j=0u;j<12u;j++) {
    od+=cloudDensity(p+light*(start+(f32(j)+0.5)*lengthRay/12.0),true)*lengthRay/12.0;
  }
  return exp(-od*F.cloudP.z*6.0);
}
fn cloudShadowAt(p:vec3f)->f32 {return cloudShadowFor(p,F.sunDir.xyz);}
fn cloudLayers(dir: vec3f,pixAng:f32,aa:vec2f,sunT:ptr<function,f32>) -> vec4f {
  *sunT=1.0;
  if(F.cloudP.y<0.001 && F.atmo.z<0.001){return vec4f(0);}
  let altitude=max(F.camPos.y*0.001,0.001);
  if(dir.y < -sqrt(2.0*altitude/RG)-0.002){return vec4f(0);}
  let ro=vec3f(0,altitude,0);
  let sphereOrigin=vec3f(0,RG+altitude,0);
  let outer=raySphere(sphereOrigin,dir,RG+F.cloudP.x+F.weather.w);
  let inner=raySphere(sphereOrigin,dir,RG+F.cloudP.x);
  var start=max(0.0,outer.x);
  var finish=max(0.0,outer.y);
  if(altitude<F.cloudP.x){start=max(0.0,inner.y);}
  else if(inner.x>0.0){finish=inner.x;}
  let ground=raySphere(sphereOrigin,dir,RG);
  if(ground.x>0.0){finish=min(finish,ground.x);}
  finish=min(finish,200.0);
  // Keep the quadrature topology continuous across image rows. Rounding a
  // view-angle-dependent count rephases every sample at each integer boundary.
  let samples=u32(F.control.x*1.5);
  let logRange=log(max((finish+1.0)/(start+1.0),1.0));
  var trans=1.0;var radiance=vec3f(0);
  let ambient=skyAtmo(vec3f(0,1,0))*0.65+skyAtmo(normalize(vec3f(dir.x,0.25,dir.z)))*0.22;
  let phase=0.85*phaseHG(dot(dir,F.sunDir.xyz),0.68)+0.15*phaseHG(dot(dir,F.sunDir.xyz),-0.25);
  // Deterministic segment quadrature: no screen-space jitter to crawl in motion.
  // Exponential spacing preserves nearby volume detail and reaches the curved horizon.
  for(var i=0u;i<samples && logRange>0.0;i++) {
    let a=(start+1.0)*exp(logRange*f32(i)/f32(samples))-1.0;
    let b=(start+1.0)*exp(logRange*f32(i+1u)/f32(samples))-1.0;
    let ds=b-a;
    let t=(a+b)*0.5;
    let p=ro+dir*t;
    let footprint=max(ds*0.14,t*pixAng);
    var density=0.0;
    // Four subsegments retained after the cheaper two-point experiment visibly
    // reintroduced distant density slices. No jitter or temporal accumulation.
    for(var sub=0u;sub<4u;sub++){
      density+=cloudDensityFiltered(ro+dir*(a+ds*(f32(sub)+0.5)*0.25),true,footprint)*0.25;
    }
    if(density>0.001) {
      let radial=vec3f(p.x,RG+p.y,p.z);
      let radius=length(radial);let mu=dot(radial,F.sunDir.xyz)/radius;
      var sun=sampleTrans(radius,mu)*F.sunDir.w;
      if(sunBelowHorizon(radius,mu)){sun=vec3f(0);}
      var shadow=0.0;
      var lightStep=0.06;
      var lightDist=0.03;
      for(var j=0u;j<u32(F.control.y);j++) {
        shadow+=cloudDensityFiltered(p+F.sunDir.xyz*lightDist,false,lightStep*0.35)*lightStep;
        lightDist+=lightStep;lightStep*=2.1;
      }
      let sigma=F.cloudP.z*6.0;
      let optical=shadow*sigma;
      let direct=exp(-optical)*phase;
      let multi=(0.6*exp(-optical*0.25)*phaseHG(dot(dir,F.sunDir.xyz),0.28)+0.3*exp(-optical*0.07)/(4.0*PI))*(1.0-exp(-density*5.0));
      let height=clamp((p.y+dot(p.xz,p.xz)/(2.0*RG)-F.cloudP.x)/F.weather.w,0.0,1.0);
      var lunar=vec3f(0);
      if(F.celestial.x>0.0){
        let moonMu=dot(radial,F.moonDir.xyz)/radius;
        if(!sunBelowHorizon(radius,moonMu)){
          let moonPhase=0.85*phaseHG(dot(dir,F.moonDir.xyz),0.68)+0.15*phaseHG(dot(dir,F.moonDir.xyz),-0.25);
          var moonOptical=0.0;var moonStep=0.06;var moonDist=0.03;
          for(var j=0u;j<u32(F.control.y);j++){
            moonOptical+=cloudDensityFiltered(p+F.moonDir.xyz*moonDist,false,moonStep*0.35)*moonStep;
            moonDist+=moonStep;moonStep*=2.1;
          }
          moonOptical*=sigma;
          let moonMulti=(0.6*exp(-moonOptical*0.25)*phaseHG(dot(dir,F.moonDir.xyz),0.28)+0.3*exp(-moonOptical*0.07)/(4.0*PI))*(1.0-exp(-density*5.0));
          lunar=sampleTrans(radius,moonMu)*F.celestial.x*(exp(-moonOptical)*moonPhase+moonMulti);
        }
      }
      let light=ambient*mix(0.18,1.0,sqrt(height))+sun*(direct+multi)+lunar;
      let stepT=exp(-density*sigma*ds);
      let aerial=exp(-t*(0.008+F.atmo.x*0.003));
      let fog=skyAtmo(dir);
      radiance+=trans*(1.0-stepT)*(light*aerial+fog*(1.0-aerial));
      trans*=stepT;
      if(trans<0.005){break;}
    }
  }
  // Spherical ice shell: finite grazing path, independent of the lower cloud cutoff.
  let iceInner=raySphere(sphereOrigin,dir,RG+7.0);
  let iceOuter=raySphere(sphereOrigin,dir,RG+7.3);
  var iceStart=max(0.0,iceOuter.x);
  var iceFinish=max(0.0,iceOuter.y);
  if(altitude<7.0){iceStart=max(0.0,iceInner.y);}
  else if(iceInner.x>0.0){iceFinish=iceInner.x;}
  if(ground.x>0.0){iceFinish=min(iceFinish,ground.x);}
  if(iceFinish>iceStart && F.atmo.z>0.001) {
    let t=(iceStart+iceFinish)*0.5;
    let p=(ro+dir*t).xz+F.camPos.xz*0.001+F.worldOrigin.xy;
    let warp=vec2f(gnoise(p*0.14),gnoise(p*0.21+vec2f(8.3,1.1)))*2.2;
    let footprint=t*pixAng;
    let low=mix(gnoise((p+warp)*vec2f(0.22,0.85)),0.0,smoothstep(0.25,0.85,footprint*0.85));
    let high=mix(gnoise(p*vec2f(0.63,2.3)),0.0,smoothstep(0.25,0.85,footprint*2.3));
    let ice=max(0.0,0.65*low+0.35*high+F.atmo.z-0.45);
    let opacity=1.0-exp(-ice*0.6*(iceFinish-iceStart));
    let radial=sphereOrigin+dir*t;let radius=length(radial);
    let mu=dot(radial,F.sunDir.xyz)/radius;
    var sun=sampleTrans(radius,mu)*F.sunDir.w;
    if(sunBelowHorizon(radius,mu)){sun=vec3f(0);}
    let aerial=exp(-t*(0.008+F.atmo.x*0.003));
    let moonMu=dot(radial,F.moonDir.xyz)/radius;
    let moon=select(sampleTrans(radius,moonMu)*F.celestial.x,vec3f(0),sunBelowHorizon(radius,moonMu));
    let iceLight=mix(skyAtmo(dir),ambient+(sun+moon)*0.12,aerial);
    radiance+=trans*opacity*iceLight;
    trans*=1.0-opacity;
  }
  *sunT=trans;
  return vec4f(radiance,1.0-trans);
}
fn nightStars(dir:vec3f) -> vec3f {
  let q=vec2f(atan2(dir.x,dir.z)+F.control.w,asin(clamp(dir.y,-1.0,1.0)))*650.0;
  let cell=floor(q);let offset=fract(q)-0.5;
  let h=hash3(vec3f(cell,17.0));
  let stars=smoothstep(0.995,1.0,h)*exp(-dot(offset,offset)*70.0);
  return vec3f(0.65,0.78,1.0)*stars*0.018*F.solarDir.w*smoothstep(0.0,0.2,dir.y);
}
fn sunDisk(dir:vec3f)->vec3f {
  let angle=acos(clamp(dot(dir,F.sunDir.xyz),-1.0,1.0));
  let pix=max(F.screen.w*length(F.camUp.xyz),0.00002);
  let disk=1.0-smoothstep(SUN_ANG_R-pix,SUN_ANG_R+pix,angle);
  let vis=step(-0.006,dir.y);
  var radiance=disk*vis*sampleTrans(camR(),max(dir.y,-0.01))*F.sunDir.w/(PI*SUN_ANG_R*SUN_ANG_R);
  if(F.celestial.x>0.0){
    let radius=F.celestial.y;
    let tangent=dir-F.moonDir.xyz*dot(dir,F.moonDir.xyz);
    let r2=dot(tangent,tangent)/(radius*radius);
    let moonMask=1.0-smoothstep(radius-pix,radius+pix,length(tangent));
    let normal=normalize(tangent/radius-F.moonDir.xyz*sqrt(max(0.0,1.0-r2)));
    let illumination=max(dot(normal,F.solarDir.xyz),0.0);
    let normalization=max((2.0/3.0)*F.celestial.z,1e-7);
    radiance+=moonMask*step(0.0,dot(dir,F.moonDir.xyz))*vis*sampleTrans(camR(),max(dir.y,-0.01))*F.celestial.x*illumination/(PI*radius*radius*normalization);
  }
  return radiance;
}
fn skyRadiance(dirIn:vec3f,withSun:bool,pixAng:f32)->vec3f {
  let dir=normalize(dirIn);
  var tr=1.0;
  let cl=cloudLayers(dir,pixAng,vec2f(0),&tr);
  var L=skyAtmo(dir)*(1.0-cl.a)+cl.rgb+nightStars(dir)*tr;
  if(withSun){L+=sunDisk(dir)*tr;}
  return L;
}
`;
