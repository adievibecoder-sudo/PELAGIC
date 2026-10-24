// Keep lighting samples inside the mass represented by a view segment.
// Four density subsegments were averaged, then lit at an unrelated midpoint.
export const CLOUD_COLLISION=/* wgsl */`
fn collisionFraction(tau:f32)->f32 {
  // Mean first-collision location in a homogeneous segment, conditional on a
  // collision. The series avoids cancellation in optically thin segments.
  if(tau<0.05){return 0.5-tau/12.0+tau*tau*tau/720.0;}
  let tr=exp(-tau);
  return 1.0/tau-tr/(1.0-tr);
}
`;
export function cloudTransportShader(code,query) {
  if(query.get('maCloudTransport')!=='centroid'||!code.includes('fn cloudLayers('))return code;
  const before=`    let p=ro+dir*t;
    let footprint=max(ds*0.14,t*pixAng);
    var density=0.0;`;
  const sample='      density+=cloudDensityFiltered(ro+dir*(a+ds*(f32(sub)+0.5)*0.25),true,footprint)*0.25;';
  if(!code.includes(before)||!code.includes(sample))throw Error('Cloud transport splice contract changed');
  return code.replace('fn cloudLayers(',CLOUD_COLLISION+'fn cloudLayers(').replace(before,`    let footprint=max(ds*0.14,t*pixAng);
    var density=0.0;
    var collisionMoment=0.0;
    var collisionWeight=0.0;
    var segmentT=1.0;`)
    .replace(sample,`      let offset=(f32(sub)+0.5)*0.25;
      let rho=cloudDensityFiltered(ro+dir*(a+ds*offset),true,footprint);
      density+=rho*0.25;
      let tau=rho*F.cloudP.z*6.0*ds*0.25;
      let tr=exp(-tau);
      let weight=segmentT*(1.0-tr);
      collisionMoment+=weight*(f32(sub)+collisionFraction(tau))*0.25;
      collisionWeight+=weight;
      segmentT*=tr;`)
    .replace('    if(density>0.001) {',`    if(density>0.001) {
      let p=ro+dir*(a+ds*select(0.5,collisionMoment/max(collisionWeight,1e-8),collisionWeight>1e-8));`);
}
