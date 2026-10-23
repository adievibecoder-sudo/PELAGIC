import test from 'node:test';
import assert from 'node:assert/strict';
import {orderOceanNodes} from '../src/ocean-order.js';

test('near-first patch order is an exact stable permutation, including rebased coordinates', () => {
  const original = new Float32Array([80,-90,16,3, -2,-2,4,0, -40,-60,8,2, -2,-2,4,1]);
  for (const offset of [0, 1000000]) {
    const input = original.slice();
    for (let i=0; i<4; i++) { input[i*4] += offset; input[i*4+1] -= offset; }
    const copy=input.slice(), output=new Float32Array(20).fill(999);
    const indices=new Uint32Array(5), distances=new Float64Array(5);
    orderOceanNodes(input, output, indices, distances, 4, offset, -offset);
    assert.deepEqual(input, copy);
    assert.deepEqual([...indices.slice(0,4)], [1,3,2,0]);
    for (let i=0; i<4; i++) assert.deepEqual(output.slice(i*4,i*4+4), input.slice(indices[i]*4,indices[i]*4+4));
    assert.equal(output[16],999);
    orderOceanNodes(input, output, indices, distances, 0, offset, -offset);
    assert.equal(output[16],999);
  }
});
