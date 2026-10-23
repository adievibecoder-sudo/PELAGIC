import {setupUI,download} from './ui.js';
import {gpuLedger} from './gpu-ledger.js';
import {phase1LightReadback} from '../tests/phase1-light-readback.js';
// WebGPU ocean â€” custom renderer.
// FFT ocean (6 cascades) + CDLOD surface mesh + physically based sky + HDR post.
// Large per-frame arrays are reused; diagnostics and browser API descriptors still allocate.
import { N, CASCADES, SKY_W, SKY_H, ENV_SIZE, ENV_MIPS, CONFIG, Q } from './wgsl/common.js';
import { sanitize, preset, PRESETS, QUALITY, toURL } from './settings.js';
import {createEnvironment,commandEnvironment,advanceEnvironment,sampleEnvironment,environmentUniforms,environmentSnapshot,restoreEnvironment,WEATHER_KEYS,SEA_KEYS} from './environment.js';
import { cosSpreadNorm, PATCHES, omega } from './numerics.js';
import { swellAlpha } from './sea-spectrum.js';
import { celestial } from './astronomy.js';
import { lunarLight, twilightExposure } from './celestial-light.js';
import {localOrigin,cascadeOrigin,foamPatternOrigin,FRAME_BYTES,FRAME_FLOATS,FOAM_BYTES} from './spatial-origin.js';
import { runtimeInput, validCamera } from './runtime-input.js';
import { PARTICLE_COUNT, PARTICLE_UPDATE, PARTICLE_RENDER } from './wgsl/particles.js';
import { spectralReadback } from '../tests/spectral-readback.js';
import { foamReadback } from '../tests/foam-readback.js';
import { hdrReadback } from '../tests/hdr-readback.js';
import { slopeMipReadback } from '../tests/slope-readback.js';
import { discreteSpectrumLedger } from './ocean-contracts.js';
import { equalizeFoamPattern } from './foam-pattern.js';
import { SIM_INIT, SIM_EVOLVE, FFT_ROWS, FFT_COLS, SIM_MIPS, FOAM_TEX, RGBA8_MIPS, FOAM_UPDATE, ARRAY16_MIPS, FOAM_RES } from './wgsl/sim.js';
import { TRANS_LUT, MS_LUT, SKYVIEW_LUT, ENV_CUBE, CUBE_MIPS, SUN_VIS, CLOUD_SCREEN, CLOUD_SHADOW } from './wgsl/sky.js';
import { OCEAN, SKY_BG, HEIGHT_PROBE } from './wgsl/ocean.js';
import { BLOOM_DOWN, BLOOM_UP, COMPOSITE } from './wgsl/post.js';
import { CLOUD_NOISE, CLOUD_NOISE_MIP, CLOUD_NOISE_SIZE } from './wgsl/cloud-noise.js';
import { ENV_IRRADIANCE, IRRADIANCE_SIZE } from './wgsl/irradiance.js';
import { WAVE_HEIGHT, WAVE_SHADOW, WAVE_MAP_SIZE, WAVE_HEIGHT_MIPS, WAVE_HEIGHT_MAX } from './wgsl/wave-visibility.js';
import { LENS_MEDIUM } from './wgsl/lens-medium.js';
import {phase0Shader} from '../tests/phase0-shaders.js';
import {phase0CloudColumns} from '../tests/phase0-readback.js';
import {cloudBankShader} from './wgsl/cloud-bank.js';
import {cloudConvectionShader} from './wgsl/cloud-convection.js';
import {cloudConvectionChecks} from '../tests/cloud-convection-readback.js';
import {cloudLightPathShader} from './wgsl/cloud-light-path.js';
import {cloudLightPathChecks} from '../tests/cloud-light-path-readback.js';
import {waveDiagnosticShader} from '../tests/milestone-a-wave-shaders.js';
import {orderOceanNodes} from './ocean-order.js';

const qs = new URLSearchParams(location.search);
const runtime=runtimeInput(location.search);
const DBG = Number(qs.get('dbg')) || 0;
const D2R = Math.PI / 180;
const GU = globalThis.GPUBufferUsage;
const TU = globalThis.GPUTextureUsage;

// ----------------------------------------------------------------------------------------
// Tunable parameters (UI panel edits these)
// ----------------------------------------------------------------------------------------
export const P = {...CONFIG};
let environment=createEnvironment(P,runtime.time);
if(qs.has('environment'))environment=restoreEnvironment(JSON.parse(qs.get('environment')),P);
const CASC_L = PATCHES;

function fail(msg) {
  const el = document.getElementById('err');
  el.style.display = 'block';
  el.textContent = msg;
  log('FATAL ' + msg);
  throw new Error(msg);
}
function log(msg) {
  console.log(msg);
  try { fetch('/__log', { method: 'POST', body: String(msg) }).catch(() => {}); } catch (e) { /* offline */ }
}

// ----------------------------------------------------------------------------------------
// Small math helpers writing into preallocated arrays
// ----------------------------------------------------------------------------------------
function mat4Mul(out, a, b) {
  for (let c = 0; c < 4; c++) {
    const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
    out[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }
}

async function main() {
  const sourceStart=qs.get('ma')==='1'?await fetch('/__source').then(r=>{if(!r.ok)throw Error('Source manifest unavailable');return r.json();}):null;
  async function postEvidence(url,body){
    const response=await fetch(url,{method:'POST',body});
    if(!response.ok)fail('Evidence save failed ('+response.status+'): '+await response.text());
  }
  if (!navigator.gpu) fail('WebGPU is not available in this browser.');
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
  if (!adapter) fail('No WebGPU adapter found.');
  const hasTS = adapter.features.has('timestamp-query');
  const device = await adapter.requestDevice({
    requiredFeatures: hasTS ? ['timestamp-query'] : [],
  });
  const allocations=gpuLedger(device);
  let stopped = false;
  addEventListener('pagehide',()=>{stopped=true;device.destroy();},{once:true});
  const errors=[];
  const browserTasks=[];
  for(const type of ['long-animation-frame','longtask'])if(PerformanceObserver.supportedEntryTypes.includes(type)){
    new PerformanceObserver(list=>{for(const e of list.getEntries()){
      browserTasks.push({type,start:e.startTime,duration:e.duration,blockingDuration:e.blockingDuration||0,
        scripts:e.scripts?.map(s=>({source:s.sourceURL,duration:s.duration,invoker:s.invoker}))});
      if(browserTasks.length>500)browserTasks.shift();
    }}).observe({type,buffered:true});
  }
  const adapterInfo={vendor:adapter.info.vendor,architecture:adapter.info.architecture,device:adapter.info.device,description:adapter.info.description,isFallbackAdapter:adapter.isFallbackAdapter ?? null};
  if(adapter.isFallbackAdapter || /swiftshader|llvmpipe|software/i.test(JSON.stringify(adapterInfo))) fail('Software WebGPU adapter detected. Select a hardware GPU in browser/OS graphics settings. No WebGL fallback.');
  log('Native WebGPU adapter: '+JSON.stringify(adapterInfo));
  device.lost.then((i) => {stopped=true; const el=document.getElementById('err');el.style.display='block';el.textContent='WebGPU device lost: '+i.message+'\nReload to recreate GPU resources.';});
  device.onuncapturederror = (e) => {errors.push(e.error.message);stopped=true;const el=document.getElementById('err');el.style.display='block';el.textContent='WebGPU rendering stopped: '+e.error.message;log('GPU error: ' + e.error.message);};

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('webgpu');
  const swapFormat = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({ device, format: swapFormat, alphaMode: 'opaque', usage: TU.RENDER_ATTACHMENT | TU.COPY_SRC });

  async function shader(code, label) {
    code=cloudLightPathShader(waveDiagnosticShader(cloudConvectionShader(cloudBankShader(phase0Shader(code,qs),qs),qs),qs),qs);
    const m = device.createShaderModule({ code, label });
    const info = await m.getCompilationInfo();
    let bad = false;
    for (const msg of info.messages) {
      if (msg.type === 'error') bad = true;
      if (msg.type !== 'info') {
        const line = code.split('\n')[msg.lineNum - 1];
        log(`[${label}] ${msg.type} ${msg.lineNum}:${msg.linePos} ${msg.message}\n    ${line}`);
      }
    }
    if (bad) fail('Shader compile error in ' + label + ' (see console)');
    return m;
  }
  async function computePipe(code, label) {
    const module = await shader(code, label);
    return device.createComputePipelineAsync({ label, layout: 'auto', compute: { module, entryPoint: 'main' } });
  }

  // --------------------------------------------------------------------------------------
  // Simulation resources
  // --------------------------------------------------------------------------------------
  const C = CASCADES;
  const SIM_MIP_COUNT = Math.log2(N) + 1;
  const specBytes = N * N * C * 16;
  const mkBuf = (size, usage, label) => allocations.buffer({ size, usage, label });
  const simUBO = mkBuf(224, GU.UNIFORM | GU.COPY_DST, 'sim ubo');
  const h0Buf = mkBuf(specBytes, GU.STORAGE | GU.COPY_SRC, 'h0');
  const phaseBuf = mkBuf(N*N*C*8, GU.STORAGE | GU.COPY_DST, 'unit phase oscillators');
  const phaseData = new Float32Array(N*N*C*2);
  const specA = mkBuf(specBytes, GU.STORAGE | GU.COPY_SRC, 'specA');
  const specB = mkBuf(specBytes, GU.STORAGE, 'specB');
  const tmpA = mkBuf(specBytes, GU.STORAGE, 'tmpA');
  const tmpB = mkBuf(specBytes, GU.STORAGE, 'tmpB');

  const mkSimTex = (label) => allocations.texture({
    label, size: [N, N, C], format: 'rgba16float', mipLevelCount: SIM_MIP_COUNT,
    usage: TU.TEXTURE_BINDING | TU.STORAGE_BINDING | TU.COPY_SRC | TU.COPY_DST,
  });
  const dispTex = mkSimTex('disp');
  const derivTex = mkSimTex('deriv');
  const momTex = mkSimTex('moments');
  const lastDisp = mkSimTex('previous displacement');
  const lvl = (t, m, dim = '2d-array') => t.createView({ dimension: dim, baseMipLevel: m, mipLevelCount: 1 });
  const fullArr = (t) => t.createView({ dimension: '2d-array' });

  const [initPipe, evolvePipe, rowsPipe, colsPipe, simMipPipe, foamGenPipe, rgba8MipPipe,
    transPipe, msPipe, skyViewPipe, envPipe, cubeMipPipe, foamUpdPipe, arr16MipPipe, sunVisPipe, cloudPipe, shadowPipe] = await Promise.all([
    computePipe(SIM_INIT, 'sim init'),
    computePipe(SIM_EVOLVE, 'sim evolve'),
    computePipe(FFT_ROWS, 'fft rows'),
    computePipe(FFT_COLS, 'fft cols'),
    computePipe(SIM_MIPS, 'sim mips'),
    computePipe(FOAM_TEX, 'foam tex'),
    computePipe(RGBA8_MIPS, 'rgba8 mips'),
    computePipe(TRANS_LUT, 'transmittance'),
    computePipe(MS_LUT, 'multiscatter'),
    computePipe(SKYVIEW_LUT, 'skyview'),
    computePipe(ENV_CUBE, 'env cube'),
    computePipe(CUBE_MIPS, 'cube mips'),
    computePipe(FOAM_UPDATE, 'foam update'),
    computePipe(ARRAY16_MIPS, 'array16 mips'),
    computePipe(SUN_VIS, 'sun visibility'),
    computePipe(CLOUD_SCREEN, 'cloud volume screen'),
    computePipe(CLOUD_SHADOW, 'cloud shadow map'),
  ]);

  const bg = (pipe, entries, label) => device.createBindGroup({
    label, layout: pipe.getBindGroupLayout(0),
    entries: entries.map((r, i) => ({ binding: i, resource: r })),
  });
  const cloudNoiseMips=Math.log2(CLOUD_NOISE_SIZE)+1;
  const cloudNoise=allocations.texture({label:'periodic cloud morphology',size:[CLOUD_NOISE_SIZE,CLOUD_NOISE_SIZE,CLOUD_NOISE_SIZE],dimension:'3d',format:'rgba8unorm',mipLevelCount:cloudNoiseMips,usage:TU.TEXTURE_BINDING|TU.STORAGE_BINDING});
  const cloudNoiseView=cloudNoise.createView();
  const cloudSampler=device.createSampler({magFilter:'linear',minFilter:'linear',mipmapFilter:'linear',addressModeU:'repeat',addressModeV:'repeat',addressModeW:'repeat'});
  const cloudNoisePipe=await computePipe(CLOUD_NOISE,'cloud morphology cache');
  const cloudMipPipe=await computePipe(CLOUD_NOISE_MIP,'cloud footprint filtering');
  {
    const e=device.createCommandEncoder(),p=e.beginComputePass();
    const view=m=>cloudNoise.createView({baseMipLevel:m,mipLevelCount:1});
    p.setPipeline(cloudNoisePipe);p.setBindGroup(0,bg(cloudNoisePipe,[view(0)]));p.dispatchWorkgroups(CLOUD_NOISE_SIZE/4,CLOUD_NOISE_SIZE/4,CLOUD_NOISE_SIZE/4);
    for(let m=1;m<cloudNoiseMips;m++){
      p.setPipeline(cloudMipPipe);p.setBindGroup(0,bg(cloudMipPipe,[view(m-1),view(m)]));
      const groups=Math.ceil((CLOUD_NOISE_SIZE>>m)/4);p.dispatchWorkgroups(groups,groups,groups);
    }
    p.end();device.queue.submit([e.finish()]);
  }
  const bgInit = bg(initPipe, [{ buffer: simUBO }, { buffer: h0Buf }], 'init');
  const bgEvolve = bg(evolvePipe, [{ buffer: simUBO }, { buffer: h0Buf }, { buffer: specA }, { buffer: specB }, {buffer:phaseBuf}], 'evolve');
  const bgRows = bg(rowsPipe, [{ buffer: specA }, { buffer: specB }, { buffer: tmpA }, { buffer: tmpB }], 'rows');
  const bgCols = bg(colsPipe, [{ buffer: tmpA }, { buffer: tmpB },
    lvl(dispTex, 0), lvl(derivTex, 0), lvl(momTex, 0)], 'cols');
  const bgSimMips = [];
  for (let m = 1; m < SIM_MIP_COUNT; m++) {
    bgSimMips.push(bg(simMipPipe, [lvl(dispTex, m - 1), lvl(derivTex, m - 1), lvl(momTex, m - 1),
      lvl(dispTex, m), lvl(derivTex, m), lvl(momTex, m)], 'simmip' + m));
  }

  // Foam micro-structure texture (generated once)
  const FOAM_SIZE = 512, FOAM_MIPS = 10;
  const foamTex = allocations.texture({
    label: 'foam detail', size: [FOAM_SIZE, FOAM_SIZE], format: 'rgba8unorm', mipLevelCount: FOAM_MIPS,
    usage: TU.TEXTURE_BINDING | TU.STORAGE_BINDING | TU.COPY_SRC | TU.COPY_DST,
  });
  let foamPatternCalibration;
  {
    const enc = device.createCommandEncoder();
    const cp = enc.beginComputePass();
    cp.setPipeline(foamGenPipe);
    cp.setBindGroup(0, bg(foamGenPipe, [lvl(foamTex, 0, '2d')]));
    cp.dispatchWorkgroups(FOAM_SIZE / 8, FOAM_SIZE / 8);
    cp.end();
    const read=mkBuf(FOAM_SIZE*FOAM_SIZE*4,GU.COPY_DST|GU.MAP_READ,'foam coverage calibration');
    enc.copyTextureToBuffer({texture:foamTex},{buffer:read,bytesPerRow:FOAM_SIZE*4},[FOAM_SIZE,FOAM_SIZE]);
    device.queue.submit([enc.finish()]);
    await read.mapAsync(GPUMapMode.READ);
    const pixels=new Uint8Array(read.getMappedRange()).slice();
    foamPatternCalibration=equalizeFoamPattern(pixels);
    read.unmap();read.destroy();
    device.queue.writeTexture({texture:foamTex},pixels,{bytesPerRow:FOAM_SIZE*4},[FOAM_SIZE,FOAM_SIZE]);
    const mipEncoder=device.createCommandEncoder(),mipPass=mipEncoder.beginComputePass();
    mipPass.setPipeline(rgba8MipPipe);
    for (let m = 1; m < FOAM_MIPS; m++) {
      const s = FOAM_SIZE >> m;
      mipPass.setBindGroup(0, bg(rgba8MipPipe, [lvl(foamTex, m - 1, '2d'), lvl(foamTex, m, '2d')]));
      mipPass.dispatchWorkgroups(Math.ceil(s / 8), Math.ceil(s / 8));
    }
    mipPass.end();
    device.queue.submit([mipEncoder.finish()]);
  }

  // World-space foam clipmaps (ping-pong)
  const FOAM_LEVEL_SIZE = [128.0, 1024.0];
  const FOAMW_MIPS = Math.log2(FOAM_RES) + 1;
  const foamW = [0, 1].map((i) => allocations.texture({
    label: 'foam world ' + i, size: [FOAM_RES, FOAM_RES, 2], format: 'rgba16float', mipLevelCount: FOAMW_MIPS,
    usage: TU.TEXTURE_BINDING | TU.STORAGE_BINDING | TU.COPY_SRC,
  }));
  const foamUBO = mkBuf(FOAM_BYTES, GU.UNIFORM | GU.COPY_DST, 'foam ubo');
  const foamUArr = new ArrayBuffer(FOAM_BYTES);
  const foamUI = new Int32Array(foamUArr);
  const foamUF = new Float32Array(foamUArr);
  const foamSnap = new Int32Array(4);  // previous camera texel per level
  let foamFirst = true;
  let foamCur = 0;
  const samplerSim = device.createSampler({
    magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat',
  });
  const bgFoamUpd = [0, 1].map((i) => bg(foamUpdPipe, [{ buffer: foamUBO }, lvl(foamW[1 - i], 0), lvl(foamW[i], 0),
    fullArr(dispTex), fullArr(derivTex), samplerSim, samplerSim, fullArr(lastDisp)], 'foamupd' + i));
  const bgFoamMips = [0, 1].map((i) => {
    const out = [];
    for (let m = 1; m < FOAMW_MIPS; m++) out.push(bg(arr16MipPipe, [lvl(foamW[i], m - 1), lvl(foamW[i], m)]));
    return out;
  });

  // --------------------------------------------------------------------------------------
  // Atmosphere resources
  // --------------------------------------------------------------------------------------
  const atmoUBO = mkBuf(16, GU.UNIFORM | GU.COPY_DST, 'atmo ubo');
  const mkLut = (w, h, label) => allocations.texture({
    label, size: [w, h], format: 'rgba16float', usage: TU.TEXTURE_BINDING | TU.STORAGE_BINDING | TU.COPY_SRC | TU.COPY_DST,
  });
  const transLUT = mkLut(256, 64, 'transmittance');
  const msLUT = mkLut(32, 32, 'multiscatter');
  const skyLUT = allocations.texture({label:'solar and lunar skyview',size:[SKY_W,SKY_H,2],format:'rgba16float',usage:TU.TEXTURE_BINDING|TU.STORAGE_BINDING|TU.COPY_SRC});
  const envTex = allocations.texture({
    label: 'env cube', size: [ENV_SIZE, ENV_SIZE, 6], format: 'rgba16float', mipLevelCount: ENV_MIPS,
    usage: TU.TEXTURE_BINDING | TU.STORAGE_BINDING | TU.COPY_SRC | TU.COPY_DST,
  });
  const envCubeView = envTex.createView({ dimension: 'cube' });
  const envBuild=allocations.texture({label:'angular radiance staging',size:[ENV_SIZE,ENV_SIZE,6],format:'rgba16float',mipLevelCount:ENV_MIPS,usage:TU.TEXTURE_BINDING|TU.STORAGE_BINDING|TU.COPY_SRC});
  const envTrans=mkLut(256,64,'environment transmittance snapshot');
  const envSky=allocations.texture({label:'environment sky snapshot',size:[SKY_W,SKY_H,2],format:'rgba16float',usage:TU.TEXTURE_BINDING|TU.COPY_DST});
  const envFrame=mkBuf(FRAME_BYTES,GU.UNIFORM|GU.COPY_DST,'environment state snapshot');
  let cacheFace=0,cacheVersion=0,cachePending=null,cachePublished=null;
  const cacheF=new Float32Array(FRAME_FLOATS),cacheHistory=[];
  const irradianceTex=allocations.texture({label:'hemispherical irradiance',size:[IRRADIANCE_SIZE,IRRADIANCE_SIZE,6],format:'rgba16float',usage:TU.TEXTURE_BINDING|TU.STORAGE_BINDING|TU.COPY_SRC});
  const irradianceView=irradianceTex.createView({dimension:'cube'});
  const irradiancePipe=await computePipe(ENV_IRRADIANCE,'cosine irradiance');
  const sampClamp = device.createSampler({
    magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear',
    addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge', addressModeW: 'clamp-to-edge',
  });
  const sampRepeat = device.createSampler({
    magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear',
    addressModeU: 'repeat', addressModeV: 'repeat', maxAnisotropy: P.quality==='Balanced'?4:8,
  });
  const frameUBO = mkBuf(FRAME_BYTES, GU.UNIFORM | GU.COPY_DST, 'frame ubo');
  const sunVisBuf = mkBuf(16, GU.STORAGE, 'sun visibility');
  const transView = transLUT.createView();
  const msView = msLUT.createView();
  const skyView = skyLUT.createView();
  const shadowTex=mkLut(256,256,'spatial cloud transmittance');
  const shadowView=shadowTex.createView();
  const bgShadow=device.createBindGroup({layout:shadowPipe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:frameUBO}},{binding:4,resource:shadowView},{binding:5,resource:cloudNoiseView},{binding:6,resource:cloudSampler}]});

  const bgTrans = bg(transPipe, [{ buffer: atmoUBO }, transView], 'trans');
  const bgMS = bg(msPipe, [{ buffer: atmoUBO }, transView, sampClamp, msView], 'ms');
  const bgSkyView = bg(skyViewPipe, [{ buffer: frameUBO }, transView, msView, sampClamp, skyView], 'skyview');
  const particleBuf=mkBuf(PARTICLE_COUNT*32,GU.STORAGE,'spray and rain particles');
  const particleCompute=await computePipe(PARTICLE_UPDATE,'particle transport');
  const particleModule=await shader(PARTICLE_RENDER,'particle rendering');
  const particleBG=[0,1].map(i=>bg(particleCompute,[{buffer:frameUBO},{buffer:particleBuf},fullArr(foamW[i]),fullArr(dispTex),samplerSim,fullArr(derivTex),fullArr(lastDisp),shadowView,sampClamp]));
  const bgEnv = bg(envPipe, [{ buffer: envFrame }, envTrans.createView(), envSky.createView(), sampClamp, lvl(envBuild, 0),cloudNoiseView,cloudSampler], 'env');
  const bgSunVis = bg(sunVisPipe, [{ buffer: frameUBO }, transView, skyView, sampClamp, { buffer: sunVisBuf },cloudNoiseView,cloudSampler], 'sunvis');
  const bgCubeMips = [];
  for (let m = 1; m < ENV_MIPS; m++) bgCubeMips.push(bg(cubeMipPipe, [lvl(envBuild, m - 1), lvl(envBuild, m)], 'cubemip' + m));
  const bgIrradiance=bg(irradiancePipe,[envCubeView,sampClamp,irradianceTex.createView({dimension:'2d-array'})]);
  const waveHeight=allocations.texture({label:'resolved Eulerian gravity height',size:[WAVE_MAP_SIZE,WAVE_MAP_SIZE,2],format:'rgba16float',mipLevelCount:WAVE_HEIGHT_MIPS,usage:TU.TEXTURE_BINDING|TU.STORAGE_BINDING|TU.COPY_SRC});
  const waveShadow=allocations.texture({label:'resolved gravity-wave solar visibility',size:[WAVE_MAP_SIZE,WAVE_MAP_SIZE,2],format:'rgba16float',usage:TU.TEXTURE_BINDING|TU.STORAGE_BINDING|TU.COPY_SRC});
  const waveHeightPipe=await computePipe(WAVE_HEIGHT,'gravity height atlas');
  const waveShadowPipe=await computePipe(WAVE_SHADOW,'gravity light visibility');
  const bgWaveHeight=bg(waveHeightPipe,[{buffer:frameUBO},fullArr(dispTex),samplerSim,lvl(waveHeight,0)]);
  const bgWaveShadow=bg(waveShadowPipe,[{buffer:frameUBO},waveHeight.createView(),sampClamp,waveShadow.createView()]);
  const heightMaxPipe=await computePipe(WAVE_HEIGHT_MAX,'gravity height upper bound');
  const bgHeightMax=Array.from({length:WAVE_HEIGHT_MIPS-1},(_,m)=>bg(heightMaxPipe,[lvl(waveHeight,m),lvl(waveHeight,m+1)]));

  // --------------------------------------------------------------------------------------
  // Render pipelines
  // --------------------------------------------------------------------------------------
  const MSAA = 4;
  const HDR = 'rgba16float';
  const particlePipe=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:particleModule,entryPoint:'vs'},fragment:{module:particleModule,entryPoint:'fs',targets:[{format:HDR,blend:{color:{srcFactor:'src-alpha',dstFactor:'one-minus-src-alpha'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha'}}}]},primitive:{topology:'triangle-list'},depthStencil:{format:'depth32float',depthWriteEnabled:false,depthCompare:'greater'},multisample:{count:MSAA}});
  const particleDrawBG=bg(particlePipe,[{buffer:frameUBO},{buffer:particleBuf},irradianceView,sampClamp,shadowView,transView,sampClamp]);
  const [oceanMod, skyMod, downMod, upMod, compMod] = await Promise.all([
    shader(OCEAN, 'ocean'), shader(SKY_BG, 'sky'), shader(BLOOM_DOWN, 'bloom down'),
    shader(BLOOM_UP, 'bloom up'), shader(COMPOSITE, 'composite'),
  ]);
  const oceanPipe = await device.createRenderPipelineAsync({
    label: 'ocean', layout: 'auto',
    vertex: {
      module: oceanMod, entryPoint: 'vs',
      buffers: [{ arrayStride: 16, stepMode: 'instance', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x4' }] }],
    },
    fragment: { module: oceanMod, entryPoint: 'fs', targets: [{ format: HDR }] },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: 'depth32float', depthWriteEnabled: true, depthCompare: 'greater' },
    multisample: { count: MSAA },
  });
  const skyPipe = await device.createRenderPipelineAsync({
    label: 'sky', layout: 'auto',
    vertex: { module: skyMod, entryPoint: 'vs' },
    fragment: { module: skyMod, entryPoint: 'fs', targets: [{ format: HDR }] },
    primitive: { topology: 'triangle-list' },
    depthStencil: { format: 'depth32float', depthWriteEnabled: false, depthCompare: 'equal' },
    multisample: { count: MSAA },
  });
  const downPipe = await device.createRenderPipelineAsync({
    label: 'bloom down', layout: 'auto',
    vertex: { module: downMod, entryPoint: 'vs' },
    fragment: { module: downMod, entryPoint: 'fs', targets: [{ format: HDR }] },
  });
  const upPipe = await device.createRenderPipelineAsync({
    label: 'bloom up', layout: 'auto',
    vertex: { module: upMod, entryPoint: 'vs' },
    fragment: {
      module: upMod, entryPoint: 'fs',
      targets: [{ format: HDR, blend: { color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' }, alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' } } }],
    },
  });
  const compPipe = await device.createRenderPipelineAsync({
    label: 'composite', layout: 'auto',
    vertex: { module: compMod, entryPoint: 'vs' },
    fragment: { module: compMod, entryPoint: 'fs', targets: [{ format: swapFormat }] },
  });

  const probeOut = mkBuf(16, GU.STORAGE | GU.COPY_SRC, 'probe out');
  const lensMedium=allocations.texture({label:'curved near-plane medium',size:[128,72],format:'rgba16float',usage:TU.TEXTURE_BINDING|TU.STORAGE_BINDING|TU.COPY_SRC});
  const lensPipe=await computePipe(LENS_MEDIUM,'near-plane surface inversion');
  const bgLens=bg(lensPipe,[{buffer:frameUBO},fullArr(dispTex),fullArr(derivTex),samplerSim,{buffer:probeOut},lensMedium.createView()]);
  const bgOcean = [0, 1].map((i) => bg(oceanPipe, [{ buffer: frameUBO }, transView, skyView, sampClamp,
    fullArr(dispTex), fullArr(derivTex), fullArr(momTex), foamTex.createView(), envCubeView, sampRepeat,
    fullArr(foamW[i]), shadowView,{buffer:probeOut},irradianceView,waveShadow.createView(),lensMedium.createView(),waveHeight.createView()], 'ocean' + i));
  let bgSky, bgCloud, cloudTex;

  // Water height under the camera (async readback, a few frames of latency) so the
  // floating camera rides above passing crests instead of clipping into them.
  const probePipe = await computePipe(HEIGHT_PROBE, 'height probe');
  const probeRead = mkBuf(16, GU.MAP_READ | GU.COPY_DST, 'probe read');
  const bgProbe = bg(probePipe, [{ buffer: frameUBO }, fullArr(dispTex), samplerSim, { buffer: probeOut },fullArr(derivTex)], 'probe');
  let probePending = false, waterH = 0,probeSubmittedFrame=0,probeCompletedFrame=0;
  const onProbe = () => {
    waterH = new Float32Array(probeRead.getMappedRange(0, 16))[0];
    probeCompletedFrame=probeSubmittedFrame;
    probeRead.unmap();
    probePending = false;
  };
  const onProbeFail = () => { probePending = false; };

  // CDLOD grid mesh
  const GRID = Q.grid;
  const LEAF = 2.0;           // finest node size (m) -> 6.25 cm vertex spacing
  const R0 = 5 * LEAF;        // LOD 0 range
  const LODS = 17;
  const MAX_DIST = 160000;
  const MAX_NODES = 8192;
  const idx = new Uint16Array(GRID * GRID * 6);
  {
    let k = 0;
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const a = i + j * (GRID + 1), b = a + 1, c = a + GRID + 1, d = c + 1;
        idx[k++] = a; idx[k++] = c; idx[k++] = d;
        idx[k++] = a; idx[k++] = d; idx[k++] = b;
      }
    }
  }
  const idxBuf = mkBuf(idx.byteLength, GU.INDEX | GU.COPY_DST, 'grid idx');
  device.queue.writeBuffer(idxBuf, 0, idx);
  const instData = new Float32Array(MAX_NODES * 4);
  const nearFirst=qs.get('maOceanOrder')!=='spatial';
  const orderedInstances=nearFirst?new Float32Array(instData.length):null;
  const nodeOrder=nearFirst?new Uint32Array(MAX_NODES):null;
  const nodeDistances=nearFirst?new Float64Array(MAX_NODES):null;
  const instBuf = mkBuf(instData.byteLength, GU.VERTEX | GU.COPY_DST, 'instances');

  // --------------------------------------------------------------------------------------
  // Screen-size dependent targets
  // --------------------------------------------------------------------------------------
  const BLOOM_LEVELS = 8;
  const linSamp = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' });
  const compUBO = mkBuf(32, GU.UNIFORM | GU.COPY_DST, 'composite ubo');
  const compData = new Float32Array(8);
  const bloomFirstData = new Float32Array(4);
  const bloomUBOs = [];
  for (let i = 0; i < BLOOM_LEVELS * 2; i++) bloomUBOs.push(mkBuf(16, GU.UNIFORM | GU.COPY_DST, 'bloom ubo'));

  let W = 0, H = 0;
  let cloudW=0,cloudH=0;
  let colorMS, depthMS, hdrTex, bloomTex;
  const mainPass = {
    colorAttachments: [{ view: null, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: 'clear', storeOp: 'store' }],
    depthStencilAttachment: { view: null, depthClearValue: 0, depthLoadOp: 'clear', depthStoreOp: 'store' },
  };
  const transparentPass={colorAttachments:[{view:null,resolveTarget:null,loadOp:'load',storeOp:'discard'}],
    depthStencilAttachment:{view:null,depthLoadOp:'load',depthStoreOp:'discard'}};
  const compPass = {
    colorAttachments: [{ view: null, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: 'clear', storeOp: 'store' }],
    timestampWrites: undefined,
  };
  let downPasses = [], upPasses = [], downBGs = [], upBGs = [], bgComp = null;

  function resize() {
    const fw = runtime.width, fh = runtime.height;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.min(device.limits.maxTextureDimension2D,fw || Math.max(256, Math.round(canvas.clientWidth * dpr * P.resolution)));
    const h = Math.min(device.limits.maxTextureDimension2D,fh || Math.max(256, Math.round(canvas.clientHeight * dpr * P.resolution)));
    if (w === W && h === H) return;
    W = w; H = h;
    canvas.width = W; canvas.height = H;
    cloudTex?.destroy();
    const cloudScale=P.quality==='Cinematic'?1:P.quality==='Balanced'?3:2;
    cloudW=Math.ceil(W/cloudScale);cloudH=Math.ceil(H/cloudScale);
    cloudTex=mkLut(cloudW,cloudH,'cloud radiance and extinction');
    bgCloud=bg(cloudPipe,[{buffer:frameUBO},transView,skyView,sampClamp,cloudTex.createView(),cloudNoiseView,cloudSampler]);
    bgSky=device.createBindGroup({layout:skyPipe.getBindGroupLayout(0),entries:[
      {binding:0,resource:{buffer:frameUBO}},{binding:1,resource:transView},{binding:2,resource:skyView},
      {binding:3,resource:sampClamp},{binding:4,resource:cloudTex.createView()},{binding:7,resource:{buffer:probeOut}},{binding:8,resource:lensMedium.createView()},
      {binding:11,resource:shadowView},{binding:13,resource:irradianceView}]});
    for (const t of [colorMS, depthMS, hdrTex, bloomTex]) t && t.destroy();
    colorMS = allocations.texture({ size: [W, H], format: HDR, sampleCount: MSAA, usage: TU.RENDER_ATTACHMENT });
    depthMS = allocations.texture({ size: [W, H], format: 'depth32float', sampleCount: MSAA, usage: TU.RENDER_ATTACHMENT });
    hdrTex = allocations.texture({ size: [W, H], format: HDR, usage: TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING | TU.COPY_SRC });
    const bw = Math.max(1, W >> 1), bh = Math.max(1, H >> 1);
    bloomTex = allocations.texture({ size: [bw, bh], format: HDR, mipLevelCount: BLOOM_LEVELS, usage: TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING });
    mainPass.colorAttachments[0].view = colorMS.createView();
    mainPass.depthStencilAttachment.view = depthMS.createView();
    transparentPass.colorAttachments[0].view=colorMS.createView();
    transparentPass.colorAttachments[0].resolveTarget=hdrTex.createView();
    transparentPass.depthStencilAttachment.view=depthMS.createView();
    const hdrView = hdrTex.createView();
    const bv = [];
    for (let m = 0; m < BLOOM_LEVELS; m++) bv.push(bloomTex.createView({ baseMipLevel: m, mipLevelCount: 1 }));
    downPasses = []; upPasses = []; downBGs = []; upBGs = [];
    const tmp = new Float32Array(4);
    for (let m = 0; m < BLOOM_LEVELS; m++) {
      const srcW = m === 0 ? W : Math.max(1, bw >> (m - 1));
      const srcH = m === 0 ? H : Math.max(1, bh >> (m - 1));
      tmp[0] = 1 / srcW; tmp[1] = 1 / srcH; tmp[2] = m === 0 ? 1 : 0; tmp[3] = 0;
      device.queue.writeBuffer(bloomUBOs[m], 0, tmp);
      downBGs.push(bg(downPipe, [m === 0 ? hdrView : bv[m - 1], linSamp, { buffer: bloomUBOs[m] }]));
      downPasses.push({ colorAttachments: [{ view: bv[m], clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: 'clear', storeOp: 'store' }] });
    }
    for (let m = BLOOM_LEVELS - 1; m > 0; m--) {
      const sw = Math.max(1, bw >> m), sh = Math.max(1, bh >> m);
      tmp[0] = 1 / sw; tmp[1] = 1 / sh; tmp[2] = 1.0; tmp[3] = 1.0;
      const ubo = bloomUBOs[BLOOM_LEVELS + m];
      device.queue.writeBuffer(ubo, 0, tmp);
      upBGs.push(bg(upPipe, [bv[m], linSamp, { buffer: ubo }]));
      upPasses.push({ colorAttachments: [{ view: bv[m - 1], loadOp: 'load', storeOp: 'store' }] });
    }
    bgComp = bg(compPipe, [hdrView, bv[0], linSamp, { buffer: compUBO }]);
  }

  // --------------------------------------------------------------------------------------
  // GPU timing
  // --------------------------------------------------------------------------------------
  let tsQuery = null, tsResolve = null, tsRead = null, tsPending = false, gpuMs = 0;
  let cpuMs=0,frameMs=0;
  const passMs={simulation:0,atmosphere:0,surface:0,post:0};
  const measurements=[];
  const frameRecords=[];let timingFrame={cpu:0,frame:0,width:0,height:0};
  let firstPassTS = undefined;
  const phase0Profile=qs.get('p0Profile')==='1',queryCount=phase0Profile?18:8;
  if (hasTS) {
    tsQuery = device.createQuerySet({ type: 'timestamp', count: queryCount });
    tsResolve = mkBuf(queryCount*8, GU.QUERY_RESOLVE | GU.COPY_SRC, 'ts resolve');
    tsRead = mkBuf(queryCount*8, GU.MAP_READ | GU.COPY_DST, 'ts read');
    firstPassTS = { querySet: tsQuery, beginningOfPassWriteIndex: 0,endOfPassWriteIndex:1 };
    mainPass.timestampWrites={querySet:tsQuery,beginningOfPassWriteIndex:4,endOfPassWriteIndex:5};
    if(phase0Profile)transparentPass.timestampWrites={querySet:tsQuery,beginningOfPassWriteIndex:16,endOfPassWriteIndex:17};
    compPass.timestampWrites = { querySet: tsQuery, endOfPassWriteIndex: 7 };
  }
  const computeDesc = { timestampWrites: firstPassTS };
  const onTsMapped = () => {
    const t = new BigUint64Array(tsRead.getMappedRange());
    const ms = Number(t[7] - t[0]) / 1e6;
    Object.keys(passMs).forEach((key,i)=>passMs[key]=Number(t[i*2+1]-t[i*2])/1e6);
    const subpasses=phase0Profile?{skyLUT:Number(t[8]-t[2])/1e6,cloudScreen:Number(t[10]-t[9])/1e6,cloudShadow:Number(t[12]-t[11])/1e6,environment:Number(t[14]-t[13])/1e6,irradiance:Number(t[3]-t[15])/1e6}:{};
    if(frameIndex>30)measurements.push({gpu:ms,...passMs,...subpasses,...(phase0Profile?{transparent:Number(t[17]-t[16])/1e6}:{}),...timingFrame,readbackCompleted:performance.now()});
    if(measurements.length>4000)measurements.shift();
    if (ms > 0 && ms < 1000) gpuMs = gpuMs ? gpuMs * 0.8 + ms * 0.2 : ms;
    tsRead.unmap();
    tsPending = false;
  };
  const onTsFail = () => { tsPending = false; };

  // --------------------------------------------------------------------------------------
  // Uniform data
  // --------------------------------------------------------------------------------------
  const simF = new Float32Array(56);
  const frameF = new Float32Array(FRAME_FLOATS);
  const atmoF = new Float32Array(4);
  const proj = new Float32Array(16), view = new Float32Array(16), viewProj = new Float32Array(16);
  const LOOP = 86400.0; // cloud-coordinate epoch only; wave phases do not loop
  let needSpectrum = true, needLUT = true, envFull = 2;

  function writeSimStatic() {
    for (let c = 0; c < C; c++) {
      const L = CASC_L[c];
      simF[c] = L;
      simF[8 + c] = c === 0 ? Math.PI / L : (2 * Math.PI * 6) / L;            // kMin
      simF[16 + c] = c < C - 1 ? (2 * Math.PI * 6) / CASC_L[c + 1] : (Math.PI * N / L) * 0.98; // kMax
    }
    for (let c = 1; c < C; c++) simF[8 + c] = simF[16 + c - 1];
    simF[40] = P.windSpeed; simF[41] = P.windDir * D2R; simF[42] = P.fetchKm * 1000; simF[43] = 3.3;
    const ks = 2 * Math.PI / P.swellLength;
    simF[44] = P.swellHs; simF[45] = P.swellDir * D2R; simF[46] = Math.sqrt(9.81 * ks); simF[47] = P.swellSpread;
    simF[48] = P.choppy; simF[49] = 0.0012; simF[50] = LOOP; simF[51] = P.seed;
    simF[54] = 2.2; simF[55] = 1.0;
  }

  // --------------------------------------------------------------------------------------
  // Camera & input
  // --------------------------------------------------------------------------------------
  const cam = { x: 0, y: 2.4, z: 0, yaw: 0, pitch: -5.5 * D2R, fovY: P.fov * D2R, speed: P.cameraSpeed };
  Object.assign(cam,validCamera(runtime.camera,cam));
  let origin=[0,0],originDelta=[0,0];
  function updateOrigin(){
    const next=localOrigin(cam.x,cam.z);
    originDelta=[next[0]-origin[0],next[1]-origin[1]];
    if(originDelta[0]!==0||originDelta[1]!==0){
      for(let l=0;l<2;l++){
        const texel=FOAM_LEVEL_SIZE[l]/FOAM_RES;
        foamSnap[l*2]-=originDelta[0]/texel;
        foamSnap[l*2+1]-=originDelta[1]/texel;
      }
      origin=next;
    }
  }
  const keys = Object.create(null);
  addEventListener('keydown', (e) => { if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return; keys[e.code] = true; if(e.code==='Space')e.preventDefault(); });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  canvas.addEventListener('dblclick', () => { if (document.pointerLockElement !== canvas) canvas.requestPointerLock().catch(()=>{}); });
  let dragging = false;
  canvas.addEventListener('mousedown', (e) => { if (e.button === 0 || e.button === 2) dragging = true; });
  addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas || dragging) {
      cam.yaw += e.movementX * 0.0022;
      cam.pitch = Math.max(-1.5, Math.min(1.5, cam.pitch - e.movementY * 0.0022));
    }
  });
  canvas.addEventListener('wheel', (e) => {
    cam.speed = Math.max(0.5, Math.min(400, cam.speed * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    P.cameraSpeed = cam.speed;
    ui.sync();
  }, { passive: true });

  const velocity={x:0,y:0,z:0};
  function updateCamera(dt) {
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    let mx = 0, my = 0, mz = 0;
    const fwd = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    const str = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    const up = (keys.KeyE || keys.Space ? 1 : 0) - (keys.KeyQ || keys.KeyC ? 1 : 0);
    mx += fwd * cp * sy + str * cy;
    my += fwd * sp + up;
    mz += -fwd * cp * cy + str * sy;
    const boost = keys.ShiftLeft || keys.ShiftRight ? 5 : 1;
    const v = cam.speed * boost * dt;
    const smooth=1-Math.exp(-dt*12);
    velocity.x+=(mx*cam.speed*boost-velocity.x)*smooth;velocity.y+=(my*cam.speed*boost-velocity.y)*smooth;velocity.z+=(mz*cam.speed*boost-velocity.z)*smooth;
    cam.x+=velocity.x*dt;cam.y+=velocity.y*dt;cam.z+=velocity.z*dt;
    cam.y = Math.max(-200, Math.min(10000, cam.y));
    // keep clear of the actual (displaced) water surface under the camera
    if (P.cameraMode === 'surface' && cam.y < waterH + 0.25) cam.y = waterH + 0.25;
  }

  // --------------------------------------------------------------------------------------
  // CDLOD node selection (CPU, allocation free)
  // --------------------------------------------------------------------------------------
  const ranges = new Float64Array(LODS);
  for (let l = 0; l < LODS; l++) ranges[l] = R0 * Math.pow(2, l);
  const planes = new Float64Array(16);
  const HB = 40.0;  // conservative bound for supported storm controls
  const XB = 40.0;
  let nodeCount = 0, ccx = 0, ccy = 0, ccz = 0;

  function sphereHit(x0, z0, size, r) {
    const dx = Math.max(x0 - ccx, 0, ccx - (x0 + size));
    const dz = Math.max(z0 - ccz, 0, ccz - (z0 + size));
    const dy = Math.max(-HB - ccy, 0, ccy - HB);
    return dx * dx + dy * dy + dz * dz <= r * r;
  }
  function inFrustum(x0, z0, size) {
    const minx = x0 - XB - ccx, maxx = x0 + size + XB - ccx;
    const minz = z0 - XB - ccz, maxz = z0 + size + XB - ccz;
    const miny = -HB - ccy, maxy = HB - ccy;
    for (let p = 0; p < 16; p += 4) {
      const a = planes[p], b = planes[p + 1], c = planes[p + 2], d = planes[p + 3];
      const px = a > 0 ? maxx : minx, py = b > 0 ? maxy : miny, pz = c > 0 ? maxz : minz;
      if (a * px + b * py + c * pz + d < 0) return false;
    }
    return true;
  }
  function addNode(x0, z0, size, lod) {
    if (nodeCount >= MAX_NODES) return;
    const o = nodeCount * 4;
    instData[o] = x0-origin[0]; instData[o + 1] = z0-origin[1]; instData[o + 2] = size; instData[o + 3] = lod;
    nodeCount++;
  }
  function selectNode(x0, z0, size, lod) {
    if (!sphereHit(x0, z0, size, ranges[lod])) return false;
    if (!sphereHit(x0, z0, size, MAX_DIST) || !inFrustum(x0, z0, size)) return true;
    if (lod === 0 || !sphereHit(x0, z0, size, ranges[lod - 1])) { addNode(x0, z0, size, lod); return true; }
    const h = size * 0.5;
    for (let i = 0; i < 4; i++) {
      const nx = x0 + (i & 1) * h, nz = z0 + (i >> 1) * h;
      if (!selectNode(nx, nz, h, lod - 1)) {
        if (sphereHit(nx, nz, h, MAX_DIST) && inFrustum(nx, nz, h)) addNode(nx, nz, h, lod - 1);
      }
    }
    return true;
  }
  function selectAll() {
    nodeCount = 0;
    ccx = cam.x; ccy = cam.y; ccz = cam.z;
    // side planes from the camera-relative view-projection (rows 3Â±0, 3Â±1)
    const m = viewProj;
    for (let i = 0; i < 4; i++) {
      const r = i >> 1, s = (i & 1) ? -1 : 1;
      planes[i * 4] = m[3] + s * m[r];
      planes[i * 4 + 1] = m[7] + s * m[4 + r];
      planes[i * 4 + 2] = m[11] + s * m[8 + r];
      planes[i * 4 + 3] = m[15] + s * m[12 + r];
    }
    const top = LODS - 1;
    const ts = LEAF * Math.pow(2, top);
    const x0 = Math.floor((ccx - MAX_DIST) / ts), x1 = Math.floor((ccx + MAX_DIST) / ts);
    const z0 = Math.floor((ccz - MAX_DIST) / ts), z1 = Math.floor((ccz + MAX_DIST) / ts);
    for (let zi = z0; zi <= z1; zi++) {
      for (let xi = x0; xi <= x1; xi++) selectNode(xi * ts, zi * ts, ts, top);
    }
  }

  // --------------------------------------------------------------------------------------
  // Per-frame uniforms
  // --------------------------------------------------------------------------------------
  let simTime = environment.clocks.wave;
  let frameIndex = 0;
  let phaseEpoch = -Infinity;
  function resetPhases(time) {
    for(let c=0;c<C;c++)for(let y=0;y<N;y++)for(let x=0;x<N;x++) {
      const k=Math.hypot(x>=N/2?x-N:x,y>=N/2?y-N:y)*2*Math.PI/CASC_L[c];
      const angle=(omega(k)*time)%(2*Math.PI),i=((c*N+y)*N+x)*2;
      phaseData[i]=Math.cos(angle);phaseData[i+1]=Math.sin(angle);
    }
    device.queue.writeBuffer(phaseBuf,0,phaseData);phaseEpoch=time;
  }

  function writeFrame(time) {
    const aspect = W / H;
    const tanY = Math.tan(cam.fovY * 0.5), tanX = tanY * aspect;
    const near = 0.05;
    proj.fill(0);
    proj[0] = 1 / tanX; proj[5] = 1 / tanY; proj[11] = -1; proj[14] = near;
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const fx = cp * sy, fy = sp, fz = -cp * cy;            // forward
    const rx = cy, ry = 0, rz = sy;                          // right
    const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx; // up = right x fwd
    view.fill(0);
    view[0] = rx; view[4] = ry; view[8] = rz;
    view[1] = ux; view[5] = uy; view[9] = uz;
    view[2] = -fx; view[6] = -fy; view[10] = -fz;
    view[15] = 1;
    mat4Mul(viewProj, proj, view);
    const f = frameF;
    f.set(viewProj, 0);
    f[16] = cam.x-origin[0]; f[17] = cam.y; f[18] = cam.z-origin[1]; f[19] = time;
    f[20] = rx * tanX; f[21] = ry * tanX; f[22] = rz * tanX; f[23] = 0;
    f[24] = ux * tanY; f[25] = uy * tanY; f[26] = uz * tanY; f[27] = 0;
    f[28] = fx; f[29] = fy; f[30] = fz; f[31] = 0;
    const se = P.sunElev * D2R, sa = P.sunAzim * D2R;
    f[32] = Math.sin(sa) * Math.cos(se); f[33] = Math.sin(se); f[34] = -Math.cos(sa) * Math.cos(se); f[35] = 14.0;
    f[36] = W; f[37] = H; f[38] = 1 / W; f[39] = 1 / H;
    for (let c = 0; c < C; c++) { f[40 + c] = CASC_L[c]; f[48 + c] = 1 / CASC_L[c]; }
    const weather=sampleEnvironment(environment,cam.x,cam.z);
    f[56] = Math.cos(weather.windDir * D2R); f[57] = Math.sin(weather.windDir * D2R); f[58] = weather.windSpeed*weather.gust;
    f[64] = R0; f[65] = GRID; f[66] = FOAM_LEVEL_SIZE[0]; f[67] = FOAM_LEVEL_SIZE[1];
    f[68] = P.exposure; f[69] = P.bloom; f[70] = frameIndex; f[71] = P.debug || DBG;
    f[72] = weather.haze; f[73] = Math.max(cam.y, 10) * 0.001; f[74] = weather.veil; f[75] = 0.9;
    // Three-band absorption/backscatter proxies and declared unresolved slope variance.
    const absorption=[0.340+0.015*P.turbidity,0.0565+0.025*P.turbidity,0.00922+0.065*P.turbidity];
    const backscatter=[0.0007+0.006*P.turbidity,0.001+0.008*P.turbidity,0.0015+0.010*P.turbidity];
    for(let i=0;i<3;i++) {f[76+i]=0.33*backscatter[i]/(absorption[i]+backscatter[i]);f[96+i]=absorption[i];f[100+i]=backscatter[i];}
    f[79] = 0.00005; // declared residual molecular-scale floor, not a Cox-Munk target
    const surfaceDrift=0.03*P.windSpeed;
    f[80]=Math.cos(P.windDir*D2R)*surfaceDrift+Math.cos(P.currentDir*D2R)*P.currentSpeed;
    f[81]=Math.sin(P.windDir*D2R)*surfaceDrift+Math.sin(P.currentDir*D2R)*P.currentSpeed;
    f[82]=0;f[83]=2.6;
    f[84] = 0.43; f[85] = 2.5; f[86] = P.foam; f[87] = 1.0;
    f[88] = (5.802e-3 + 4.40e-3 * P.haze) * 1e-3;
    f[89] = (13.558e-3 + 4.40e-3 * P.haze) * 1e-3;
    f[90] = (33.1e-3 + 4.40e-3 * P.haze) * 1e-3;
    f[91] = 1.5e-5+P.rain*0.00035;
    f[92] = 1.1; f[93] = P.clouds; f[94] = 2.2; f[95] = time;
    f[99]=waterH;f[103]=Math.min(0.05,nowDT);
    const astro=celestial(new Date(environment.utcEpoch+environment.clocks.astronomy*1000),P.latitude,P.longitude);
    f.set(astro.moon,104);f[107]=astro.phase;f.set(astro.sun,108);f[111]=0;
    if(P.astronomy) {
      f.set(astro.sun,32);
      const night=1-Math.max(0,Math.min(1,(astro.sunElevation+7)/7));f[111]=night;
    } else { f.set(f.subarray(32,35),108);f[111]=1-Math.max(0,Math.min(1,(P.sunElev+7)/7)); }
    // Preserve direct solar radiance in binary16 without sacrificing night precision.
    const solarElevation=Math.asin(f[33])/D2R;
    const lunar=lunarLight(Array.from(f.subarray(32,35)),astro.moon,astro.moonDistanceKm);
    f[120]=P.astronomy?lunar.irradiance:0;f[121]=lunar.radius;f[122]=lunar.phase;f[123]=twilightExposure(solarElevation);
    f[60]=1+31*Math.max(0,Math.min(1,(solarElevation+10)/10));
    f[61] = P.choppy;
    f[112]=weather.rain;f[113]=P.spray;f[114]=P.cloudType;f[115]=Math.max(environment.weather.cloudDepth,environment.front.enabled?3.5:0);
    f[116]=Q.cloudSteps;f[117]=Q.cloudLightSteps;f[118]=P.cameraMode==='surface'?0:1;f[119]=astro.sidereal%(2*Math.PI);
    f.set([origin[0]*.001,origin[1]*.001,...originDelta],124);
    cascadeOrigin(origin,f,128);
    foamPatternOrigin(origin,[f[56],f[57]],time,[f[80],f[81]],f,140);
    environmentUniforms(environment,cam,f);
    device.queue.writeBuffer(frameUBO, 0, f);
  }

  // --------------------------------------------------------------------------------------
  // Interface communicates through validated commands; no GPU resources escape this module.
  let captureRequested=false,recorder=null,movieStart=0,movieChunks=[];
  function applyConfig(config){Object.assign(P,sanitize(config,P));environment=createEnvironment(P,simTime);needSpectrum=true;needLUT=true;envFull=1;cam.speed=P.cameraSpeed;cam.fovY=P.fov*D2R;}
  const ui=setupUI(P,cam,{
    adapter:adapterInfo,time:()=>simTime,snapshot:()=>environmentSnapshot(environment),
    change(key,value){
      const next=sanitize({[key]:value},P);
      if(SEA_KEYS.includes(key)||WEATHER_KEYS.includes(key)||key.startsWith('front')||key==='electrified'){
        commandEnvironment(environment,{[key]:next[key]},{instant:P.environmentMode==='instant'});
        if(key.startsWith('front')||key==='electrified'||key==='cloudType')P[key]=next[key];
      } else {P[key]=next[key];if(key==='seed'||key==='swellSpread')needSpectrum=true;}
      if(key==='environmentMode')environment.mode=P.environmentMode;
      if(key==='seed'){environment.seed=P.seed;environment.front.id=P.seed;}
      if(['date','hour'].includes(key)){environment.utcEpoch=Date.parse(P.date+'T00:00:00Z')+P.hour*3600000;environment.clocks.astronomy=0;}
      if(key==='cameraMode'&&value==='underwater'){cam.y=waterH-3;cam.pitch=0.3;}
      if(key==='cameraSpeed')cam.speed=P.cameraSpeed;
      if(key==='fov')cam.fovY=P.fov*D2R;
      if(P.environmentMode==='instant')envFull=1;
    },
    preset(name){
      if(P.environmentMode==='natural')commandEnvironment(environment,Object.fromEntries(WEATHER_KEYS.map(k=>[k,preset(name)[k]])),{weatherOnly:true});
      else {const quality=P.quality,resolution=P.resolution;applyConfig({...preset(name),quality,resolution,environmentMode:'instant'});}
    },
    developed(){commandEnvironment(environment,{}, {instant:true});Object.assign(P,environment.sea);needSpectrum=true;},
    quality(value){const url=toURL({...P,quality:value,resolution:QUALITY[value].scale},cam,simTime,location.href,environmentSnapshot(environment));location.href=url;},
    capture(){captureRequested=true;},
    record(){if(recorder?.state==='recording'){recorder.stop();return;}startRecording(false);},
    restore(state){
      const config=sanitize(state.settings);const restoredCamera=validCamera(state.camera,cam);
      const restoredTime=Number.isFinite(Number(state.time))?Math.max(0,Math.min(864000,Number(state.time))):0;
      const restoredEnvironment=state.environment?restoreEnvironment(state.environment,config):createEnvironment(config,restoredTime);
      if(config.quality!==P.quality){location.href=toURL(config,restoredCamera,restoredTime,location.href,restoredEnvironment);return;}
      applyConfig(config);if(state.camera)for(const k of ['x','y','z','yaw','pitch','speed','fovY'])if(Number.isFinite(state.camera[k]))cam[k]=state.camera[k];
      cam.y=Math.max(-200,Math.min(10000,cam.y));cam.pitch=Math.max(-1.5,Math.min(1.5,cam.pitch));
      Object.assign(cam,restoredCamera);environment=restoredEnvironment;simTime=environment.clocks.wave;resetPhases(simTime);foamFirst=true;
    },
    altitude(y){P.cameraMode='free';cam.y=y;cam.pitch=(y>40?-12:-5.5)*D2R;},
    resetCamera(){Object.assign(cam,{x:0,y:2.4,z:0,yaw:0,pitch:-5.5*D2R});P.cameraMode='surface';}
  });
  const hudFps=document.getElementById('fps');
  function startRecording(evidence){
    if(!globalThis.MediaRecorder){ui.toast('MediaRecorder is unavailable in this browser');return;}
    const stream=canvas.captureStream(30);
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:16000000});movieChunks=[];movieStart=performance.now();
    recorder.ondataavailable=e=>{if(e.data.size)movieChunks.push(e.data);};
    recorder.onstop=async()=>{const blob=new Blob(movieChunks,{type:mime});stream.getTracks().forEach(t=>t.stop());document.getElementById('record').textContent='Record';
      if(evidence){const stage=encodeURIComponent(qs.get('stage')||'v03-local');await postEvidence('/__evidence?stage='+stage+'&name='+qs.get('video')+'.webm',blob);await postEvidence('/__evidence?stage='+stage+'&name='+qs.get('video')+'.json',JSON.stringify(evidenceReport(),null,2));document.title='VIDEO DONE';stopped=true;parent.postMessage({type:'pelagic-video'},location.origin);}
      else download(blob,'pelagic-'+Date.now()+'.webm');
    };
    recorder.start(1000);document.getElementById('record').textContent='Stop recording';ui.toast('Recording the rendered canvas');
  }

  // --------------------------------------------------------------------------------------

  // Frame
  // --------------------------------------------------------------------------------------
  const submitList = [null];
  const shotName = qs.get('shot');
  const shotFrames = runtime.frames;
  const shotSeq = runtime.sequence;
  let shotIdx = 0;
  const fixedDt = shotName ? 1 / 60 : 0;
  let last = performance.now();
  let fpsAcc = 0, fpsN = 0, fpsT = 0;
  let shooting = false;
  let nowDT=1/60;

  function encodeSim(cp) {
    cp.setPipeline(evolvePipe);
    cp.setBindGroup(0, bgEvolve);
    cp.dispatchWorkgroups(N / 16, N / 16, C);
    cp.setPipeline(rowsPipe);
    cp.setBindGroup(0, bgRows);
    cp.dispatchWorkgroups(N, 1, C);
    cp.setPipeline(colsPipe);
    cp.setBindGroup(0, bgCols);
    cp.dispatchWorkgroups(N, 1, C);
    cp.setPipeline(simMipPipe);
    for (let m = 1; m < SIM_MIP_COUNT; m++) {
      const s = N >> m;
      cp.setBindGroup(0, bgSimMips[m - 1]);
      cp.dispatchWorkgroups(Math.ceil(s / 8), Math.ceil(s / 8), C);
    }
    // foam clipmaps
    foamCur = 1 - foamCur;
    cp.setPipeline(foamUpdPipe);
    cp.setBindGroup(0, bgFoamUpd[foamCur]);
    cp.dispatchWorkgroups(FOAM_RES / 8, FOAM_RES / 8, 2);
    cp.setPipeline(arr16MipPipe);
    const fm = bgFoamMips[foamCur];
    for (let m = 1; m < FOAMW_MIPS; m++) {
      const s = Math.max(1, FOAM_RES >> m);
      cp.setBindGroup(0, fm[m - 1]);
      cp.dispatchWorkgroups(Math.ceil(s / 8), Math.ceil(s / 8), 2);
    }
  }

  function writeFoamUniforms(dt) {
    for (let l = 0; l < 2; l++) {
      const ts = FOAM_LEVEL_SIZE[l] / FOAM_RES;
      const cx = Math.floor((cam.x-origin[0]) / ts), cz = Math.floor((cam.z-origin[1]) / ts);
      foamUI[l * 4] = cx; foamUI[l * 4 + 1] = cz;
      // first frame: pretend the previous window was far away so everything is reset
      foamUI[l * 4 + 2] = foamFirst ? cx + 100000 : foamSnap[l * 2];
      foamUI[l * 4 + 3] = foamFirst ? cz + 100000 : foamSnap[l * 2 + 1];
      foamSnap[l * 2] = cx; foamSnap[l * 2 + 1] = cz;
      foamUF[8 + l] = ts;
    }
    foamFirst = false;
    foamUF[10] = dt; foamUF[11] = 0.22;          // decay 1/s
    foamUF[12] = 0.65+0.009*Math.min(P.windSpeed,25); foamUF[13] = 3.0; foamUF[14] = 5.0; foamUF[15] = Math.min(P.foam,1);
    for (let c = 0; c < C; c++) { foamUF[16 + c] = CASC_L[c]; foamUF[24 + c] = 1 / CASC_L[c]; }
    const drift = 0.03 * P.windSpeed;
    foamUF[32] = Math.cos(P.windDir * D2R) * drift + Math.cos(P.currentDir*D2R)*P.currentSpeed;
    foamUF[33] = Math.sin(P.windDir * D2R) * drift + Math.sin(P.currentDir*D2R)*P.currentSpeed;
    foamUF[34] = P.choppy;
    cascadeOrigin(origin,foamUF,36);
    device.queue.writeBuffer(foamUBO, 0, foamUArr);
  }

  let benchmarkStart=null,benchmarkStopReason=null;
  let lutHaze=P.haze,lastSeaSignature='',motionStep=-1;
  function phase1Motion(now){
    if(recorder?.state!=='recording')return;
    const elapsed=(now-movieStart)/1000,kind=qs.get('motion');
    if(kind==='environment'||kind==='preview'){
      const step=Math.min(4,Math.floor(elapsed/4));
      if(step!==motionStep){
        motionStep=step;
        const stages=[{clouds:0,cloudType:0,rain:0,haze:1.4,windSpeed:8,cloudDepth:1.5},
          {clouds:.5,cloudType:0,rain:0,haze:1.4,windSpeed:9,cloudDepth:1.5},
          {clouds:.95,cloudType:1,rain:.3,haze:3,windSpeed:12,cloudDepth:1.8},
          {clouds:.98,cloudType:2,rain:.8,haze:7,windSpeed:22,cloudDepth:3.5},
          {clouds:.15,cloudType:0,rain:0,haze:1.4,windSpeed:7,cloudDepth:1.5}];
        commandEnvironment(environment,stages[step],{instant:kind==='preview',weatherOnly:true});
        if(kind==='preview')envFull=1;
      }
      P.weatherRate=600;P.seaRate=1;
    }
    if(kind==='front'){
      if(motionStep<0){commandEnvironment(environment,{frontEnabled:true,frontX:15000,frontZ:0,frontWidth:20,frontSpeed:12,frontHeading:180,electrified:false});motionStep=0;}
      P.weatherRate=30;P.seaRate=1;cam.x=-10000+elapsed*1250;cam.y=50;cam.pitch=-8*D2R;
    }
  }
  function frame(now) {
    if(benchmarkStart===null)benchmarkStart=now;
    if (shooting || stopped) return;
    const cpuStart=performance.now();
    resize();
    const realDt=Math.max(0,(now-last)/1000);
    frameMs=realDt*1000;
    let dt = Math.min(0.1, realDt);
    // Reproducible recording pre-roll; subsequent motion retains actual elapsed time.
    if(qs.get('ma')==='1'&&qs.has('video')&&frameIndex<=20)dt=frameIndex===20?0:1/60;
    last = now;
    fpsAcc += realDt; fpsN++; fpsT += realDt;
    if (fpsT > 0.5) {
      const fps = fpsN / fpsAcc;
      hudFps.textContent = `${fps.toFixed(0)} fps  ${(1000 / fps).toFixed(2)} ms` +
        (hasTS ? `  |  GPU ${gpuMs.toFixed(2)} ms` : '') + `  |  ${nodeCount} nodes  ${W}x${H}`;
      ui.update(hudFps.textContent);
      fpsAcc = 0; fpsN = 0; fpsT = 0;
    }
    if(qs.get('ma')!=='1')updateCamera(dt);
    if(qs.has('video') && frameIndex===20)startRecording(true);
    if(qs.has('video') && recorder?.state==='recording' && now-movieStart>Math.max(10,Math.min(30,Number(qs.get('duration'))||20))*1000)recorder.stop();
    if(qs.get('motion')==='fly'){cam.x+=dt*2.0;cam.y=2.4+Math.sin(simTime*0.2)*0.6;cam.yaw+=dt*0.035;}
    if(qs.get('motion')==='waterline'){P.cameraMode='free';cam.y=1.2+Math.sin((performance.now()-movieStart)*0.0007)*4.0;cam.pitch=0.2;}
    if(qs.get('motion')==='skim'){P.cameraMode='free';cam.y=waterH+Math.sin((performance.now()-movieStart)*0.0008)*0.035;cam.pitch=0.02;}
    if(qs.get('motion')==='slowwaterline' && recorder?.state==='recording'){
      P.cameraMode='free';cam.y=waterH+((performance.now()-movieStart)/1000-5.0)*0.012;cam.pitch=0.02;
    }
    if(qs.get('motion')==='rebase' && recorder?.state==='recording'){
      cam.x=505+(now-movieStart)*.002;cam.y=3;P.cameraMode='free';
    }
    if(qs.get('motion')==='celestial' && recorder?.state==='recording'){
      P.astronomy=true;P.astronomyRate=2160;
    }
    if(qs.get('motion')==='ma-pan' && recorder?.state==='recording'){
      const u=Math.max(0,Math.min(1,((now-movieStart)/1000-8)/12));
      cam.yaw=(4+75*u*u*(3-2*u))*D2R;
    }
    if (fixedDt) dt = fixedDt;
    phase1Motion(now);
    advanceEnvironment(environment,dt,P,cam.x,cam.z);
    const local=sampleEnvironment(environment,cam.x,cam.z);
    Object.assign(P,environment.sea,{clouds:local.clouds,cloudDepth:local.cloudDepth,rain:local.rain,haze:local.haze,veil:local.veil});
    if(frameIndex%4===0){const signature=SEA_KEYS.map(k=>P[k].toFixed(7)).join(',');if(signature!==lastSeaSignature){needSpectrum=true;lastSeaSignature=signature;}}
    if(Math.abs(P.haze-lutHaze)>.005){needLUT=true;lutHaze=P.haze;}
    dt = P.paused ? 0 : Math.min(dt*P.timeScale,0.1);
    nowDT=dt;
    if(simTime-phaseEpoch>120) resetPhases(simTime);
    simTime = environment.clocks.wave;
    frameIndex++;
    if(P.adaptive && !qs.has('w') && frameIndex%120===0 && gpuMs>0) {
      const target=P.quality==='Balanced'?16.67:33.33;
      const next=P.resolution*Math.sqrt(target/Math.max(gpuMs,1));
      P.resolution=Math.max(0.65,Math.min(Q.scale,P.resolution*0.8+next*0.2));
    }

    updateOrigin();
    writeFrame(simTime);
    writeSimStatic();
    if(needSpectrum){simF[24]=swellAlpha(P.swellHs,simF[46]);simF[25]=cosSpreadNorm(P.swellSpread);}
    simF[52] = simTime; simF[53] = dt;
    device.queue.writeBuffer(simUBO, 0, simF);
    writeFoamUniforms(dt);
    selectAll();
    if (nodeCount) {
      const instances=nearFirst?orderOceanNodes(instData,orderedInstances,nodeOrder,nodeDistances,nodeCount,cam.x-origin[0],cam.z-origin[1]):instData;
      device.queue.writeBuffer(instBuf, 0, instances, 0, nodeCount * 4);
    }

    const enc = device.createCommandEncoder();
    let cp = enc.beginComputePass(computeDesc);
    if (needSpectrum) {
      cp.setPipeline(initPipe);
      cp.setBindGroup(0, bgInit);
      cp.dispatchWorkgroups(N / 16, N / 16, C);
      needSpectrum = false;
    }
    if (needLUT) {
      atmoF[0] = P.haze;
      device.queue.writeBuffer(atmoUBO, 0, atmoF);
      cp.setPipeline(transPipe);
      cp.setBindGroup(0, bgTrans);
      cp.dispatchWorkgroups(256 / 8, 64 / 8);
      cp.setPipeline(msPipe);
      cp.setBindGroup(0, bgMS);
      cp.dispatchWorkgroups(32 / 8, 32 / 8);
      needLUT = false;
    }
    encodeSim(cp);
    cp.setPipeline(probePipe);
    cp.setBindGroup(0, bgProbe);
    cp.dispatchWorkgroups(1);
    cp.setPipeline(lensPipe);cp.setBindGroup(0,bgLens);cp.dispatchWorkgroups(16,9);
    cp.setPipeline(waveHeightPipe);cp.setBindGroup(0,bgWaveHeight);cp.dispatchWorkgroups(WAVE_MAP_SIZE/8,WAVE_MAP_SIZE/8,2);
    cp.setPipeline(heightMaxPipe);
    for(let m=1;m<WAVE_HEIGHT_MIPS;m++){
      cp.setBindGroup(0,bgHeightMax[m-1]);cp.dispatchWorkgroups(Math.ceil((WAVE_MAP_SIZE>>m)/8),Math.ceil((WAVE_MAP_SIZE>>m)/8),2);
    }
    cp.setPipeline(waveShadowPipe);cp.setBindGroup(0,bgWaveShadow);cp.dispatchWorkgroups(WAVE_MAP_SIZE/8,WAVE_MAP_SIZE/8,2);
    cp.end();
    cp=enc.beginComputePass({timestampWrites:hasTS?{querySet:tsQuery,beginningOfPassWriteIndex:2,...(phase0Profile?{endOfPassWriteIndex:8}:{})}:undefined});
    cp.setPipeline(skyViewPipe);
    cp.setBindGroup(0, bgSkyView);
    cp.dispatchWorkgroups(Math.ceil(SKY_W / 8), Math.ceil(SKY_H / 8),2);
    if(phase0Profile){cp.end();cp=enc.beginComputePass({timestampWrites:hasTS?{querySet:tsQuery,beginningOfPassWriteIndex:9,endOfPassWriteIndex:10}:undefined});}
    cp.setPipeline(cloudPipe);
    cp.setBindGroup(0,bgCloud);
    cp.dispatchWorkgroups(Math.ceil(cloudW/8),Math.ceil(cloudH/8));
    if(phase0Profile){cp.end();cp=enc.beginComputePass({timestampWrites:hasTS?{querySet:tsQuery,beginningOfPassWriteIndex:11,endOfPassWriteIndex:12}:undefined});}
    cp.setPipeline(shadowPipe);
    cp.setBindGroup(0,bgShadow);
    cp.dispatchWorkgroups(32,32);
    if(P.spray>0 || P.rain>0 || originDelta.some(x=>x!==0)){cp.setPipeline(particleCompute);cp.setBindGroup(0,particleBG[foamCur]);cp.dispatchWorkgroups(PARTICLE_COUNT/64);}
    cp.end();
    const fullCache=envFull>0;
    if(fullCache)cacheFace=0;
    if(cacheFace===0){
      cacheF.set(frameF);
      cachePending={version:++cacheVersion,frame:frameIndex,weather:environment.clocks.weather,astronomy:environment.clocks.astronomy,
        commandRevision:environment.revision,camera:[cam.x,cam.y,cam.z],origin:[...origin]};
      enc.copyTextureToTexture({texture:transLUT},{texture:envTrans},[256,64]);
      enc.copyTextureToTexture({texture:skyLUT},{texture:envSky},[SKY_W,SKY_H,2]);
    }
    cacheF[70]=cacheFace;device.queue.writeBuffer(envFrame,0,cacheF);
    cp=enc.beginComputePass({timestampWrites:hasTS&&phase0Profile?{querySet:tsQuery,beginningOfPassWriteIndex:13,endOfPassWriteIndex:14}:undefined});
    cp.setPipeline(envPipe);
    cp.setBindGroup(0, bgEnv);
    cp.dispatchWorkgroups(ENV_SIZE / 8, ENV_SIZE / 8, fullCache ? 6 : 1);
    const publish=fullCache||cacheFace===5;
    if(publish){
      cp.setPipeline(cubeMipPipe);
      for (let m = 1; m < ENV_MIPS; m++) {
      const s = Math.max(1, ENV_SIZE >> m);
      cp.setBindGroup(0, bgCubeMips[m - 1]);
      cp.dispatchWorkgroups(Math.ceil(s / 8), Math.ceil(s / 8), 6);
      }
    }
    cp.end();
    if(publish){
      for(let m=0;m<ENV_MIPS;m++)enc.copyTextureToTexture({texture:envBuild,mipLevel:m},{texture:envTex,mipLevel:m},[Math.max(1,ENV_SIZE>>m),Math.max(1,ENV_SIZE>>m),6]);
      cachePublished={...cachePending,publishedFrame:frameIndex};cacheHistory.push(cachePublished);if(cacheHistory.length>256)cacheHistory.shift();
    }
    cp=enc.beginComputePass({timestampWrites:hasTS?{querySet:tsQuery,...(phase0Profile?{beginningOfPassWriteIndex:15}:{}),endOfPassWriteIndex:3}:undefined});
    if(publish){cp.setPipeline(irradiancePipe);cp.setBindGroup(0,bgIrradiance);cp.dispatchWorkgroups(IRRADIANCE_SIZE/8,IRRADIANCE_SIZE/8,6);}
    cp.end();
    cacheFace=publish?0:cacheFace+1;envFull=0;
    for(let m=0;m<SIM_MIP_COUNT;m++)enc.copyTextureToTexture({texture:dispTex,mipLevel:m},{texture:lastDisp,mipLevel:m},[N>>m,N>>m,C]);

    const rp = enc.beginRenderPass(mainPass);
    if (nodeCount) {
      rp.setPipeline(oceanPipe);
      rp.setBindGroup(0, bgOcean[foamCur]);
      rp.setVertexBuffer(0, instBuf);
      rp.setIndexBuffer(idxBuf, 'uint16');
      rp.drawIndexed(GRID * GRID * 6, nodeCount);
    }
    rp.setPipeline(skyPipe);
    rp.setBindGroup(0, bgSky);
    rp.draw(3);
    rp.end();
    const particles=enc.beginRenderPass(transparentPass);
    if(P.spray>0 || P.rain>0){particles.setPipeline(particlePipe);particles.setBindGroup(0,particleDrawBG);particles.draw(6,PARTICLE_COUNT);}
    particles.end();

    bloomFirstData.set([1/W,1/H,1,frameF[60]]);
    device.queue.writeBuffer(bloomUBOs[0],0,bloomFirstData);
    for (let m = 0; m < BLOOM_LEVELS; m++) {
      downPasses[m].timestampWrites=m===0&&hasTS?{querySet:tsQuery,beginningOfPassWriteIndex:6}:undefined;
      const p = enc.beginRenderPass(downPasses[m]);
      p.setPipeline(downPipe);
      p.setBindGroup(0, downBGs[m]);
      p.draw(3);
      p.end();
    }
    for (let i = 0; i < upPasses.length; i++) {
      const p = enc.beginRenderPass(upPasses[i]);
      p.setPipeline(upPipe);
      p.setBindGroup(0, upBGs[i]);
      p.draw(3);
      p.end();
    }

    compData[0] = P.exposure * frameF[60] * frameF[123]; compData[1] = P.bloom; compData[2] = frameIndex % 64; compData[3] = 0.10;
    compData[4] = 1.0; compData[5] = 1.0; compData[6] = 0; compData[7] = 0;
    device.queue.writeBuffer(compUBO, 0, compData);
    const swapTex = ctx.getCurrentTexture();
    compPass.colorAttachments[0].view = swapTex.createView();
    const pc = enc.beginRenderPass(compPass);
    pc.setPipeline(compPipe);
    pc.setBindGroup(0, bgComp);
    pc.draw(3);
    pc.end();

    let doProbe = false;
    if (qs.get('probeReadback')!=='off' && !probePending && (frameIndex & 7) === 0) {
      enc.copyBufferToBuffer(probeOut, 0, probeRead, 0, 16);
      doProbe = true;
    }
    let doTs = false;
    // Seven is coprime to the six-frame light-cache cycle. Sampling every eight
    // frames missed every irradiance publication and understated its GPU cost.
    if (qs.get('timestampReadback')!=='off' && hasTS && !tsPending && frameIndex % 7 === 0) {
      enc.resolveQuerySet(tsQuery, 0, queryCount, tsResolve, 0);
      enc.copyBufferToBuffer(tsResolve, 0, tsRead, 0, queryCount*8);
      doTs = true;
    }
    let readBuf = null;
    if (captureRequested || (shotName && shotIdx < shotSeq && frameIndex >= shotFrames + shotIdx)) {
      shooting = true;
      const bpr = Math.ceil(W * 4 / 256) * 256;
      readBuf = allocations.buffer({ size: bpr * H, usage: GU.MAP_READ | GU.COPY_DST });
      enc.copyTextureToBuffer({ texture: swapTex }, { buffer: readBuf, bytesPerRow: bpr }, [W, H]);
      saveShot(readBuf, bpr);
    }
    submitList[0] = enc.finish();
    const submitStart=performance.now();device.queue.submit(submitList);const submitEnd=performance.now();
    cpuMs=performance.now()-cpuStart;
    if(frameIndex>30){frameRecords.push({id:frameIndex,raf:now,cpuStart,submitStart,submitEnd,frame:frameMs,cpu:cpuMs,visibility:document.visibilityState,time:simTime,camera:[cam.x,cam.y,cam.z,cam.yaw,cam.pitch],cacheVersion:cachePublished?.version,cacheAgeFrames:frameIndex-(cachePublished?.frame||0),
      weather:{...local,clocks:{...environment.clocks},swellHs:P.swellHs,seaWind:P.windSpeed},probeAgeFrames:frameIndex-probeCompletedFrame,readbackHeight:waterH});if(frameRecords.length>4000)frameRecords.shift();}
    if (doProbe) { probePending = true;probeSubmittedFrame=frameIndex; probeRead.mapAsync(GPUMapMode.READ).then(onProbe, onProbeFail); }
    if (doTs) { timingFrame={id:frameIndex,submitEnd,cpu:cpuMs,frame:frameMs,width:W,height:H};tsPending = true; tsRead.mapAsync(GPUMapMode.READ).then(onTsMapped, onTsFail); }
    if (readBuf) saveShot(readBuf, Math.ceil(W * 4 / 256) * 256, true);
    if(qs.has('benchmark') && (frameIndex>=runtime.frames || now-benchmarkStart>=runtime.benchmarkSeconds*1000)){
      benchmarkStopReason=frameIndex>=runtime.frames?'frame limit':'wall-clock limit';
      stopped=true;device.queue.onSubmittedWorkDone().then(async()=>{
        const report=evidenceReport();
        if(qs.get('validate')==='1'){
          report.hdr=await hdrReadback(device,hdrTex);
          report.foam=await foamReadback(device,foamW[foamCur]);
        }
        await postEvidence('/__evidence?stage='+encodeURIComponent(qs.get('stage')||'v03-local')+'&name='+qs.get('benchmark')+'.json',JSON.stringify(report,null,2));document.title='BENCHMARK DONE';
        if(parent!==window)parent.postMessage({type:'pelagic-benchmark',name:qs.get('benchmark')},location.origin);
      });return;
    }
    if(!shooting) scheduleFrame();
  }
  function scheduleFrame() {
    if(shotName || qs.has('video')) device.queue.onSubmittedWorkDone().then(()=>frame(performance.now()));
    else requestAnimationFrame(frame);
  }

  function evidenceReport(){return {version:qs.get('ma')==='1'?'0.4-milestone-a':'0.4-phase1',sourceStart,sourceCheckpoint:qs.get('revision')||'development',adapter:adapterInfo,backend:'native-webgpu',timestampQuery:hasTS,settings:{...P},camera:{...cam},simulationTime:simTime,frameIndex,width:W,height:H,nodes:nodeCount,errors,measurements,frameRecords,
    allocations:allocations.report(),environment:environmentSnapshot(environment),lightCache:{published:cachePublished,history:cacheHistory,units:'relative scene-linear RGB radiance / irradiance; not absolute SI calibrated',latency:'complete snapshot, six-frame angular build; direct shadow current frame'},browserTasks,
    phase0:{query:Object.fromEntries(qs),profile:phase0Profile,note:'Experimental toggles are Phase 0 hypotheses, not accepted features.'},userAgent:navigator.userAgent,
    foamPatternCalibration,worldOrigin:origin,benchmarkStopReason,benchmarkWallSeconds:benchmarkStart===null?0:(performance.now()-benchmarkStart)/1000,
    surfaceProbe:{height:waterH,scope:'Asynchronous camera-point height; optical classification uses the current GPU near-plane map.'},
    timingMode:qs.has('benchmark')?'requestAnimationFrame, display paced':'queue-completion capture throughput',
    memoryEstimate:{renderTargetsMiB:(W*H*56+(W>>1)*(H>>1)*8*4/3+cloudW*cloudH*8)/1048576,
      note:'Analytic lower bound for main MSAA/depth/HDR/bloom/cloud render targets only. Excludes simulation, driver alignment, browser compositor, and transient resources.'}};}

  async function saveShot(buf, bpr, go) {
    if (!go) return;
    await buf.mapAsync(GPUMapMode.READ);
    const src = new Uint8Array(buf.getMappedRange());
    const img = new ImageData(W, H);
    const bgra = swapFormat === 'bgra8unorm';
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const s = y * bpr + x * 4, d = (y * W + x) * 4;
        img.data[d] = src[s + (bgra ? 2 : 0)];
        img.data[d + 1] = src[s + 1];
        img.data[d + 2] = src[s + (bgra ? 0 : 2)];
        img.data[d + 3] = 255;
      }
    }
    buf.unmap();
    buf.destroy();
    const oc = new OffscreenCanvas(W, H);
    oc.getContext('2d').putImageData(img, 0, 0);
    const blob = await oc.convertToBlob({ type: 'image/png' });
    if(captureRequested){captureRequested=false;download(blob,'pelagic-'+Date.now()+'.png');shooting=false;scheduleFrame();return;}
    const nm = shotSeq > 1 ? shotName.replace('.png', `_${shotIdx}.png`) : shotName;
    const stage=qs.get('stage')||'v03-local';
    await postEvidence('/__shot?stage='+stage+'&name=' + encodeURIComponent(nm),blob);
    const report=evidenceReport();
    if(qs.get('p0Columns')==='1')report.cloudColumns=await phase0CloudColumns(device,frameUBO,cloudNoiseView,cloudSampler,qs);
    if(qs.get('maChecks')==='1')report.cloudChecks=await cloudConvectionChecks(device,frameUBO,cloudNoiseView,cloudSampler);
    if(qs.get('maLightChecks')==='1')report.cloudLightChecks=await cloudLightPathChecks(device,frameUBO,cloudNoiseView,cloudSampler);
    if(qs.get('validate')==='1')report.spectral=await spectralReadback(device,{h0:h0Buf,specA,disp:dispTex,deriv:derivTex,mom:momTex},P);
    if(qs.get('validate')==='1')report.foam=await foamReadback(device,foamW[foamCur]);
    if(qs.get('validate')==='1'){report.hdr=await hdrReadback(device,hdrTex,frameF[60]);report.light=await phase1LightReadback(device,shadowTex,irradianceTex,envTex);}
    if(qs.get('contracts')==='1'){
      report.discreteSpectrum=discreteSpectrumLedger(P);
      report.slopeMipBudget=await slopeMipReadback(device,derivTex,momTex);
    }
    await postEvidence('/__evidence?stage='+stage+'&name='+encodeURIComponent(nm.replace('.png','.json')),JSON.stringify(report,null,2));
    log('shot saved ' + nm + ' gpu ' + gpuMs.toFixed(2) + 'ms nodes ' + nodeCount);
    shotIdx++;
    shooting = false;
    if (shotIdx < shotSeq) { scheduleFrame(); return; }
    if (shotSeq > 1) await fetch('/__shot?name=' + encodeURIComponent(shotName), { method: 'POST', body: blob });
    document.title = 'SHOT DONE';
    if(parent!==window)parent.postMessage({type:'pelagic-capture',name:nm},location.origin);
    if (qs.get('keep') === '1') scheduleFrame();
  }

  resize();
  addEventListener('resize', resize);
  scheduleFrame();
}

main().catch((e) => { const el=document.getElementById('err');el.style.display='block';el.textContent='Native WebGPU initialization failed.\n'+(e.message||e)+'\nUse current Chrome or Edge with hardware acceleration. No WebGL fallback.';log('init failed: ' + (e && e.stack || e)); });
