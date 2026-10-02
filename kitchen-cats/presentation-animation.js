export function createPresentationState(){return {players:new Map(),serveBaseline:0,serveBurstUntil:0,serveBurstStart:0,serveBurstId:0,phase:null};}
export function resetPresentation(s,x={}){s.players.clear();s.serveBaseline=x.served??0;s.serveBurstUntil=0;s.serveBurstStart=0;s.serveBurstId=0;s.phase=x.phase??null;}
export function updatePhasePresentation(s,x){if(s.phase!==x.phase){resetPresentation(s,x);return true;}return false;}
export function updatePlayerVisual(s,player,context={}){
 const now=context.now??0, reduced=!!context.reducedMotion, prev=s.players.get(player.id);
 const moved=!!prev && Math.hypot(player.x-prev.x,player.y-prev.y)>.25;
 const lastMovedAt=moved?now:(prev?.lastMovedAt??-Infinity);
 s.players.set(player.id,{x:player.x,y:player.y,lastMovedAt});
 const recent=now-lastMovedAt<200;
 let row=0,mode="idle";
 if(context.celebrate){row=3;mode="celebrate";}
 else if(context.nearPrep && context.prepActive && !recent){row=1;mode="chop";}
 else if(context.nearPot && context.potActive && !recent){row=2;mode="stir";}
 else if(recent){row=0;mode="walk";}
 const frame = reduced || mode === "idle" ? 0 : Math.floor(now/125)%4;
 return {row,frame,mode,moving:recent,bob:0,tilt:0};
}
export function updateServeEffect(s,n,t,r=false){if(n<s.serveBaseline){s.serveBaseline=n;s.serveBurstUntil=0;s.serveBurstStart=0;} if(n>s.serveBaseline){s.serveBaseline=n;s.serveBurstStart=t;s.serveBurstUntil=t+700;s.serveBurstId++;}return {active:!r&&t<s.serveBurstUntil,id:s.serveBurstId,age:t-s.serveBurstStart};}
export function prepPose(t,r=false){return r?0:Math.floor(t/125)%4;}
export function potEffect(t,a,r=false){return {active:a&&!r,frame:r?0:Math.floor(t/125)%4};}
export function burstOffset(i,age,r=false){if(r)return {x:0,y:0,a:1};const life=Math.max(0,1-age/700);return {x:(i-2.5)*8*life,y:-life*18,a:life};}
