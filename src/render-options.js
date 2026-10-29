// Only renderer choices survive sharing/reloading. Capture commands, file
// names, diagnostics and benchmark controls must never be replayed by a link.
const OPTIONS=Object.freeze({
  abDefaults:['legacy'],
  aa:['taa','msaa'], abWater:['body','layered','volume','slab','transport','angular','off'], abDisplay:['linear','luminance','off'],
  abReflection:['partition','visible'],
  abRadiance:['scaled','legacy'],
  abLightCache:['responsive','legacy'],
  abSea:['regional','off'], abBubbles:['plumes','off'], abClouds:['regional','condensate','profile','legacy'],
  abWind:['legacy','regional'],
  abEnvironment:['coupled','marine','marine-diffuse','marine-sunset','off'], maBreaking:['gravity','events','onset','fold','crest'],
  abBreaking:['handoff','population','phase-field','phase-resident'], abFoam:['transport','relief','skin','volume'], abFoamPattern:['bubbles'],
  abRain:['velocity'], abWhitewater:['parcels'], abCrest:['phase'],
  abCrestShape:['sheet','elongated'], abCrestEvent:['shared'], abCrestSurface:['water'],
  abCrestEdge:['fade'], abCrestLife:['supported'], abShadow:['curved12','curved48','curved96'],
});
// Preserve explicit historical foam experiments as complete comparisons.
// Normal development uses the reviewed phase-resident active/residual pair.
export function withRenderDefaults(input){
  const query=new URLSearchParams(input);
  const historical=[...query.keys()].some(key=>(key.startsWith('ab')&&key!=='abDefaults')||/^ma[A-Z]/.test(key));
  const explicit=[...query.keys()].some(key=>key==='maBreaking'||
    key==='abBreaking'||key.startsWith('abFoam')||key==='abWhitewater'||key.startsWith('abCrest'));
  if(query.get('abDefaults')!=='legacy'&&!explicit){
    query.set('abBreaking','phase-resident');
    query.set('abFoam','relief');
  }
  if(query.get('abDefaults')!=='legacy'&&!historical){
    query.set('abRadiance','scaled');
    query.set('abLightCache','responsive');
  }
  return query;
}
export function renderOptions(input){
  const values=input instanceof URLSearchParams?Object.fromEntries(input):input;
  return Object.fromEntries(Object.entries(values||{}).filter(([k,v])=>Object.hasOwn(OPTIONS,k)&&OPTIONS[k].includes(v)));
}
export function sameRenderOptions(a,b){
  const left=renderOptions(a),right=renderOptions(b);
  return Object.keys(OPTIONS).every(k=>left[k]===right[k]);
}
