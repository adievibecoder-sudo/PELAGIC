// Original finite-volume cloud approximation. Distances in kilometres; extinction in 1/km.
// Front-to-back Beer integration with sampled self-shadowing. Not a fluid cloud simulation.
export const CLOUD_VOLUME = /* wgsl */ `
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
fn cloudDensityFiltered(p: vec3f, detail: bool, footprint:f32) -> f32 {
  let altitude=p.y+dot(p.xz,p.xz)/(2.0*RG);
  let h=(altitude-F.cloudP.x)/F.weather.w;
  if(h<0.0 || h>1.0){return 0.0;}
  let drift=vec3f(F.windP[0].x,0.0,F.windP[0].y)*F.cloudP.w*F.windP[0].z*0.00065;
  let world=p+vec3f(F.camPos.x*0.001,0,F.camPos.z*0.001)-drift;
  let strat=select(0.0,1.0,F.weather.z>0.5 && F.weather.z<1.5);
  let storm=step(1.5,F.weather.z);
  let scale=vec3f(mix(0.72,0.42,storm),mix(1.1,2.4,strat),mix(0.72,0.42,storm));
  let q=world*scale;
  let fw=footprint*max(scale.x,scale.y);
  let weather=filteredNoise(q*0.19+vec3f(21.3,1.1,9.7),fw*0.19);
  let base=filteredNoise(q,fw)*0.55+0.27*filteredNoise(q*2.13+vec3f(17.2,4.3,7.1),fw*2.13)+0.18*filteredNoise(q*4.37+vec3f(3.2,17.1,9.4),fw*4.37);
  let profile=smoothstep(0.0,0.08,h)*(1.0-smoothstep(mix(0.35,0.65,storm),mix(1.0,0.55,strat),h));
  let threshold=0.76-F.cloudP.y*0.50+0.12*(weather-0.5);
  var density=max(0.0,base-threshold-(1.0-profile)*0.22)*4.0*profile;
  if(detail){density=max(0.0,density-(1.0-filteredNoise(q*12.3,fw*12.3))*0.14*(1.0-density));}
  return clamp(density,0.0,1.0);
}
fn cloudDensity(p:vec3f,detail:bool)->f32{return cloudDensityFiltered(p,detail,0.0);}
fn cloudShadowAt(p: vec3f) -> f32 {
  let light=F.sunDir.xyz;
  if(light.y<0.01){return 1.0;}
  let start=max(0.0,(F.cloudP.x-p.y)/light.y);
  let lengthRay=min(30.0,F.weather.w/max(light.y,0.03));
  var od=0.0;
  for(var j=0u;j<4u;j++) {
    od+=cloudDensity(p+light*(start+(f32(j)+0.5)*lengthRay/4.0),false)*lengthRay/4.0;
  }
  return exp(-od*F.cloudP.z*1.8);
}
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
  finish=min(finish,55.0);
  let samples=u32(F.control.x);
  let ds=max(0.0,finish-start)/f32(samples);
  var trans=1.0;var radiance=vec3f(0);
  let ambient=skyAtmo(vec3f(0,1,0))*0.38+skyAtmo(normalize(vec3f(dir.x,0.08,dir.z)))*0.06;
  let phase=0.82*phaseHG(dot(dir,F.sunDir.xyz),0.72)+0.18*phaseHG(dot(dir,F.sunDir.xyz),-0.25);
  let jitter=hash3(floor(dir*8000.0))*0.8+0.1;
  for(var i=0u;i<samples && ds>0.0;i++) {
    let t=start+(f32(i)+jitter)*ds;
    let p=ro+dir*t;
    let density=cloudDensityFiltered(p,true,max(ds*0.5,t*pixAng));
    if(density>0.001) {
      let radial=vec3f(p.x,RG+p.y,p.z);
      let radius=length(radial);let mu=dot(radial,F.sunDir.xyz)/radius;
      var sun=sampleTrans(radius,mu)*F.sunDir.w;
      if(sunBelowHorizon(radius,mu)){sun=vec3f(0);}
      var shadow=0.0;
      var lightStep=0.22;
      var lightDist=0.11;
      for(var j=0u;j<u32(F.control.y);j++) {
        shadow+=cloudDensity(p+F.sunDir.xyz*lightDist,false)*lightStep;
        lightDist+=lightStep;lightStep*=2.1;
      }
      let sigma=F.cloudP.z*1.8;
      let optical=shadow*sigma;
      let direct=exp(-optical)*phase;
      let multi=0.45*exp(-optical*0.35)*phaseHG(dot(dir,F.sunDir.xyz),0.25)+0.12*exp(-optical*0.12)/(4.0*PI);
      let light=ambient*(0.5+0.5*exp(-density*2.0))+sun*(direct+multi);
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
    let p=(ro+dir*t).xz+F.camPos.xz*0.001;
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
    let iceLight=mix(skyAtmo(dir),ambient+sun*0.12,aerial);
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
  return disk*vis*sampleTrans(camR(),max(dir.y,-0.01))*F.sunDir.w/(PI*SUN_ANG_R*SUN_ANG_R);
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
