// A six-frame snapshot is too old during accelerated twilight. Bound its
// predicted celestial drift; ordinary fixed lighting keeps amortized work.
export function needsCurrentLightCache(previous,current){
  if(!previous)return false;
  const angularMotion=offset=>Math.hypot(...current.slice(offset,offset+3).map((v,i)=>v-previous[offset+i]));
  const halfSolarRadius=.00234;
  return Math.max(angularMotion(32),angularMotion(104))*6>halfSolarRadius||
    Math.abs(Math.log(current[123]/previous[123]))*6>Math.log(1.02);
}
