export function finiteNumber(value, fallback, min, max) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

export function validCamera(input, base) {
  const result = {...base};
  for (const axis of ['x','z']) result[axis] = finiteNumber(input?.[axis],base[axis],-100000,100000);
  result.y = finiteNumber(input?.y,base.y,-200,10000);
  result.yaw = finiteNumber(input?.yaw,base.yaw,-1e6,1e6) % (2*Math.PI);
  result.pitch = finiteNumber(input?.pitch,base.pitch,-1.5,1.5);
  result.speed = finiteNumber(input?.speed,base.speed,.1,500);
  result.fovY = finiteNumber(input?.fovY,base.fovY,Math.PI/6,Math.PI*100/180);
  return result;
}

export function runtimeInput(search) {
  const q = new URLSearchParams(search);
  const cam = q.get('cam')?.split(',').map(Number);
  return {
    camera:cam?.length===5 && cam.every(Number.isFinite) ? {x:cam[0],y:cam[1],z:cam[2],yaw:cam[3]*Math.PI/180,pitch:cam[4]*Math.PI/180} : null,
    time:finiteNumber(q.get('t'),0,0,864000),
    width:Math.round(finiteNumber(q.get('w'),0,256,7680)),
    height:Math.round(finiteNumber(q.get('h'),0,256,4320)),
    frames:Math.round(finiteNumber(q.get('frames'),240,1,100000)),
    sequence:Math.round(finiteNumber(q.get('seq'),1,1,240)),
  };
}
