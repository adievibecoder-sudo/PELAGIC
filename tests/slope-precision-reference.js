// Round-to-nearest-even binary16, including gradual underflow. Used only by the
// independent CPU reference; the renderer writes actual GPU float textures.
export function half(value) {
  if (!Number.isFinite(value) || value === 0) return value;
  const sign = Math.sign(value), x = Math.abs(value);
  const step = 2 ** Math.max(-24, Math.floor(Math.log2(x)) - 10);
  const q = x / step, lower = Math.floor(q), fraction = q - lower;
  return sign * step * (lower + (fraction > .5 || (fraction === .5 && lower % 2) ? 1 : 0));
}

export function slopeLevel(slopes, size, layers, round = x => x) {
  const data = new Float64Array(size*size*layers*5);
  for(let i=0;i<size*size*layers;i++){
    const x=slopes[i*4],z=slopes[i*4+1];
    data.set([round(x),round(z),round(x*x),round(z*z),round(x*z)],i*5);
  }
  return data;
}

export function downsample(data, size, layers, round = x => x) {
  const next=new Float64Array((size/2)**2*layers*5);
  for(let c=0;c<layers;c++)for(let y=0;y<size/2;y++)for(let x=0;x<size/2;x++)for(let k=0;k<5;k++){
    let sum=0;
    for(let j=0;j<2;j++)for(let i=0;i<2;i++)sum+=data[((c*size+y*2+j)*size+x*2+i)*5+k];
    next[((c*size/2+y)*size/2+x)*5+k]=round(sum*.25);
  }
  return next;
}

export function compareLevel(reference, legacy, measured, size, layers) {
  const rows=[];
  for(let c=0;c<layers;c++){
    let count=0,referenceEnergy=0,halfAbsError=0,floatAbsError=0,halfLargeErrors=0,floatLargeErrors=0;
    let halfZeroFootprintSpurious=0,floatZeroFootprintSpurious=0;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)for(const [u,v] of [[0,0],[.13,.71],[.5,.5]]){
      const weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v];
      const points=[[x,y],[(x+1)%size,y],[x,(y+1)%size],[(x+1)%size,(y+1)%size]];
      const variances=[reference,legacy,measured].map(data=>{
        const s=[0,0,0,0,0];
        points.forEach(([a,b],p)=>{for(let k=0;k<5;k++)s[k]+=weights[p]*data[((c*size+b)*size+a)*5+k];});
        return Math.max(s[2]-s[0]*s[0],0)+Math.max(s[3]-s[1]*s[1],0);
      });
      const [truth,h,f]=variances;
      if(truth<1e-12){halfZeroFootprintSpurious=Math.max(halfZeroFootprintSpurious,h);floatZeroFootprintSpurious=Math.max(floatZeroFootprintSpurious,f);continue;}
      count++;referenceEnergy+=truth;
      halfAbsError+=Math.abs(h-truth);floatAbsError+=Math.abs(f-truth);
      if(Math.abs(h-truth)>.1*truth)halfLargeErrors++;
      if(Math.abs(f-truth)>.1*truth)floatLargeErrors++;
    }
    rows.push({cascade:c,count,meanReferenceVariance:referenceEnergy/Math.max(count,1),
      halfRelativeL1:halfAbsError/Math.max(referenceEnergy,1e-20),floatRelativeL1:floatAbsError/Math.max(referenceEnergy,1e-20),
      halfOver10Percent:halfLargeErrors/Math.max(count,1),floatOver10Percent:floatLargeErrors/Math.max(count,1),
      halfZeroFootprintSpurious,floatZeroFootprintSpurious});
  }
  return rows;
}
