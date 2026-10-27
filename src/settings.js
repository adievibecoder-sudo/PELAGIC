import {renderOptions} from './render-options.js';

export const DEFAULTS = Object.freeze({
  windSpeed: 7, windDir: 118, fetchKm: 90, swellHs: 1.8, swellDir: 94,
  swellLength: 120, swellSpread: 48, choppy: 1.12, turbidity: 0.25, foam: 1,
  sunElev: 8, sunAzim: 4, exposure: 1.2, haze: 1.8, clouds: 0.32, veil: 0.14,
  bloom: 0.045, spray: 0.6, rain: 0, cloudDepth: 1.5, cloudType: 0,
  seed: 1307, quality: 'Balanced', resolution: 1, adaptive: true,
  timeScale: 1, weatherRate: 1, seaRate: 60, astronomyRate: 0, environmentMode:'natural',
  frontEnabled:false,frontX:18000,frontZ:0,frontWidth:20,frontHeading:180,frontSpeed:12,electrified:false,
  paused: false, cameraMode: 'surface',
  astronomy: false, date: '2026-10-25', hour: 17, latitude: 32, longitude: -30,
  debug: 0, currentSpeed: 0.12, currentDir: 35, cameraSpeed: 6, fov: 58,
});

export const RANGES = Object.freeze({
  windSpeed:[0.3,30],windDir:[0,360],fetchKm:[5,800],swellHs:[0,10],swellDir:[0,360],
  swellLength:[25,500],swellSpread:[2,100],choppy:[0,1.6],turbidity:[0,2],foam:[0,3],
  sunElev:[-30,89],sunAzim:[-180,180],exposure:[0.02,24],haze:[0.5,15],clouds:[0,1],veil:[0,1],
  bloom:[0,0.25],spray:[0,3],rain:[0,1],cloudDepth:[0.3,5],cloudType:[0,2],
  seed:[1,16777215],resolution:[0.5,1.5],timeScale:[0,20],weatherRate:[1,3600],
  hour:[0,23.999],latitude:[-89,89],longitude:[-180,180],debug:[0,12],
  seaRate:[1,3600],astronomyRate:[0,3600],frontX:[-100000,100000],frontZ:[-100000,100000],frontWidth:[1,100],frontHeading:[0,360],frontSpeed:[0,60],
  currentSpeed:[0,2],currentDir:[0,360],cameraSpeed:[0.1,500],fov:[30,100],
});
export const PRESETS = Object.freeze({
  calm: {label:'Quiet water',note:'A long swell under light airs',windSpeed:2,fetchKm:25,swellHs:0.65,swellLength:170,choppy:0.95,clouds:0.12,veil:0.08,haze:1.4,sunElev:24,exposure:1.05,rain:0,spray:0.3},
  midday:{label:'Open Atlantic',note:'Clear sky. Crossing wind and swell.',windSpeed:8,fetchKm:110,swellHs:2,swellLength:135,choppy:1.12,clouds:0.32,veil:0.1,haze:1.4,sunElev:48,exposure:0.95,rain:0,spray:0.65},
  golden:{label:'The golden hour',note:'Low light across a living sea',windSpeed:7,fetchKm:90,swellHs:1.8,swellLength:120,choppy:1.12,clouds:0.32,veil:0.14,haze:1.8,sunElev:5,exposure:1.3,rain:0,spray:0.6},
  storm:{label:'Weather approaching',note:'A developed, wind-driven sea',windSpeed:20,fetchKm:250,swellHs:3.4,swellLength:200,choppy:1.12,clouds:0.92,veil:0.8,haze:7,sunElev:18,exposure:1.4,rain:0.65,spray:1.5,cloudDepth:3.5,cloudType:2},
  twilight:{label:'After the sun',note:'The blue interval',windSpeed:5,fetchKm:65,swellHs:1.5,swellLength:150,choppy:1.05,clouds:0.25,veil:0.18,haze:2,sunElev:-5,exposure:4,rain:0,spray:0.3},
  moonlit:{label:'Moon on the water',note:'Astronomical moonlight',windSpeed:5.5,fetchKm:70,swellHs:1.4,swellLength:135,choppy:1.08,clouds:0.16,veil:0.05,haze:1.2,astronomy:true,date:'2026-10-26',hour:2,latitude:32,longitude:-30,exposure:12,rain:0,spray:0.3},
});
export const QUALITY = Object.freeze({
  Balanced:{env:128,foam:512,cloudSteps:64,cloudLightSteps:5,grid:24,scale:1},
  High:{env:256,foam:512,cloudSteps:80,cloudLightSteps:6,grid:32,scale:1},
  Ultra:{env:256,foam:1024,cloudSteps:112,cloudLightSteps:7,grid:40,scale:1.2},
  Cinematic:{env:512,foam:1024,cloudSteps:160,cloudLightSteps:8,grid:48,scale:1.5},
});

export function sanitize(input, base = DEFAULTS) {
  const result = {...base};
  for (const [key,value] of Object.entries(input || {})) {
    if (!(key in DEFAULTS)) continue;
    if (key in RANGES) { const n = Number(value); if (Number.isFinite(n)) result[key] = Math.max(RANGES[key][0],Math.min(RANGES[key][1],n)); }
    else if (typeof DEFAULTS[key] === 'boolean') result[key] = value === true || value === 'true' || value === '1';
    else if (key === 'quality' && value in QUALITY) result[key] = value;
    else if (key === 'cameraMode' && ['surface','free','underwater'].includes(value)) result[key] = value;
    else if (key === 'environmentMode' && ['natural','instant'].includes(value)) result[key] = value;
    else if (key === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))) result[key] = value;
  }
  result.seed = Math.round(result.seed); result.cloudType = Math.round(result.cloudType); result.debug = Math.round(result.debug);
  return result;
}
export function preset(name) { return sanitize(PRESETS[name], DEFAULTS); }
export function scenePreset(name, current) {
  if (!Object.hasOwn(PRESETS, name)) throw Error('Unknown scene preset: '+name);
  const next=preset(name);
  for(const key of ['quality','resolution','adaptive','paused','cameraMode','cameraSpeed','fov','environmentMode'])next[key]=current[key];
  return sanitize(next);
}
export function fromURL(search) {
  const q = new URLSearchParams(search);
  let config = preset(q.get('preset') || 'golden');
  if (q.has('config')) { try { config = sanitize(JSON.parse(q.get('config')), config); } catch {} }
  return sanitize(Object.fromEntries(q), config);
}
export function toURL(settings, camera, time, base, environment, rendering) {
  const preserved=renderOptions(rendering??new URL(base).searchParams);
  const u = new URL(base); u.search = '';
  for(const [key,value] of Object.entries(preserved))u.searchParams.set(key,value);
  u.searchParams.set('config',JSON.stringify(sanitize(settings)));
  u.searchParams.set('cam',[camera.x,camera.y,camera.z,camera.yaw*180/Math.PI,camera.pitch*180/Math.PI].map(v=>Number(v.toFixed(5))).join(','));
  u.searchParams.set('t',time.toFixed(4));
  if(environment)u.searchParams.set('environment',JSON.stringify(environment));
  return u.href;
}

// Exponential sea-state relaxation is a controlled approximation, not a wave-action solver.
export function approachSea(current,target,dt,compression) {
  const windT = 1800, swellT = 10800;
  for (const k of ['windSpeed','windDir','fetchKm','swellHs','swellDir','swellLength']) {
    let delta = target[k]-current[k];
    if (k.endsWith('Dir')) delta = ((delta+540)%360)-180;
    current[k] += delta*(-Math.expm1(-dt*compression/(k.startsWith('swell')?swellT:windT)));
    if (k.endsWith('Dir')) current[k] = (current[k]+360)%360;
  }
}
