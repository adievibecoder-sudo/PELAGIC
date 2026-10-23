// Opt-in look-development views. Vertex displacement and production defaults stay exact.
export function waveDiagnosticShader(code, query) {
  if (!code.includes('fn reflectedEnvironment(')) return code;
  const filter = query.get('maWaveFilter');
  if (['2', '4'].includes(filter)) {
    const marker = 'let dx=dxXZ*invL;let dy=dyXZ*invL;';
    if (code.split(marker).length !== 2) throw Error('Wave filter splice contract changed');
    // Same positive filter for first and second moments; removed mean-square
    // slope becomes unresolved covariance instead of disappearing.
    code = code.replace(marker, `let dx=dxXZ*invL*${filter}.0;let dy=dyXZ*invL*${filter}.0;`);
  }
  const mode = query.get('maWaveView');
  if (!['geometry', 'normal-light', 'normal-angle'].includes(mode)) return code;
  const marker = '  let J = jac;';
  if (code.split(marker).length !== 2) throw Error('Wave diagnostic splice contract changed');
  const normal = mode === 'geometry' ? 'ng' : 'nrm';
  const output = mode === 'normal-angle'
    ? 'let angle=acos(clamp(dot(ng,nrm),-1.0,1.0)); let value=clamp(angle/(PI/6.0),0.0,1.0); return vec4f(vec3f(value,0.0,1.0-value)/F.windP[1].x,1.0);'
    : `let grey=0.04+0.6*max(dot(${normal},normalize(vec3f(-0.3,0.8,0.5))),0.0); return vec4f(vec3f(grey)/F.windP[1].x,1.0);`;
  return code.replace(marker, `${marker}
  // Upward-oriented raster facet; difference includes intentional sub-mesh detail.
  let ng=select(-rasterNormal,rasterNormal,rasterNormal.y>=0.0);
  ${output}
  `);
}
