// Morphological cumulus model: heterogeneous updraft clusters and entrained liquid
// water. Kilometres, g/m^3. This is an explicit representation, not fluid dynamics.
export const CLOUD_PLUMES=/* wgsl */`
fn cloudPlumeDensity(p:vec3f,footprint:f32)->f32 {
  let altitude=p.y+dot(p.xz,p.xz)/(2.0*RG);
  let depth=mix(F.regional.y,3.5,regionalWeight(p.xz));
  if(altitude<=F.cloudP.x||altitude>=F.cloudP.x+depth){return 0.0;}
  let coverage=regionalCoverage(p.xz);
  if(coverage<0.001){return 0.0;}
  let world=vec3f(p.x,altitude,p.z)+vec3f(F.camPos.x*0.001+F.worldOrigin.x,0,F.camPos.z*0.001+F.worldOrigin.y)-vec3f(F.cloudDrift.x,0,F.cloudDrift.y);
  let spacing=2.8;
  let cell=floor(world.xz/spacing);
  let lod=max(log2(max(footprint,0.001)*128.0),0.0);
  let large=textureSampleLevel(cloudNoise,cloudNoiseSampler,world*0.19,lod-2.4);
  let organization=textureSampleLevel(cloudNoise,cloudNoiseSampler,vec3f(world.x*.017,.43,world.z*.017),max(lod-5.8,0.0)).a;
  let localCoverage=clamp(coverage+(organization-.5)*4.0*coverage*(1.0-coverage),0.0,1.0);
  let detail=textureSampleLevel(cloudNoise,cloudNoiseSampler,world*1.3+vec3f(.27,.61,.43),lod+0.38);
  let erosion=textureSampleLevel(cloudNoise,cloudNoiseSampler,world*4.7+vec3f(.71,.19,.37),lod+2.23).b;
  let boundary=(large.r-.5)*.42+(detail.r-.5)*.32-(1.0-erosion)*.04;
  var liquid=0.0;
  for(var z=-1;z<=1;z++){for(var x=-1;x<=1;x++){
    let id=cell+vec2f(f32(x),f32(z));
    let seed=vec3f(id,31.7);
    let r=vec4f(hash3(seed),hash3(seed+vec3f(13.2,2.7,9.4)),hash3(seed+vec3f(2.9,17.1,5.3)),hash3(seed+vec3f(7.3,4.9,23.1)));
    let occupied=smoothstep(r.w-.12,r.w+.12,localCoverage);
    if(occupied<.001){continue;}
    let centre=(id+.08+.84*r.xy)*spacing;
    let radius=.25+1.35*r.z*r.z;
    let bottom=F.cloudP.x+.04*r.y;
    let rise=altitude-bottom;
    if(rise<=0.0){continue;}
    let height=min(depth-.08,radius*(.75+.9*r.x));
    let extent=radius*1.7+.45;
    let delta=world.xz-centre-F.windP[0].xy*rise*.12;
    if(dot(delta,delta)>extent*extent||rise>height+.45){continue;}
    var envelope=-10.0;
    for(var lobe=0u;lobe<8u;lobe++){
      let l=vec3f(hash3(seed+vec3f(f32(lobe)*9.3,7.1,1.8)),hash3(seed+vec3f(5.7,f32(lobe)*11.7,8.1)),hash3(seed+vec3f(2.3,6.4,f32(lobe)*3.7)));
      let angle=l.x*2.0*PI;
      let shift=vec2f(cos(angle),sin(angle))*radius*l.y+F.windP[0].xy*rise*.12;
      let width=radius*(.24+.38*l.z);
      let top=height*(.38+.62*l.z);
      let vertical=(rise-top*.48)/max(top*.54,.06);
      let radial=length((world.xz-centre-shift)/width);
      let distance=(1.0-sqrt(radial*radial+vertical*vertical))*width+boundary;
      envelope=max(envelope,distance);
    }
    // Entrainment varies across the boundary; condensate grows above cloud base.
    let mixing=smoothstep(0.0,.09,envelope)*smoothstep(0.0,.035,rise);
    let lwc=min(.6,.8*rise)*mix(.55,1.0,large.a)*mixing*occupied;
    liquid=max(liquid,lwc);
  }}
  // Extinction 3 LWC/(2 rho_water r_eff), r_eff = 10 micrometres:
  // one g/m^3 gives 150 / km. Convert into the integrator's density units.
  return liquid*150.0/max(F.cloudP.z*6.0,0.001);
}
`;

export function cloudPlumesShader(code,query){
  if(['droplet','orders'].includes(query.get('maCloudPhase'))){
    // Water-droplet forward asymmetry. Higher-order angular convolutions of HG
    // have g^n; retain the old order weights for this isolated phase comparison.
    code=code.replaceAll('0.85*phaseHG(dot(dir,F.sunDir.xyz),0.68)+0.15*phaseHG(dot(dir,F.sunDir.xyz),-0.25)',
      'phaseHG(dot(dir,F.sunDir.xyz),0.85)')
      .replaceAll('phaseHG(dot(dir,F.sunDir.xyz),0.28)','phaseHG(dot(dir,F.sunDir.xyz),0.52200625)')
      .replaceAll('0.85*phaseHG(dot(dir,F.moonDir.xyz),0.68)+0.15*phaseHG(dot(dir,F.moonDir.xyz),-0.25)',
      'phaseHG(dot(dir,F.moonDir.xyz),0.85)')
      .replaceAll('phaseHG(dot(dir,F.moonDir.xyz),0.28)','phaseHG(dot(dir,F.moonDir.xyz),0.52200625)');
    if(query.get('maCloudPhase')==='orders'){
      // The old point-density gate creates higher-order light even on a thin,
      // directly exposed boundary. Condition it on an incident collision path.
      // This remains a local scattering-order closure, not full cloud transport.
      code=code.replace(')*(1.0-exp(-density*5.0));',')*(1.0-exp(-optical));')
        .replace(')*(1.0-exp(-density*5.0));',')*(1.0-exp(-moonOptical));');
    }
  }
  const mode=query.get('maCloud');
  if(!['plumes','entrained'].includes(mode)||!code.includes('fn cloudDensityFiltered('))return code;
  let density=CLOUD_PLUMES;
  if(mode==='entrained'){
    density=density.replace('let boundary=(large.r-.5)*.42+(detail.r-.5)*.32-(1.0-erosion)*.04;',/* wgsl */`
  let warp=vec3f(large.r-.5,large.a-.5,detail.r-.5);
  let billow=textureSampleLevel(cloudNoise,cloudNoiseSampler,world*.63+vec3f(.13,.79,.37),lod-.66);
  let boundary=(billow.r-.5)*.28+(detail.r-.5)*.075-(1.0-erosion)*.03;`)
      .replace('let radius=.25+1.35*r.z*r.z;', 'let radius=.16+1.65*pow(r.z,2.5);')
      .replace('let height=min(depth-.08,radius*(.75+.9*r.x));','let height=min(depth-.08,radius*(.5+1.4*r.x));')
      .replace('let extent=radius*1.7+.45;', 'let extent=radius*2.8+.55;')
      .replace('rise>height+.45','rise>height+radius*.7+.55')
      .replace('let vertical=(rise-top*.48)/max(top*.54,.06);',/* wgsl */`
      let developed=smoothstep(0.0,height*.7,rise);
      let vertical=(rise+warp.y*radius*.8*developed-top*.48)/max(top*.54,.06);`)
      .replace('let radial=length((world.xz-centre-shift)/width);','let radial=length((world.xz+warp.xz*radius*1.2-centre-shift)/width);')
      .replace('let width=radius*(.24+.38*l.z);','let width=radius*(.3+.45*l.z);')
      .replace('let mixing=smoothstep(0.0,.09,envelope)*smoothstep(0.0,.035,rise);',/* wgsl */`
    let entrainment=max(0.0,(1.0-detail.g)*.06*radius+(0.5-billow.a)*.08);
    let mixing=smoothstep(entrainment,entrainment+.08,envelope)*smoothstep(0.0,.035,rise);`);
  }
  return code.replace('fn cloudDensityFiltered(', 'fn cloudDensityLegacyPlumes(').replace('fn cloudDensity(p:',density+/* wgsl */`
fn cloudDensityFiltered(p:vec3f,detail:bool,footprint:f32)->f32 {
  let weight=clamp(regionalTypes(p.xz).x,0.0,1.0);
  if(weight<.0001){return cloudDensityLegacyPlumes(p,detail,footprint);}
  let plume=cloudPlumeDensity(p,footprint);
  if(weight>.9999){return plume;}
  return mix(cloudDensityLegacyPlumes(p,detail,footprint),plume,weight);
}
fn cloudDensity(p:`);
}
