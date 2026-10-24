import {windSpectrumK} from './sea-spectrum.js';
import {logIntegral,omega} from './numerics.js';
import {modulo} from './spatial-origin.js';

function shortEnergy(speed,fetch) {
  return logIntegral(k=>k*k*windSpectrumK(k,speed,fetch),2*Math.PI/1.2383333,3011,512);
}

// First-order local response of the existing short-wave equilibrium spectrum.
// The imposed gust field is a representation model, not a weather prediction.
export function roughnessResponse(speed,fetch,gust=.35) {
  const base=shortEnergy(speed,fetch);
  if(base<1e-6)return 0;
  return Math.min(.85,Math.max(0,(shortEnergy(speed*(1+gust),fetch)-
    shortEnergy(speed*(1-gust),fetch))/(2*base)));
}

let lastKey='',statistics;
function shortStatistics(speed,fetch) {
  const key=`${speed},${fetch}`;
  if(key!==lastKey){
    const slope=shortEnergy(speed,fetch);
    const curvature=logIntegral(k=>k**4*windSpectrumK(k,speed,fetch),2*Math.PI/1.2383333,3011,512);
    const kRms=Math.sqrt(curvature/Math.max(slope,1e-12));
    statistics={response:roughnessResponse(speed,fetch),area:2*Math.PI/Math.max(kRms*kRms,1),frequency:omega(kRms)};
    lastKey=key;
  }
  return statistics;
}

export function roughnessUniforms(state,origin,enabled,out,offset=172) {
  const angle=state.weather.windDir*Math.PI/180,wx=Math.cos(angle),wz=Math.sin(angle);
  const remainder=state.remainder*state.weather.windSpeed*.65;
  const x=origin[0]-state.drift[0]-wx*remainder,z=origin[1]-state.drift[1]-wz*remainder;
  const stats=shortStatistics(state.sea.windSpeed,state.sea.fetchKm*1000);
  out.set([wx,wz,enabled?stats.response:0,state.seed],offset);
  // Noise coordinates have a 256-cell period; f64 phase reduction precedes f32 upload.
  out.set([modulo((x*wx+z*wz)/96,256),modulo((-x*wz+z*wx)/32,256),stats.area,stats.frequency],offset+4);
}
