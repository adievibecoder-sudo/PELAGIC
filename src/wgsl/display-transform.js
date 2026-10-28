import {replaceShader} from './shader-patch.js';

export function displayTransformShader(code,query){
  const luminance=query.get('abDisplay')==='luminance';
  if(!luminance&&query.get('abDisplay')!=='linear'||!code.includes('fn agxEotf('))return code;
  if(luminance){
    code=replaceShader(code,'fn agxContrast(',/* wgsl */`
fn luminanceDisplay(c:vec3f)->vec3f {
  let positive=max(c,vec3f(0));
  let y=dot(positive,vec3f(.2126,.7152,.0722));
  let mapped=positive/(1.0+y);
  let neutral=y/(1.0+y);
  let peak=max(mapped.r,max(mapped.g,mapped.b));
  // Preserve ratios in gamut; desaturate only enough to fit the display.
  let saturation=min(1.0,(1.0-neutral)/max(peak-neutral,1e-8));
  let linear=mix(vec3f(neutral),mapped,saturation);
  return select(1.055*pow(max(linear,vec3f(0)),vec3f(1.0/2.4))-.055,
    12.92*linear,linear<=vec3f(.0031308));
}
fn agxContrast(`);
    return replaceShader(code,`  var o = agx(c);
  o = agxLook(o, U.q.x, U.q.y);
  o = agxEotf(o);`, '  var o = luminanceDisplay(c);');
  }
  // AgX's contrast polynomial is display encoded. Decode before the output
  // gamut transform; explicitly encode sRGB for the unorm canvas attachment.
  code=replaceShader(code,'  return mi * v;',`  let linear=mi*pow(max(v,vec3f(0)),vec3f(2.2));
  return select(1.055*pow(max(linear,vec3f(0)),vec3f(1.0/2.4))-.055,
    12.92*linear,linear<=vec3f(.0031308));`);
  return replaceShader(code,'  return l + sat * (p - l);',
    '  let poweredLuma=dot(p,vec3f(.2126,.7152,.0722));\n  return poweredLuma+sat*(p-poweredLuma);');
}
