import {replaceShader} from './shader-patch.js';

// Both E[s] and E[ss] need full precision: upgrading moments alone retains
// cancellation against independently rounded binary16 mean slopes.
export function slopePrecisionShader(code, enabled) {
  if (!enabled) return code;
  for (const name of ['derivOut', 'momOut', 'dstB', 'dstC']) {
    const marker = `var ${name}: texture_storage_2d_array<rgba16float, write>`;
    if (code.includes(marker)) code = replaceShader(code, marker, marker.replace('rgba16float', 'rgba32float'));
  }
  return code;
}
