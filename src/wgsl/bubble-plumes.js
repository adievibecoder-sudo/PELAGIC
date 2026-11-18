import {replaceShader} from './shader-patch.js';
import {WATER_LAYER} from './water-material.js';

export const BUBBLE_TRANSPORT=/* wgsl */`
const BUBBLE_STORAGE:f32=1024.0;
fn advanceBubbleColumn(plume:vec4f,fresh:f32,dt:f32)->vec4f {
  if(dt==0.0){return plume;}
  let gas=max((plume.r+plume.a)/BUBBLE_STORAGE,0.0);
  let depth=clamp((plume.g+plume.b)/(BUBBLE_STORAGE*max(gas,1e-8)),.03,2.5);
  let rise=.18;
  let remaining=gas*exp(-dt*(.12+rise/max(depth,.1)));
  let injection=.004*dt*clamp(fresh,0.0,1.0);
  let sourceDepth=.35+1.1*sqrt(clamp(fresh,0.0,1.0));
  let column=remaining+injection;
  let moment=remaining*max(depth-rise*dt,.03)+injection*sourceDepth;
  let storedGas=quantizeToF16(column*BUBBLE_STORAGE);let storedMoment=quantizeToF16(moment*BUBBLE_STORAGE);
  return vec4f(storedGas,storedMoment,moment*BUBBLE_STORAGE-storedMoment,column*BUBBLE_STORAGE-storedGas);
}
`;

// A compact beta(2,2) vertical profile has unit column and centroid depth.
// Its analytic integral resolves thin columns even between ray sample points.
// The shape is a closure of two transported moments, not resolved turbulence.
export const BUBBLE_VOLUME=/* wgsl */`
fn bubbleColumnFraction(depth:f32,meanDepth:f32)->f32 {
  let t=clamp(depth/(2.0*max(meanDepth,.03)),0.0,1.0);
  return t*t*(3.0-2.0*t);
}
fn bubbleSegmentWeight(waterTau:vec3f,bubbleTau:f32)->vec3f {
  let total=waterTau+vec3f(bubbleTau);
  // Integral of the bubble source through this absorbing segment. The
  // complementary background term keeps zero gas an exact identity.
  let response=select(1.0-exp(-total),total*(1.0-.5*total+total*total/6.0),total<vec3f(.001));
  return response*bubbleTau/max(total,vec3f(1e-8));
}
`;

const VOLUME_VIEW=/* wgsl */`
  let interfaceNormal=select(normalize(select(-rasterNormal,rasterNormal,rasterNormal.y>=0.0)),nrm,dot(nrm,V)>0.0);
  let waterRay=refract(-V,interfaceNormal,1.0/1.333);
  let inverseHorizontal=mat2x2f(jz,-jzx,-jxz,jx)*(1.0/max(jac,.3));
  let muView=max(-dot(waterRay,interfaceNormal),.66);
  let waterExtinction=aWater+waterMolecularScatter(bb)+waterParticleScatter(bb)*(1.0-WATER_PARTICLE_G);
  let unperturbedBody=body;
  let footprint=max(length(dxXZ),length(dyXZ));
  var through=vec3f(1);var change=vec3f(0);
  for(var tap=0u;tap<12u;tap++){
    let lower=5.0*pow(f32(tap)/12.0,2.0);
    let upper=5.0*pow(f32(tap+1u)/12.0,2.0);
    let depth=.5*(lower+upper);
    let q=xz+inverseHorizontal*waterRay.xz*(depth/muView);
    let plume=submergedColumnFiltered(q,footprint);
    let gas=max(plume.r+plume.a,0.0);
    let meanDepth=clamp((plume.g+plume.b)/max(gas,1e-8),.03,2.5);
    let segmentGas=gas*(bubbleColumnFraction(upper,meanDepth)-bubbleColumnFraction(lower,meanDepth))/muView;
    let bubbleTau=225.0*segmentGas;
    let waterTau=waterExtinction*((upper-lower)/muView);
    // Same reduced-scattering family and incident budget as the slab trial.
    // This is a bounded diffuse-source approximation, not a Mie phase solver.
    let source=downwelling*exp(-waterExtinction*depth)/(PI*1.333*1.333);
    change+=through*bubbleSegmentWeight(waterTau,bubbleTau)*(source-unperturbedBody);
    through*=exp(-waterTau-vec3f(bubbleTau));
  }
  body=unperturbedBody+change;
`;

// Air volume per surface area [m] and its depth moment [m2]. The phenomenological
// entrainment rate is bounded; this is not a resolved turbulent gas simulation.
export function bubblePlumeShader(code,query){
  const volume=query.get('abBubbles')==='volume';
  if(!volume&&query.get('abBubbles')!=='plumes')return code;
  if(code.includes('struct FoamU {')){
    code=replaceShader(code,'fn wrapIdx(',BUBBLE_TRANSPORT+'fn wrapIdx(');
    return replaceShader(code,'  textureStore(dst, id.xy, lvl, vec4f(stored, fresh, signal, f-stored));',/* wgsl */`
  textureStore(dst, id.xy, lvl, vec4f(stored, fresh, signal, f-stored));
  var plume=vec4f(0);
  // Use the residual/material characteristic, not the travelling crest's phase.
  // The radius is sqrt(4 D dt): four ring taps integrate isotropic diffusion.
  let diffusion=.12+.30*clamp(fresh,0.0,1.0);
  let radius=sqrt(4.0*diffusion*dt)/ts;
  let back=(vec2f(id.xy)+.5-velocity*dt/ts)/f32(RES);
  for(var tap=0u;tap<4u;tap++){
    let angle=f32(tap)*1.57079632679;
    let offset=vec2f(cos(angle),sin(angle))*radius;
    let samplePoint=source+offset;
    if(all(samplePoint>=vec2f(plo))&&all(samplePoint<vec2f(plo+vec2i(RES-1)))){
      plume+=sampleFoamHistory(back+offset/f32(RES),lvl+2u)*.25;
    }
  }
  textureStore(dst,id.xy,lvl+2u,advanceBubbleColumn(plume,fresh,dt));`);
  }
  if(!code.includes('fn reflectedEnvironment('))return code;
  if(query.has('abWater')&&query.get('abWater')!=='off')throw Error('Bubble plumes currently require the normal water-body solver');
  if(volume){
    code=replaceShader(code,'fn reflectedEnvironment(',BUBBLE_VOLUME+/* wgsl */`
fn submergedColumnFiltered(q:vec2f,footprint:f32)->vec4f {
  let distance=max(abs(q.x-F.camPos.x),abs(q.y-F.camPos.z));
  let near=1.0-smoothstep(.30*F.lodP.z,.45*F.lodP.z,distance);
  let far=1.0-smoothstep(.30*F.lodP.w,.45*F.lodP.w,distance);
  let resolution=f32(textureDimensions(foamWorld).x);
  let nearLod=max(log2(max(footprint*resolution/F.lodP.z,1.0)),0.0);
  let farLod=max(log2(max(footprint*resolution/F.lodP.w,1.0)),0.0);
  let a=textureSampleLevel(foamWorld,sampR,q/F.lodP.z,2u,nearLod);
  let b=textureSampleLevel(foamWorld,sampR,q/F.lodP.w,3u,farLod);
  return mix(b,a,near)*(far/1024.0);
}
fn reflectedEnvironment(`);
    return replaceShader(code,'  body += exp(-aWater*0.65)*downwelling/PI*aeration*0.075;',VOLUME_VIEW);
  }
  code=replaceShader(code,'fn reflectedEnvironment(',WATER_LAYER+/* wgsl */`
fn submergedColumn(q:vec2f)->vec4f {
  let distance=max(abs(q.x-F.camPos.x),abs(q.y-F.camPos.z));
  let near=1.0-smoothstep(.30*F.lodP.z,.45*F.lodP.z,distance);
  let far=1.0-smoothstep(.30*F.lodP.w,.45*F.lodP.w,distance);
  let a=textureSample(foamWorld,sampR,q/F.lodP.z,2u);
  let b=textureSample(foamWorld,sampR,q/F.lodP.w,3u);
  return mix(b,a,near)*(far/1024.0);
}
fn reflectedEnvironment(`);
  // Reuse foamWorld's two new layers. All previous surface channels remain intact.
  code=replaceShader(code,'  body += exp(-aWater*0.65)*downwelling/PI*aeration*0.075;',/* wgsl */`
  let entryPlume=submergedColumn(xz);
  let entryDepth=clamp((entryPlume.g+entryPlume.b)/max(entryPlume.r+entryPlume.a,1e-8),.03,2.5);
  let waterRay=refract(-V,nrm,1.0/1.333);
  // Refracted parallax through the actual local tangent plane, then back to
  // material coordinates. This column closure is not a resolved 3D plume.
  let inverseHorizontal=mat2x2f(jz,-jzx,-jxz,jx)*(1.0/max(jac,.3));
  let columnPoint=xz+inverseHorizontal*waterRay.xz*(entryDepth/max(-dot(waterRay,nrm),.66));
  let plume=submergedColumn(columnPoint);
  let gasColumn=max(plume.r+plume.a,0.0);
  let plumeDepth=clamp((plume.g+plume.b)/max(gasColumn,1e-8),.03,2.5);
  // 0.5 mm radius, g=.85: reduced scattering optical depth = 225 * gas column.
  // Both are explicit bubble-family assumptions, not a calibrated size spectrum.
  let layerThickness=min(2.0*plumeDepth,150.0*gasColumn);
  let layer=waterFiniteLayer(aWater,vec3f(225.0*gasColumn/max(layerThickness,1e-6)),layerThickness);
  let overburden=max(plumeDepth-.5*layerThickness,0.0);
  let muView=sqrt(1.0-(1.0-pow(clamp(dot(nrm,V),0.0,1.0),2.0))/(1.333*1.333));
  let attenuation=exp(-aWater*overburden*(1.0/max(muView,.66)+1.2));
  let bubbleReflection=layer.reflection*attenuation;
  // Partition the same downwelling budget. No additive cyan emission and no
  // compression-only air source; the surface foam is shaded independently.
  body=body*(1.0-bubbleReflection)+downwelling*bubbleReflection/(PI*1.333*1.333);`);
  return code;
}
