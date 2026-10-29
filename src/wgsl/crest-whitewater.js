import {replaceShader} from './shader-patch.js';
import {CREST_SUPPORT,GRAVITY_CREST_SAMPLING} from './crest-support.js';
import {PARTICLE_COUNT} from './particles.js';

export function crestWhitewaterShader(code,query){
  if(query.get('abCrest')!=='phase')return code;
  if(query.get('abWhitewater')!=='parcels'||query.get('maBreaking')!=='gravity')throw Error('Crest tracking requires gravity whitewater parcels');
  if(code.includes('fn frothParcel(k:u32)')){
    const start=code.indexOf('fn frothParcel(k:u32)'),end=code.indexOf('@compute @workgroup_size(64)',start);
    if(end<0)throw Error('Crest parcel compute contract changed');
    return code.slice(0,start)+CREST_SUPPORT+GRAVITY_CREST_SAMPLING+/* wgsl */`
@group(0) @binding(9) var<storage,read_write> crestFrames:array<vec4f>;
fn frothParcel(k:u32){
  let index=k-${PARTICLE_COUNT}u;
  var p=particles[k];let dt=min(F.backscatter.w,.05);
  p.v.x-=F.worldOrigin.z;p.v.z-=F.worldOrigin.w;
  p.p.x-=F.worldOrigin.z;p.p.z-=F.worldOrigin.w;
  if(dt<=0.0){particles[k]=p;return;}
  if(F.foamP.z<=0.0){p.p.w=0;particles[k]=p;return;}
  p.p.w-=dt;
  var q=p.v.xz;
  let spawn=p.p.w<=0.0 || distance(p.p.xz,F.camPos.xz)>66.0;
  let seed=k*137u+u32(F.post.z)*197u;
  if(spawn){q=F.camPos.xz+(vec2f(rnd(seed+1u),rnd(seed+3u))-.5)*116.0;}
  let crest=projectGravityCrest(q,select(.08+20.0*dt,2.5,spawn));
  if(crest.valid==0.0){
    if(spawn){p.p=vec4f(q.x,-1000,q.y,0);crestFrames[index]=vec4f(0);}
    else{p.p.w=min(p.p.w,.12);p.v.y*=exp(-dt*12.0);}
    particles[k]=p;return;
  }
  q=crest.q;
  let fresh=textureSampleLevel(foam,samp,q/F.lodP.z,0u,0.0).g;
  var d=vec3f(0);var strain=vec3f(0);var slope=vec2f(0);
  let amplitude=surfaceAmplitude(derivatives,samp,q,F.windP[1].y,F.waveOrigins,F.roughnessWind,F.roughnessOffset,F.seaFront,F.seaFrontControl,F.seaEnergy);
  for(var c=0u;c<6u;c++){
    let uv=cascadeUV(q,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins);
    let a=textureSampleLevel(disp,samp,uv,c,0.0);
    d+=a.xyz*select(1.0,amplitude,c>=3u);
    if(c<3u){let b=textureSampleLevel(derivatives,samp,uv,c,0.0);strain+=vec3f(b.z,b.w,a.w);slope+=b.xy;}
  }
  // Geometry uses a metre-scale ridge. Onset retains AB6's full gravity-band
  // strain; applying its thresholds to a smoothed magnitude suppresses events.
  let gravityStrain=strain/max(F.windP[1].y,.1);
  let steepness=-.5*(gravityStrain.x+gravityStrain.y-length(vec2f(gravityStrain.x-gravityStrain.y,2.0*gravityStrain.z)));
  let support=smoothstep(.22,.40,steepness);
  if(spawn){
    if(rnd(seed+4u)>emissionProbability(fresh*support*min(F.foamP.z,1.0),dt)){
      p.p=vec4f(q.x,-1000,q.y,0);crestFrames[index]=vec4f(0);particles[k]=p;return;
    }
    let r=rnd(seed+2u);p.p.w=.45+.55*r;
    p.v=vec4f(q.x,fresh,q.y,.28+.48*r*sqrt(fresh));
  }
  // Active froth follows phase; residual surface foam retains material-current
  // transport. Map the ridge tangent into the displaced surface.
  let tangent=vec2f(-crest.axis.y,crest.axis.x);
  let worldT=mat2x2f(1.0+strain.x,strain.z,strain.z,1.0+strain.y)*tangent;
  var frame=normalize(vec3f(worldT.x,dot(slope,tangent),worldT.y));
  let previous=crestFrames[index].xyz;
  if(!spawn && dot(previous,frame)<0.0){frame=-frame;}
  crestFrames[index]=vec4f(frame,crest.steepness);
  p.v.x=q.x;p.v.z=q.y;p.v.y*=exp(-dt*1.6);
  p.p=vec4f(q.x+d.x,d.y+p.v.w*.02,q.y+d.z,p.p.w);
  particles[k]=p;
}
`+code.slice(end);
  }
  if(!code.includes('struct FrothOut'))return code;
  code=replaceShader(code,'@group(0) @binding(8) var skyLUT:texture_2d_array<f32>;',
    '@group(0) @binding(10) var skyLUT:texture_2d_array<f32>;\n@group(0) @binding(8) var<storage,read> crestFrames:array<vec4f>;');
  code=replaceShader(code,'@location(7) @interpolate(flat) seed:f32};',
    '@location(7) @interpolate(flat) seed:f32,@location(8) @interpolate(flat) tangent:vec3f};');
  code=replaceShader(code,' if(o.froth==1u){',' o.tangent=vec3f(0,0,1);\n if(o.froth==1u){\n   o.tangent=crestFrames[id-'+PARTICLE_COUNT+'u].xyz;');
  if(query.get('abCrestShape')!=='elongated')return code;
  code=replaceShader(code,'let drawRadius=max(radius,pixelRadius);',
    `let drawRadius=max(radius*select(1.0,3.0,id>=${PARTICLE_COUNT}u),pixelRadius);`);
  code=replaceShader(code,'let axes=vec3f(i.radius,i.radius*.28,i.radius);',/* wgsl */`
 let tangent=normalize(i.tangent);
 let across=normalize(vec3f(tangent.z,0,-tangent.x));
 let up=cross(tangent,across);
 let localToWorld=mat3x3f(across,up,tangent);let worldToLocal=transpose(localToWorld);
 let axes=vec3f(i.radius,i.radius*.28,i.radius*3.0);`);
  code=replaceShader(code,'let origin=(F.camPos.xyz-i.centre)/axes;let dir=ray/axes;',
    'let origin=(worldToLocal*(F.camPos.xyz-i.centre))/axes;let dir=(worldToLocal*ray)/axes;');
  code=replaceShader(code,'let local=(point-i.centre)/axes;let e=.04;',
    'let local=(worldToLocal*(point-i.centre))/axes;let e=.04;');
  code=replaceShader(code,'let normal=normalize(select(local/axes,outward,dot(outward,outward)>1e-8));',
    'let normal=localToWorld*normalize(select(local/axes,outward,dot(outward,outward)>1e-8));');
  return code;
}
