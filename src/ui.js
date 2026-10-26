import {PRESETS,RANGES,toURL} from './settings.js';
const $=id=>document.getElementById(id);
const descriptions={
  windSpeed:'Mean wind measured 10 m above water. The sea takes time to develop in gradual mode.',
  windDir:'Direction the wind travels towards, measured in the scene horizontal plane.',
  fetchKm:'Distance over which wind builds waves. Longer fetch changes height and peak period.',
  swellHs:'Significant height of the independent incoming swell, not the height of every crest.',
  swellLength:'Longer swell travels faster according to gravity-wave dispersion.',
  choppy:'Horizontal wave deformation. Extreme values can fold the height-field surface.',
  foam:'Whitewater strength. Breaking still requires wave support; zero disables foam emission.',
  spray:'Airborne sea spray and spindrift strength; emission also depends on wind and breaking.',
  seaRate:'Sea response speed relative to the weather clock. Effective acceleration also includes weather time compression.',
  weatherRate:'Advances weather evolution and cloud advection. Does not accelerate the astronomical clock.',
  rain:'Rain potential under sufficiently dense clouds. Clear sky does not produce rain.',
  exposure:'Camera brightness multiplier, combined with twilight adaptation.',
  sunElev:'Manual solar angle above the horizon. Disable astronomical light to edit.',
  sunAzim:'Manual solar direction. Disable astronomical light to edit.',
  frontWidth:'Width of the moving regional weather cell; enabled separately above.',
  frontSpeed:'Travel speed of the regional cell, using the weather clock.',
  timeScale:'Wave playback only. Zero freezes waves while weather may continue.',
  astronomyRate:'Seconds of astronomical time per real second; enable astronomical light first.',
  resolution:'Pixel scale. Adaptive resolution may adjust it while enabled.'
};
const groups=[
 ['Sea state',[
 ['windSpeed','Wind at 10 m','m/s',.1],['windDir','Wind travel direction','deg',1],['fetchKm','Wind fetch','km',1],
 ['swellHs','Swell significant height','m',.05],['swellLength','Swell wavelength','m',1],['swellDir','Swell travel direction','deg',1],
 ['choppy','Crest sharpness','',.01],['foam','Whitewater','',.05],['spray','Spindrift','',.05],
 ['currentSpeed','Surface current','m/s',.01],['currentDir','Current direction','deg',1],['seaRate','Sea development speed','x',1]]],
 ['Water & light',[
 ['turbidity','Particles & dissolved matter','',.01],['sunElev','Sun elevation','deg',.1],['sunAzim','Sun azimuth','deg',1],['exposure','Exposure','x',.01],['bloom','Lens bloom','',.005]]],
 ['Atmosphere',[
 ['clouds','Cloud coverage','',.01],['cloudDepth','Cloud depth','km',.05],['veil','High ice cloud','',.01],['haze','Aerosol density','',.1],['rain','Rainfall','',.01],['weatherRate','Weather time compression','x',1],['frontWidth','Regional front width','km',1],['frontSpeed','Regional front speed','m/s',1]]],
 ['Time & place',[
 ['hour','Time (UTC)','h',.05],['latitude','Latitude','deg',.1],['longitude','Longitude','deg',.1],['timeScale','Wave playback speed','x',.25],['astronomyRate','Astronomical clock speed','x',1]]],
 ['Camera & rendering',[
 ['cameraSpeed','Flight speed','m/s',.1],['fov','Field of view','deg',1],['resolution','Render scale','x',.05]]]
];
export function setupUI(P,cam,api) {
  const controls=new Map();
  const viewOnly=new Set(['cameraMode','cameraSpeed','fov','resolution','debug','adaptive','environmentMode']);
  function change(key,value){api.change(key,value);if(!viewOnly.has(key))setScene(null);}
  for(const [title,items] of groups) {
    const details=document.createElement('details');details.open=title==='Sea state';
    const summary=document.createElement('summary');summary.textContent=title;details.append(summary);
    for(const [key,label,unit,step] of items){
      const row=document.createElement('label');row.className='control';
      const text=document.createElement('span');text.textContent=label;const out=document.createElement('output');
      const input=document.createElement('input');Object.assign(input,{type:'range',min:RANGES[key][0],max:RANGES[key][1],step,id:key,name:key});input.setAttribute('aria-label',label);
      const digits=Math.max(2,String(step).split('.')[1]?.length||0);
      const set=v=>{input.value=v;out.value=Number(v).toLocaleString('en',{maximumFractionDigits:digits})+(unit?' '+unit:'');input.setAttribute('aria-valuetext',out.value);};set(P[key]);
      input.oninput=()=>{set(Number(input.value));change(key,Number(input.value));};
      controls.set(key,set);row.append(text,out,input);
      if(descriptions[key]){const hint=document.createElement('small');hint.id=key+'-hint';hint.className='control-hint';hint.textContent=descriptions[key];input.setAttribute('aria-describedby',hint.id);row.append(hint);}
      details.append(row);
    }$('control-groups').append(details);
  }
  const cloudSelect=document.createElement('select');cloudSelect.id='cloud-type';cloudSelect.setAttribute('aria-label','Cloud formation');
  for(const [value,label]of ['Cumulus','Stratocumulus','Storm towers'].entries()){const option=document.createElement('option');option.value=value;option.textContent=label;cloudSelect.append(option);}
  const cloudLabel=document.createElement('label');cloudLabel.className='control';cloudLabel.textContent='Cloud formation';cloudLabel.append(cloudSelect);$('control-groups').children[2].append(cloudLabel);
  cloudSelect.onchange=()=>change('cloudType',Number(cloudSelect.value));
  const mode=document.createElement('select');mode.setAttribute('aria-label','Parameter changes');
  for(const [value,label]of [['natural','Gradual wind and weather edits'],['instant','Immediate parameter edits']]){const o=document.createElement('option');o.value=value;o.textContent=label;mode.append(o);}
  const modeRow=document.createElement('label');modeRow.className='select-row';modeRow.textContent='Changes';modeRow.append(mode);
  mode.value=P.environmentMode;mode.onchange=()=>api.change('environmentMode',mode.value);$('control-groups').prepend(modeRow);
  const front=document.createElement('label');front.className='check';front.textContent=' Regional weather front';const enabled=document.createElement('input');enabled.type='checkbox';enabled.checked=P.frontEnabled;enabled.setAttribute('aria-label','Regional weather front');enabled.onchange=()=>change('frontEnabled',enabled.checked);front.prepend(enabled);modeRow.after(front);
  const transition=document.createElement('div');transition.className='weather-transition';
  const targetLabel=document.createElement('label');targetLabel.textContent='Next weather';targetLabel.htmlFor='weather-target';
  const target=document.createElement('select');target.id='weather-target';target.setAttribute('aria-label','Next weather');
  const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Choose a target';target.append(placeholder);
  for(const [id,p]of Object.entries(PRESETS)){const option=document.createElement('option');option.value=id;option.textContent=p.label;target.append(option);}
  const evolve=document.createElement('button');evolve.textContent='Evolve weather';evolve.disabled=true;
  target.onchange=()=>{evolve.disabled=!target.value;};
  evolve.onclick=()=>{api.weather(target.value);sync();setScene(null);$('scene-title').textContent='Weather evolving';$('scene-note').textContent='Target: '+PRESETS[target.value].label+'. Sun, swell and time preserved.';};
  const transitionHint=document.createElement('p');transitionHint.className='hint';transitionHint.textContent='Choose a future target, then Evolve. Sun, swell and time stay as set. The regional front is a separate moving weather cell.';
  const conditions=document.createElement('p');conditions.className='conditions';conditions.id='conditions';
  transition.append(targetLabel,target,evolve,transitionHint,conditions);front.before(transition);
  function sync(){
    const state=api.controls(),values=state.values;
    for(const [k,set]of controls)set(values[k]);
    mode.value=P.environmentMode;enabled.checked=P.frontEnabled;cloudSelect.value=values.cloudType;
    $('pause').textContent=P.paused?'Play':'Pause';$('quality').value=P.quality;$('camera-mode').value=P.cameraMode;$('astronomy').checked=P.astronomy;$('adaptive').checked=P.adaptive;$('debug').value=P.debug;
    for(const key of ['date','seed'])if(document.activeElement!==$(key))$(key).value=P[key];
    for(const key of ['sunElev','sunAzim'])$(key).disabled=P.astronomy;
    for(const key of ['hour','latitude','longitude','astronomyRate','date'])$(key).disabled=!P.astronomy;
    const c=state.current,t=state.target;
    conditions.textContent=`Current wind ${c.windSpeed.toFixed(1)} m/s / sea ${c.seaWindSpeed.toFixed(1)} m/s. Target ${t.windSpeed.toFixed(1)} m/s. Clouds ${Math.round(c.clouds*100)}% / target ${Math.round(t.clouds*100)}%.${P.paused?' Evolution paused.':''}`;
  }
  let ordinal=0;
  for(const [id,p]of Object.entries(PRESETS)) {
    const b=document.createElement('button');b.className='scene';b.dataset.preset=id;
    const n=document.createElement('span');n.textContent=++ordinal;b.append(n,({calm:'Calm',midday:'Midday',golden:'Golden hour',storm:'Storm',twilight:'Twilight',moonlit:'Moonlight'})[id]);
    b.title='Preview the full scene immediately';
    b.onclick=()=>{api.preset(id);target.value='';evolve.disabled=true;sync();setScene(id);toast('Full scene applied: '+p.label);};$('scenes').append(b);
  }
  function setScene(id){$('scene-title').textContent=PRESETS[id]?.label||'Your ocean';$('scene-note').textContent=PRESETS[id]?.note||'A sea state of your own';document.querySelectorAll('.scene').forEach(el=>{el.classList.toggle('selected',el.dataset.preset===id);el.setAttribute('aria-pressed',String(el.dataset.preset===id));});}
  const initialQuery=new URLSearchParams(location.search);setScene(initialQuery.has('config')?null:initialQuery.get('preset')||'golden');
  function panelOpen(open){$('panel').classList.toggle('hidden',!open);$('environment').setAttribute('aria-expanded',String(open));if(open){sync();$('close-panel').focus();}else $('environment').focus();}
  $('environment').onclick=()=>panelOpen($('panel').classList.contains('hidden'));
  $('close-panel').onclick=()=>panelOpen(false);
  $('pause').onclick=()=>{P.paused=!P.paused;$('pause').textContent=P.paused?'Play':'Pause';};
  $('hide').onclick=()=>document.body.classList.add('cinema');$('restore-ui').onclick=()=>document.body.classList.remove('cinema');
  $('screenshot').onclick=()=>{api.capture();toast('Capturing full-resolution PNG');};$('record').onclick=()=>api.record();
  $('share').onclick=async()=>{const url=toURL(P,cam,api.time(),location.href,api.snapshot());$('share-url').value=url;$('share-dialog').showModal();try{await navigator.clipboard.writeText(url);toast('Reproducible URL copied');}catch{toast('Copy the URL from this dialog');}};
  const configuration=()=>({settings:P,camera:cam,time:api.time(),environment:api.snapshot()});
  $('save').onclick=()=>{localStorage.setItem('pelagic-config-v1',JSON.stringify(configuration()));toast('Configuration saved on this browser');};
  $('load').onclick=()=>{try{const state=JSON.parse(localStorage.getItem('pelagic-config-v1'));if(!state)throw Error('No saved configuration');api.restore(state);target.value='';evolve.disabled=true;sync();setScene(null);toast('Configuration restored');}catch(e){toast(e.message);}};
  $('export').onclick=()=>download(new Blob([JSON.stringify(configuration(),null,2)],{type:'application/json'}),'pelagic-config.json');
  $('import').onchange=async(e)=>{try{const f=e.target.files[0];if(!f)return;const state=JSON.parse(await f.text());if(!state.settings)throw Error('Missing settings');api.restore(state);target.value='';evolve.disabled=true;sync();setScene(null);toast('Configuration imported');}catch(e){toast('Import failed: '+e.message);}};
  $('quality').onchange=e=>api.quality(e.target.value);$('camera-mode').onchange=e=>api.change('cameraMode',e.target.value);$('debug').onchange=e=>api.change('debug',Number(e.target.value));
  $('astronomy').onchange=e=>{change('astronomy',e.target.checked);sync();};$('adaptive').onchange=e=>api.change('adaptive',e.target.checked);$('date').onchange=e=>change('date',e.target.value);$('seed').onchange=e=>change('seed',Number(e.target.value));
  $('developed').onclick=()=>{api.developed();sync();toast('Current weather and sea targets applied');};$('reset-camera').onclick=()=>{api.resetCamera();sync();};
  document.querySelectorAll('[data-altitude]').forEach(b=>b.onclick=()=>{api.altitude(Number(b.dataset.altitude));sync();});
  $('gpu-tests').onclick=()=>window.open('/tests.html','_blank','noopener');
  addEventListener('keydown',e=>{if(e.code==='Escape'&&!$('panel').classList.contains('hidden')&&!$('share-dialog').open){panelOpen(false);return;}if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.target.closest('input,select,textarea,button,summary,a,[contenteditable="true"],dialog'))return;if(e.code==='KeyH')document.body.classList.toggle('cinema');if(e.code==='KeyP')$('pause').click();if(e.code==='KeyF')panelOpen($('panel').classList.contains('hidden'));});
  sync();if(new URLSearchParams(location.search).get('ui')==='0')document.body.classList.add('cinema');
  return {sync,toast,setScene,update(data){if(!$('panel').classList.contains('hidden'))sync();$('fps').textContent=data;$('altitude').textContent=cam.y.toFixed(1)+' m';$('backend').textContent='WEBGPU / '+api.adapter.vendor.toUpperCase();$('status').textContent=P.paused?'PAUSED':'LIVE';}};
}
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}
export function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
