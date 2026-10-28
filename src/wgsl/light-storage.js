import {replaceShader} from './shader-patch.js';

// Power-of-two scaling preserves ordinary binary16 values while moving lunar
// radiance out of its coarse subnormal range. Light caches exclude the discs.
export const LIGHT_STORAGE_SCALE=256;

export function hdrStorageDivisor(elevation,adaptation,scaled=false){
  const daylight=1+31*Math.max(0,Math.min(1,(elevation+10)/10));
  return daylight/(scaled?Math.min(LIGHT_STORAGE_SCALE,adaptation):1);
}

function decodeSamples(code,texture){
  const pattern=new RegExp(`textureSample(?:Level)?\\(\\s*${texture}\\s*,`,'g');
  let match;
  while((match=pattern.exec(code))){
    let end=code.indexOf('(',match.index),depth=1;
    while(depth&&++end<code.length){if(code[end]==='(')depth++;if(code[end]===')')depth--;}
    if(depth||code.slice(end+1,end+5)!=='.rgb')throw Error(`Light sample contract changed: ${texture}`);
    end+=5;
    const sample=code.slice(match.index,end);
    const decoded=`(${sample}/${LIGHT_STORAGE_SCALE}.0)`;
    code=code.slice(0,match.index)+decoded+code.slice(end);
    pattern.lastIndex=match.index+decoded.length;
  }
  return code;
}

export function lightStorageShader(code,query){
  if(query.get('abRadiance')!=='scaled')return code;
  if(code.includes('const ENV: f32')){
    if(code.includes('vec4f(L*fresnel,1)')){
      code=replaceShader(code,'vec4f(L,1)',`vec4f(L*${LIGHT_STORAGE_SCALE}.0,1)`);
      code=replaceShader(code,'vec4f(L*fresnel,1)',`vec4f(L*fresnel*${LIGHT_STORAGE_SCALE}.0,1)`);
    }else code=replaceShader(code,'vec4f(L, 1.0)',`vec4f(L*${LIGHT_STORAGE_SCALE}.0, 1.0)`);
  }
  if(code.includes('textureStore(dst,id.xy,cl);')){
    code=replaceShader(code,'textureStore(dst,id.xy,cl);',
      `textureStore(dst,id.xy,vec4f(cl.rgb*${LIGHT_STORAGE_SCALE}.0,cl.a));`);
  }
  if(code.includes('let cl=textureSampleLevel(cloudScreen,sampC,cloudUV,0.0);')){
    code=replaceShader(code,'let cl=textureSampleLevel(cloudScreen,sampC,cloudUV,0.0);',
      `let storedCloud=textureSampleLevel(cloudScreen,sampC,cloudUV,0.0);
  let cl=vec4f(storedCloud.rgb/${LIGHT_STORAGE_SCALE}.0,storedCloud.a);`);
  }
  // Mip generation and irradiance convolution stay in the same cache units.
  // Decode only consumers which evaluate physical lighting with Frame inputs.
  if(code.includes('struct Frame {')){
    for(const texture of ['envCube','skyIrradiance','environment'])code=decodeSamples(code,texture);
  }
  return code;
}
