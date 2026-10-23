export const G = 9.81, CAPILLARY = 7.4e-5;
export function wavePatchLengths(query=new URLSearchParams()) {
  const length=query.get('maLongGrid');
  return [length==='2207'?2207:length==='4093'?4093:1103,211.3,39.7,7.43,1.393,0.2617];
}
export const PATCHES = wavePatchLengths(new URLSearchParams(typeof location==='undefined'?'':location.search));
export const omega = k => Math.sqrt(G*k+CAPILLARY*k*k*k);
export const groupVelocity = k => (G+3*CAPILLARY*k*k)/(2*omega(k));
export function jonswap(w,wp,alpha,gamma=3.3) {
  if (!(w>0)) return 0;
  const sigma = w<=wp?0.07:0.09;
  return alpha*G*G*w**-5*Math.exp(-1.25*(wp/w)**4)*gamma**Math.exp(-0.5*((w-wp)/(sigma*wp))**2);
}
export function integrate(f,a,b,n=4096) {
  if(n%2) n++;
  const h=(b-a)/n;
  let sum=f(a)+f(b);
  for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+i*h);
  return sum*h/3;
}
export function logIntegral(f,min,max,n=8192) {
  return integrate(x=>f(Math.exp(x))*Math.exp(x),Math.log(min),Math.log(max),n);
}
export function normalizedSwellAlpha(hs,wp,gamma=6) {
  const variance=logIntegral(w=>jonswap(w,wp,1,gamma),wp*0.1,wp*100);
  return (hs/4)**2/variance;
}
export function cosSpreadNorm(s) {
  return 1/integrate(t=>Math.abs(Math.cos(t/2))**(2*s),-Math.PI,Math.PI);
}
export function fresnel(c,n1=1,n2=1.333) {
  c=Math.max(0,Math.min(1,Math.abs(c)));
  const sin2=(n1/n2)**2*(1-c*c);
  if(sin2>=1)return 1;
  const t=Math.sqrt(1-sin2);
  const rs=(n1*c-n2*t)/(n1*c+n2*t),rp=(n2*c-n1*t)/(n2*c+n1*t);
  return (rs*rs+rp*rp)/2;
}
export function decodeHalf(v) {
  const s=v&32768?-1:1,e=(v>>10)&31,m=v&1023;
  return e===0?s*m*2**-24:e===31?(m?NaN:s*Infinity):s*(1+m/1024)*2**(e-15);
}

// Recursive double-precision reference: deliberately independent of GPU bit-reversed butterflies.
export function inverseFFT(re,im) {
  const n=re.length;
  if(n===1)return [Float64Array.of(re[0]),Float64Array.of(im[0])];
  const er=new Float64Array(n/2),ei=new Float64Array(n/2),or=new Float64Array(n/2),oi=new Float64Array(n/2);
  for(let j=0;j<n/2;j++){er[j]=re[2*j];ei[j]=im[2*j];or[j]=re[2*j+1];oi[j]=im[2*j+1];}
  const [a,b]=inverseFFT(er,ei),[c,d]=inverseFFT(or,oi),r=new Float64Array(n),i=new Float64Array(n);
  for(let j=0;j<n/2;j++) {
    const angle=2*Math.PI*j/n,co=Math.cos(angle),si=Math.sin(angle),x=c[j]*co-d[j]*si,y=c[j]*si+d[j]*co;
    r[j]=a[j]+x;i[j]=b[j]+y;r[j+n/2]=a[j]-x;i[j+n/2]=b[j]-y;
  }
  return [r,i];
}
export function inverse2D(data,n) {
  const r=new Float64Array(n*n*4);
  for(let channel=0;channel<4;channel+=2){
    for(let y=0;y<n;y++) {
      const re=new Float64Array(n),im=new Float64Array(n);
      for(let x=0;x<n;x++){re[x]=data[(y*n+x)*4+channel];im[x]=data[(y*n+x)*4+channel+1];}
      const [a,b]=inverseFFT(re,im);
      for(let x=0;x<n;x++){r[(y*n+x)*4+channel]=a[x];r[(y*n+x)*4+channel+1]=b[x];}
    }
    for(let x=0;x<n;x++) {
      const re=new Float64Array(n),im=new Float64Array(n);
      for(let y=0;y<n;y++){re[y]=r[(y*n+x)*4+channel];im[y]=r[(y*n+x)*4+channel+1];}
      const [a,b]=inverseFFT(re,im);
      for(let y=0;y<n;y++){r[(y*n+x)*4+channel]=a[y];r[(y*n+x)*4+channel+1]=b[y];}
    }
  }
  return r;
}
export function stats(values) {
  let sum=0,sq=0,min=Infinity,max=-Infinity,invalid=0;
  for(const v of values){if(!Number.isFinite(v)){invalid++;continue;}sum+=v;sq+=v*v;min=Math.min(min,v);max=Math.max(max,v);}
  const n=values.length-invalid,mean=sum/n;
  return {mean,variance:sq/n-mean*mean,min,max,invalid};
}
