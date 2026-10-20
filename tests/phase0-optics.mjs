// Decision experiment: no renderer coefficients are changed.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=new URL('./data/cie/',import.meta.url);
function csv(name,md5){const b=fs.readFileSync(new URL(name,root));assert.equal(crypto.createHash('md5').update(b).digest('hex'),md5);return b.toString().trim().split(/\r?\n/).map(l=>l.split(',').map(Number));}
const cie=csv('CIE_xyz_1931_2deg.csv','17cca777db64b17170f06f67ce9d3ab7');
const d65=new Map(csv('CIE_std_illum_D65.csv','03d4eb9b837c60671627c946fb534deb'));
const pope=fs.readFileSync(new URL('../docs/pope97.dat',import.meta.url),'utf8').split(/\r?\n/).filter(l=>/^\d/.test(l)).map(l=>l.trim().split(/\s+/).map(Number)).map(([nm,a])=>[nm,a*100]);
function absorption(nm){const i=Math.min(pope.length-2,Math.floor((nm-380)/2.5)),f=(nm-pope[i][0])/2.5;return pope[i][1]*(1-f)+pope[i+1][1]*f;}
const matrix=[[3.2404542,-1.5371385,-.4985314],[-.969266,1.8760108,.041556],[.0556434,-.2040259,1.0572252]];
function rgb(xyz){return matrix.map(row=>row.reduce((s,x,i)=>s+x*xyz[i],0));}
const yn=cie.reduce((s,[nm,x,y,z])=>s+(d65.get(nm)||0)*y,0);
function integrate(fn,lo=380,hi=700){const xyz=[0,0,0];for(const [nm,x,y,z] of cie)if(nm>=lo&&nm<=hi){const w=(d65.get(nm)||0)*fn(nm)/yn;[x,y,z].forEach((v,i)=>xyz[i]+=v*w);}return{xyz,rgb:rgb(xyz)};}
const white=integrate(()=>1,360,830),truncatedWhite=integrate(()=>1);
const depths=[.1,1,3,10,30],cases=depths.map(depth=>({depth,...integrate(nm=>Math.exp(-absorption(nm)*depth))}));
const proxy=[.340,.0565,.00922];
const fit=proxy.map((_,channel)=>{
 const loss=k=>cases.filter(v=>[1,3,10].includes(v.depth)).reduce((s,v)=>s+(truncatedWhite.rgb[channel]*Math.exp(-k*v.depth)-v.rgb[channel])**2,0);
 let lo=0,hi=2;for(let j=0;j<100;j++){const a=(lo*2+hi)/3,b=(lo+hi*2)/3;if(loss(a)<loss(b))hi=b;else lo=a;}return(lo+hi)/2;
});
for(const c of cases){c.proxy=proxy.map((a,i)=>truncatedWhite.rgb[i]*Math.exp(-a*c.depth));c.fit=fit.map((a,i)=>truncatedWhite.rgb[i]*Math.exp(-a*c.depth));c.outOfGamut=c.rgb.some(x=>x<0||x>1);c.proxyError=Math.hypot(...c.rgb.map((v,i)=>v-c.proxy[i]));c.fitError=Math.hypot(...c.rgb.map((v,i)=>v-c.fit[i]));}
const deep=integrate(nm=>{const bb=.001*(550/nm)**4.32,u=bb/(absorption(nm)+bb);return(.0949*u+.0794*u*u)/(1.333**2);});
const M=[[.842479062253094,.0784335999999992,.0792237451477643],[.0423282422610123,.878468636469772,.0791661274605434],[.0423756549057051,.0784336,.879142973793104]];
const I=[[1.19687900512017,-.0980208811401368,-.0990297440797205],[-.0528968517574562,1.15190312990417,-.0989611768448433],[-.0529716355144438,-.0980434501171241,1.15107367264116]];
const inverseError=Math.max(...M.flatMap((row,i)=>row.map((_,j)=>Math.abs(row.reduce((s,v,k)=>s+v*I[k][j],0)-(i===j?1:0)))));
assert.ok(inverseError<1e-12);assert.ok(Math.abs(white.xyz[1]-1)<1e-12);
assert.ok(Math.abs(absorption(650)-.340)<1e-10);assert.ok(cases.every(c=>c.rgb.every(Number.isFinite)));
const result={scope:'D65 pure-water beam transmission, CIE 1931 2 degree integration; not full ocean transport or sunset calibration. No channelwise white normalization. Negative sRGB values retained.',units:'Pope/Fry input explicitly 1/cm; multiply by 100 for 1/m. Linear interpolation 380-700 nm, outside range omitted and white truncation disclosed.',white,truncatedWhite,proxyCoefficients:proxy,fittedCoefficients:fit,fitTrainingDepths:[1,3,10],heldOutDepths:[.1,30],cases,illustrativeDeepWater:{...deep,scope:'Analytic molecular-like backscatter power law is an assumption, not measured seawater data.'},agxMatrixInverseMaxError:inverseError,decision:'Three fixed coefficients improve a restricted transmission fit but cannot represent signed spectral-to-RGB transport generally. Test diverse illuminants, turbidity and body radiance before selecting refit or LUT; no production coefficient replacement justified by this experiment alone.'};
fs.mkdirSync('evidence/v04-p0-science',{recursive:true});fs.writeFileSync('evidence/v04-p0-science/optics.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
