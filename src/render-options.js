// Only renderer choices survive sharing/reloading. Capture commands, file
// names, diagnostics and benchmark controls must never be replayed by a link.
const OPTIONS=Object.freeze({
  aa:['taa','msaa'], abWater:['body','layered','volume','slab','off'], abDisplay:['linear','off'],
  abEnvironment:['coupled','marine','off'], maBreaking:['gravity','events','onset','fold','crest'],
  abBreaking:['handoff','population'], abFoam:['transport','relief'], abFoamPattern:['bubbles'],
  abRain:['velocity'], abWhitewater:['parcels'], abCrest:['phase'],
  abCrestShape:['sheet','elongated'], abCrestEvent:['shared'], abCrestSurface:['water'],
  abCrestEdge:['fade'], abCrestLife:['supported'], abShadow:['curved12','curved48','curved96'],
});
export function renderOptions(input){
  const values=input instanceof URLSearchParams?Object.fromEntries(input):input;
  return Object.fromEntries(Object.entries(values||{}).filter(([k,v])=>Object.hasOwn(OPTIONS,k)&&OPTIONS[k].includes(v)));
}
export function sameRenderOptions(a,b){
  const left=renderOptions(a),right=renderOptions(b);
  return Object.keys(OPTIONS).every(k=>left[k]===right[k]);
}
