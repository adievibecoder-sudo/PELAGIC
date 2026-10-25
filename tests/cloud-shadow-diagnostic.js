import {expectShaderMarkers} from '../src/wgsl/shader-patch.js';

// Isolate direct-light attenuation only. Never a production lighting option.
export function cloudShadowDiagnostic(code, query) {
  if(query.get('abCloudShadow')!=='off' || !code.includes('fn reflectedEnvironment('))return code;
  const marker='let cloudT=textureSampleLevel(cloudShadow,sampC,shadowUV,0.0).r;';
  expectShaderMarkers(code,'Cloud-shadow diagnostic',[marker]);
  return code.replace(marker,'let cloudT=1.0; // Diagnostic: unattenuated direct Sun.');
}
