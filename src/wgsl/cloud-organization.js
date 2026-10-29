import {replaceShader} from './shader-patch.js';

// Seeded thermal population. The existing density erosion, lighting and exact
// support rejection are retained; this changes organization, not march quality.
export function cloudOrganizationShader(code,query){
  const mode=query.get('abClouds');
  if(!['regional','condensate','profile'].includes(mode)||!code.includes('fn thermalShape('))return code;
  if(mode!=='profile'){
  code=replaceShader(code,'  let cell=floor(world.xz/size);',/* wgsl */`
  // An oblique basis avoids world-axis streets; integrated drift still advects
  // the population continuously when the wind direction changes.
  let axis=vec2f(.8574929257,.5144957554);
  let across=vec2f(-axis.y,axis.x);
  let position=vec2f(dot(world.xz,axis),dot(world.xz,across));
  let cell=floor(position/size);`);
  code=replaceShader(code,'    let random=vec3f(hash3(vec3f(id,13.7)),hash3(vec3f(id.yx,29.3)),hash3(vec3f(id,71.9)));',/* wgsl */`
    let seed=F.roughnessWind.w;
    let random=vec3f(hash3(vec3f(id,13.7+seed*.017)),hash3(vec3f(id.yx,29.3+seed*.031)),hash3(vec3f(id,71.9+seed*.013)));
    let variety=vec3f(hash3(vec3f(id,103.1+seed*.019)),hash3(vec3f(id,193.7+seed*.023)),hash3(vec3f(id.yx,251.9+seed*.029)));`);
  code=replaceShader(code,'    let centre=(id+0.2+random.xy*0.6)*size;',/* wgsl */`
    let centreLocal=(id+.05+random.xy*.9)*size;
    let centre=axis*centreLocal.x+across*centreLocal.y;`);
  code=replaceShader(code,'    let depth=layerDepth*(0.20+0.64*random.y*random.y);',
    '    let depth=layerDepth*(.18+.68*variety.y*variety.y);');
  // The rotated side lobe reaches sqrt(2)*.7 + .62*1.32 radii.
  // Include shear when bounding support, so a jittered cell cannot appear or
  // disappear at the edge of the 3x3 search (including 5 km deep cumulus).
  code=replaceShader(code,'    let radius=size*(0.17+0.29*random.x)*pow(strength,0.333333);',
    `    let supportRadius=(1.049*size-.18*1.101*1.101*depth)/1.809;
    let radius=min(size*(.10+.36*variety.x*variety.x),supportRadius)*pow(strength,0.333333);`);
  code=replaceShader(code,'    let q=vec3f((world.xz-centre-bend)/radius,(h-0.30)/0.52);',/* wgsl */`
    let delta=world.xz-centre-bend;
    let orientation=6.28318530718*variety.z;
    let ca=cos(orientation);let sa=sin(orientation);
    let q=vec3f(vec2f(ca*delta.x-sa*delta.y,sa*delta.x+ca*delta.y)/radius,(h-.30)/.52);`);
  }
  if(['condensate','profile'].includes(mode)){
    code=replaceShader(code,'layerDepth:f32)->f32 {','layerDepth:f32)->vec2f {');
    const field=code.includes('  var field=-0.32;')?'  var field=-0.32;':'  var field=-1.0;';
    code=replaceShader(code,field,field+'\n  var moisture=0.0;var moistureWeight=0.0;');
    code=replaceShader(code,'    field=max(field,mix(-1.0,lobe,base));',/* wgsl */`
    let shape=mix(-1.0,lobe,base);
    // Condensate starts at zero at the LCL. The h/(h+.15) profile has
    // integral 1-.15*log(1.15/.15) on [0,1]. This normalizes the profile;
    // the final eroded cloud's optical mass still depends on its shape.
    let condensate=max(h,0.0)/(max(h,0.0)+.15)/.694467711;
    let weight=pow(max(shape+.32,0.0),2.0);
    moisture+=condensate*weight;moistureWeight+=weight;
    field=max(field,shape);`);
    code=replaceShader(code,'  return field;','  return vec2f(field,moisture/max(moistureWeight,1e-8));');
    code=code.replace('  var thermal=-1.0;','  var thermal=vec2f(-1,0);')
      .replace('thermal<=-0.32','thermal.x<=-0.32')
      .replace('(thermal+billow)','(thermal.x+billow)')
      .replace('smoothstep(-0.32,0.06,thermal);','smoothstep(-0.32,0.06,thermal.x)*thermal.y;');
    if(query.get('abCloudWork')!=='off'){
      // Zero-support cells contribute neither shape nor condensate. Avoid
      // their division and use a multiply for the quadratic blend weight.
      code=replaceShader(code,'    let condensate=max(h,0.0)',
        '    if(shape<=-.32){continue;}\n    let condensate=max(h,0.0)');
      code=replaceShader(code,'    let weight=pow(max(shape+.32,0.0),2.0);',
        '    let support=shape+.32;let weight=support*support;');
    }
  }
  if(mode!=='profile'&&query.get('abCloudWork')!=='off'){
    // Most queried cells are empty or outside this ray's height/radius. Delay
    // attributes that cannot affect those decisions, retaining exact density.
    code=replaceShader(code,`    let random=vec3f(hash3(vec3f(id,13.7+seed*.017)),hash3(vec3f(id.yx,29.3+seed*.031)),hash3(vec3f(id,71.9+seed*.013)));
    let variety=vec3f(hash3(vec3f(id,103.1+seed*.019)),hash3(vec3f(id,193.7+seed*.023)),hash3(vec3f(id.yx,251.9+seed*.029)));`,
      '    let occupancy=hash3(vec3f(id,71.9+seed*.013));');
    code=replaceShader(code,'    let strength=smoothstep(random.z-0.12,random.z+0.12,coverage);',
      '    let strength=smoothstep(occupancy-0.12,occupancy+0.12,coverage);');
    code=replaceShader(code,`    let centreLocal=(id+.05+random.xy*.9)*size;
    let centre=axis*centreLocal.x+across*centreLocal.y;
    let depth=layerDepth*(.18+.68*variety.y*variety.y);
    let bottom=F.cloudP.x+layerDepth*(0.015+0.08*random.x);`,/* wgsl */`
    let randomX=hash3(vec3f(id,13.7+seed*.017));
    let depthRandom=hash3(vec3f(id,193.7+seed*.023));
    let depth=layerDepth*(.18+.68*depthRandom*depthRandom);
    let bottom=F.cloudP.x+layerDepth*(0.015+0.08*randomX);`);
    code=replaceShader(code,'    let supportRadius=',/* wgsl */`
    let random=vec3f(randomX,hash3(vec3f(id.yx,29.3+seed*.031)),occupancy);
    let centreLocal=(id+.05+random.xy*.9)*size;
    let centre=axis*centreLocal.x+across*centreLocal.y;
    let radiusRandom=hash3(vec3f(id,103.1+seed*.019));
    let supportRadius=`);
    code=replaceShader(code,'.10+.36*variety.x*variety.x','.10+.36*radiusRandom*radiusRandom');
    code=replaceShader(code,'    let orientation=6.28318530718*variety.z;',/* wgsl */`
    if(dot(delta,delta)>radius*radius*(1.809*1.809)){continue;}
    let orientation=6.28318530718*hash3(vec3f(id.yx,251.9+seed*.029));`);
  }
  return code;
}
