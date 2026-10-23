import test from 'node:test';
import assert from 'node:assert/strict';
import {OCEAN, SKY_BG, HEIGHT_PROBE} from '../src/wgsl/ocean.js';
import {waveDiagnosticShader} from './milestone-a-wave-shaders.js';

test('wave isolation preserves default shaders and actual displaced vertex geometry', () => {
  for (const source of [OCEAN, SKY_BG, HEIGHT_PROBE]) {
    assert.equal(waveDiagnosticShader(source, new URLSearchParams()), source);
    assert.equal(waveDiagnosticShader(source, new URLSearchParams('maWaveView=unknown')), source);
  }
  const fragment = OCEAN.indexOf('@fragment fn fs(');
  for (const mode of ['geometry', 'normal-light', 'normal-angle']) {
    const query = new URLSearchParams({maWaveView: mode});
    const result = waveDiagnosticShader(OCEAN, query);
    assert.equal(result.slice(0, fragment), OCEAN.slice(0, fragment));
    assert.notEqual(result, OCEAN);
    assert.equal(waveDiagnosticShader(SKY_BG, query), SKY_BG);
    assert.equal(waveDiagnosticShader(HEIGHT_PROBE, query), HEIGHT_PROBE);
  }
  for (const filter of ['2', '4']) {
    const query = new URLSearchParams({maWaveFilter: filter});
    const result = waveDiagnosticShader(OCEAN, query);
    assert.equal(result.slice(0, fragment), OCEAN.slice(0, fragment));
    assert.equal(result.replace(`let dx=dxXZ*invL*${filter}.0;let dy=dyXZ*invL*${filter}.0;`,
      'let dx=dxXZ*invL;let dy=dyXZ*invL;'), OCEAN);
  }
});
