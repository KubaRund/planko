import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OBB } from 'three/addons/math/OBB.js';
import { SIZE, TABLE, MAX_PLANKS, BRIDGE, createPhysics, createPlank, orientation, bounds, measurements, awaken, shakeGravity, resetGravity, step } from './physics.js';
import { CHALLENGES, challengeById, evaluate } from './challenges.js';

const $=id=>document.getElementById(id), all=s=>[...document.querySelectorAll(s)];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const STORAGE='planko-studio-v2', UNIT=.01, GRID=.039;
const fmt=x=>(Math.round(x*10)/10).toLocaleString('cs-CZ',{maximumFractionDigits:1});
let renderer;
try { renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); }
catch(error) { $('error').hidden=false; $('reload').onclick=()=>location.reload(); throw error; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate=false;
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
const viewport=$('viewport');viewport.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','3D stavební prostor');
const scene=new THREE.Scene(); scene.background=new THREE.Color('#dbe4d7'); scene.fog=new THREE.Fog('#dbe4d7',18,38);
const camera=new THREE.PerspectiveCamera(43,1,.04,100);
const light=new THREE.DirectionalLight('#fff0d5',3.4);light.position.set(-5,11,6);light.castShadow=true;
light.shadow.mapSize.set(1536,1536);Object.assign(light.shadow.camera,{left:-8,right:8,top:10,bottom:-7,near:.5,far:35});light.shadow.normalBias=.012;light.shadow.bias=-.00018;
scene.add(light,new THREE.HemisphereLight('#eef8ff','#7a8268',2.05));const fill=new THREE.DirectionalLight('#e9f0ff',.65);fill.position.set(6,4,-6);scene.add(fill);
const studioGround=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({color:'#d4ded1',roughness:1}));studioGround.rotation.x=-Math.PI/2;studioGround.position.y=-.25;studioGround.receiveShadow=true;scene.add(studioGround);

function woodTexture(){
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,0,128);gradient.addColorStop(0,'#f2d9a9');gradient.addColorStop(.5,'#ead0a0');gradient.addColorStop(1,'#d9b27e');ctx.fillStyle=gradient;ctx.fillRect(0,0,c.width,c.height);
  let seed=519;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  for(let i=0;i<100;i++){const y=random()*128,wave=random()*2+1,phase=random()*8;ctx.strokeStyle=random()>.5?'#8d6132':'#fff0c9';ctx.globalAlpha=.04+random()*.12;ctx.lineWidth=.45+random()*1.2;ctx.beginPath();for(let x=0;x<=512;x+=8){let yy=y+Math.sin(x*.014+phase)*wave+Math.sin(x*.037+phase)*.4;if(!x)ctx.moveTo(x,yy);else ctx.lineTo(x,yy)}ctx.stroke()}
  for(let k=0;k<2;k++){const x=90+random()*330,y=20+random()*90;for(let j=0;j<7;j++){ctx.beginPath();ctx.ellipse(x,y,5+j*3.5,1.2+j*.55,0,0,Math.PI*2);ctx.globalAlpha=.045;ctx.strokeStyle='#88572f';ctx.stroke()}}
  ctx.globalAlpha=1;const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return tex;
}
const grain=woodTexture();
const colorways=['#fff7db','#f5deba','#f9e7cb','#e4c9a5','#fff1d3','#f0dab5'].map(color=>new THREE.MeshStandardMaterial({color,map:grain,roughness:.82,metalness:0}));
const plankGeometry=new RoundedBoxGeometry(SIZE.length,SIZE.thickness,SIZE.width,2,.005);
plankGeometry.computeBoundingBox();
const ghostMat=new THREE.MeshStandardMaterial({color:'#77ad80',transparent:true,opacity:.51,depthWrite:false,roughness:.85});
const ghostMesh=new THREE.Mesh(plankGeometry,ghostMat);ghostMesh.renderOrder=2;
const ghostLine=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(SIZE.length,SIZE.thickness,SIZE.width)),new THREE.LineBasicMaterial({color:'#305f3c',transparent:true,opacity:.9}));ghostLine.renderOrder=3;
const ghost=new THREE.Group();ghost.add(ghostMesh,ghostLine);scene.add(ghost);
const selection=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(SIZE.length+.013,SIZE.thickness+.013,SIZE.width+.013)),new THREE.LineBasicMaterial({color:'#d24c3b',depthTest:false,transparent:true,opacity:.95}));selection.visible=false;selection.renderOrder=5;scene.add(selection);
const marker=new THREE.Mesh(new THREE.RingGeometry(.03,.044,32),new THREE.MeshBasicMaterial({color:'#376448',side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));marker.rotation.x=-Math.PI/2;scene.add(marker);
const supportMeshes=new THREE.Group();scene.add(supportMeshes);
const floorMat=new THREE.MeshStandardMaterial({color:'#c6cbb4',roughness:.92});
const stoneMat=new THREE.MeshStandardMaterial({color:'#a0a7a0',roughness:.92});
const riverMat=new THREE.MeshStandardMaterial({color:'#8ba8a9',roughness:.65});
const table=new THREE.Mesh(new THREE.BoxGeometry(TABLE,.24,TABLE),floorMat);table.position.y=-.12;table.castShadow=true;table.receiveShadow=true;scene.add(table);
const grid=new THREE.GridHelper(TABLE,40,'#73806e','#a3ae98');grid.position.y=.003;grid.material.transparent=true;grid.material.opacity=.34;scene.add(grid);
const ray=new THREE.Raycaster(), pointer=new THREE.Vector2(), tempMat=new THREE.Matrix4(), tempRot=new THREE.Matrix3(), tempQ=new THREE.Quaternion();
const half=new THREE.Vector3(SIZE.length/2-.0018,SIZE.thickness/2-.0018,SIZE.width/2-.0018);
const threeQ=q=>new THREE.Quaternion(q.x,q.y,q.z,q.w), vec=p=>new THREE.Vector3(p.x,p.y,p.z);
const bodyById=id=>planks.find(p=>p.id===id);

let stored={};try{stored=JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch{}
const profiles=stored.profiles&&typeof stored.profiles==='object'?stored.profiles:{};
const achievements=stored.achievements&&typeof stored.achievements==='object'?stored.achievements:{};
let globalBest=+stored.globalBest||0, snap=stored.snap!==false, precision=!!stored.precision, soundOn=stored.sound!==false, vibrationOn=stored.vibration!==false;
let activeId=challengeById(stored.activeId)?stored.activeId:'sandbox';
let challenge=challengeById(activeId), world, statics=[], planks=[], serial=0, mode='build', tool='flat', angle=0, selected=null, aim={x:0,z:0,y:0}, autoStack=null, candidate=null, panCamera=false;
let yaw=.67,pitch=.57,radius=6.1,target=new THREE.Vector3(0,.18,0),dirty=true,shakeStart=null,shakeChecking=false,shakePassed=false,hold=0,wonNow=false,toastTimer,measure={count:0,height:0,span:0,stable:true},lastRecordTime=0;

function setCamera(){camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*radius,target.y+Math.sin(pitch)*radius,target.z+Math.cos(yaw)*Math.cos(pitch)*radius);camera.lookAt(target);camera.updateMatrixWorld();}
function zoom(f){radius=clamp(radius*f,1.25,25);setCamera()}
function fit(){const m=measurements(planks.map(p=>p.body));let center=new THREE.Vector3(0,.17,0),span=0;
  if(planks.length){const box=new THREE.Box3();for(const p of planks){const {lo,hi}=bounds(p.body);box.expandByPoint(vec(lo));box.expandByPoint(vec(hi))}box.getCenter(center);const s=box.getSize(new THREE.Vector3());span=Math.max(s.x,s.z,s.y*1.05);center.y=Math.max(.15,center.y)}target.copy(center);radius=clamp(Math.max(5.6,span/Math.tan(THREE.MathUtils.degToRad(21.5))*1.2),2.6,25);setCamera();dirty=true;
}
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();setCamera()}
new ResizeObserver(resize).observe(viewport);
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2300)}
let audio=null,lastSound=0;
function enableAudio(){if(!soundOn)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume()}catch{}}
function play(freq=165,volume=.045,duration=.065){if(!audio||!soundOn||performance.now()-lastSound<42)return;try{lastSound=performance.now();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.68,audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{}}
function vibrate(ms=10){if(vibrationOn&&navigator.vibrate)navigator.vibrate(ms)}
function setStatus(){
  all('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));
  all('[data-tool]').forEach(b=>{b.classList.toggle('selected',b.dataset.tool===tool);b.disabled=!!challenge?.tools&&!challenge.tools.includes(b.dataset.tool)});
  $('dock').classList.toggle('compact',mode!=='build');$('precisionPad').hidden=mode!=='build'||!precision;
  $('precisionToggle').classList.toggle('active',precision);$('snap').classList.toggle('active',snap);grid.visible=snap;$('angle').textContent=`${angle}°`;
  $('modeName').textContent=challenge?.title||'Sandbox';$('objective').hidden=!challenge;$('objectiveTitle').textContent=challenge?.title||'';
  $('pan').classList.toggle('active',panCamera&&mode==='camera');$('place').classList.toggle('danger',mode==='erase');$('place').classList.toggle('camera',mode==='camera');
  $('placeLabel').textContent=mode==='camera'?'ZPĚT KE STAVĚNÍ':mode==='erase'?'ODEBRAT':'POLOŽIT';$('place').querySelector('i').textContent=mode==='erase'?'−':mode==='camera'?'▱':'＋';
  $('hint').textContent=mode==='camera'?(panCamera?'Táhni pro posun pohledu':'Táhni pro otáčení kamery'):mode==='erase'?'Vyber destičku a potvrď odebrání':'Dotykem posuň náhled';
  $('placementStatus').textContent=mode==='camera'?'Pohyb kamery':mode==='erase'?(selected?'Destička vybrána':'Vyber destičku'):'Náhled připraven';
  ghost.visible=mode==='build';marker.visible=mode==='build';selection.visible=mode==='erase'&&!!selected;
  $('undo').disabled=!planks.length;$('place').disabled=mode==='erase'?!selected:mode==='build'&&(planks.length>=(challenge?.limit||MAX_PLANKS)||!candidate||candidate.blocked);
}

function addBody(data,disturb=false){const id=Number.isInteger(data.id)?data.id:++serial;serial=Math.max(serial,id);const body=createPlank(world,{...data,disturb});const mesh=new THREE.Mesh(plankGeometry,colorways[id%colorways.length]);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.plankId=id;scene.add(mesh);const item={id,tool:data.tool||'flat',yaw:data.yaw||0,body,mesh};planks.push(item);body.addEventListener('collide',e=>{const speed=Math.abs(e.contact?.getImpactVelocityAlongNormal?.()||0);if(speed>.55)play(140+Math.min(120,speed*6),Math.min(.08,.03+speed*.007),.07)});syncMesh(item);renderer.shadowMap.needsUpdate=true;return item}
function syncMesh(p){p.mesh.position.copy(p.body.position);p.mesh.quaternion.copy(p.body.quaternion);p.mesh.updateMatrixWorld();}
function removeItem(item){if(!item)return;world.removeBody(item.body);scene.remove(item.mesh);planks=planks.filter(p=>p!==item);if(selected===item.id)selected=null;if(autoStack===item.id)autoStack=null;awaken(planks.map(p=>p.body));renderer.shadowMap.needsUpdate=true;dirty=true;hold=0;shakePassed=false;}
function clearScene(){for(const p of planks){scene.remove(p.mesh);world?.removeBody(p.body)}planks=[];while(supportMeshes.children.length){const o=supportMeshes.children[0];supportMeshes.remove(o);o.geometry?.dispose()};serial=0}
function makeScenario(){clearScene();const physics=createPhysics(challenge?.scenario==='bridge');world=physics.world;statics=physics.statics;
  if(challenge?.scenario==='bridge'){
    for(const sign of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(BRIDGE.width,BRIDGE.height,BRIDGE.depth),stoneMat);p.position.set(sign*BRIDGE.x,BRIDGE.height/2,0);p.receiveShadow=true;p.castShadow=true;supportMeshes.add(p)}
    const river=new THREE.Mesh(new THREE.BoxGeometry(BRIDGE.gap,.005,BRIDGE.depth+1.1),riverMat);river.position.set(0,.004,0);river.receiveShadow=true;supportMeshes.add(river);
  }
  renderer.shadowMap.needsUpdate=true;
}
function capture(){profiles[activeId]={pieces:planks.map(({id,tool,yaw,body})=>({id,tool,yaw,x:body.position.x,y:body.position.y,z:body.position.z,quaternion:[body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w]})),wonNow,shakePassed};}
function save(){capture();try{localStorage.setItem(STORAGE,JSON.stringify({profiles,achievements,globalBest,activeId,snap,precision,sound:soundOn,vibration:vibrationOn}));dirty=false}catch{}}
function loadProfile(){makeScenario();const state=profiles[activeId];if(state&&Array.isArray(state.pieces))for(const p of state.pieces.slice(0,challenge?.limit||MAX_PLANKS)){if([p.x,p.y,p.z].every(Number.isFinite)&&p.quaternion?.length===4&&p.quaternion.every(Number.isFinite))addBody(p)}
  wonNow=!!state?.wonNow;shakePassed=!!state?.shakePassed;hold=0;shakeStart=null;shakeChecking=false;autoStack=null;selected=null;aim={x:0,z:0,y:0};tool='flat';angle=0;mode='build';panCamera=false;measure=measurements(planks.map(p=>p.body));fit();updatePreview();setStatus();updateHud(0);dirty=true;
}
function migrate(){if(Object.keys(profiles).length)return;try{const old=JSON.parse(localStorage.getItem('planko-v1')||'null');if(!old?.blocks?.length)return;profiles.sandbox={pieces:old.blocks.slice(0,MAX_PLANKS).map(b=>{const tool=b.tool||'flat',yaw=b.dir?Math.PI/2:0,q=orientation(tool,yaw);const hh=tool==='stand'?SIZE.length/2:tool==='edge'?SIZE.width/2:SIZE.thickness/2;return {id:b.id,tool,yaw,x:b.x*.325,y:b.y*.325+hh,z:b.z*.325,quaternion:[q.x,q.y,q.z,q.w]}})};activeId='sandbox';challenge=null}catch{}}
function switchChallenge(id){save();activeId=id;challenge=challengeById(id);loadProfile();closeSheet();save();toast(challenge?.title||'Volné stavění')}
function setMode(next){mode=next;selected=null;autoStack=null;if(mode!=='camera')panCamera=false;updatePreview();setStatus()}

function overlap(a,b,c,d,t=.003){return Math.min(b,d)-Math.max(a,c)>t}
function makeOBB(center,q,size=half){return new OBB(center,size.clone(),new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)))}
function updatePreview(){
  if(mode!=='build'){ghost.visible=false;marker.visible=false;candidate=null;return}
  if(autoStack){const p=bodyById(autoStack);if(p&&Math.abs(p.body.position.x-aim.x)<.5&&Math.abs(p.body.position.z-aim.z)<.5)aim.y=bounds(p.body).hi.y;else autoStack=null}
  const q=threeQ(orientation(tool,angle*Math.PI/180));const local=plankGeometry.boundingBox.clone().applyMatrix4(tempMat.makeRotationFromQuaternion(q));
  const x=aim.x,z=aim.z;
  let surface=0;
  const near=[];
  for(const body of [...statics,...planks.map(p=>p.body)]){
    const {lo,hi}=bounds(body);
    if(overlap(x+local.min.x,x+local.max.x,lo.x,hi.x)&&overlap(z+local.min.z,z+local.max.z,lo.z,hi.z)){
      if(hi.y<=aim.y+.21)surface=Math.max(surface,hi.y);near.push(body);
    }
  }
  const position=new THREE.Vector3(x,surface-local.min.y+.009,z),obb=makeOBB(position,q);let blocked=false,reason='';
  if(x+local.min.x<-TABLE/2||x+local.max.x>TABLE/2||z+local.min.z<-TABLE/2||z+local.max.z>TABLE/2){blocked=true;reason='Mimo stůl'}
  for(const body of near){const {lo,hi}=bounds(body);const close=overlap(position.y+local.min.y,position.y+local.max.y,lo.y,hi.y,.001);
    if(body.mass<=0){if(close){blocked=true;reason='Náhled koliduje s podstavcem';break}continue}
    if(close&&obb.intersectsOBB(makeOBB(vec(body.position),threeQ(body.quaternion)))){blocked=true;reason='Náhled koliduje';break}
    if(Math.abs(hi.y-surface)<.03&&(body.velocity.length()>.075||body.angularVelocity.length()>.12)){blocked=true;reason='Počkej na dosednutí'}
  }
  candidate={x,y:position.y,z,q,blocked,reason,tool,yaw:angle*Math.PI/180};ghost.position.copy(position);ghost.quaternion.copy(q);ghost.visible=true;ghostMat.color.set(blocked?'#d78e79':'#7db485');ghostLine.material.color.set(blocked?'#b95e41':'#396b46');marker.position.set(x,surface+.014,z);marker.visible=true;
  $('placementStatus').textContent=reason||`Náhled · ${fmt(surface*10)} cm`;const limit=challenge?.limit||MAX_PLANKS;$('place').disabled=blocked||planks.length>=limit||shakeStart!==null;
}

function pick(px,py){const r=viewport.getBoundingClientRect();pointer.set((px/r.width)*2-1,1-(py/r.height)*2);ray.setFromCamera(pointer,camera);return ray.intersectObjects([table,...supportMeshes.children.filter(o=>o.geometry&&o.position.y>.05),...planks.map(p=>p.mesh)],false)[0]||null;}
function updateAim(px,py){const hit=pick(px,py);if(mode==='erase'){selected=hit?.object.userData.plankId||null;setStatus();return}if(!hit)return;let y=hit.point.y;const item=bodyById(hit.object.userData.plankId);if(item)y=bounds(item.body).hi.y;else if(hit.object!==table)y=BRIDGE.height;else y=0;const s=v=>snap?Math.round(v/GRID)*GRID:v;aim={x:clamp(s(hit.point.x),-3.9,3.9),z:clamp(s(hit.point.z),-3.9,3.9),y:Math.max(0,y)};autoStack=null;updatePreview()}
function place(){if(mode==='camera'){setMode('build');return}if(mode==='erase'){const p=bodyById(selected);if(p){removeItem(p);play(110);vibrate();setStatus();toast('Destička odebrána')}return}updatePreview();if(!candidate||candidate.blocked||planks.length>=(challenge?.limit||MAX_PLANKS)||shakeStart!==null)return;
  const p=addBody(candidate,true);autoStack=p.id;aim.y=bounds(p.body).hi.y;hold=0;shakePassed=false;wonNow=false;dirty=true;awaken(planks.map(p=>p.body));play(240,.035);vibrate();setStatus();
}
function nudge(dir){if(mode!=='build')return;autoStack=null;const rightX=Math.cos(yaw),rightZ=-Math.sin(yaw),forwardX=-Math.sin(yaw),forwardZ=-Math.cos(yaw);const signs={up:[forwardX,forwardZ],down:[-forwardX,-forwardZ],left:[-rightX,-rightZ],right:[rightX,rightZ]};const [x,z]=signs[dir];aim.x=clamp(aim.x+x*UNIT,-3.9,3.9);aim.z=clamp(aim.z+z*UNIT,-3.9,3.9);updatePreview()}

function showSheet(title,content){$('sheet').innerHTML=`<div class="sheet-head"><h2>${title}</h2><button class="sheet-close" id="sheetClose" aria-label="Zavřít">×</button></div>${content}`;$('modal').classList.add('open');$('sheetClose').onclick=closeSheet;}
function closeSheet(){$('modal').classList.remove('open')}
function showCatalog(){const completed=CHALLENGES.filter(c=>achievements[c.id]).length;showSheet('Stavební výzvy',`<p>Vyber volné stavění nebo jednu z ${CHALLENGES.length} fyzikálních výzev. Každá stavba se ukládá zvlášť.</p><button class="sandbox-card" id="sandboxChoice"><span class="sandbox-icon">▱</span><div><b>Sandbox</b><small>Neomezené nápady · až ${MAX_PLANKS} destiček</small></div></button><h3>Výzvy · ${completed}/${CHALLENGES.length} splněno</h3><div class="card-list">${CHALLENGES.map(c=>`<button class="challenge-card ${achievements[c.id]?'done':''} ${activeId===c.id?'active':''}" data-challenge="${c.id}"><span class="challenge-icon">${achievements[c.id]?'✓':c.icon}</span><div><div class="challenge-meta"><b>${c.title}</b><span class="level">${c.level}</span></div><small>${c.description} · ${c.limit} dest.</small><span class="stars">${'★'.repeat(achievements[c.id]?.stars||0)}${'☆'.repeat(3-(achievements[c.id]?.stars||0))}</span></div></button>`).join('')}</div>`);$('sandboxChoice').onclick=()=>switchChallenge('sandbox');all('[data-challenge]').forEach(b=>b.onclick=()=>switchChallenge(b.dataset.challenge))}
function showHelp(){showSheet('Ovládání',`<div class="help-row"><i>▱</i><div><b>Stavět</b><br>Dotkni se stolu nebo stavby a posuň náhled prstem. Destička se položí až po stisku POLOŽIT.</div></div><div class="help-row"><i>◎</i><div><b>Kamera</b><br>Přepni na Kamera, tažením otáčej. Křížek ✥ přepne posun. Dvěma prsty můžeš přibližovat v každém režimu.</div></div><div class="help-row"><i>⊞</i><div><b>Přesnost</b><br>Mřížka přichytává na 3,9 mm. Přesně zobrazí šipky po 1 mm. Otočení po 15°.</div></div><div class="help-row"><i>⊖</i><div><b>Odebrat</b><br>Vyber libovolnou stěnu destičky a potvrď odebrání.</div></div><div class="help-row"><i>≋</i><div><b>Test otřesem</b><br>Krátké zrychlení prověří stabilitu. Destičky mají skutečnou hmotnost, tření a kolize.</div></div><h3>Nastavení</h3><div class="settings-row"><span>Zvuk dřeva</span><button id="soundSwitch" class="switch ${soundOn?'on':''}">${soundOn?'Zapnuto':'Vypnuto'}</button></div><div class="settings-row"><span>Vibrace</span><button id="vibSwitch" class="switch ${vibrationOn?'on':''}">${vibrationOn?'Zapnuto':'Vypnuto'}</button></div><div class="empty-note">PLANKO Studio · verze 0.2.0</div>`);$('soundSwitch').onclick=()=>{soundOn=!soundOn;enableAudio();save();showHelp()};$('vibSwitch').onclick=()=>{vibrationOn=!vibrationOn;save();showHelp()}}
function resetPrompt(){showSheet('Nová stavba?',`<p>Vymaže aktuální konstrukci. Rekordy, hvězdy a ostatní rozehrané výzvy zůstanou zachovány.</p><button id="resetYes" class="wide-btn danger">Začít znovu</button><button id="resetNo" class="wide-btn secondary">Pokračovat ve stavbě</button>`);$('resetYes').onclick=()=>{delete profiles[activeId];loadProfile();closeSheet();save()};$('resetNo').onclick=closeSheet}

function runShake(){if(!planks.length){toast('Nejdřív něco postav.');return}if(shakeStart!==null)return;shakeStart=performance.now();shakeChecking=true;hold=0;shakePassed=false;awaken(planks.map(p=>p.body));$('shake').classList.add('active');$('shakeLabel').textContent='Probíhá otřes';vibrate(35);toast('Zkouška stability')}
function updateHud(dt){const m=measure;let limit=challenge?.limit||MAX_PLANKS;$('count').innerHTML=`${m.count} <i>/ ${limit}</i>`;$('height').innerHTML=`${fmt(m.height)} <i>cm</i>`;$('best').innerHTML=`${fmt(globalBest)} <i>cm</i>`;
  $('physicsStatus').textContent=shakeStart!==null?'≋ Test stability':m.stable?'● Stavba v klidu':'● Probíhá simulace';$('undo').disabled=!planks.length;
  if(!challenge)return;
  const ev=evaluate(challenge,m,{shakePassed});let qualified=ev.qualified&&m.stable&&shakeStart===null;
  if(qualified)hold+=dt;else hold=0;
  $('progress').style.width=`${Math.min(100,ev.progress*100)}%`;
  $('objectiveStatus').textContent=wonNow?'SPLNĚNO':qualified?`VYDRŽ ${Math.max(0,Math.ceil(challenge.hold-hold))} S`:'STAVÍŠ';
  $('objectiveText').textContent=wonNow?'✓ '+challenge.description:ev.detail;
  if(qualified&&hold>=challenge.hold&&!wonNow){wonNow=true;const stars=m.count<=challenge.min+1?3:m.count<=challenge.limit*.75?2:1;const old=achievements[challenge.id];achievements[challenge.id]={stars:Math.max(stars,old?.stars||0),bestCount:Math.min(m.count,old?.bestCount||Infinity),height:Math.max(m.height,old?.height||0)};play(440,.065,.15);vibrate([45,60,45]);toast(`Výzva splněna! ${'★'.repeat(stars)}`);save()}
}

$('catalog').onclick=showCatalog;$('help').onclick=showHelp;$('modal').onclick=e=>{if(e.target===$('modal'))closeSheet()};$('reset').onclick=resetPrompt;
all('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));all('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;updatePreview();setStatus()});
function rotate(delta){angle=(angle+delta+360)%360;updatePreview();$('angle').textContent=`${angle}°`}
$('rotateLeft').onclick=()=>rotate(-15);$('rotateRight').onclick=()=>rotate(15);$('place').onclick=()=>{enableAudio();place()};$('undo').onclick=()=>{if(planks.length){removeItem(planks[planks.length-1]);wonNow=false;setStatus();play(110);}};
$('snap').onclick=()=>{snap=!snap;if(snap){aim.x=Math.round(aim.x/GRID)*GRID;aim.z=Math.round(aim.z/GRID)*GRID}updatePreview();setStatus();save()};$('precisionToggle').onclick=()=>{precision=!precision;setStatus();save()};all('[data-nudge]').forEach(b=>b.onclick=()=>nudge(b.dataset.nudge));
$('zoomIn').onclick=()=>zoom(.82);$('zoomOut').onclick=()=>zoom(1.22);$('fit').onclick=fit;$('pan').onclick=()=>{if(mode!=='camera')setMode('camera');panCamera=!panCamera;setStatus()};$('shake').onclick=runShake;$('reload').onclick=()=>location.reload();

const pointers=new Map();let gesture=null,dragged=false,primaryId=null;
function coords(e){const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
function snapshot(){const [a,b]=[...pointers.values()];return {distance:Math.hypot(a.x-b.x,a.y-b.y),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2}}
function orbit(dx,dy){yaw-=dx*.007;pitch=clamp(pitch+dy*.006,.13,1.43);setCamera()}
function pan(dx,dy){const unit=radius/Math.max(180,viewport.clientHeight)*.93;target.x-=Math.cos(yaw)*dx*unit;target.z+=Math.sin(yaw)*dx*unit;target.y+=dy*unit;setCamera()}
viewport.addEventListener('pointerdown',e=>{if(e.target!==renderer.domElement)return;enableAudio();viewport.setPointerCapture(e.pointerId);const p=coords(e);pointers.set(e.pointerId,p);if(pointers.size===1){primaryId=e.pointerId;dragged=false;if(mode!=='camera')updateAim(p.x,p.y)}else if(pointers.size===2){gesture=snapshot();dragged=true}});
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;let p=coords(e),old=pointers.get(e.pointerId);pointers.set(e.pointerId,p);
  if(pointers.size>=2){const s=snapshot();if(gesture){if(gesture.distance>6&&s.distance>6)zoom(gesture.distance/s.distance);orbit(s.cx-gesture.cx,s.cy-gesture.cy)}gesture=s;dragged=true;return}
  if(dragged&&primaryId!==e.pointerId)return;
  if(mode==='camera'){if(panCamera)pan(p.x-old.x,p.y-old.y);else orbit(p.x-old.x,p.y-old.y)}else if(!gesture)updateAim(p.x,p.y);
});
function release(e){pointers.delete(e.pointerId);if(pointers.size===0){gesture=null;dragged=false;primaryId=null}else if(pointers.size===1){primaryId=null;dragged=true}}
viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(e.deltaY*.001))},{passive:false});
window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});

let last=performance.now(),hudTime=0,saveTime=0,stableTime=0;
function frame(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
  if(shakeStart!==null){const elapsed=(now-shakeStart)/1000;if(elapsed<=1.2){shakeGravity(world,elapsed);awaken(planks.map(p=>p.body))}else{shakeStart=null;resetGravity(world);$('shake').classList.remove('active');$('shakeLabel').textContent='Test otřesem';toast('Čekám, až se stavba ustálí')}}
  step(world,dt);let moved=false;for(const p of [...planks]){if(p.body.position.y<-2.5||Math.abs(p.body.position.x)>11||Math.abs(p.body.position.z)>11){removeItem(p);continue}syncMesh(p);if(p.body.velocity.length()>.025||p.body.angularVelocity.length()>.035)moved=true}
  if(moved){renderer.shadowMap.needsUpdate=true;dirty=true}
  updatePreview();const s=bodyById(selected);if(mode==='erase'&&s){selection.visible=true;selection.position.copy(s.mesh.position);selection.quaternion.copy(s.mesh.quaternion)}else selection.visible=false;
  hudTime+=dt;saveTime+=dt;
  if(hudTime>=.12){measure=measurements(planks.map(p=>p.body));stableTime=measure.stable?stableTime+hudTime:0;
    if(stableTime>.7&&measure.height>globalBest+.05){globalBest=measure.height;dirty=true}
    if(shakeChecking&&shakeStart===null&&stableTime>1.1){shakeChecking=false;shakePassed=challenge?.shake?measure.height>=challenge.height-.05&&measure.count>=challenge.min:true;toast(shakePassed?'Test dokončen – stabilní':'Stavba nevydržela');dirty=true}
    updateHud(hudTime);hudTime=0;
  }
  if(saveTime>1.5){if(dirty)save();saveTime=0}
  renderer.render(scene,camera);requestAnimationFrame(frame);
}
migrate();loadProfile();resize();setStatus();document.documentElement.dataset.ready='true';requestAnimationFrame(frame);
