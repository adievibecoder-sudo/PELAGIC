// Three-band proxy at 650/550/450 nm. CDOM absorption follows an exponential
// spectral slope of 0.014 / nm; it does not create particulate scattering.
export function waterCoefficients(turbidity,dissolvedAbsorption=0,mineralScattering=0){
  const t=Math.max(0,Math.min(2,Number(turbidity)||0));
  const c=Math.max(0,Math.min(1,Number(dissolvedAbsorption)||0));
  const mineral=Math.max(0,Math.min(3,Number(mineralScattering)||0));
  // Weakly absorbing suspended minerals: b(550 nm) is independent of CDOM.
  // This is a bounded optical family, not a fit to a particular water sample.
  const scatter=[550/650,1,550/450].map(r=>mineral*r);
  return {
    absorption:[.340+.015*t+c*Math.exp(-2.8)+.006*mineral,.0565+.025*t+c*Math.exp(-1.4)+.002*mineral,.00922+.065*t+c+.001*mineral],
    backscatter:[.0007+.006*t+scatter[0]/12,.001+.008*t+scatter[1]/12,.0015+.010*t+scatter[2]/12],
  };
}
