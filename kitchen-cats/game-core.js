// Browser-only Kitchen Cats simulation core with optional host-authoritative multiplayer.
export const stations=[{id:"tomato",x:110,y:95,kind:"source"},{id:"carrot",x:280,y:95,kind:"source"},{id:"prep",x:460,y:95,kind:"prep"},{id:"pot",x:690,y:95,kind:"pot"},{id:"pass",x:400,y:370,kind:"pass"},{id:"serve",x:690,y:540,kind:"serve"},{id:"bin",x:110,y:540,kind:"bin"}];

const clampInput=(x,y)=>{x=Number(x);y=Number(y);if(!Number.isFinite(x)||!Number.isFinite(y))return {x:0,y:0};const n=Math.hypot(x,y)||1;return {x:Math.max(-1,Math.min(1,x/n)),y:Math.max(-1,Math.min(1,y/n))};};

export class KitchenGame {
 constructor(clock=()=>Date.now()){this.clock=clock;this.listeners=[];this.reset();}
 on(fn){this.listeners.push(fn);return()=>this.listeners=this.listeners.filter(x=>x!==fn)}
 emit(){this.listeners.forEach(f=>f(this.snapshot()))}
 reset(){this.state={phase:"playing",ends:this.clock()+90000,score:0,served:0,missed:0,next:0,orders:[],prep:null,pot:null,pass:null,notice:"Aprons on! Let's make soup."};this.players=new Map();this.hostId=null;const api=(id)=>id===undefined?this.players.get("solo")||this.players.values().next().value:this.players.get(id);this.player=new Proxy(api,{get:(t,k)=>k in t?t[k]:api()[k],set:(t,k,v)=>{api()[k]=v;return true;}});this.addPlayer("solo","Chef",0);this.addOrder();this.addOrder();this.emit()}
 addPlayer(id,name="Chef",avatar=0){if(this.players.size>=4)return false;if(this.players.has(id))return false;this.players.set(id,{id,name,avatar,x:280+this.players.size*20,y:270,held:null,input:{x:0,y:0},connected:true});if(this.hostId===null)this.hostId=id;this.emit();return true}
 removePlayer(id){const p=this.players.get(id);if(!p)return false;this.players.delete(id);if(this.hostId===id)this.hostId=this.players.keys().next().value??null;this.emit();return true}
 snapshot(){return JSON.parse(JSON.stringify({...this.state,code:"SOLO",host:this.hostId,solo:this.players.size===1,now:this.clock(),players:[...this.players.values()],stations}))}
 addOrder(){this.state.orders.push({id:String(Math.random()),recipe:["tomato","carrot"][this.state.next++%2],expires:this.clock()+15000})}
 getPlayer(id){return this.players.get(id)}
 move(id,x,y){if(y===undefined){y=x; x=id; id="solo"} const p=this.getPlayer(id);if(!p)return false;p.input=clampInput(x,y);return true}
 tick(dt=.05){const now=this.clock();if(this.state.phase!=="playing")return;if(now>=this.state.ends){this.state.phase="results";this.emit();return}for(const p of this.players.values()){p.x=Math.max(40,Math.min(760,p.x+p.input.x*190*dt));p.y=Math.max(175,Math.min(465,p.y+p.input.y*190*dt));}let expired=this.state.orders.filter(o=>o.expires<=now);if(expired.length){this.state.missed+=expired.length;this.state.score=Math.max(0,this.state.score-expired.length*20);this.state.orders=this.state.orders.filter(o=>o.expires>now);this.addOrder()}this.emit()}
 interact(id,stationId){if(stationId===undefined){stationId=id;id="solo"} const p=this.getPlayer(id);let s=stations.find(x=>x.id===stationId),n=this.clock();if(!p||!s||Math.hypot(p.x-s.x,p.y-s.y)>110)return false;
 if(s.kind==="source"){if(p.held)return false;p.held=s.id}
 if(s.kind==="prep"){if(this.state.prep){if(n<this.state.prep.ready||p.held)return false;p.held=this.state.prep.item;this.state.prep=null}else{if(!["tomato","carrot"].includes(p.held))return false;this.state.prep={item:"chopped-"+p.held,ready:n+3000};p.held=null}}
 if(s.kind==="pot"){if(this.state.pot){if(n<this.state.pot.ready||p.held)return false;p.held=this.state.pot.item;this.state.pot=null}else{if(!p.held?.startsWith("chopped-"))return false;this.state.pot={item:p.held.replace("chopped-","soup-"),ready:n+5000};p.held=null}}
 if(s.kind==="pass"){[p.held,this.state.pass]=[this.state.pass||null,p.held]}
 if(s.kind==="bin")p.held=null;
 if(s.kind==="serve"){let i=this.state.orders.findIndex(o=>"soup-"+o.recipe===p.held&&o.expires>n);if(i<0)return false;this.state.score+=100;this.state.served++;this.state.orders.splice(i,1);this.addOrder();p.held=null}
 this.emit();return true}
 replay(){this.reset()}
}
