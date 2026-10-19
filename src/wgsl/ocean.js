// Ocean surface + sky background rendering.
import { FRAME_WGSL, ATMO_CORE_WGSL, ENV_MIPS, ENV_SIZE, N, CASCADES } from './common.js';
import { SKY_RENDER_FUNCS, SKY_CLOUD_FUNCS } from './sky.js';
import { IMMERSION } from './immersion.js';

const RENDER_BINDINGS = /* wgsl */ `
@group(0) @binding(0) var<uniform> F: Frame;
@group(0) @binding(1) var transLUT: texture_2d<f32>;
@group(0) @binding(2) var skyLUT: texture_2d<f32>;
@group(0) @binding(3) var sampC: sampler;
`;

// Full-resolution sky + clouds. Cloud silhouettes are anti-aliased analytically: the
// screen-space derivative of each layer's edge function sets the width of its opacity edge.
export const SKY_BG = FRAME_WGSL + ATMO_CORE_WGSL + RENDER_BINDINGS + `@group(0) @binding(4) var cloudScreen:texture_2d<f32>;
@group(0) @binding(7) var<storage,read> surfaceAtLens:vec4f;` + SKY_RENDER_FUNCS + SKY_CLOUD_FUNCS + IMMERSION + /* wgsl */ `
struct VO { @builtin(position) pos: vec4f, @location(0) ndc: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VO {
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u)) * 2.0 - 1.0;
  var o: VO;
  o.pos = vec4f(p, 0.0, 1.0);
  o.ndc = p;
  return o;
}
@fragment fn fs(in: VO) -> @location(0) vec4f {
  let dir = normalize(F.camFwd.xyz + in.ndc.x * F.camRight.xyz + in.ndc.y * F.camUp.xyz);
  let pixAng = 2.0 * length(F.camUp.xyz) * F.screen.w;
  var d2 = dir;
  d2.y = max(d2.y, 0.0005);
  d2 = normalize(d2);
  let cloudUV=in.pos.xy*F.screen.zw;
  let cl=textureSampleLevel(cloudScreen,sampC,cloudUV,0.0);
  var L=skyAtmo(dir)*(1.0-cl.a)+cl.rgb+(sunDisk(dir)+nightStars(dir))*(1.0-cl.a);
  L=mix(L,volumeWater(dir,200.0,surfaceAtLens),waterFraction(dir,surfaceAtLens));
  return vec4f(L/F.windP[1].x, 1.0);
}
`;

export const OCEAN = FRAME_WGSL + ATMO_CORE_WGSL + RENDER_BINDINGS + /* wgsl */ `
@group(0) @binding(4) var dispTex: texture_2d_array<f32>;
@group(0) @binding(5) var derivTex: texture_2d_array<f32>;
@group(0) @binding(6) var momTex: texture_2d_array<f32>;
@group(0) @binding(7) var foamTex: texture_2d<f32>;
@group(0) @binding(8) var envCube: texture_cube<f32>;
@group(0) @binding(9) var sampR: sampler;
@group(0) @binding(10) var foamWorld: texture_2d_array<f32>;
@group(0) @binding(11) var cloudShadow:texture_2d<f32>;
@group(0) @binding(12) var<storage,read> surfaceAtLens:vec4f;
` + SKY_RENDER_FUNCS + IMMERSION + /* wgsl */ `
const ENV_MAXMIP: f32 = ${ENV_MIPS - 1}.0;
const ENV_TEXELS_PER_RAD: f32 = ${ENV_SIZE}.0 / 1.5708;
const TEX_N: f32 = ${N}.0;

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) rel: vec3f,     // displaced position relative to the camera
  @location(1) xz: vec2f,      // undisplaced (lagrangian) coordinates
  @location(2) height: f32,
};

@vertex fn vs(@builtin(vertex_index) vi: u32, @location(0) inst: vec4f) -> VSOut {
  let n = u32(F.lodP.y);
  let g = vec2f(f32(vi % (n + 1u)), f32(vi / (n + 1u)));
  let spacing = inst.z / f32(n);
  var xz = inst.xy + g * spacing;
  // CDLOD morph towards the next coarser level
  let R = F.lodP.x * exp2(inst.w);
  let d = distance(vec3f(xz.x, 0.0, xz.y), F.camPos.xyz);
  let mk = clamp((d - 0.8 * R) / (0.2 * R), 0.0, 1.0);
  xz -= fract(g * 0.5) * 2.0 * spacing * mk;
  let eff = spacing * (1.0 + mk);
  var disp = vec3f(0.0);
  for (var c = 0u; c < ${CASCADES}u; c++) {
    let texel = F.cascL[c >> 2u][c & 3u] / TEX_N;
    let lod = log2(max(eff / texel, 1.0)) + 0.5;
    if (lod < 8.0) {
      disp += textureSampleLevel(dispTex, sampR, xz * F.cascInvL[c >> 2u][c & 3u], c, lod).xyz;
    }
  }
  var o: VSOut;
  let delta=xz-F.camPos.xz;
  let curvature=dot(delta,delta)/(2.0*6360000.0);
  let world = vec3f(xz.x + disp.x, disp.y-curvature, xz.y + disp.z);
  o.rel = world - F.camPos.xyz;
  o.pos = F.viewProj * vec4f(o.rel, 1.0);
  o.xz = xz;
  o.height = disp.y;
  return o;
}

fn fresnelWater(c: f32) -> f32 {
  let ci = clamp(abs(c), 0.00001, 1.0);
  let ct = sqrt(max(0.0, 1.0 - (1.0-ci*ci)/(1.333*1.333)));
  let rs = (ci-1.333*ct)/(ci+1.333*ct);
  let rp = (1.333*ci-ct)/(1.333*ci+ct);
  return 0.5*(rs*rs+rp*rp);
}

fn lambdaSmith(w: vec3f, cov: vec3f) -> f32 {
  let xz2 = max(dot(w.xz, w.xz), 1e-8);
  let il = inverseSqrt(xz2);
  let az = w.xz * il;
  let sig2 = az.x * az.x * cov.x + az.y * az.y * cov.y + 2.0 * az.x * az.y * cov.z;
  let cotT = w.y * il;
  let a = max(cotT, 1e-3) / sqrt(2.0 * max(sig2, 1e-7));
  if (a >= 1.6) { return 0.0; }
  return (1.0 - 1.259 * a + 0.396 * a * a) / (3.535 * a + 2.181 * a * a);
}

fn positiveCovariance(c:vec3f)->vec3f {
  let diagonal=max(c.xy,vec2f(1e-7));
  let limit=0.999*sqrt(diagonal.x*diagonal.y);
  return vec3f(diagonal,clamp(c.z,-limit,limit));
}
fn sourceCovariance(V:vec3f,L:vec3f)->vec3f {
  // Linearized uniform solar disc in half-vector slope space. Angular variance
  // belongs to the light, AFTER surface deformation and the tangent transform.
  let axis=select(vec3f(0,1,0),vec3f(1,0,0),abs(L.y)>0.95);
  let a=normalize(cross(L,axis));let b=cross(L,a);
  let q=V+L;let den=max(q.y*q.y,1e-5);
  let da=-(a.xz*q.y-q.xz*a.y)/den;
  let db=-(b.xz*q.y-q.xz*b.y)/den;
  return vec3f(da.x*da.x+db.x*db.x,da.y*da.y+db.y*db.y,da.x*da.y+db.x*db.y)*(SUN_ANG_R*SUN_ANG_R*0.25);
}

fn foamPattern(xz: vec2f, t: f32) -> f32 {
  let a = textureSample(foamTex, sampR, xz * 0.23 + vec2f(0.013, 0.0) * t).r;
  let b = textureSample(foamTex, sampR, xz * 0.71 + vec2f(0.37, 0.71)).g;
  return a * 0.78 + b * 0.22;
}

@fragment fn fs(in: VSOut, @builtin(front_facing) front:bool) -> @location(0) vec4f {
  let xz = in.xz;
  var s = vec2f(0.0);
  var jxx = 0.0;
  var jzz = 0.0;
  var jxz = 0.0;
  var cov = vec3f(0.0);
  // wind gusts ("cat's paws"): patches where the short ripples are stronger or calmer
  let gustN = textureSample(foamTex, sampR, xz * 0.011 + F.windP[0].xy * (F.camPos.w * 0.0004)).b;
  let gust = mix(0.35, 1.2, smoothstep(0.3, 0.72, gustN));
  let dxXZ=dpdx(xz);let dyXZ=dpdy(xz);
  for (var c = 0u; c < ${CASCADES}u; c++) {
    let uv = xz * F.cascInvL[c >> 2u][c & 3u];
    let gk = mix(1.0, gust, select(0.0, select(0.5, 1.0, c >= 4u), c >= 3u));
    let invL=F.cascInvL[c >> 2u][c & 3u];
    let dx=dxXZ*invL;let dy=dyXZ*invL;
    let footprint=min(length(dx),length(dy))*TEX_N;
    var dv:vec4f;var mv:vec4f;var av:vec4f;
    if(footprint>64.0){
      dv=textureSampleLevel(derivTex,sampR,uv,c,8.0)*gk;
      mv=textureSampleLevel(momTex,sampR,uv,c,8.0)*(gk*gk);
      av=vec4f(0);
    }else{
      dv=textureSampleGrad(derivTex,sampR,uv,c,dx,dy)*gk;
      mv=textureSampleGrad(momTex,sampR,uv,c,dx,dy)*(gk*gk);
      av=textureSampleGrad(dispTex,sampR,uv,c,dx,dy)*gk;
    }
    s += dv.xy;
    jxx += dv.z;
    jzz += dv.w;
    jxz += av.w;
    cov += vec3f(max(mv.x - dv.x * dv.x, 0.0), max(mv.y - dv.y * dv.y, 0.0), mv.z - dv.x * dv.y);
  }
  let dist = length(in.rel);
  let V = -in.rel / dist;
  let Ld = F.sunDir.xyz;

  let jx = 1.0+jxx;
  let jz = 1.0+jzz;
  let jac = jx*jz-jxz*jxz;
  // Full inverse-transpose; regularization near folds is a geometric approximation.
  let invJ = 1.0 / max(jac, 0.18);
  let A = mat2x2f(jz,-jxz,-jxz,jx)*invJ;
  let sl = A*s;
  let C = A*mat2x2f(cov.x,cov.z,cov.z,cov.y)*transpose(A);
  cov = positiveCovariance(vec3f(C[0][0],C[1][1],C[0][1]));
  let nrm = normalize(vec3f(-sl.x, 1.0, -sl.y));
  let tangent=normalize(vec3f(1.0,sl.x,0.0));
  let bitangent=normalize(cross(tangent,nrm));
  let scale=inverseSqrt(1.0+dot(sl,sl));
  let B=mat2x2f(tangent.x,bitangent.x,tangent.z,bitangent.z)*scale;
  let localC=B*mat2x2f(cov.x,cov.z,cov.z,cov.y)*transpose(B);
  cov=positiveCovariance(vec3f(localC[0][0],localC[1][1],localC[0][1])+vec3f(F.waterCol.w,F.waterCol.w,0));
  let Vl=vec3f(dot(V,tangent),dot(V,nrm),dot(V,bitangent));
  let Ll=vec3f(dot(Ld,tangent),dot(Ld,nrm),dot(Ld,bitangent));
  let J = (1.0 + jxx) * (1.0 + jzz) - jxz * jxz;

  let shadowUV=clamp((xz-F.camPos.xz)/40000.0+0.5,vec2f(0.001),vec2f(0.999));
  let cloudT=textureSampleLevel(cloudShadow,sampC,shadowUV,0.0).r;
  let sunE = sunIlluminance() * cloudT;
  let skyUp = textureSampleLevel(envCube, sampC, vec3f(0.0, 1.0, 0.0), ENV_MAXMIP).rgb;
  // average radiance of the whole upper hemisphere (incl. the bright horizon band)
  let skyHemi = skyUp * 0.4 + 0.15 * (
      textureSampleLevel(envCube, sampC, vec3f(0.94, 0.34, 0.0), ENV_MAXMIP - 1.0).rgb +
      textureSampleLevel(envCube, sampC, vec3f(-0.94, 0.34, 0.0), ENV_MAXMIP - 1.0).rgb +
      textureSampleLevel(envCube, sampC, vec3f(0.0, 0.34, 0.94), ENV_MAXMIP - 1.0).rgb +
      textureSampleLevel(envCube, sampC, vec3f(0.0, 0.34, -0.94), ENV_MAXMIP - 1.0).rgb);
  let skyN = textureSampleLevel(envCube, sampC, nrm, ENV_MAXMIP - 1.0).rgb;

  // ---- sun glitter: anisotropic Gaussian slope distribution ----
  let Hv = normalize(V + Ld);
  let Hl=normalize(Vl+Ll);
  let dsl=-Hl.xz/max(Hl.y,1e-4);
  let sunCov=positiveCovariance(cov+sourceCovariance(Vl,Ll));
  let det = max(sunCov.x * sunCov.y - sunCov.z * sunCov.z, 1e-12);
  let e = (dsl.x * dsl.x * sunCov.y + dsl.y * dsl.y * sunCov.x - 2.0 * dsl.x * dsl.y * sunCov.z) / det;
  let pdf = exp(-0.5 * e) / (2.0 * PI * sqrt(det));
  let hy2 = Hl.y * Hl.y;
  let Dm = pdf / max(hy2 * hy2, 1e-6);
  let G = 1.0 / (1.0 + lambdaSmith(Vl, cov) + lambdaSmith(Ll, cov));
  let Fh = fresnelWater(dot(V, Hv));
  let spec = sunE * (Fh * Dm * G / (4.0 * max(Vl.y, 0.025))) * step(0.0, Ld.y)*step(0.0,Ll.y)*step(0.0,Vl.y);

  // ---- sky reflection ----
  // At grazing angles the *visible* facets are biased towards the viewer (projected-area
  // weighting + masking), so the effective reflector tilts up and sees higher, greyer sky.
  let sig = sqrt(max(cov.x + cov.y, 1e-6) * 0.5);
  let envLod = clamp(log2(max(0.7 * sig * ENV_TEXELS_PER_RAD, 1.0)), 0.0, ENV_MAXMIP);
  // Five-point covariance quadrature with projected visible-facet weighting.
  // Small mip footprint integrates within each quadrature cell, not the whole lobe twice.
  let ch0=vec2f(sqrt(cov.x),cov.z/sqrt(cov.x));
  let ch1=vec2f(0.0,sqrt(max(cov.y-cov.z*cov.z/cov.x,1e-7)));
  var reflected=vec3f(0);var fresnelSum=0.0;var weights=0.0;
  for(var tap=0u;tap<5u;tap++) {
    var off=vec2f(0);var w=1.0/3.0;
    if(tap>0u){off=select(ch0,ch1,tap>2u)*select(-1.7320508,1.7320508,(tap&1u)==1u);w=1.0/6.0;}
    let facet=normalize(nrm-tangent*off.x-bitangent*off.y);
    let nv=max(dot(facet,V),0.0);
    w*=nv;
    let rf=reflect(-V,facet);
    let f=fresnelWater(nv);
    reflected+=textureSampleLevel(envCube,sampC,rf,envLod).rgb*f*w;
    fresnelSum+=f*w;weights+=w;
  }
  let Fr=clamp(fresnelSum/max(weights,1e-6),0.0,1.0);
  let refl=reflected/max(fresnelSum,1e-6);

  // ---- water body: upwelling scatter + backlit subsurface glow ----
  let ambient = skyUp * 1.3 + skyN * 0.5;
  let NdL = max(dot(nrm, Ld), 0.0);
  // upwelling light is diffuse: light it with smooth terms only (no per-pixel normal noise)
  // Three-wavelength, optically deep backscatter approximation; coefficients are 1/m.
  let aWater = F.absorption.rgb;
  let bb = F.backscatter.rgb;
  let scatterRatio = bb / (aWater + bb);
  let subsurfaceReflectance=0.0949*scatterRatio+0.0794*scatterRatio*scatterRatio;
  let downwelling=skyHemi*PI*0.94+sunE*max(Ld.y,0.0)*(1.0-fresnelWater(Ld.y));
  var body = subsurfaceReflectance*downwelling/(1.333*1.333);
  // light transmitted through the thin upper part of backlit crests
  let compression=0.5*(jx+jz-sqrt((jx-jz)*(jx-jz)+4.0*jxz*jxz));
  let crest=1.0-smoothstep(0.35,0.9,compression);
  let toSun = max(dot(Ld, -V), 0.0);
  let thin = pow(clamp(0.5 - 0.5 * dot(Ld, nrm), 0.0, 1.0), 3.0);
  let k1 = F.sssCol.w * crest * crest * pow(toSun, 4.0) * thin * exp(-dist / 600.0);
  let crestPath = 0.35 + 3.0*(1.0-crest);
  body += exp(-(aWater + bb*12.0)*crestPath) * sunE * k1 * 0.035;

  // ---- foam ----
  // persistent foam from the world-space clipmaps (near: fine, far: coarse), plus
  // instantaneous crest foam from the per-pixel Jacobian for anything beyond them
  let dc = abs(xz - F.camPos.xz);
  let cheb = max(dc.x, dc.y);
  let w0 = 1.0 - smoothstep(0.30 * F.lodP.z, 0.45 * F.lodP.z, cheb);
  let w1 = 1.0 - smoothstep(0.30 * F.lodP.w, 0.45 * F.lodP.w, cheb);
  let fw0 = textureSample(foamWorld, sampR, xz / F.lodP.z, 0u);
  let fw1 = textureSample(foamWorld, sampR, xz / F.lodP.w, 1u);
  let fwl = mix(fw1, fw0, w0) * w1;
  let fresh=smoothstep(0.04,0.28,1.0-smoothstep(0.18,0.65+0.009*min(F.windP[0].z,25.0),compression))*min(F.foamP.z,1.0);
  var cover = clamp((max(fwl.r+fwl.a, fresh*(1.0-w1)*0.45)+fwl.g*0.22)*F.foamP.z,0.0,2.0);
  // aged foam breaks into wind-aligned streaks; fresh crest foam stays dense
  let wd = F.windP[0].xy;
  let ws = vec2f(dot(xz, wd), dot(xz, vec2f(-wd.y, wd.x)));
  let streak = textureSample(foamTex, sampR, ws * vec2f(0.035, 0.11)).a;
  let freshK = clamp(fwl.g * 2.0 + fresh, 0.0, 1.0);
  cover *= mix(0.45+1.1*smoothstep(0.25,0.75,streak),1.0,freshK);
  let pat = foamPattern(xz, F.camPos.w);
  // Memory is optical thickness: thin films remain visible rather than being
  // removed by a second density threshold. Bubble texture modulates extinction.
  let bubbleThickness=mix(0.08+2.0*pat*pat,0.85+0.3*pat,freshK);
  var foamMask=1.0-exp(-cover*3.6*bubbleThickness);
  // submerged bubbles brighten and tint the water just beneath foam
  body += exp(-aWater*1.5)*(skyHemi+sunE*max(Ld.y,0.0)/PI)*fwl.g*0.12;
  // bubbly brightness variation inside the foam
  let bub = textureSample(foamTex, sampR, xz * 1.9 + vec2f(0.21, 0.53)).g;
  let foamAlb = vec3f(0.88) * (0.9 + 0.1 * bub);
  // diffuse: albedo * (sky irradiance / pi + sun * cos / pi); sky dominates at sunset
  // foam scatters light from the whole hemisphere (incl. the cool zenith): use a less saturated ambient
  let foamAmb=skyHemi*0.8+skyN*0.2;
  let foamLit=foamAlb*(sunE*max(dot(nrm,Ld),0.0)/PI+foamAmb);

  if (F.post.w > 0.5) {
    // debug: r = foam cover, g = clamp(J), b = world foam level-0 weight
    if (F.post.w < 1.5) { return vec4f(vec3f(cover, clamp(J * 0.5, 0.0, 1.0), w0 * 0.3)*0.2/F.windP[1].x, 1.0); }
    if (F.post.w > 2.5 && F.post.w < 3.5) { return vec4f(refl/F.windP[1].x, 1.0); }
    if (F.post.w > 3.5 && F.post.w < 4.5) { return vec4f(vec3f(Fr)*0.5/F.windP[1].x, 1.0); }
    if (F.post.w > 4.5 && F.post.w < 5.5) { return vec4f(body * (1.0 - Fr)/F.windP[1].x, 1.0); }
    if (F.post.w > 5.5 && F.post.w < 6.5) { return vec4f(foamLit/F.windP[1].x, 1.0); }
    if (F.post.w > 6.5 && F.post.w < 7.5) { return vec4f(skyUp/F.windP[1].x, 1.0); }
    return vec4f(vec3f(fwl.r, fwl.g, fresh)*0.2/F.windP[1].x, 1.0);
  }
  var col = body * (1.0 - Fr) + refl * Fr + spec;
  col = mix(col, foamLit, foamMask * 0.95);

  // First-hit triangle orientation identifies the incident medium. Normal-map
  // backfacing is not medium classification; the near-plane estimate is only for sky rays.
  let wet=select(1.0,0.0,front)*step(0.5,F.control.z);
  var submerged=col;
  if (wet>0.0) {
    var transmitted=vec3f(0);var total=0.0;
    for(var tap=0u;tap<5u;tap++) {
      var off=vec2f(0);var w=1.0/3.0;
      if(tap>0u){off=select(ch0,ch1,tap>2u)*select(-1.7320508,1.7320508,(tap&1u)==1u);w=1.0/6.0;}
      let facet=normalize(nrm-tangent*off.x-bitangent*off.y);
      let Nw=select(-facet,facet,dot(facet,V)>0.0);
      let ci=clamp(dot(Nw,V),0.0,1.0);
      let sinT2=1.333*1.333*(1.0-ci*ci);
      let ct=sqrt(max(0.0,1.0-sinT2));
      let rs=(1.333*ci-ct)/max(1.333*ci+ct,0.00001);
      let rp=(ci-1.333*ct)/max(ci+1.333*ct,0.00001);
      let Funder=select(0.5*(rs*rs+rp*rp),1.0,sinT2>=1.0);
      let through=refract(-V,Nw,1.333);
      let refractionLod=clamp(envLod-log2(max(ct,0.08)),0.0,ENV_MAXMIP);
      let incident=textureSampleLevel(envCube,sampC,normalize(through+vec3f(0,0.000001,0)),refractionLod).rgb;
      let deep=volumeWater(reflect(-V,Nw),100.0,surfaceAtLens);
      w*=ci;total+=w;
      transmitted+=(incident*(1.0-Funder)*(1.333*1.333)+deep*Funder)*w;
    }
    transmitted/=max(total,1e-6);
    let beam=exp(-(F.absorption.rgb+F.backscatter.rgb*12.0)*dist);
    submerged=transmitted*beam+volumeWater(-V,dist,surfaceAtLens);
    submerged=mix(submerged,foamLit*beam,foamMask*0.6);
  }
  // ---- aerial perspective ----
  // aerial perspective: atmosphere extinction plus a marine haze floor
  let T = exp(-max(F.fogExt.rgb, vec3f(F.fogExt.w)) * dist);
  let hz = normalize(vec3f(-V.x, 0.002, -V.z));
  let fogCol = skyAtmo(hz);
  col = col * T + fogCol * (1.0 - T);
  return vec4f(mix(col,submerged,wet)/F.windP[1].x, 1.0);
}
`;

// Samples the displaced surface height under the camera (inverting the horizontal
// displacement with a few fixed-point iterations).
export const HEIGHT_PROBE = FRAME_WGSL + /* wgsl */ `
@group(0) @binding(0) var<uniform> F: Frame;
@group(0) @binding(1) var dispTex: texture_2d_array<f32>;
@group(0) @binding(2) var samp: sampler;
@group(0) @binding(3) var<storage, read_write> outH: array<f32, 4>;
fn dispAt(xz: vec2f) -> vec3f {
  var d = vec3f(0.0);
  for (var c = 0u; c < ${CASCADES}u; c++) {
    let texel=F.cascL[c>>2u][c&3u]/${N}.0;
    let lod=log2(max((2.0/F.lodP.y)/texel,1.0))+0.5;
    if(lod<8.0){d += textureSampleLevel(dispTex, samp, xz * F.cascInvL[c >> 2u][c & 3u], c, lod).xyz;}
  }
  return d;
}
@compute @workgroup_size(1)
fn main() {
  let goal = F.camPos.xz;
  var x0 = goal;
  for (var i = 0; i < 4; i++) {
    let d = dispAt(x0);
    x0 = goal - d.xz;
  }
  let d=dispAt(x0);
  let ex=dispAt(x0+vec2f(0.08,0))-dispAt(x0-vec2f(0.08,0));
  let ez=dispAt(x0+vec2f(0,0.08))-dispAt(x0-vec2f(0,0.08));
  let tx=vec3f(0.16,0,0)+ex;let tz=vec3f(0,0,0.16)+ez;
  let normal=normalize(cross(tz,tx));
  outH[0]=d.y;outH[1]=-normal.x/max(normal.y,0.2);outH[2]=-normal.z/max(normal.y,0.2);outH[3]=0.0;
}
`;
