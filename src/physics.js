import { World, Body, Box, Vec3, Quaternion, Material, ContactMaterial, SAPBroadphase } from 'cannon-es';

// One simulated unit equals 10 cm. Scaling small wooden objects improves solver precision.
export const SIZE = Object.freeze({ length: 1.17, width: .234, thickness: .078 });
export const CM_PER_UNIT = 10;
export const TABLE = 8;
export const GRAVITY = 98.0665;
export const STEP = 1 / 120;
export const MAX_PLANKS = 180;
export const BRIDGE = Object.freeze({ x: .72, width: .52, height: .50, depth: 1.25, gap: .92 });
const wood = new Material('pine');
const tabletop = new Material('table');
const half = new Vec3(SIZE.length / 2, SIZE.thickness / 2, SIZE.width / 2);
const mid = (a,b)=>(a+b)/2;

export function createPhysics(bridge = false) {
  const world = new World({ gravity: new Vec3(0, -GRAVITY, 0), allowSleep: true });
  world.broadphase = new SAPBroadphase(world);
  world.solver.iterations = 28;
  // Tiny wooden pieces have small impulses; a relative-looking default tolerance
  // can stop Gauss-Seidel too early and leave resting contacts chattering.
  world.solver.tolerance = 1e-7;
  const contact = { friction: .52, restitution: .035, contactEquationStiffness: 1e7, contactEquationRelaxation: 4,
    frictionEquationStiffness: 1e7, frictionEquationRelaxation: 4 };
  Object.assign(world.defaultContactMaterial, contact);
  world.addContactMaterial(new ContactMaterial(wood, wood, contact));
  world.addContactMaterial(new ContactMaterial(wood, tabletop, { ...contact, friction: .62 }));
  const statics = [];
  const makeStatic = (x,y,z,w,h,d) => {
    const b = new Body({ mass: 0, material: tabletop, position: new Vec3(x,y,z) });
    b.addShape(new Box(new Vec3(w/2,h/2,d/2))); world.addBody(b); statics.push(b); return b;
  };
  makeStatic(0,-.12,0,TABLE,.24,TABLE);
  if (bridge) for (const sign of [-1,1]) makeStatic(sign*BRIDGE.x,BRIDGE.height/2,0,BRIDGE.width,BRIDGE.height,BRIDGE.depth);
  return { world, statics };
}

export function orientation(tool, yaw = 0) {
  const q = new Quaternion();
  q.setFromAxisAngle(new Vec3(0,1,0), yaw);
  const tilt = new Quaternion();
  if (tool === 'edge') tilt.setFromAxisAngle(new Vec3(1,0,0), Math.PI/2);
  else if (tool === 'stand') tilt.setFromAxisAngle(new Vec3(0,0,1), Math.PI/2);
  return q.mult(tilt);
}

export function halfHeight(tool) {
  return (tool === 'stand' ? SIZE.length : tool === 'edge' ? SIZE.width : SIZE.thickness)/2;
}

export function createPlank(world, { x=0,y=0,z=0,tool='flat',yaw=0,quaternion,disturb=false,random=Math.random }={}) {
  // 500 kg/m³ pine reference density; mass is approximately 10.7 g.
  const mass = 500 * (SIZE.length/10) * (SIZE.width/10) * (SIZE.thickness/10);
  const body = new Body({ mass, material: wood, shape: new Box(half.clone()), position: new Vec3(x,y,z),
    linearDamping:.07, angularDamping:.12, allowSleep:true, sleepSpeedLimit:.10, sleepTimeLimit:1.3 });
  const q=quaternion ? new Quaternion(...quaternion) : orientation(tool,yaw);
  if (disturb) {
    // Tiny hand-placement error makes needle-like towers sensitive, rather than mathematically perfect.
    body.position.x+=(random()-.5)*.007;
    body.position.z+=(random()-.5)*.007;
    const tilt=new Quaternion(); tilt.setFromAxisAngle(new Vec3(1,0,0),(random()-.5)*.012);
    body.quaternion.copy(q.mult(tilt));
  } else body.quaternion.copy(q);
  world.addBody(body); body.updateAABB(); return body;
}

export function bounds(body) {
  if (body.aabbNeedsUpdate) body.updateAABB();
  return {lo:body.aabb.lowerBound,hi:body.aabb.upperBound};
}

export function measurements(bodies) {
  let height=0,minX=Infinity,minZ=Infinity,maxX=-Infinity,maxZ=-Infinity,foundation=0,bridge=0,energy=0;
  for (const body of bodies) {
    const {lo,hi}=bounds(body);
    if (hi.y<0) continue;
    height=Math.max(height,hi.y); minX=Math.min(minX,lo.x); minZ=Math.min(minZ,lo.z);
    maxX=Math.max(maxX,hi.x); maxZ=Math.max(maxZ,hi.z);
    if(lo.y<.045)foundation++;
    if(lo.x<=-BRIDGE.gap/2 && hi.x>=BRIDGE.gap/2 && lo.y>=BRIDGE.height-.035 && lo.y<=BRIDGE.height+.09 && Math.abs(mid(lo.z,hi.z))<BRIDGE.depth/2-.03 && hi.y-lo.y<.22)bridge++;
    energy=Math.max(energy,body.velocity.length(),body.angularVelocity.length()*.3);
  }
  return { count:bodies.length, height:height*CM_PER_UNIT, span:bodies.length?Math.max(maxX-minX,maxZ-minZ)*CM_PER_UNIT:0,
    foundation,bridge,energy,stable:energy<.09 };
}

// Connected-component scoring: a pile scattered across the table must not count
// as a single wide or tall building. The tolerance is about two millimetres.
export function connectedMeasurements(bodies) {
  const boxes=bodies.map(bounds), parents=bodies.map((_,i)=>i), root=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i]}return i};
  const gap=(a,b,axis)=>Math.max(a.lo[axis]-b.hi[axis],b.lo[axis]-a.hi[axis]);
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)if(['x','y','z'].every(a=>gap(boxes[i],boxes[j],a)<.023))parents[root(j)]=root(i);
  const groups=new Map();for(let i=0;i<bodies.length;i++){const r=root(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(bodies[i])}
  const largest=[...groups.values()].sort((a,b)=>b.length-a.length)[0]||[];
  const m=measurements(largest);return {componentCount:largest.length,height:m.height,span:m.span,foundation:m.foundation};
}

export function awaken(bodies) { for(const b of bodies)b.wakeUp(); }
export function shakeGravity(world, elapsed) { world.gravity.x = 21*Math.sin(elapsed*19) * Math.max(0,1-elapsed/1.2); world.gravity.z = 12*Math.sin(elapsed*13) * Math.max(0,1-elapsed/1.2); }
export function resetGravity(world) { world.gravity.set(0,-GRAVITY,0); }
export function step(world,dt) { world.step(STEP,Math.min(dt,.05),8); }
