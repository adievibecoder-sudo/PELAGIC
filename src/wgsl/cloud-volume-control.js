// Independent authored shape control; not a procedural weather replacement.
// Asset attribution and conversion are in assets/experiments/wdas-cloud/.
const VOLUME_CONTROL = /* wgsl */ `
@group(1) @binding(0) var cloudControl:texture_3d<f32>;
fn cloudVolumeControl(p:vec3f,footprint:f32)->f32 {
  let altitude=p.y+dot(p.xz,p.xz)/(2.0*RG);
  let depth=mix(F.regional.y,3.5,regionalWeight(p.xz));
  let coverage=regionalCoverage(p.xz);
  if(coverage<0.001||altitude<=F.cloudP.x||altitude>=F.cloudP.x+depth){return 0.0;}
  let world=p.xz+F.camPos.xz*0.001+F.worldOrigin.xy-F.cloudDrift.xy;
  let spacing=3.6;
  let cell=floor(world/spacing);
  var density=0.0;
  for(var j=-1;j<=1;j++){for(var i=-1;i<=1;i++){
    let id=cell+vec2f(f32(i),f32(j));
    let random=vec3f(hash3(vec3f(id,13.7)),hash3(vec3f(id.yx,29.3)),hash3(vec3f(id,71.9)));
    let strength=smoothstep(random.z-0.12,random.z+0.12,coverage);
    if(strength<0.001){continue;}
    let centre=(id+0.1+random.xy*0.8)*spacing;
    let height=depth*(0.80+0.20*random.y);
    let angle=random.x*6.28318530718;
    let delta=world-centre;
    let local=vec2f(cos(angle)*delta.x-sin(angle)*delta.y,sin(angle)*delta.x+cos(angle)*delta.y);
    // Uniform scale retains the native 128:88:156 aspect ratio including padding.
    let extent=height*vec3f(128.0/88.0,1.0,156.0/88.0);
    let uv=vec3f(local.x,altitude-F.cloudP.x-height*0.5,local.y)/extent+0.5;
    if(any(uv<=vec3f(0))||any(uv>=vec3f(1))){continue;}
    let lod=max(log2(max(footprint,0.00001)*88.0/height),0.0);
    density=max(density,textureSampleLevel(cloudControl,cloudNoiseSampler,uv,lod).r*strength);
  }}
  return density;
}
`;

export function cloudVolumeControlShader(code,query){
  if(query.get('maCloud')!=='volume'||!code.includes('fn cloudDensityFiltered('))return code;
  return code.replace('fn cloudDensityFiltered(','fn cloudDensityPreserved(')
    .replace('fn cloudDensity(p:',VOLUME_CONTROL+/* wgsl */`
fn cloudDensityFiltered(p:vec3f,detail:bool,footprint:f32)->f32 {
  let weight=clamp(regionalTypes(p.xz).x,0.0,1.0);
  if(weight<0.0001){return cloudDensityPreserved(p,detail,footprint);}
  let candidate=cloudVolumeControl(p,footprint);
  if(weight>0.9999){return candidate;}
  return mix(cloudDensityPreserved(p,detail,footprint),candidate,weight);
}
fn cloudDensity(p:`);
}
