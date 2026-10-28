import {OCEAN} from './ocean.js';
import {replaceShader} from './shader-patch.js';

export const FROTH_SKIN_WEIGHT=/* wgsl */`
fn frothSkinWeight(q:vec2f)->f32 {
  let d=max(abs(q.x-F.camPos.x),abs(q.y-F.camPos.z));
  return 1.0-smoothstep(40.0,54.0,d);
}
`;

// One continuous surface follows the shared occupancy, rather than individual
// event strips. The optical closure is a porous slab, not overturning water.
const SUPPORT=FROTH_SKIN_WEIGHT+/* wgsl */`
fn frothState(q:vec2f)->vec4f {
  let d=max(abs(q.x-F.camPos.x),abs(q.y-F.camPos.z));
  let near=1.0-smoothstep(.30*F.lodP.z,.45*F.lodP.z,d);
  return mix(textureSampleLevel(foamWorld,sampR,q/F.lodP.w,1u,0.0),
    textureSampleLevel(foamWorld,sampR,q/F.lodP.z,0u,0.0),near);
}
fn frothHeight(q:vec2f)->f32 {
  let state=frothState(q);
  let support=smoothstep(.02,.32,state.g)*min(F.foamP.z,1.0);
  let mound=textureSampleLevel(foamTex,sampR,q*.29+F.patternOrigins[0].xy,0.0).b;
  return support*(.12+.32*mound)*frothSkinWeight(q);
}
`;

export function frothSurfaceShader(code,query){
  if(!['skin','volume'].includes(query.get('abFoam'))||!code.includes('fn reflectedEnvironment('))return code;
  code=replaceShader(code,'fn foamCoverage(',FROTH_SKIN_WEIGHT+'fn foamCoverage(');
  return replaceShader(code,'let activeCoverage=mix(activePores,activeArea,.35);',
    'let activeCoverage=mix(activePores,activeArea,.35)*(1.0-frothSkinWeight(xz));');
}

export function frothSurfaceCode(temporal=false,volume=false){
  let code=OCEAN.slice(0,OCEAN.indexOf('fn fresnelWater('));
  code=replaceShader(code,'struct VSOut {',SUPPORT+'struct VSOut {');
  code=replaceShader(code,'disp.y-curvature,','disp.y+frothHeight(xz)-curvature,');
  if(temporal)code=replaceShader(code,'  o.xz = xz;',
    '  o.pos=vec4f(o.pos.xy+F.jitter.xy*o.pos.w,o.pos.zw);\n  o.xz = xz;');
  if(volume){
    code=replaceShader(code,'  @location(2) height: f32,','  @location(3) bottom: vec3f,\n  @location(2) height: f32,');
    code=replaceShader(code,'  o.height = disp.y;',
      '  o.bottom=o.rel-vec3f(0,frothHeight(xz),0);\n  o.height = disp.y;');
    code=replaceShader(code,'support*(.12+.32*mound)','support*(.18+.50*mound)');
    return code+FROTH_VOLUME;
  }
  return code+/* wgsl */`
@fragment fn fs(in:VSOut)->@location(0) vec4f {
  let state=frothState(in.xz);
  let supported=max(state.g,state.b*state.g/(state.g+.04));
  let area=clamp((1.0-exp(-4.0*supported))*F.foamP.z,0.0,1.0);
  let uv=in.xz*.29+F.patternOrigins[0].xy;
  let rank=textureSample(foamTex,sampR,uv).r;
  let edge=max(fwidth(rank),.018);
  let footprint=max(length(dpdx(uv)),length(dpdy(uv)))*10.0;
  let resolved=smoothstep(1.0-area-edge,1.0-area+edge,rank);
  let pores=mix(resolved,area,smoothstep(.12,.6,footprint));
  let coverage=select(mix(pores,area,.35),0.0,area<=0.0);
  let bubble=textureSample(foamTex,sampR,in.xz*1.9+vec2f(.21,.53)+F.patternOrigins[1].zw).g;
  let tau=5.0*(.85+.15*bubble);
  let opacity=coverage*tau/(1.0+tau)*frothSkinWeight(in.xz)*(1.0-waterFraction(in.pos.xy));
  let geometric=normalize(cross(dpdy(in.rel),dpdx(in.rel)));
  let normal=select(-geometric,geometric,geometric.y>=0.0);
  let world=F.camPos.xyz+in.rel;
  let shadowUV=clamp((in.xz-F.camPos.xz)/40000.0+.5,vec2f(.001),vec2f(.999));
  let cloudT=textureSampleLevel(cloudShadow,sampC,shadowUV,0.0).rg;
  let waveUV=(world.xz-waveMapCentre(F.camPos.xz,0u))/128.0+.5;
  let visibility=cloudT*textureSampleLevel(waveShadow,sampC,waveUV,0u,0.0).rg;
  let sky=textureSampleLevel(skyIrradiance,sampC,normal,0.0).rgb;
  let direct=sunIlluminance()*visibility.x*max(dot(normal,F.sunDir.xyz),0.0)+
    moonIlluminance()*visibility.y*max(dot(normal,F.moonDir.xyz),0.0);
  if(opacity<=.0001){discard;}
  return vec4f((sky+direct)/(PI*F.windP[1].x),opacity);
}
`;
}

const FROTH_VOLUME=/* wgsl */`
struct FrothVolumeOut {@location(0) color:vec4f};
@fragment fn fs(in:VSOut)->FrothVolumeOut {
  let state=frothState(in.xz);
  let support=smoothstep(.02,.32,state.g)*min(F.foamP.z,1.0);
  let thickness=max(in.rel.y-in.bottom.y,0.0);
  if(thickness<.002 || support<=0.0){discard;}
  let ray=normalize(in.rel);
  let bottomCross=cross(dpdy(in.bottom),dpdx(in.bottom));
  let baseNormal=normalize(select(-bottomCross,bottomCross,bottomCross.y>=0.0));
  let down=max(-dot(ray,baseNormal),.08);
  let travel=min(thickness*baseNormal.y/down,2.0);
  let stepSize=travel/6.0;
  let uv=in.xz*.29+F.patternOrigins[0].xy;
  let flow=F.cloudP.w*.22;
  let footprint=max(length(dpdx(uv)),length(dpdy(uv)));
  let lod=max(log2(max(footprint*512.0,1.0)),0.0);
  var trans=1.0;var scattered=0.0;
  // A porous shell tied to active occupancy. Density changes with depth;
  // it is not a second opaque film on the sea or a resolved fluid volume.
  for(var tap=0u;tap<6u;tap++){
    let distance=(f32(tap)+.5)*stepSize;
    let p=in.xz+ray.xz*distance;
    let z=1.0-distance*down/max(thickness*baseNormal.y,.001);
    let coarse=textureSampleLevel(foamTex,sampR,p*.29+F.patternOrigins[0].xy+vec2f(z*.19,flow*.07),lod).b;
    let fine=textureSampleLevel(foamTex,sampR,p*1.17+F.patternOrigins[0].xy*4.03448+vec2f(-flow*.13,z*.37),lod+2.0).g;
    let top=.30+.62*coarse+.08*fine;
    let edge=(1.0-smoothstep(top-.20,top,z))*smoothstep(-.08,.12,z);
    let density=edge*(.45+.55*fine)*support;
    let extinction=12.0*density;
    let stepT=exp(-extinction*stepSize);
    let escape=1.0/(1.0+extinction*max(top-z,0.0)*thickness);
    scattered+=trans*(1.0-stepT)*(.55+.45*escape);
    trans*=stepT;
  }
  let weight=frothSkinWeight(in.xz)*(1.0-waterFraction(in.pos.xy));
  let alpha=(1.0-trans)*weight;
  if(alpha<.001){discard;}
  let shadowUV=clamp((in.xz-F.camPos.xz)/40000.0+.5,vec2f(.001),vec2f(.999));
  let cloudT=textureSampleLevel(cloudShadow,sampC,shadowUV,0.0).rg;
  let world=F.camPos.xyz+in.bottom;
  let waveUV=(world.xz-waveMapCentre(F.camPos.xz,0u))/128.0+.5;
  let visibility=cloudT*textureSampleLevel(waveShadow,sampC,waveUV,0u,0.0).rg;
  let sky=textureSampleLevel(skyIrradiance,sampC,baseNormal,0.0).rgb;
  let direct=sunIlluminance()*visibility.x*max(dot(baseNormal,F.sunDir.xyz),0.0)+
    moonIlluminance()*visibility.y*max(dot(baseNormal,F.moonDir.xyz),0.0);
  var out:FrothVolumeOut;
  out.color=vec4f((sky+direct)/PI*(scattered/max(1.0-trans,.001))/F.windP[1].x,alpha);
  return out;
}
`;
