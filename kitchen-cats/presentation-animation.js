export function createPresentationState(){return {players:new Map(),serveBaseline:0,serveBurstUntil:0,serveBurstId:0,serveBurstStart:0,phase:null};}
export function resetPresentation(s,x={}){s.players.clear();s.serveBaseline=x.served||0;s.serveBurstUntil=0;s.serveBurstId=0;s.serveBurstStart=0;s.phase=x.phase||null;}
export function updatePhasePresentation(s,x){if(s.phase!==x.phase){resetPresentation(s,x);return true;}return false;}
export function updatePlayerVisual(s,p,t,r=false){let q=s.players.get(p.id);let moving=!!q&&Math.hypot(p.x-q.x,p.y-q.y)>.25;s.players.set(p.id,{x:p.x,y:p.y});let pose=r?0:Math.floor(t/100)%4;return {moving,pose,bob:r?0:[-1,0,1,0][pose],tilt:r?0:(moving?[0,.02,-.02,0][pose]:0)};}
export function updateServeEffect(s,n,t,r=false){if(n<s.serveBaseline){s.serveBaseline=n;s.serveBurstUntil=0;s.serveBurstStart=0;} if(n>s.serveBaseline){s.serveBaseline=n;s.serveBurstStart=t;s.serveBurstUntil=t+700;s.serveBurstId++;}return {active:!r&&t<s.serveBurstUntil,id:s.serveBurstId,age:t-s.serveBurstStart};}
export function prepPose(t,r=false){return r?0:Math.floor(t/100)%4;}
export function potEffect(t,a,r=false){return {active:a&&!r,frame:a&&!r?Math.floor(t/180)%4:0};}
export function burstOffset(i,age,r=false){if(r)return {x:0,y:0,a:1};let life=Math.max(0,1-age/700);return {x:(i-2.5)*life*8,y:-life*18+i*2,a:life};}
