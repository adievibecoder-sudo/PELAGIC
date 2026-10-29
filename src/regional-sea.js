import {shortEnergy} from './wind-roughness.js';

// Only the sub-metre cascades respond locally. Eight seconds is an explicit
// short-wave relaxation assumption, not a calibrated regional wave forecast.
export const SHORT_SEA_SECONDS=8;
let lastKey='',ratios=[1,1];
export function regionalSeaUniforms(state,origin,enabled,out,offset=228){
  const f=state.front,angle=f.heading*Math.PI/180,axis=[Math.cos(angle),Math.sin(angle)];
  const time=state.clocks.weather+state.remainder;
  const key=[state.sea.windSpeed,state.sea.fetchKm,state.weather.windSpeed].join(',');
  if(enabled&&key!==lastKey){
    const base=shortEnergy(state.sea.windSpeed,state.sea.fetchKm*1000);
    // There are no carriers to modulate in a zero-energy spectrum. Bounded
    // energy ratios keep this first-order modulation inside its stated domain.
    ratios=base<1e-8?[1,1]:[state.weather.windSpeed,22].map(w=>
      Math.min(4,Math.max(.25,shortEnergy(w,state.sea.fetchKm*1000)/base)));
    lastKey=key;
  }
  out.set([f.x+axis[0]*f.speed*time-origin[0],f.z+axis[1]*f.speed*time-origin[1],f.width,f.length],offset);
  out.set([...axis,f.speed,Math.min(time,8*SHORT_SEA_SECONDS)],offset+4);
  out.set(enabled?[ratios[0],ratios[1],+f.enabled,SHORT_SEA_SECONDS]:[1,1,0,SHORT_SEA_SECONDS],offset+8);
}
