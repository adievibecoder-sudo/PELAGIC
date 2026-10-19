import test from 'node:test';
import assert from 'node:assert/strict';

const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>a.map(x=>x/Math.hypot(...a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const slope=(V,L)=>[-(V[0]+L[0])/(V[1]+L[1]),-(V[2]+L[2])/(V[1]+L[1])];
test('linearized solar-disc covariance matches independent uniform-disc integration',()=>{
  const radius=.004675;
  for(const elevation of [5,20,60]){
    const a=elevation*Math.PI/180,L=[0,Math.sin(a),-Math.cos(a)],V=norm([.1,.35,1]);
    const t=norm(cross(L,[0,1,0])),b=cross(L,t),q=V.map((x,i)=>x+L[i]);
    const derivative=d=>[-(d[0]*q[1]-q[0]*d[1])/q[1]**2,-(d[2]*q[1]-q[2]*d[1])/q[1]**2];
    const da=derivative(t),db=derivative(b),analytic=[0,1].map(i=>(da[i]**2+db[i]**2)*radius**2/4);
    let sums=[0,0],squares=[0,0];const N=16384;
    for(let i=0;i<N;i++){
      const r=radius*Math.sqrt((i+.5)/N),phi=i*2.399963229728653;
      const light=norm(L.map((x,j)=>x+r*(t[j]*Math.cos(phi)+b[j]*Math.sin(phi))));
      const s=slope(V,light);s.forEach((x,j)=>{sums[j]+=x;squares[j]+=x*x;});
    }
    for(let j=0;j<2;j++){const v=squares[j]/N-(sums[j]/N)**2;assert.ok(Math.abs(v/analytic[j]-1)<.003);}
  }
});
test('five-facet quadrature conserves covariance and projected radiance for constant environment',()=>{
  for(const c of [[.001,.02,.003],[.04,.01,-.008],[1e-7,1e-7,0]]){
    const l0=[Math.sqrt(c[0]),c[2]/Math.sqrt(c[0])],l1=[0,Math.sqrt(c[1]-c[2]**2/c[0])];
    let xx=0,yy=0,xy=0;
    for(const v of [l0,l1])for(const sign of [-1,1]){const x=v[0]*Math.sqrt(3)*sign,y=v[1]*Math.sqrt(3)*sign;xx+=x*x/6;yy+=y*y/6;xy+=x*y/6;}
    assert.ok(Math.abs(xx-c[0])<1e-12&&Math.abs(yy-c[1])<1e-12&&Math.abs(xy-c[2])<1e-12);
  }
});
test('radiance through a dielectric obeys n squared and homogeneous volume has zero path limit',()=>{
  const n=1.333;assert.ok(Math.abs((1/n**2)*n**2-1)<1e-12);
  for(const extinction of [.01,.1,1]){
    assert.equal(1-Math.exp(-extinction*0),0);
    const a=Math.exp(-extinction*3),b=Math.exp(-extinction*7);
    assert.ok(Math.abs(a*b-Math.exp(-extinction*10))<1e-12);
  }
});
