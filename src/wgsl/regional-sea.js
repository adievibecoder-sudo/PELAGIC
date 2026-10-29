// Exponentially relaxed energy of the existing translating weather ellipse.
// Integrate its past forcing, not a decorative noise multiplier. Spatial
// derivatives use the same quadrature as amplitude, including at the boundary.
export const REGIONAL_SEA=/* wgsl */`
fn regionalSea(q:vec2f,front:vec4f,control:vec4f,energy:vec4f)->vec3f {
  // Zero-initialized diagnostic uniform blocks retain the legacy identity.
  if(energy.w<=0.0){return vec3f(1,0,0);}
  if(energy.z==0.0){return vec3f(sqrt(energy.x),0,0);}
  let axis=control.xy;let across=vec2f(-axis.y,axis.x);
  let nodes=array<f32,8>(.0198550718,.1016667613,.2372337950,.4082826788,.5917173212,.7627662050,.8983332387,.9801449282);
  let weights=array<f32,8>(.0506142681,.1111905172,.1568533229,.1813418917,.1813418917,.1568533229,.1111905172,.0506142681);
  let horizon=control.w;
  // Integrate only the interval in which this point is inside the translating
  // ellipse. Uniform quadrature over the full history misses fast narrow fronts.
  let relative=q-front.xy;
  let acrossDistance=dot(relative,across)/front.w;
  if(abs(acrossDistance)>=1.0){return vec3f(sqrt(energy.x),0,0);}
  let extent=front.z*sqrt(1.0-acrossDistance*acrossDistance);
  let alongDistance=dot(relative,axis);
  var start=0.0;var finish=horizon;
  var startGradient=vec2f(0);var finishGradient=vec2f(0);
  if(control.z>.001){
    let entry=(-extent-alongDistance)/control.z;
    let exit=(extent-alongDistance)/control.z;
    let extentGradient=across*(-front.z*acrossDistance/(front.w*sqrt(1.0-acrossDistance*acrossDistance)));
    start=clamp(entry,0.0,horizon);finish=clamp(exit,0.0,horizon);
    if(entry>0.0&&entry<horizon){startGradient=(-extentGradient-axis)/control.z;}
    if(exit>0.0&&exit<horizon){finishGradient=(extentGradient-axis)/control.z;}
  }
  let interval=finish-start;
  let intervalGradient=finishGradient-startGradient;
  var response=vec3f(0);
  for(var i=0u;i<8u;i++){
    let delay=start+interval*nodes[i];
    let delayGradient=startGradient+intervalGradient*nodes[i];
    let d=q-front.xy+axis*(control.z*delay);
    let uv=vec2f(dot(d,axis)/front.z,dot(d,across)/front.w);
    let radius=length(uv);
    let t=clamp((radius-.55)/.45,0.0,1.0);
    let value=1.0-t*t*(3.0-2.0*t);
    let radialGradient=-6.0*t*(1.0-t)/(.45*max(radius,1e-8));
    let gradient=(axis*(uv.x/front.z)+across*(uv.y/front.w))*radialGradient;
    // Differentiate the implemented quadrature too: its clipped nodes move
    // with q. Omitting these terms disagrees with displaced-surface normals.
    let derivative=interval*(gradient+delayGradient*(dot(gradient,axis)*control.z-value/energy.w))+value*intervalGradient;
    response+=vec3f(value*interval,derivative)*(weights[i]/energy.w*exp(-delay/energy.w));
  }
  let e=energy.x+(energy.y-energy.x)*response.x;
  let amplitude=sqrt(max(e,.0001));
  return vec3f(amplitude,response.yz*((energy.y-energy.x)/(2.0*amplitude)));
}
`;
