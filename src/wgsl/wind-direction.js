import {replaceShader} from './shader-patch.js';

export const EQUILIBRIUM_DIRECTION=/* wgsl */`
fn hybridWindDirection(theta:f32,k:f32,U:f32,wp:f32)->f32 {
  let w=omegaOf(k);
  let forward=donelanBanner(wrapAngle(theta),w,wp);
  let backward=donelanBanner(wrapAngle(theta+PI),w,wp);
  let kp=wp*wp/GRAV;let cp=omegaOf(kp)/kp;let c=w/k;
  let km=sqrt(GRAV/SURF);let cm=omegaOf(km)/km;
  let age=U/cp;let z0=3.7e-5*U*U/GRAV*pow(max(age,.01),.9);
  let friction=.41*U/log(10.0/max(z0,1e-8));
  let delta=tanh(log(2.0)/4.0+4.0*pow(c/cp,2.5)+.13*friction/cm*pow(cm/c,2.5));
  let orientation=(1.0+delta*cos(2.0*theta))/(2.0*PI);
  // Orientation is even under k -> -k. Preserve the old travelling split;
  // each opposing pair still integrates to exactly twice the orientation.
  let travelling=2.0*orientation*forward/max(forward+backward,1e-20);
  return mix(forward,travelling,smoothstep(0.0,log(8.0),log(k)));
}
`;

export function windDirectionShader(code,query){
  if(query.get('abDirection')!=='equilibrium'||!code.includes('fn spectrum(k: vec2f)'))return code;
  code=replaceShader(code,'fn spectrum(k: vec2f)',EQUILIBRIUM_DIRECTION+'fn spectrum(k: vec2f)');
  return replaceShader(code,'donelanBanner(wrapAngle(theta - S.wind.y), w, wp)',
    'hybridWindDirection(theta-S.wind.y,kl,U,wp)');
}
