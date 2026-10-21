import {sanitize} from './settings.js';

export const WEATHER_KEYS=['clouds','veil','haze','rain','cloudDepth','cloudType','windSpeed','windDir'];
export const SEA_KEYS=['windSpeed','windDir','fetchKm','swellHs','swellDir','swellLength'];
const D=Math.PI/180, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const angle=(a,b,t)=>(a+(((b-a+540)%360)-180)*t+360)%360;
const weights=t=>[t===0?1:0,t===1?1:0,t===2?1:0];
const copy=x=>JSON.parse(JSON.stringify(x));

// A bounded moving regional event, not a meteorological solver. All distances m.
// Analytic evaluation avoids map interpolation/rebake jumps under origin shifts.
export function frontWeight(front,x,z,weatherSeconds){
  if(!front.enabled)return 0;
  const a=front.heading*D,dx=x-front.x-Math.cos(a)*front.speed*weatherSeconds,
    dz=z-front.z-Math.sin(a)*front.speed*weatherSeconds;
  const along=(dx*Math.cos(a)+dz*Math.sin(a))/front.width;
  const across=(-dx*Math.sin(a)+dz*Math.cos(a))/front.length;
  return 1-smooth((Math.hypot(along,across)-.55)/.45);
}
export function sampleEnvironment(state,x,z){
  const w=state.weather, f=state.front, a=frontWeight(f,x,z,state.clocks.weather+state.remainder);
  const cloudWeights=w.weights.map((v,i)=>mix(v,i===2?1:0,a));
  const coverage=mix(w.clouds,.98,a),depth=mix(w.cloudDepth,3.5,a);
  const rain=mix(w.rain,.8,a)*smooth((coverage-.55)/.35);
  const windSpeed=mix(w.windSpeed,22,a), windDir=angle(w.windDir,f.heading,a*.3);
  // Bounded gust field: U10 is the mean; this modulation is not wave energy.
  const gust=1+.12*a*Math.sin((x*Math.cos(f.heading*D)+z*Math.sin(f.heading*D))*.0013-(state.clocks.weather+state.remainder)*.035+state.seed);
  return {clouds:coverage,cloudDepth:depth,weights:cloudWeights,veil:mix(w.veil,.8,a),
    haze:mix(w.haze,7,a),rain,windSpeed,windDir,gust,
    wind:[Math.cos(windDir*D)*windSpeed*gust,Math.sin(windDir*D)*windSpeed*gust],
    convection:a*cloudWeights[2],lightningEligible:f.electrified&&a>.65,
    frontId:a>0?f.id:0,frontWeight:a};
}

export function createEnvironment(settings,time=0){
  const p=sanitize(settings),weather=Object.fromEntries(WEATHER_KEYS.map(k=>[k,p[k]]));
  weather.weights=weights(p.cloudType);
  return {schema:1,seed:p.seed,revision:0,mode:p.environmentMode,
    clocks:{weather:time,astronomy:0,wave:time,exposure:0},remainder:0,
    utcEpoch:Date.parse(p.date+'T00:00:00Z')+p.hour*3600000,
    weather,target:copy(weather),sea:Object.fromEntries(SEA_KEYS.map(k=>[k,p[k]])),
    swellTarget:Object.fromEntries(SEA_KEYS.filter(k=>k.startsWith('swell')).map(k=>[k,p[k]])),
    fetchTarget:p.fetchKm,drift:[Math.cos(p.windDir*D)*p.windSpeed*.65*time,Math.sin(p.windDir*D)*p.windSpeed*.65*time],
    front:{enabled:p.frontEnabled,id:p.seed,x:p.frontX,z:p.frontZ,width:p.frontWidth*1000,length:30000,
      speed:p.frontSpeed,heading:p.frontHeading,electrified:p.electrified}};
}

export function commandEnvironment(s,patch,{instant=false,weatherOnly=false}={}){
  const p=sanitize(patch,{...sanitize({}),...s.target,...s.sea});
  for(const k of WEATHER_KEYS)if(k in patch)s.target[k]=p[k];
  if('cloudType' in patch)s.target.weights=weights(p.cloudType);
  if(!weatherOnly){
    for(const k of Object.keys(s.swellTarget))if(k in patch)s.swellTarget[k]=p[k];
    if('fetchKm' in patch)s.fetchTarget=p.fetchKm;
  }
  const map={frontEnabled:'enabled',frontX:'x',frontZ:'z',frontSpeed:'speed',frontHeading:'heading',electrified:'electrified'};
  for(const [k,v]of Object.entries(map))if(k in patch)s.front[v]=p[k];
  if('frontWidth' in patch)s.front.width=p.frontWidth*1000;
  if(instant){s.weather=copy(s.target);s.sea.windSpeed=s.target.windSpeed;s.sea.windDir=s.target.windDir;s.sea.fetchKm=s.fetchTarget;Object.assign(s.sea,s.swellTarget);}
  s.revision++;
}

export function advanceEnvironment(s,dt,settings,x=0,z=0){
  if(!Number.isFinite(dt)||dt<0)throw Error('Environment dt must be finite and nonnegative');
  if(settings.paused)return;
  s.clocks.astronomy+=dt*settings.astronomyRate;
  s.clocks.wave+=Math.min(dt*settings.timeScale,.1);
  s.clocks.exposure+=dt;
  s.remainder+=dt*settings.weatherRate;
  // One-second physical weather ticks keep relaxation/advection replay independent
  // of render scheduling. Remainder is serialized; no wall-clock Date.now input.
  const ticks=Math.floor(s.remainder+1e-9);s.remainder-=ticks;
  for(let i=0;i<ticks;i++){
    const a=-Math.expm1(-1/180),oldWind=s.weather.windSpeed;
    for(const k of WEATHER_KEYS){if(k==='cloudType')continue;
      s.weather[k]=k==='windDir'?angle(s.weather[k],s.target[k],a):mix(s.weather[k],s.target[k],a);
    }
    s.weather.weights=s.weather.weights.map((v,j)=>mix(v,s.target.weights[j],a));
    s.clocks.weather++;
    const local=sampleEnvironment({...s,remainder:0},x,z),b=-Math.expm1(-settings.seaRate/1800),c=-Math.expm1(-settings.seaRate/10800);
    s.sea.windSpeed=mix(s.sea.windSpeed,local.windSpeed,b);s.sea.windDir=angle(s.sea.windDir,local.windDir,b);
    s.sea.fetchKm=mix(s.sea.fetchKm,s.fetchTarget,b);
    for(const k of Object.keys(s.swellTarget))s.sea[k]=k.endsWith('Dir')?angle(s.sea[k],s.swellTarget[k],c):mix(s.sea[k],s.swellTarget[k],c);
    const speed=.65*(oldWind+s.weather.windSpeed)*.5;
    s.drift[0]+=Math.cos(s.weather.windDir*D)*speed;s.drift[1]+=Math.sin(s.weather.windDir*D)*speed;
  }
}

export function environmentSnapshot(s){return copy(s);}
export function restoreEnvironment(raw,settings){
  if(!raw||raw.schema!==1)throw Error('Unsupported environment snapshot');
  const s=createEnvironment(settings);
  // Accept only known shape, finite numbers and bounded front metadata.
  function assign(dst,src){for(const k of Object.keys(dst)){
    if(!(k in src))throw Error('Incomplete environment snapshot: '+k);
    if(dst[k]&&typeof dst[k]==='object')assign(dst[k],src[k]);
    else if(typeof dst[k]==='number'){if(!Number.isFinite(src[k]))throw Error('Nonfinite environment snapshot: '+k);dst[k]=src[k];}
    else if(typeof src[k]===typeof dst[k])dst[k]=src[k];else throw Error('Invalid environment snapshot: '+k);
  }}
  assign(s,raw);
  if(s.front.width<1000||s.front.width>100000||s.front.length<=0||s.remainder<-.00001||s.remainder>=1.00001||Object.values(s.clocks).some(v=>v<0))throw Error('Out-of-range environment snapshot');
  for(const w of [s.weather,s.target])if(w.weights.some(v=>v<0||v>1)||Math.abs(w.weights.reduce((a,b)=>a+b,0)-1)>1e-5)throw Error('Invalid cloud weights');
  return s;
}

// Packed camera-relative front coordinates retain physical world anchoring in f32.
export function environmentUniforms(s,cam,out,offset=148){
  const f=s.front,a=f.heading*D,t=s.clocks.weather+s.remainder;
  const local=sampleEnvironment(s,cam.x,cam.z),w=s.weather;
  out.set([(f.x+Math.cos(a)*f.speed*t-cam.x)*.001,(f.z+Math.sin(a)*f.speed*t-cam.z)*.001,f.width*.001,f.length*.001],offset);
  out.set([Math.cos(a),Math.sin(a),+f.enabled,+f.electrified],offset+4);
  out.set([w.clouds,w.cloudDepth,w.rain,w.haze],offset+8);
  out.set([...w.weights,w.veil],offset+12);
  // Existing noise periods remain; integrating velocity avoids wind*time jumps.
  const driftRemainder=s.remainder*w.windSpeed*.65;
  out.set([(s.drift[0]+Math.cos(w.windDir*D)*driftRemainder)*.001,(s.drift[1]+Math.sin(w.windDir*D)*driftRemainder)*.001,t,s.revision],offset+16);
  out.set([local.wind[0],local.wind[1],local.gust,local.frontId],offset+20);
}
