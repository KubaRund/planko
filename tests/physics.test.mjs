import test from 'node:test';
import assert from 'node:assert/strict';
import { Vec3, Quaternion } from 'cannon-es';
import { SIZE,STEP,BRIDGE,createPhysics,createPlank,orientation,bounds,measurements,shakeGravity,resetGravity,GRAVITY } from '../src/physics.js';
import { CHALLENGES,challengeById,evaluate } from '../src/challenges.js';

function settle(world, seconds=4){for(let i=0;i<seconds/STEP;i++)world.step(STEP)}
const close=(a,b,t=.025)=>assert.ok(Math.abs(a-b)<t,`${a} is not close to ${b}`);

test('true 1:3:15 dimensions and scaled gravity',()=>{
  close(SIZE.width/SIZE.thickness,3,.00001);close(SIZE.length/SIZE.thickness,15,.00001);
  const {world}=createPhysics();close(world.gravity.y,-98.0665,.00001);
  const plank=createPlank(world,{y:.18});assert.ok(plank.mass>.009&&plank.mass<.012);
  settle(world);close(plank.position.y,SIZE.thickness/2);
  assert.ok(measurements([plank]).stable,`resting velocity: ${plank.velocity.toString()}, angular: ${plank.angularVelocity.toString()}, sleep: ${plank.sleepState}`);
});

test('real collision stack falls when support disappears',()=>{
  const {world}=createPhysics();const base=createPlank(world,{y:.18});settle(world,2);
  const top=createPlank(world,{y:.25,tool:'flat',yaw:Math.PI/2});settle(world,4);
  close(top.position.y,SIZE.thickness*1.5,.023);
  world.removeBody(base);top.wakeUp();settle(world,3);
  close(top.position.y,SIZE.thickness/2);
});

test('an off-balance upright does not remain mathematically frozen',()=>{
  const {world}=createPhysics();const tilt=new Quaternion();tilt.setFromAxisAngle(new Vec3(0,0,1),.23);
  const q=orientation('stand').mult(tilt);const piece=createPlank(world,{y:.79,tool:'stand',quaternion:[q.x,q.y,q.z,q.w]});
  settle(world,6);assert.ok(bounds(piece).hi.y<SIZE.length*.55,`still standing: ${bounds(piece).hi.y}`);
});

test('friction slows horizontal motion on the table',()=>{
  const {world}=createPhysics();const piece=createPlank(world,{y:.12});settle(world,2);piece.wakeUp();piece.velocity.set(1,0,0);settle(world,2);assert.ok(Math.abs(piece.velocity.x)<.09);
});

test('two real wooden beams can bridge the platform gap',()=>{
  const {world}=createPhysics(true);const p1=createPlank(world,{y:BRIDGE.height+.10,z:-.21}),p2=createPlank(world,{y:BRIDGE.height+.10,z:.21});settle(world,4);
  const m=measurements([p1,p2]);assert.equal(m.bridge,2);assert.ok(m.stable);assert.equal(evaluate(challengeById('bridge'),m).qualified,true);
});

test('ten distinct challenge definitions validate all their requirements',()=>{
  assert.equal(CHALLENGES.length,10);assert.equal(new Set(CHALLENGES.map(c=>c.id)).size,10);
  for(const challenge of CHALLENGES){const m={count:challenge.min,height:challenge.height||0,span:challenge.span||0,bridge:challenge.bridge||0,foundation:challenge.foundation||0,stable:true};assert.equal(evaluate(challenge,m,{shakePassed:true}).qualified,true,challenge.id);assert.equal(evaluate(challenge,{...m,count:0},{shakePassed:true}).qualified,false,challenge.id);}
  const m={count:12,height:21,span:18,bridge:0,foundation:3};assert.equal(evaluate(challengeById('quake'),m,{shakePassed:false}).qualified,false);assert.equal(evaluate(challengeById('quake'),m,{shakePassed:true}).qualified,true);
});

test('shake applies and restores lateral acceleration',()=>{const {world}=createPhysics();shakeGravity(world,.13);assert.notEqual(world.gravity.x,0);resetGravity(world);close(world.gravity.x,0,.00001);close(world.gravity.z,0,.00001);close(world.gravity.y,-GRAVITY,.00001)});
