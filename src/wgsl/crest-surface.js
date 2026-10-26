import {FRAME_WGSL} from './common.js';
import {CREST_NODE_WGSL,CREST_SHEET_COUNT} from './crest-sheet.js';
import {replaceShader} from './shader-patch.js';

export const CREST_SURFACE_SIZE=512;
const COORDS=/* wgsl */`
const CREST_SPACING:f32=144.0/512.0;
fn crestOrigin(camera:vec2f)->vec2f{return floor(camera/CREST_SPACING)*CREST_SPACING-vec2f(72);}
`;
export const CREST_SURFACE_CLEAR=/* wgsl */`
@group(0) @binding(0) var<storage,read_write> field:array<u32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  if(id.x<262144u){field[id.x]=0u;}
}`;

export const CREST_SURFACE_BUILD=FRAME_WGSL+CREST_NODE_WGSL+COORDS+/* wgsl */`
@group(0) @binding(0) var<uniform> F:Frame;
@group(0) @binding(1) var<storage,read> nodes:array<CrestNode>;
@group(0) @binding(2) var<storage,read_write> field:array<atomic<u32>>;
fn edge(a:vec2f,b:vec2f,p:vec2f)->f32{return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);}
fn paint(a:vec3f,b:vec3f,c:vec3f){
  let area=edge(a.xy,b.xy,c.xy);if(abs(area)<1e-6){return;}
  let origin=crestOrigin(F.camPos.xz);
  let lo=max(vec2i(floor((min(a.xy,min(b.xy,c.xy))-origin)/CREST_SPACING)),vec2i(0));
  let hi=min(vec2i(floor((max(a.xy,max(b.xy,c.xy))-origin)/CREST_SPACING)),vec2i(511));
  for(var y=lo.y;y<=hi.y;y++){for(var x=lo.x;x<=hi.x;x++){
    let p=origin+(vec2f(vec2i(x,y))+.5)*CREST_SPACING;
    let w=vec3f(edge(b.xy,c.xy,p),edge(c.xy,a.xy,p),edge(a.xy,b.xy,p))/area;
    if(all(w>=vec3f(0))){
      let activity=clamp(dot(w,vec3f(a.z,b.z,c.z)),0.0,1.0);
      // Shared fronts occupy one surface field; overlapping event chains do
      // not repeatedly blend the same whitewater onto the water.
      atomicMax(&field[u32(y)*512u+u32(x)],u32(round(activity*65535.0)));
    }
  }}
}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  let instance=id.x;if(instance>=${CREST_SHEET_COUNT}u){return;}
  for(var n=0u;n<8u;n++){
    let a=nodes[instance*9u+n];let b=nodes[instance*9u+n+1u];
    if(a.across.w<=0.0||b.across.w<=0.0){continue;}
    for(var j=0u;j<4u;j++){
      let s0=max(0.0,sin(f32(j)*.25*3.14159265));
      let s1=max(0.0,sin(f32(j+1u)*.25*3.14159265));
      let p0=vec3f(a.section[j].xz,a.across.w*s0);
      let p1=vec3f(b.section[j].xz,b.across.w*s0);
      let p2=vec3f(b.section[j+1u].xz,b.across.w*s1);
      let p3=vec3f(a.section[j+1u].xz,a.across.w*s1);
      paint(p0,p1,p2);paint(p0,p2,p3);
    }
  }
}`;

export function crestSurfaceShader(code,query){
  if(query.get('abCrestSurface')!=='water'||!code.includes('fn reflectedEnvironment('))return code;
  if(query.get('abCrestShape')!=='sheet')throw Error('Water crest footprints require crest sheets');
  code=replaceShader(code,'fn foamCoverage(',COORDS+/* wgsl */`
@group(0) @binding(17) var<storage,read> crestField:array<u32>;
fn crestValue(p:vec2i)->f32 {
  if(any(p<vec2i(0))||any(p>vec2i(511))){return 0.0;}
  return f32(crestField[u32(p.y)*512u+u32(p.x)])/65535.0;
}
fn crestActivity(point:vec2f)->f32 {
  let p=(point-crestOrigin(F.camPos.xz))/CREST_SPACING-.5;
  let cell=vec2i(floor(p));let f=fract(p);
  return mix(mix(crestValue(cell),crestValue(cell+vec2i(1,0)),f.x),
    mix(crestValue(cell+vec2i(0,1)),crestValue(cell+vec2i(1,1)),f.x),f.y);
}
fn foamCoverage(`);
  code=replaceShader(code,'  // submerged bubbles brighten and tint the water just beneath foam',/* wgsl */`
  let attached=select(0.0,crestActivity(displacedXZ),F.foamP.z>0.0);
  let sheetCover=foamCoverage(material*.29+F.patternOrigins[0].xy,attached);
  let attachedMask=sheetCover*(5.0/6.0);
  // Max union also avoids double-counting the active surface population.
  // Geometry, normal and visibility are those of the actual CDLOD water raster.
  // submerged bubbles brighten and tint the water just beneath foam`);
  // Optical transport may replace foamMask later in the shader.
  code=replaceShader(code,'  if (F.post.w > 0.5) {',
    '  foamMask=max(foamMask,attachedMask);\n  if (F.post.w > 0.5) {');
  return code;
}
