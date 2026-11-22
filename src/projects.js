import { SIZE, MAX_PLANKS, orientation } from './physics.js';

export const PROJECT_LIMIT=24;
export const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function projectName(value,fallback='Moje stavba'){return String(value||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,40)||fallback}
export function readProjects(value){if(!Array.isArray(value))return [];const seen=new Set();return value.filter(p=>p&&typeof p.id==='string'&&/^gallery:[a-z0-9-]+$/.test(p.id)&&!seen.has(p.id)&&seen.add(p.id)).slice(0,PROJECT_LIMIT).map(p=>({id:p.id,name:projectName(p.name),created:Number(p.created)||0,updated:Number(p.updated)||0,template:typeof p.template==='string'?p.template:''}))}
export function createProject(name,projects,{now=Date.now(),template=''}={}){if(projects.length>=PROJECT_LIMIT)return null;let index=0,id;do{id=`gallery:${now.toString(36)}-${index++}`}while(projects.some(p=>p.id===id));return {id,name:projectName(name),created:now,updated:now,template}}
export function copyProfile(pieces){return {pieces:pieces.slice(0,MAX_PLANKS).map(p=>({...p,quaternion:[...p.quaternion]})),wonNow:false,shakePassed:false}}

const piece=(id,x,y,z,tool='flat',yaw=0)=>{const q=orientation(tool,yaw);return {id,x,y,z,tool,yaw,quaternion:[q.x,q.y,q.z,q.w]}};
const layerY=n=>SIZE.thickness*(n+.5)+.001*n;
function tower(){const out=[];for(let k=0;k<6;k++)for(let j=-1;j<=1;j++)out.push(piece(out.length+1,k%2?j*.28:0,layerY(k),k%2?0:j*.28,'flat',k%2?Math.PI/2:0));return out}
function bridge(){const out=[];for(let layer=0;layer<4;layer++)for(const sign of [-1,1])out.push(piece(out.length+1,sign*.44,layerY(layer),0,'flat',Math.PI/2));for(let j=-1;j<=1;j++)out.push(piece(out.length+1,0,layerY(4),j*.29));return out}
function stairs(){const out=[];for(let level=0;level<5;level++)for(let i=0;i<5-level;i++)out.push(piece(out.length+1,(i-2)*SIZE.width,layerY(level),0,'flat',Math.PI/2));return out}
function wall(){const out=[];for(let row=0;row<6;row++)for(let i=0;i<3;i++)out.push(piece(out.length+1,(i-1)*SIZE.length+(row%2?.29:0),layerY(row),0));return out}

export const TEMPLATES=[
  {id:'tower',name:'Srubová věž',description:'Střídej směry vrstev a postav stabilní věž.',icon:'▥',build:tower},
  {id:'bridge',name:'Malý most',description:'Dvě podpěry a tři nosníky; zkus most rozšířit.',icon:'⌒',build:bridge},
  {id:'stairs',name:'Schodiště',description:'Pět postupných stupňů pro vlastní architekturu.',icon:'▟',build:stairs},
  {id:'wall',name:'Dřevěná stěna',description:'Základ pro dům, pevnost nebo ohradu.',icon:'▤',build:wall}
];
export function templatePieces(id){const template=TEMPLATES.find(t=>t.id===id);return template?template.build():[]}
export function galleryMarkup(projects,profiles,activeId){const sorted=[...projects].sort((a,b)=>b.updated-a.updated);return `<p>Každá stavba má vlastní automatické ukládání. Vytvoř novou, zkopíruj rozehranou nebo začni podle předlohy.</p><div class="gallery-actions"><button id="galleryBlank" class="wide-btn hero-button">＋ Nová stavba</button><button id="galleryCopy" class="wide-btn secondary">Duplikovat aktuální</button></div><h3>Moje projekty <span class="gallery-cap">${projects.length}/${PROJECT_LIMIT}</span></h3>${sorted.length?`<div class="gallery-list">${sorted.map(p=>{const count=profiles[p.id]?.pieces?.length||0;return `<div class="project-row ${p.id===activeId?'current':''}"><button class="project-open" data-open-project="${p.id}"><span class="project-icon">▱</span><span><b>${escapeHtml(p.name)}</b><small>${count} destiček${p.id===activeId?' · právě otevřeno':''}</small></span></button><button class="project-more" data-manage-project="${p.id}" aria-label="Spravovat ${escapeHtml(p.name)}">⋯</button></div>`}).join('')}</div>`:'<div class="gallery-empty">Tady budou tvoje vlastní stavby.</div>'}<h3>Stavební předlohy</h3><div class="template-list">${TEMPLATES.map(t=>`<button class="template-card" data-template="${t.id}"><span class="template-icon">${t.icon}</span><b>${t.name}</b><small>${t.description}</small><em>${templatePieces(t.id).length} destiček</em></button>`).join('')}</div>`}
