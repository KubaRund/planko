import { Vector3 } from 'three';

// A genuine perspective projection of the same 3D rigid bodies, without WebGL.
// This avoids GPU-context initialization and driver-specific WebView failures.
const FACES=[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]];
const EDGES=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
const CORNERS=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const LIGHT=new Vector3(-.4,.8,.45).normalize();
const WOODS=['#e6c18b','#dab17b','#edcb99','#d5ae7c','#f0cb97','#dfb784'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function color(hex,amount){const h=parseInt(hex.slice(1),16);return `rgb(${[h>>16,(h>>8)&255,h&255].map(v=>clamp(Math.round(v*amount),0,255)).join(',')})`}
const corners=(pos,quat,dim)=>CORNERS.map(([x,y,z])=>new Vector3(x*dim[0]/2,y*dim[1]/2,z*dim[2]/2).applyQuaternion(quat).add(pos));

export class CanvasRenderer {
  constructor(){this.domElement=document.createElement('canvas');this.ctx=this.domElement.getContext('2d',{alpha:false});if(!this.ctx)throw new Error('Canvas 2D unavailable');this.isCanvas=true;this.dpi=1;this.w=1;this.h=1;this.capabilities={getMaxAnisotropy:()=>1};this.shadowMap={enabled:false,autoUpdate:false,needsUpdate:false};}
  setPixelRatio(v){this.dpi=Math.min(1.5,v)}
  setSize(w,h){this.w=w;this.h=h;this.domElement.width=Math.max(1,Math.round(w*this.dpi));this.domElement.height=Math.max(1,Math.round(h*this.dpi));this.ctx.setTransform(this.dpi,0,0,this.dpi,0,0);}
  cameraPoint(v){return v.clone().applyMatrix4(this.camera.matrixWorldInverse)}
  projected(v){const e=this.camera.projectionMatrix.elements,depth=-v.z;return [this.w*(.5+(v.x*e[0]/depth)*.5),this.h*(.5-(v.y*e[5]/depth)*.5),depth]}
  clip(points){const near=-Math.max(.035,this.camera.near);const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],insideA=a.z<=near,insideB=b.z<=near;if(insideA)out.push(a);if(insideA!==insideB){const t=(near-a.z)/(b.z-a.z);out.push(a.clone().lerp(b,t))}}return out;}
  polygon(p,fill,stroke=null,width=.6){if(p.length<3)return;const c=this.ctx;c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
  line(a,b,color,width=.65){let p=this.cameraPoint(a),q=this.cameraPoint(b),near=-Math.max(.035,this.camera.near);if(p.z>near&&q.z>near)return;if(p.z>near)p=p.clone().lerp(q,(near-p.z)/(q.z-p.z));else if(q.z>near)q=q.clone().lerp(p,(near-q.z)/(p.z-q.z));const s=this.projected(p),t=this.projected(q);this.ctx.beginPath();this.ctx.moveTo(s[0],s[1]);this.ctx.lineTo(t[0],t[1]);this.ctx.strokeStyle=color;this.ctx.lineWidth=width;this.ctx.stroke()}
  faces(pos,quat,dim,base,kind,id=0){const v=corners(pos,quat,dim),out=[];for(let i=0;i<FACES.length;i++){const world=FACES[i].map(j=>v[j]),normal=world[1].clone().sub(world[0]).cross(world[2].clone().sub(world[0])).normalize(),center=world.reduce((p,q)=>p.add(q),new Vector3()).multiplyScalar(.25);if(normal.dot(this.camera.position.clone().sub(center))<=0)continue;const cam=this.clip(world.map(p=>this.cameraPoint(p)));if(cam.length<3)continue;const points=cam.map(p=>this.projected(p)),depth=cam.reduce((value,p)=>value-p.z,0)/cam.length;const shade=.73+.31*Math.max(0,normal.dot(LIGHT));out.push({points,depth,kind,id,shade,base,top:i===4,world})}return out;}
  face(f){const c=this.ctx,wood=f.kind==='plank',preview=f.kind==='ghost';if(preview)c.globalAlpha=.58;this.polygon(f.points,color(f.base,f.shade),preview?'#285f3f':wood?'#936f49':f.kind==='support'?'#8d978c':null,wood?.65:1);c.globalAlpha=1;
    if(wood&&f.points.length===4&&f.top){const [a,b,d,e]=f.points;c.save();c.beginPath();f.points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip();for(let i=1;i<5;i++){const t=i/5,p=[a[0]+(e[0]-a[0])*t,a[1]+(e[1]-a[1])*t],q=[b[0]+(d[0]-b[0])*t,b[1]+(d[1]-b[1])*t];c.beginPath();c.moveTo(...p);c.lineTo(...q);c.strokeStyle=i%2?'#7c542a25':'#fff2c23d';c.lineWidth=.65;c.stroke()}c.restore()}
  }
  box(pos,quat,dim,base,kind,id){const faces=this.faces(pos,quat,dim,base,kind,id);faces.sort((a,b)=>b.depth-a.depth);faces.forEach(f=>this.face(f));}
  outline(pos,quat,dim,color){const v=corners(pos,quat,dim);for(const [a,b] of EDGES)this.line(v[a],v[b],color,1.6)}
  shadow(item,dim){const vertices=corners(item.mesh.position,item.mesh.quaternion,dim);const points=vertices.map(p=>new Vector3(p.x+.21*Math.max(0,p.y),.005,p.z-.13*Math.max(0,p.y))).map(p=>this.cameraPoint(p));if(points.some(p=>p.z>-.04))return;const screen=points.map(p=>this.projected(p));let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const p of screen){minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1])}if(maxX-minX>3*this.w||maxY-minY>3*this.h)return;const cx=(minX+maxX)/2,cy=(minY+maxY)/2;screen.sort((a,b)=>Math.atan2(a[1]-cy,a[0]-cx)-Math.atan2(b[1]-cy,b[0]-cx));this.polygon(screen,'#334d3a21');}
  renderGame({camera,table,grid,planks,ghost,selection,marker,supportMeshes,size,blocked}){
    this.camera=camera;const c=this.ctx;c.clearRect(0,0,this.w,this.h);const bg=c.createRadialGradient(this.w*.5,this.h*.5,10,this.w*.5,this.h*.45,Math.max(this.w,this.h)*.75);bg.addColorStop(0,'#e7edde');bg.addColorStop(1,'#bacbbd');c.fillStyle=bg;c.fillRect(0,0,this.w,this.h);
    this.box(table.position,table.quaternion,[size.table,.24,size.table],'#c3cbb1','table');
    if(grid.visible){const n=size.table/2;for(let t=-n;t<=n+.005;t+=.2){this.line(new Vector3(t,.004,-n),new Vector3(t,.004,n),'#75857048',.65);this.line(new Vector3(-n,.004,t),new Vector3(n,.004,t),'#75857048',.65)}}
    const dim=[size.length,size.thickness,size.width];for(const p of planks)this.shadow(p,dim);
    const faces=[];for(const mesh of supportMeshes.children){const g=mesh.geometry?.parameters;if(!g)continue;faces.push(...this.faces(mesh.position,mesh.quaternion,[g.width,g.height,g.depth],g.height<.02?'#8ca9a8':'#a4afa3','support'))}
    for(const p of planks)faces.push(...this.faces(p.mesh.position,p.mesh.quaternion,dim,WOODS[p.id%WOODS.length],'plank',p.id));faces.sort((a,b)=>b.depth-a.depth);faces.forEach(f=>this.face(f));
    if(ghost.visible){this.box(ghost.position,ghost.quaternion,dim,blocked?'#d68a74':'#83bd91','ghost');this.outline(ghost.position,ghost.quaternion,dim,blocked?'#a54433':'#2c7349')}
    if(selection.visible)this.outline(selection.position,selection.quaternion,dim.map(x=>x+.01),'#d4473b');
    if(marker.visible){let last;for(let i=0;i<=24;i++){const a=i/24*Math.PI*2,p=new Vector3(marker.position.x+.045*Math.cos(a),marker.position.y,marker.position.z+.045*Math.sin(a));if(last)this.line(last,p,'#305f3c',1.3);last=p}}
  }
}
