import {replaceShader} from './shader-patch.js';
import {WAVE_MAP_COORDS} from './wave-visibility.js';
import {PARTICLE_COUNT} from './particles.js';

export const WHITEWATER_COUNT=PARTICLE_COUNT/4;

export const FROTH_DENSITY=/* wgsl */`
fn frothHash(p:vec3f)->f32 {
  var q=fract(p*vec3f(.1031,.1030,.0973));
  q+=dot(q,q.yxz+33.33);
  return fract((q.x+q.y)*q.z);
}
fn frothNoise(p:vec3f)->f32 {
  let cell=floor(p);let f=fract(p);let u=f*f*(3.0-2.0*f);
  return mix(mix(mix(frothHash(cell),frothHash(cell+vec3f(1,0,0)),u.x),
    mix(frothHash(cell+vec3f(0,1,0)),frothHash(cell+vec3f(1,1,0)),u.x),u.y),
    mix(mix(frothHash(cell+vec3f(0,0,1)),frothHash(cell+vec3f(1,0,1)),u.x),
    mix(frothHash(cell+vec3f(0,1,1)),frothHash(cell+vec3f(1,1,1)),u.x),u.y),u.z);
}
fn frothField(p:vec3f,seed:f32)->f32 {
  let n=frothNoise(p*4.0+vec3f(seed));
  let detail=frothNoise(p*11.0+vec3f(seed+7.0));
  return 1.0-dot(p,p)-(.95-.8*n-.15*detail);
}
fn frothDensity(p:vec3f,seed:f32)->f32 {
  return smoothstep(0.0,.18,frothField(p,seed));
}
`;

// Extend the existing particle buffer with short-lived aerated water parcels.
// These are surface-attached froth volumes, not overturning fluid simulation.
export function whitewaterShader(code,query){
  if(query.get('abWhitewater')!=='parcels')return code;
  if(query.get('maBreaking')!=='gravity')throw Error('Whitewater parcels require maBreaking=gravity');
  if(code.includes('var<storage,read_write> particles:')){
    code=replaceShader(code,`if(k>=${PARTICLE_COUNT}u)`,`if(k>=${PARTICLE_COUNT+WHITEWATER_COUNT}u)`);
    code=replaceShader(code,'@compute @workgroup_size(64)',/* wgsl */`
fn frothParcel(k:u32){
  var p=particles[k];let dt=min(F.backscatter.w,0.05);
  // v.xz stores the material anchor, v.y the event amplitude, v.w the radius.
  p.v.x-=F.worldOrigin.z;p.v.z-=F.worldOrigin.w;
  p.p.x-=F.worldOrigin.z;p.p.z-=F.worldOrigin.w;
  if(dt<=0.0){particles[k]=p;return;}
  if(F.foamP.z<=0.0){p.p.w=0.0;particles[k]=p;return;}
  p.p.w-=dt;
  var q=p.v.xz;
  let spawn=p.p.w<=0.0 || distance(p.p.xz,F.camPos.xz)>66.0;
  let seed=k*137u+u32(F.post.z)*197u;
  if(spawn){q=F.camPos.xz+(vec2f(rnd(seed+1u),rnd(seed+3u))-.5)*116.0;}
  let fresh=textureSampleLevel(foam,samp,q/F.lodP.z,0u,0.0).g;
  var d=vec3f(0);var strain=vec3f(0);
  let amplitude=surfaceAmplitude(derivatives,samp,q,F.windP[1].y,F.waveOrigins,F.roughnessWind,F.roughnessOffset);
  for(var c=0u;c<6u;c++){
    let uv=cascadeUV(q,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins);
    let a=textureSampleLevel(disp,samp,uv,c,0.0);
    let b=textureSampleLevel(derivatives,samp,uv,c,0.0);
    d+=a.xyz*select(1.0,amplitude,c>=3u);
    if(c<3u){strain+=vec3f(b.z,b.w,a.w);}
  }
  let gravityStrain=strain/max(F.windP[1].y,.1);
  let steepness=-.5*(gravityStrain.x+gravityStrain.y-sqrt((gravityStrain.x-gravityStrain.y)*(gravityStrain.x-gravityStrain.y)+4.0*gravityStrain.z*gravityStrain.z));
  let support=smoothstep(.22,.40,steepness);
  if(spawn){
    // Current crest support prevents old advected foam from emitting new bodies.
    let probability=fresh*support*min(F.foamP.z,1.0);
    if(rnd(seed+4u)>emissionProbability(probability,dt)){
      p.p=vec4f(q.x,-1000,q.y,0);particles[k]=p;return;
    }
    let r=rnd(seed+2u);
    p.p.w=.45+.55*r;
    p.v=vec4f(q.x,fresh,q.y,.28+.48*r*sqrt(fresh));
  }
  // Advect with the same mean current as surface foam. The displacement carries
  // orbital motion; generation advances along the crest, parcels trail it.
  let J=(1.0+strain.x)*(1.0+strain.y)-strain.z*strain.z;
  let inverse=mat2x2f(1.0+strain.y,-strain.z,-strain.z,1.0+strain.x)*(1.0/max(J,.3));
  q+=inverse*F.sssCol.xy*dt;
  p.v.x=q.x;p.v.z=q.y;
  p.v.y*=exp(-dt*1.6);
  p.p=vec4f(q.x+d.x,d.y+p.v.w*.02,q.y+d.z,p.p.w);
  particles[k]=p;
}
@compute @workgroup_size(64)`);
    return replaceShader(code,' let rain=k%4u==0u;let spindrift=k%4u==1u;',
      ` if(k>=${PARTICLE_COUNT}u){frothParcel(k);return;}\n let rain=k%4u==0u;let spindrift=k%4u==1u;`);
  }
  if(!code.includes('let stretch=select(1.0,12.0,rain);'))return code;
  code=replaceShader(code,'let rain=id%4u==0u;let spindrift=id%4u==1u;',
    `let rain=id<${PARTICLE_COUNT}u&&id%4u==0u;let spindrift=id<${PARTICLE_COUNT}u&&id%4u==1u;`);
  code=replaceShader(code,'struct VOut{',
    '@group(0) @binding(7) var waveVisibility:texture_2d_array<f32>;\n'+WAVE_MAP_COORDS+FROTH_DENSITY+'struct VOut{');
  // skyLUT is unused in the original particle shader; binding 7 is reclaimed.
  code=replaceShader(code,'@group(0) @binding(7) var skyLUT:texture_2d_array<f32>;',
    '@group(0) @binding(8) var skyLUT:texture_2d_array<f32>;');
  code=replaceShader(code,'@location(2) light:vec3f};',
    '@location(2) light:vec3f,@location(3) centre:vec3f,@location(4) radius:f32,@location(5) @interpolate(flat) froth:u32,@location(6) plane:vec3f,@location(7) @interpolate(flat) seed:f32};');
  code=replaceShader(code,' return o;\n}',/* wgsl */`
 o.centre=p.p.xyz;o.radius=p.v.w;o.froth=select(0u,1u,id>=${PARTICLE_COUNT}u);o.plane=world;o.seed=f32(id%997u)*.6180339;
 if(o.froth==1u){
   o.opacity=smoothstep(0.0,.25,p.p.w)*sqrt(max(p.v.y,0.0));
 }
 return o;
}`);
  const start=code.indexOf('@fragment fn fs(');
  if(start<0)throw Error('Whitewater fragment contract changed');
  return code.slice(0,start)+/* wgsl */`
struct FrothOut{@location(0) colour:vec4f,@builtin(frag_depth) depth:f32};
@fragment fn fs(i:VOut)->FrothOut{
 var o:FrothOut;o.depth=i.p.z;
 if(i.froth==0u){
   let alpha=exp(-dot(i.uv,i.uv)*3.0)*i.opacity;
   o.colour=vec4f(i.light/F.windP[1].x,alpha);return o;
 }
 if(i.opacity<=0.0 || i.radius<=0.0){discard;}
 // Intersect an upright oblate parcel; write its actual reverse-Z surface.
 // Water depth testing clips the submerged part, including at the silhouette.
 let axes=vec3f(i.radius,i.radius*.28,i.radius);
 let ray=normalize(i.plane-F.camPos.xyz);
 let origin=(F.camPos.xyz-i.centre)/axes;let dir=ray/axes;
 let a=dot(dir,dir);let b=dot(origin,dir);let c=dot(origin,origin)-1.0;
 let discriminant=b*b-a*c;
 if(discriminant<=0.0){discard;}
 let distance=(-b-sqrt(discriminant))/a;
 if(distance<=0.0){discard;}
 let chord=2.0*sqrt(discriminant)/a;
 var optical=0.0;var first=1.0;
 for(var step=0u;step<12u;step++){
   let fraction=(f32(step)+.5)/12.0;
   let p=origin+dir*(distance+fraction*chord);
   let density=frothDensity(p,i.seed);
   optical+=density*chord/12.0;
   if(density>.05){first=min(first,fraction);}
 }
 if(optical<.002){discard;}
 let point=F.camPos.xyz+ray*(distance+first*chord);
 let local=(point-i.centre)/axes;let e=.04;
 let gradient=vec3f(
   frothField(local+vec3f(e,0,0),i.seed)-frothField(local-vec3f(e,0,0),i.seed),
   frothField(local+vec3f(0,e,0),i.seed)-frothField(local-vec3f(0,e,0),i.seed),
   frothField(local+vec3f(0,0,e),i.seed)-frothField(local-vec3f(0,0,e),i.seed));
 let outward=-gradient/axes;
 let normal=normalize(select(local/axes,outward,dot(outward,outward)>1e-8));
 let clip=F.viewProj*vec4f(point-F.camPos.xyz,1);
 o.depth=clip.z/clip.w;
 let shadowUV=clamp((point.xz-F.camPos.xz)/40000.0+.5,vec2f(.001),vec2f(.999));
 let layer=select(0u,1u,max(abs(point.x-F.camPos.x),abs(point.z-F.camPos.z))>52.0);
 let waveUV=(point.xz-waveMapCentre(F.camPos.xz,layer))/waveMapSpan(layer)+.5;
 let visibility=textureSampleLevel(shadow,lightSampler,shadowUV,0.0).rg*
   textureSampleLevel(waveVisibility,lightSampler,waveUV,layer,0.0).rg;
 let sky=textureSampleLevel(environment,lightSampler,normal,0.0).rgb;
 let direct=sunIlluminance()*visibility.x*max(dot(normal,F.sunDir.xyz),0.0)+
   moonIlluminance()*visibility.y*max(dot(normal,F.moonDir.xyz),0.0);
 // Conservative scattering slab, using chord length through the parcel.
 let tau=20.0*optical;
 let reflectance=tau/(1.0+tau);
 o.colour=vec4f((sky+direct)/(PI*F.windP[1].x),reflectance*i.opacity);
 return o;
}`;
}
