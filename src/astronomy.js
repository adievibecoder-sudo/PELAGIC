// USNO approximate solar coordinates; lunar orbital elements/perturbations: Paul Schlyter.
// Geometric directions, no atmospheric refraction. UTC input; east-positive longitude.
const R=Math.PI/180;
const sin=d=>Math.sin(d*R),cos=d=>Math.cos(d*R);
const norm=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export function celestial(date,latitude,longitude) {
  const jd=date.getTime()/86400000+2440587.5,D=jd-2451545,d=jd-2451543.5;
  const g=357.529+0.98560028*D,q=280.459+0.98564736*D,L=q+1.915*sin(g)+0.020*sin(2*g),ecl=23.439-0.00000036*D;
  const sunEq=[cos(L),sin(L)*cos(ecl),sin(L)*sin(ecl)];
  const sidereal=(280.46061837+360.98564736629*D+longitude)*R;
  const lat=latitude*R;
  const horizontal=(v)=>{
    const east=-v[0]*Math.sin(sidereal)+v[1]*Math.cos(sidereal);
    const meridian=v[0]*Math.cos(sidereal)+v[1]*Math.sin(sidereal);
    return [east,meridian*Math.cos(lat)+v[2]*Math.sin(lat),meridian*Math.sin(lat)-v[2]*Math.cos(lat)];
  };
  const N=125.1228-.0529538083*d,w=318.0634+.1643573223*d,M=115.3654+13.0649929509*d,e=.0549;
  let E=M*R+e*Math.sin(M*R)*(1+e*Math.cos(M*R));
  for(let j=0;j<5;j++)E-=(E-e*Math.sin(E)-M*R)/(1-e*Math.cos(E));
  const xv=60.2666*(Math.cos(E)-e),yv=60.2666*Math.sqrt(1-e*e)*Math.sin(E);
  const v=Math.atan2(yv,xv)/R;
  let radius=Math.hypot(xv,yv);
  const x=cos(N)*cos(v+w)-sin(N)*sin(v+w)*cos(5.1454),y=sin(N)*cos(v+w)+cos(N)*sin(v+w)*cos(5.1454),z=sin(v+w)*sin(5.1454);
  let lon=Math.atan2(y,x)/R,b=Math.atan2(z,Math.hypot(x,y))/R;
  const Ms=356.0470+.9856002585*d,Ls=Ms+282.9404+.0000470935*d,Lm=M+w+N,elong=Lm-Ls,F=Lm-N;
  lon+=-1.274*sin(M-2*elong)+.658*sin(2*elong)-.186*sin(Ms)-.059*sin(2*M-2*elong)-.057*sin(M-2*elong+Ms)+.053*sin(M+2*elong)+.046*sin(2*elong-Ms)+.041*sin(M-Ms)-.035*sin(elong)-.031*sin(M+Ms)-.015*sin(2*F-2*elong)+.011*sin(M-4*elong);
  b+=-.173*sin(F-2*elong)-.055*sin(M-F-2*elong)-.046*sin(M+F-2*elong)+.033*sin(F+2*elong)+.017*sin(2*M+F);
  radius+=-.58*cos(M-2*elong)-.46*cos(2*elong);
  const mx=radius*cos(lon)*cos(b),my=radius*sin(lon)*cos(b),mz=radius*sin(b);
  const moonEq=[mx,my*cos(ecl)-mz*sin(ecl),my*sin(ecl)+mz*cos(ecl)];
  const moonLocal=horizontal(moonEq);moonLocal[1]-=1;
  const sun=norm(horizontal(sunEq)),moon=norm(moonLocal);
  const toSun=norm(sunEq.map((x,i)=>x*23455-moonEq[i]));
  const phase=(1+dot(toSun,norm(moonEq.map(x=>-x))))/2;
  return {sun,moon,phase,moonDistanceKm:radius*6378.14,sunElevation:Math.asin(sun[1])/R,sunAzimuth:Math.atan2(sun[0],-sun[2])/R,moonElevation:Math.asin(moon[1])/R,sidereal};
}
