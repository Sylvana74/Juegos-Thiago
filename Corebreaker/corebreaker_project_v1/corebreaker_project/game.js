(()=>{'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);const overlay=$('overlay'),startBtn=$('startBtn');
const W=canvas.width,H=canvas.height,CX=W/2,CY=H/2;
let state='ready',last=0,elapsed=0,fps=60,fpsClock=0,fpsFrames=0,score=0,gameTime=0,shake=0;
const keys=new Set(),mouse={x:W*.72,y:H*.5,down:false};
let player,boss,shots,enemyShots,particles,stars;
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function reset(){
 player={x:W*.5,y:H-65,r:10,speed:255,hp:100,invuln:0,fireCD:0};
 boss={x:CX,y:CY-5,r:34,angle:0,spin:0.78,hp:100,maxHp:100,armor:Array.from({length:8},()=>({hp:3,maxHp:3,alive:true,flash:0})),shootCD:.75,pattern:0,patternTimer:0,burstCount:0};
 shots=[];enemyShots=[];particles=[];score=0;gameTime=0;shake=0;elapsed=0;
 stars=Array.from({length:95},()=>({x:rand(0,W),y:rand(0,H),r:rand(.5,1.7),a:rand(.18,.8),sp:rand(3,15)}));
 updateStats();
}
function updateStats(){ $('armorStat').textContent=boss?`${boss.armor.filter(a=>a.alive).length} / 8`:'8 / 8';$('bossStat').textContent=boss?`${Math.ceil(boss.hp)}%`:'100%';$('playerStat').textContent=player?`${Math.ceil(player.hp)}%`:'100%';}
function start(){reset();state='playing';overlay.classList.add('hidden');last=performance.now();canvas.focus();requestAnimationFrame(loop)}
function pause(){if(state==='playing'){state='paused';showOverlay('PAUSA','Presioná P o el botón para seguir con el combate.','Continuar')}else if(state==='paused'){state='playing';overlay.classList.add('hidden');last=performance.now();requestAnimationFrame(loop)}}
function showOverlay(title,text,button){$('overlayTitle').textContent=title;$('overlayText').textContent=text;startBtn.textContent=button;overlay.classList.remove('hidden')}
startBtn.addEventListener('click',()=>{if(state==='paused')pause();else start()});
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);if(k==='p'){if(state==='playing'||state==='paused')pause()}if((k==='enter'||k===' ')&&(state==='ready'||state==='won'||state==='lost'))start()});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function toCanvas(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
canvas.addEventListener('pointermove',e=>{const p=toCanvas(e);mouse.x=p.x;mouse.y=p.y});canvas.addEventListener('pointerdown',e=>{if(e.button===0){mouse.down=true;const p=toCanvas(e);mouse.x=p.x;mouse.y=p.y;canvas.focus()}});window.addEventListener('pointerup',e=>{if(e.button===0)mouse.down=false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
function spawnParticle(x,y,color,n=8,power=100){for(let i=0;i<n;i++){let a=rand(0,Math.PI*2),v=rand(power*.25,power);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:rand(1,3),life:rand(.2,.65),maxLife:.65,color})}}
function shootPlayer(){let dx=mouse.x-player.x,dy=mouse.y-player.y,d=Math.hypot(dx,dy)||1;shots.push({x:player.x+dx/d*13,y:player.y+dy/d*13,vx:dx/d*590,vy:dy/d*590,r:3.2,life:1.5});player.fireCD=.14;spawnParticle(player.x+dx/d*12,player.y+dy/d*12,'#80f4ff',2,35)}
function fireBoss(){const alive=boss.armor.filter(a=>a.alive).length;const difficulty=1+(100-boss.hp)/170;const type=boss.pattern%3;
 if(type===0){ // radial ring
  const count=14;for(let i=0;i<count;i++){let a=(Math.PI*2/count)*i+boss.angle*.35;enemyShots.push({x:boss.x+Math.cos(a)*43,y:boss.y+Math.sin(a)*43,vx:Math.cos(a)*rand(125,158)*difficulty,vy:Math.sin(a)*rand(125,158)*difficulty,r:5,life:5,color:'#ff547d'})}
 }else if(type===1){ // aimed three-shot fan
  const base=Math.atan2(player.y-boss.y,player.x-boss.x);for(let i=-1;i<=1;i++){let a=base+i*.2;enemyShots.push({x:boss.x+Math.cos(a)*42,y:boss.y+Math.sin(a)*42,vx:Math.cos(a)*190*difficulty,vy:Math.sin(a)*190*difficulty,r:5.4,life:5,color:'#ffb45f'})}
 }else{ // alternating spiral-ish spray
  for(let i=0;i<8;i++){let a=boss.angle+i*Math.PI/4;enemyShots.push({x:boss.x+Math.cos(a)*43,y:boss.y+Math.sin(a)*43,vx:Math.cos(a)*165*difficulty,vy:Math.sin(a)*165*difficulty,r:4.5,life:5,color:'#e879ff'})}
 }
 boss.pattern++;boss.shootCD=Math.max(.47,1.22-gameTime*.005);shake=Math.max(shake,2);
}
function update(dt){gameTime+=dt;boss.angle+=boss.spin*dt;boss.spin=.78+Math.sin(gameTime*.7)*.24;
 stars.forEach(s=>{s.y+=s.sp*dt;if(s.y>H){s.y=0;s.x=rand(0,W)}});
 let mx=0,my=0;if(keys.has('arrowleft')||keys.has('a'))mx--;if(keys.has('arrowright')||keys.has('d'))mx++;if(keys.has('arrowup')||keys.has('w'))my--;if(keys.has('arrowdown')||keys.has('s'))my++;
 if(mx||my){const d=Math.hypot(mx,my);player.x+=mx/d*player.speed*dt;player.y+=my/d*player.speed*dt}
 player.x=clamp(player.x,18,W-18);player.y=clamp(player.y,18,H-18);player.invuln=Math.max(0,player.invuln-dt);player.fireCD-=dt;
 if(mouse.down&&player.fireCD<=0)shootPlayer();
 boss.shootCD-=dt;if(boss.shootCD<=0)fireBoss();
 for(let i=shots.length-1;i>=0;i--){let b=shots[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let remove=b.life<=0||b.x<-10||b.x>W+10||b.y<-10||b.y>H+10;
  if(!remove){const dx=b.x-boss.x,dy=b.y-boss.y,dist=Math.hypot(dx,dy),sector=Math.PI*2/8;const ang=((Math.atan2(dy,dx)-boss.angle)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);const idx=Math.round(ang/sector)%8;const rawDiff=Math.abs(ang-idx*sector);const ad=Math.min(rawDiff,Math.PI*2-rawDiff);const plate=boss.armor[idx];
   // Placas curvas aproximadas: solo bloquean en el anillo y dentro del ancho angular de cada pieza.
   if(plate.alive&&dist>43&&dist<77&&ad<sector*.37){plate.hp--;plate.flash=.14;spawnParticle(b.x,b.y,'#ffcc72',5,65);remove=true;if(plate.hp<=0){plate.alive=false;score+=100;spawnParticle(boss.x+Math.cos(boss.angle+idx*sector)*60,boss.y+Math.sin(boss.angle+idx*sector)*60,'#67e8f9',22,165);shake=7}}
   else if(dist<boss.r+4){if(boss.armor.every(a=>!a.alive)){boss.hp-=2.3;spawnParticle(b.x,b.y,'#83f7ff',3,55);score+=5;remove=true;if(boss.hp<=0){boss.hp=0;state='won';showOverlay('¡NÚCLEO DESTRUIDO!','Derrotaste al Guardián. Tu puntaje: '+score+'. Podés volver a jugar para probar otros movimientos.','Jugar de nuevo')}}}
  }
  if(remove)shots.splice(i,1);
 }
 for(let i=enemyShots.length-1;i>=0;i--){const b=enemyShots[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0||b.x<-20||b.x>W+20||b.y<-20||b.y>H+20){enemyShots.splice(i,1);continue}const d=Math.hypot(b.x-player.x,b.y-player.y);if(d<b.r+player.r&&player.invuln<=0){enemyShots.splice(i,1);player.hp-=20;player.invuln=.8;shake=8;spawnParticle(player.x,player.y,'#ff638e',17,130);if(player.hp<=0){player.hp=0;state='lost';showOverlay('SISTEMA DAÑADO','El Guardián te venció. Probá moverte alrededor de la arena y no quedarte quieto. Puntaje: '+score,'Reintentar')}}}
 for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.12,dt);p.vy*=Math.pow(.12,dt);p.life-=dt;if(p.life<=0)particles.splice(i,1)}
 boss.armor.forEach(a=>a.flash=Math.max(0,a.flash-dt));shake=Math.max(0,shake-30*dt);score+=dt*2;updateStats();
}
function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function draw(){ctx.save();if(shake>0)ctx.translate(rand(-shake,shake),rand(-shake,shake));ctx.clearRect(-20,-20,W+40,H+40);
 const bg=ctx.createRadialGradient(CX,CY,15,CX,CY,580);bg.addColorStop(0,'#111d37');bg.addColorStop(1,'#050916');ctx.fillStyle=bg;ctx.fillRect(-20,-20,W+40,H+40);
 stars.forEach(s=>{ctx.globalAlpha=s.a;ctx.fillStyle='#d6eeff';ctx.fillRect(s.x,s.y,s.r,s.r)});ctx.globalAlpha=1;
 // Arena guides
 ctx.strokeStyle='#28405d55';ctx.lineWidth=1;for(let r=70;r<500;r+=70){ctx.beginPath();ctx.arc(CX,CY,r,0,Math.PI*2);ctx.stroke()}for(let x=0;x<=W;x+=80)line(x,0,x,H,'#20345122');for(let y=0;y<=H;y+=80)line(0,y,W,y,'#20345122');
 // Boss rotation arms
 ctx.save();ctx.translate(boss.x,boss.y);ctx.rotate(-boss.angle*.6);for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.fillStyle='#1c3554';ctx.strokeStyle='#4c789c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(25,-8);ctx.lineTo(90,-5);ctx.lineTo(104,0);ctx.lineTo(90,5);ctx.lineTo(25,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#67e8f955';ctx.fillRect(44,-2,30,4)}ctx.restore();
 // spinning outer ring
 ctx.save();ctx.translate(boss.x,boss.y);ctx.rotate(boss.angle);ctx.beginPath();ctx.arc(0,0,82,0,Math.PI*2);ctx.strokeStyle='#5f8cab66';ctx.lineWidth=2;ctx.setLineDash([5,8]);ctx.stroke();ctx.setLineDash([]);
 // Armor pieces as thick arc-wall segments
 const sector=Math.PI*2/8;boss.armor.forEach((p,i)=>{if(!p.alive)return;const a=i*sector;const start=a-sector*.37,end=a+sector*.37;ctx.beginPath();ctx.arc(0,0,60,start,end);ctx.strokeStyle=p.flash>0?'#ffffff':(p.hp===1?'#ff8d68':'#ffbd62');ctx.lineWidth=15;ctx.lineCap='butt';ctx.stroke();ctx.beginPath();ctx.arc(0,0,60,start,end);ctx.strokeStyle='#fff2b866';ctx.lineWidth=2;ctx.stroke();const mid=a;const tx=Math.cos(mid)*60,ty=Math.sin(mid)*60;ctx.fillStyle='#fff5cf';ctx.beginPath();ctx.arc(tx,ty,2.2,0,Math.PI*2);ctx.fill()});ctx.restore();
 // core
 const exposed=boss.armor.every(a=>!a.alive);ctx.save();ctx.translate(boss.x,boss.y);ctx.rotate(boss.angle*.45);ctx.shadowBlur=exposed?30:16;ctx.shadowColor=exposed?'#67e8f9':'#ed4f87';ctx.fillStyle=exposed?'#153e55':'#331c3e';ctx.strokeStyle=exposed?'#8bf4ff':'#ff78a5';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<6;i++){let a=i*Math.PI/3-Math.PI/6,r=i%2===0?boss.r:boss.r*.82;let x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.rotate(-boss.angle*.9+gameTime*1.8);for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ctx.fillStyle=exposed?'#72f1ff':'#d95189';ctx.fillRect(-2,-18,4,16)}const pulse=1+Math.sin(gameTime*5)*.08;ctx.beginPath();ctx.arc(0,0,11*pulse,0,Math.PI*2);ctx.fillStyle=exposed?'#b5fbff':'#ffb2d0';ctx.fill();ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.restore();
 // boss health arc
 ctx.beginPath();ctx.arc(boss.x,boss.y,103,-Math.PI/2,-Math.PI/2+Math.PI*2*(boss.hp/boss.maxHp));ctx.strokeStyle='#68e8f9';ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.arc(boss.x,boss.y,103,-Math.PI/2,Math.PI*1.5);ctx.strokeStyle='#ffffff20';ctx.lineWidth=3;ctx.stroke();
 // bullets
 shots.forEach(b=>{ctx.save();ctx.shadowBlur=13;ctx.shadowColor='#72f4ff';ctx.fillStyle='#d9fcff';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.restore()});enemyShots.forEach(b=>{ctx.save();ctx.shadowBlur=12;ctx.shadowColor=b.color;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff8';ctx.lineWidth=1;ctx.stroke();ctx.restore()});
 // player cursor craft
 const aim=Math.atan2(mouse.y-player.y,mouse.x-player.x);ctx.save();ctx.translate(player.x,player.y);ctx.rotate(aim);ctx.globalAlpha=player.invuln>0&&Math.floor(gameTime*18)%2===0?.32:1;ctx.shadowBlur=17;ctx.shadowColor='#69eaff';ctx.fillStyle='#72eaff';ctx.strokeStyle='#e8fdff';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-8,-8);ctx.lineTo(-4,0);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();ctx.restore();ctx.globalAlpha=1;
 // particles
 particles.forEach(p=>{ctx.globalAlpha=clamp(p.life/p.maxLife,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
 // Aim reticle
 ctx.strokeStyle='#b7f8ffbb';ctx.lineWidth=1;ctx.beginPath();ctx.arc(mouse.x,mouse.y,7,0,Math.PI*2);ctx.stroke();line(mouse.x-12,mouse.y,mouse.x-5,mouse.y,'#b7f8ff99');line(mouse.x+5,mouse.y,mouse.x+12,mouse.y,'#b7f8ff99');line(mouse.x,mouse.y-12,mouse.x,mouse.y-5,'#b7f8ff99');line(mouse.x,mouse.y+5,mouse.x,mouse.y+12,'#b7f8ff99');
 // in-arena hint and progress
 ctx.font='700 11px system-ui';ctx.fillStyle='#9fb6d4';ctx.fillText('GUARDIÁN // '+(boss.armor.every(a=>!a.alive)?'NÚCLEO EXPUESTO':'ARMADURA ACTIVA'),18,24);ctx.fillStyle='#6b829f';ctx.fillText('PUNTAJE '+String(Math.floor(score)).padStart(5,'0'),W-118,24);
 ctx.restore();
}
function loop(now){if(state!=='playing')return;const dt=Math.min(.033,Math.max(0,(now-last)/1000));last=now;fpsFrames++;fpsClock+=dt;if(fpsClock>=.5){fps=Math.round(fpsFrames/fpsClock);$('fpsStat').textContent=fps;fpsClock=0;fpsFrames=0}update(dt);draw();if(state==='playing')requestAnimationFrame(loop);else draw()}
reset();draw();
})();
