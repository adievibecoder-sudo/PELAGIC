export function replaceShader(code, marker, replacement, expected = 1) {
  const count = code.split(marker).length - 1;
  if (count !== expected) throw Error(`Shader splice expected ${expected} occurrences, found ${count}: ${marker}`);
  return code.replaceAll(marker, replacement);
}

export function expectShaderMarkers(code, label, markers) {
  for (const marker of markers) {
    if (!code.includes(marker)) throw Error(`${label} shader marker missing: ${marker}`);
  }
}
