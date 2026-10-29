export const TEMPORAL_OFFSET=180;
export const TEMPORAL_FLOATS=48;

export function cameraJitter(frame,width,height,sequence='msaa4'){
  let x,y;
  if(sequence==='halton'){
    const radical=(n,b)=>{let v=0,s=1;while(n){s/=b;v+=(n%b)*s;n=Math.floor(n/b);}return v;};
    const i=frame%8+1;
    // Centre the finite eight-sample sequence, not only its infinite limit.
    x=radical(i,2)-0.4453125;y=radical(i,3)-0.5;
  }else{
    [x,y]=[[-.25,-.25],[.25,.25],[.25,-.25],[-.25,.25]][frame%4];
  }
  return [2*x/width,-2*y/height];
}

export function temporalCamera(sequence='msaa4'){
  let previous=null,index=0,resetReason='initial';
  return {
    reset(reason){previous=null;index=0;resetReason=reason;},
    write(frame,worldCamera,wallDt,revision){
      const cut=previous&&(wallDt>.25||frame[19]<previous.frame[19]||
        Math.hypot(...worldCamera.map((x,i)=>x-previous.camera[i]))>25||
        frame[28]*previous.frame[28]+frame[29]*previous.frame[29]+frame[30]*previous.frame[30]<.8||
        Math.abs(Math.hypot(...frame.subarray(24,27))-Math.hypot(...previous.frame.subarray(24,27)))>.01||revision!==previous.revision);
      if(cut){previous=null;index=0;resetReason='camera/time/environment discontinuity';}
      const old=previous?.frame||frame;
      frame.set(old.subarray(0,16),180);
      frame.set([old[16],old[17],old[18],old[61]],196);
      frame.set(old.subarray(128,140),200);
      frame.set(old.subarray(172,180),212);
      frame.set(old.subarray(228,240),240);
      const jitter=cameraJitter(index++,frame[36],frame[37],sequence);
      frame.set([...jitter,...(previous?.jitter||jitter)],220);
      frame.set([previous?1:0,old[60]/frame[60],wallDt,1],224);
      previous={frame:frame.slice(),camera:[...worldCamera],jitter,revision};
      return {valid:frame[224]===1,jitter,resetReason};
    },
  };
}
