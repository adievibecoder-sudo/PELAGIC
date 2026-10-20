// Relative rendering radiometry, not a calibrated camera/light-meter model.
export function lambertPhase(alpha){
 const a=Math.max(0,Math.min(Math.PI,alpha));
 if(a===Math.PI)return 0;
 return Math.max(0,(Math.sin(a)+(Math.PI-a)*Math.cos(a))/Math.PI);
}
export function twilightExposure(solarElevation){
 const t=Math.max(0,Math.min(1,(-solarElevation-3)/11));
 return Math.exp(Math.log(500)*t*t*(3-2*t));
}
export function lunarLight(sun,moon,distanceKm){
 const alpha=Math.acos(Math.max(-1,Math.min(1,-sun.reduce((s,v,i)=>s+v*moon[i],0))));
 const phase=lambertPhase(alpha),radius=Math.asin(1737.4/distanceKm);
 return {alpha,phase,radius,irradiance:.000055*phase*(384400/distanceKm)**2};
}
