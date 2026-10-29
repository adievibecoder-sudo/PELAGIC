import {replaceShader} from './shader-patch.js';
import {PARTICLE_COUNT} from './particles.js';
import {WHITEWATER_COUNT,FROTH_DENSITY} from './whitewater.js';
import {FRAME_WGSL,ATMO_CORE_WGSL} from './common.js';
import {WAVE_MAP_COORDS} from './wave-visibility.js';
import {SKY_RENDER_FUNCS} from './sky.js';

export const CREST_SHEET_COUNT=WHITEWATER_COUNT/4;
export const CREST_SHEET_NODES=9;
export const CREST_SHEET_VERTICES=8*4*6;
export const CREST_SHEET_NODE_BYTES=144;
const NODE=/* wgsl */`struct CrestNode {position:vec4f,across:vec4f,front:vec4f,back:vec4f,section:array<vec4f,5>};`;
export {NODE as CREST_NODE_WGSL};

export function crestSheetShader(code,query){
  if(query.get('abCrestShape')!=='sheet')return code;
  if(query.get('abCrest')!=='phase')throw Error('Crest sheets require phase tracking');
  if(code.includes('struct SheetOut'))return code;
  if(!code.includes('fn frothParcel(k:u32)'))return code;
  code=replaceShader(code,'fn frothParcel(k:u32){',NODE+/* wgsl */`
@group(0) @binding(10) var<storage,read_write> crestNodes:array<CrestNode>;
fn sheetSurface(q:vec2f)->vec3f {
  var d=vec3f(0);
  let amplitude=surfaceAmplitude(derivatives,samp,q,F.windP[1].y,F.waveOrigins,F.roughnessWind,F.roughnessOffset,F.seaFront,F.seaFrontControl,F.seaEnergy);
  for(var c=0u;c<6u;c++){
    d+=textureSampleLevel(disp,samp,cascadeUV(q,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins),c,0.0).xyz*select(1.0,amplitude,c>=3u);
  }
  return vec3f(q.x+d.x,d.y,q.y+d.z);
}
fn sheetNode(index:u32,q:vec2f,axis:vec2f,radius:f32,activity:f32,age:f32){
  let centre=sheetSurface(q);
  let across=normalize(sheetSurface(q+axis*.2)-sheetSurface(q-axis*.2));
  crestNodes[index].position=vec4f(centre,radius);
  crestNodes[index].across=vec4f(across,activity);
  crestNodes[index].front=vec4f(sheetSurface(q+axis*radius),age);
  crestNodes[index].back=vec4f(sheetSurface(q-axis*radius),0);
}
fn buildCrestSheet(index:u32,crest:CrestSupport,oldQ:vec2f,radius:f32,activity:f32,spawn:bool){
  let base=index*9u;
  let age=select(crestNodes[base+4u].front.w,0.0,spawn)+min(F.backscatter.w,.05);
  let birth=smoothstep(0.0,.12,age);
  var axis=crest.axis;
  // Direction from actual phase continuation; wind is only the birth fallback.
  let advance=select(dot(crest.q-oldQ,axis),dot(F.windP[0].xy,axis),spawn);
  if(advance<0.0){axis=-axis;}
  let previous=crestNodes[base+4u].across.xyz;
  if(!spawn&&abs(advance)<.01&&dot(vec3f(axis.x,0,axis.y),previous)<0.0){axis=-axis;}
  var points:array<vec2f,9>;var axes:array<vec2f,9>;
  points[4]=crest.q;axes[4]=axis;
  var low=4u;var high=4u;
  var termination=vec2u(4u);
  for(var side=0u;side<2u;side++){
    var q=crest.q;var tangent=vec2f(-axis.y,axis.x)*select(-1.0,1.0,side==1u);
    for(var step=1u;step<=4u;step++){
      let candidateQ=q+tangent*.8;
      let next=projectGravityCrest(candidateQ,.65);
      let nextAxis=next.axis*select(-1.0,1.0,dot(next.axis,axis)>=0.0);
      let nextT=vec2f(-nextAxis.y,nextAxis.x)*select(-1.0,1.0,side==1u);
      let fresh=textureSampleLevel(foam,samp,next.q/F.lodP.z,0u,0.0).g;
      // Curvature and event continuity constrain length; never span a missing
      // ridge just to complete the strip. Adjacent segments share this node.
      if(next.valid<=0.0){termination[side]=1u;break;}
      if(dot(tangent,nextT)<=.75){termination[side]=2u;break;}
      if(fresh<=.01){termination[side]=3u;break;}
      let slot=select(4u-step,4u+step,side==1u);
      points[slot]=next.q;axes[slot]=nextAxis;
      low=min(low,slot);high=max(high,slot);
      q=next.q;tangent=nextT;
    }
  }
  // Both sides end on supported water. A clipped chain closes at its actual
  // endpoint rather than exposing a full-width cut through the aerated body.
  for(var n=low;n<=high;n++){
    let taper=smoothstep(0.0,1.6,f32(min(n-low,high-n))*.8);
    sheetNode(base+n,points[n],axes[n],radius*taper,activity*birth,age);
  }
  crestNodes[base+4u].back.w=f32(termination.x+16u*termination.y);
}
fn frothParcel(k:u32){`);
  code=replaceShader(code,'  let index=k-'+PARTICLE_COUNT+'u;',/* wgsl */`
  let index=k-${PARTICLE_COUNT}u;
  if(index>=${CREST_SHEET_COUNT}u){particles[k].p.w=0.0;return;}
  for(var n=0u;n<9u;n++){
    crestNodes[index*9u+n].position.x-=F.worldOrigin.z;
    crestNodes[index*9u+n].position.z-=F.worldOrigin.w;
    crestNodes[index*9u+n].front.x-=F.worldOrigin.z;
    crestNodes[index*9u+n].front.z-=F.worldOrigin.w;
    crestNodes[index*9u+n].back.x-=F.worldOrigin.z;
    crestNodes[index*9u+n].back.z-=F.worldOrigin.w;
  }`);
  code=replaceShader(code,'  if(dt<=0.0){particles[k]=p;return;}',/* wgsl */`
  if(dt<=0.0){particles[k]=p;return;}
  for(var n=0u;n<9u;n++){crestNodes[index*9u+n].across.w=0.0;}`);
  code=replaceShader(code,'else{p.p.w=min(p.p.w,.12);p.v.y*=exp(-dt*12.0);}',
    'else{p.p.w=0.0;p.v.y=0.0;}');
  code=replaceShader(code,'  p.v.x=q.x;p.v.z=q.y;p.v.y*=exp(-dt*1.6);',/* wgsl */`
  let sheetActivity=smoothstep(0.0,.2,p.p.w)*sqrt(max(p.v.y,0.0));
  buildCrestSheet(index,crest,p.v.xz,p.v.w,sheetActivity,spawn);
  p.v.x=q.x;p.v.z=q.y;p.v.y*=exp(-dt*1.6);`);
  if(query.get('abCrestEvent')==='shared'){
    code=replaceShader(code,'fn sheetSurface(q:vec2f)->vec3f {',/* wgsl */`
fn sheetGravitySupport(q:vec2f)->f32 {
  var strain=vec3f(0);
  for(var c=0u;c<3u;c++){
    let uv=cascadeUV(q,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins);
    let d=textureSampleLevel(disp,samp,uv,c,0.0);
    let b=textureSampleLevel(derivatives,samp,uv,c,0.0);
    strain+=vec3f(b.z,b.w,d.w);
  }
  strain/=max(F.windP[1].y,.1);
  let steepness=-.5*(strain.x+strain.y-length(vec2f(strain.x-strain.y,2.0*strain.z)));
  return smoothstep(.22,.40,steepness);
}
fn sheetSurface(q:vec2f)->vec3f {`);
    code=replaceShader(code,'let fresh=textureSampleLevel(foam,samp,next.q/F.lodP.z,0u,0.0).g;',
      'let fresh=sheetGravitySupport(next.q);');
    code=replaceShader(code,'if(fresh<=.01){termination[side]=3u;break;}',
      'if(fresh<=.05){termination[side]=3u;break;}');
  }
  if(query.get('abCrestEdge')==='fade'){
    code=replaceShader(code,'sheetNode(base+n,points[n],axes[n],radius*taper,activity*birth,age);',
      'sheetNode(base+n,points[n],axes[n],radius,activity*birth*max(taper,.0001),age);');
  }
  if(query.get('abCrestSurface')==='water'&&query.get('abCrestLife')==='supported'){
    code=replaceShader(code,'  // Active froth follows phase;',`  if(!spawn&&support>.15){p.p.w=max(p.p.w,.35);}
  p.v.y=mix(p.v.y,support,1.0-exp(-dt/.18));
  // Active froth follows phase;`);
    code=replaceShader(code,'p.v.y*=exp(-dt*1.6);','p.v.y*=exp(-dt*select(1.6,0.0,support>.15));');
  }
  if(query.get('abCrestSurface')==='water'){
    code=replaceShader(code,'    crestNodes[index*9u+n].back.z-=F.worldOrigin.w;',`    crestNodes[index*9u+n].back.z-=F.worldOrigin.w;
    for(var j=0u;j<5u;j++){
      crestNodes[index*9u+n].section[j].x-=F.worldOrigin.z;
      crestNodes[index*9u+n].section[j].z-=F.worldOrigin.w;
    }`);
    code=replaceShader(code,'  crestNodes[index].back=vec4f(sheetSurface(q-axis*radius),0);',/* wgsl */`
  crestNodes[index].back=vec4f(sheetSurface(q-axis*radius),0);
  for(var j=0u;j<5u;j++){
    let u=f32(j)*.25;
    let water=sheetSurface(q+axis*radius*(1.0-2.0*u));
    crestNodes[index].section[j]=vec4f(water,0);
  }`);
  }
  return code;
}

export const CREST_SHEET_RENDER=FRAME_WGSL+ATMO_CORE_WGSL+WAVE_MAP_COORDS+FROTH_DENSITY+NODE+/* wgsl */`
@group(0) @binding(0) var<uniform> F:Frame;
@group(0) @binding(1) var<storage,read> nodes:array<CrestNode>;
@group(0) @binding(2) var environment:texture_cube<f32>;
@group(0) @binding(3) var sampC:sampler;
@group(0) @binding(4) var shadow:texture_2d<f32>;
@group(0) @binding(5) var waveVisibility:texture_2d_array<f32>;
@group(0) @binding(6) var transLUT:texture_2d<f32>;
@group(0) @binding(7) var skyLUT:texture_2d_array<f32>;
`+SKY_RENDER_FUNCS+/* wgsl */`
// Thin MSAA triangles need covered-sample interpolants: pixel centres can lie
// outside the sheet and extrapolate its optical-depth profile below zero.
struct SheetOut {@builtin(position) p:vec4f,
  @location(0) @interpolate(perspective,centroid) world:vec3f,
  @location(1) @interpolate(perspective,centroid) uv:vec2f,
  @location(2) @interpolate(perspective,centroid) normal:vec3f,
  @location(3) @interpolate(perspective,centroid) activity:f32,
  @location(4) @interpolate(flat) seed:f32};
fn sheetPoint(n:CrestNode,u:f32)->vec3f {
  let flank=select(n.front.xyz,n.back.xyz,u>.5);
  let water=mix(n.position.xyz,flank,abs(2.0*u-1.0));
  return water+vec3f(0,sin(u*PI)*n.position.w*.5+.008,0);
}
@vertex fn vs(@builtin(vertex_index) vertex:u32,@builtin(instance_index) instance:u32)->SheetOut {
  let corner=array<vec2u,6>(vec2u(0,0),vec2u(1,0),vec2u(1,1),vec2u(0,0),vec2u(1,1),vec2u(0,1));
  let cell=vertex/6u;let c=corner[vertex%6u];let along=cell/4u+c.x;let across=cell%4u+c.y;
  let n=nodes[instance*9u+along];
  let a=nodes[instance*9u+cell/4u];let b=nodes[instance*9u+cell/4u+1u];
  let u=f32(across)/4.0;let angle=u*PI;
  let radius=n.position.w;
  let world=sheetPoint(n,u);
  let crossSlope=select((n.position.xyz-n.front.xyz)*2.0,(n.back.xyz-n.position.xyz)*2.0,u>.5)+vec3f(0,cos(angle)*PI*radius*.5,0);
  let alongSlope=b.position.xyz-a.position.xyz;
  let rawNormal=cross(alongSlope,crossSlope);
  let normal=select(rawNormal,-rawNormal,rawNormal.y<0.0);
  var o:SheetOut;o.p=F.viewProj*vec4f(world-F.camPos.xyz,1);o.world=world;
  o.uv=vec2f(f32(along)*.8,u);o.normal=normalize(normal+vec3f(0,1e-6,0));
  o.activity=select(0.0,n.across.w,a.across.w>0.0&&b.across.w>0.0);
  o.seed=f32(instance%997u)*.6180339;return o;
}
@fragment fn fs(i:SheetOut)->@location(0) vec4f {
  if(i.activity<=0.0){discard;}
  // Shared world-space pores do not restart at every strip or traced node.
  let porePosition=vec3f(i.world.x+F.worldOrigin.x*1000.0,i.world.y,i.world.z+F.worldOrigin.y*1000.0);
  let pores=frothNoise(porePosition*5.0)*.75+frothNoise(porePosition*13.0)*.25;
  let holes=smoothstep(.28,.62,pores);
  let edge=max(0.0,sin(clamp(i.uv.y,0.0,1.0)*PI));
  let tau=6.0*edge*holes;
  let reflectance=tau/(1.0+tau);
  let normal=normalize(i.normal);
  let shadowUV=clamp((i.world.xz-F.camPos.xz)/40000.0+.5,vec2f(.001),vec2f(.999));
  let layer=select(0u,1u,max(abs(i.world.x-F.camPos.x),abs(i.world.z-F.camPos.z))>52.0);
  let waveUV=(i.world.xz-waveMapCentre(F.camPos.xz,layer))/waveMapSpan(layer)+.5;
  let visibility=textureSampleLevel(shadow,sampC,shadowUV,0.0).rg*textureSampleLevel(waveVisibility,sampC,waveUV,layer,0.0).rg;
  let sky=textureSampleLevel(environment,sampC,normal,0.0).rgb;
  let direct=sunIlluminance()*visibility.x*max(dot(normal,F.sunDir.xyz),0.0)+moonIlluminance()*visibility.y*max(dot(normal,F.moonDir.xyz),0.0);
  return vec4f((sky+direct)/(PI*F.windP[1].x),clamp(reflectance*i.activity,0.0,1.0));
}
`;
