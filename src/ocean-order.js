// Reorder opaque patches only. Displacement, topology and depth tests stay unchanged.
export function orderOceanNodes(input, output, indices, distances, count, cameraX, cameraZ) {
  for (let i = 0; i < count; i++) {
    const p = i * 4, size = input[p + 2];
    const dx = Math.max(input[p] - cameraX, 0, cameraX - input[p] - size);
    const dz = Math.max(input[p + 1] - cameraZ, 0, cameraZ - input[p + 1] - size);
    distances[i] = dx * dx + dz * dz;
    indices[i] = i;
  }
  indices.subarray(0, count).sort((a, b) => distances[a] - distances[b] || a - b);
  for (let i = 0; i < count; i++) {
    const source = indices[i] * 4, target = i * 4;
    for (let j = 0; j < 4; j++) output[target + j] = input[source + j];
  }
  return output;
}
