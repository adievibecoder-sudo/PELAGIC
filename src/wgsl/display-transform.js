import {replaceShader} from './shader-patch.js';

export function displayTransformShader(code,query){
  if(query.get('abDisplay')!=='linear'||!code.includes('fn agxEotf('))return code;
  // AgX's contrast polynomial is display encoded. Decode before the output
  // gamut transform; explicitly encode sRGB for the unorm canvas attachment.
  code=replaceShader(code,'  return mi * v;',`  let linear=mi*pow(max(v,vec3f(0)),vec3f(2.2));
  return select(1.055*pow(max(linear,vec3f(0)),vec3f(1.0/2.4))-.055,
    12.92*linear,linear<=vec3f(.0031308));`);
  return replaceShader(code,'  return l + sat * (p - l);',
    '  let poweredLuma=dot(p,vec3f(.2126,.7152,.0722));\n  return poweredLuma+sat*(p-poweredLuma);');
}
