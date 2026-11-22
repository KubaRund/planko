const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/index.html'), 'utf8');
const source = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx = Object.fromEntries(['setTransform','clearRect','beginPath','moveTo','lineTo','closePath','fill','stroke'].map(x=>[x,()=>{}]));
const fake = () => ({style: {}, classList: {add(){}, remove(){}, toggle(){}},
  addEventListener(){}, getContext(){return ctx}, getBoundingClientRect(){return {width:390,height:560}}});
const elements = new Map();
const context = vm.createContext({
  document: {getElementById(id){if(!elements.has(id))elements.set(id,fake());return elements.get(id)},querySelectorAll(){return []}},
  localStorage: {getItem(){return null},setItem(){}}, ResizeObserver: class{observe(){}},
  navigator: {}, devicePixelRatio: 1, performance: {now(){return 0}}, requestAnimationFrame(){},
  setTimeout(){},clearTimeout(){},console
});
const testSource = source.replace(/\}\)\(\);\s*$/, 'globalThis.game={dims,shape,landing,balanced,step,projection,plane,hit,boxFaces,draw,add,setBlocks:v=>blocks=v,getBlocks:()=>blocks};})();');
vm.runInContext(testSource,context);
const g = context.game;
let id=0;
const plank=(x=0,y=0,z=0,tool='flat',dir=0)=>({id:++id,x,y,z,tool,dir,v:0,fall:false,tip:null});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
assert.deepEqual(Array.from(g.dims('flat',0)).map(x=>Math.round(x/.24)),[15,1,3]);
assert.deepEqual(Array.from(g.dims('edge',1)).map(x=>Math.round(x/.24)),[1,3,15]);
assert.deepEqual(Array.from(g.dims('stand',0)).map(x=>Math.round(x/.24)),[3,15,1]);
const base=plank(),upper=plank(0,.24);g.setBlocks([base,upper]);
close(g.landing(upper,.24).level,.24);assert.equal(g.balanced(upper,g.landing(upper,.24)),true);
g.setBlocks([upper]);g.step(.02);assert.equal(upper.fall,true);for(let i=0;i<80;i++)g.step(.016);close(upper.y,0);
const unstable=plank(1.68,.24,0,'flat',1);g.setBlocks([base,unstable]);assert.equal(g.balanced(unstable,g.landing(unstable,.24)),true);
unstable.x=1.92;assert.equal(g.balanced(unstable,g.landing(unstable,.24)),false);g.step(.016);assert.ok(unstable.tip);
const p=g.projection(1.5,2,-.5),q=g.plane(p[0],p[1],2);close(q.x,1.5);close(q.z,-.5);
assert.ok(g.boxFaces(base).some(f=>f.top),'top face must be visible');
g.setBlocks([]);const center=g.projection(0,0,0);g.add(center[0],center[1]);g.add(center[0],center[1]);assert.equal(g.getBlocks().length,1,'rapid taps must not overlap two falling blocks');
for(let i=0;i<100;i++)g.step(.016);const top=g.projection(0,g.shape(g.getBlocks()[0]).top,0);g.add(top[0],top[1]);for(let i=0;i<100;i++)g.step(.016);assert.equal(g.getBlocks().length,2);close(g.getBlocks()[1].y,.24);g.draw();
elements.get('undo').onclick();assert.equal(g.getBlocks().length,1);g.draw();
console.log('PLANKO: orientace, podpora, pád, převrácení, projekce a vykreslení OK');
