export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const sum=a=>a.reduce((x,y)=>x+y,0);
export const action=(id,label,detail='')=>({id,label,detail});
export const card=(label,value,detail='',tone='')=>({label,value,detail,tone});
export const finish=(s,won,note)=>{s.done=true;s.won=won;s.note=note;return s;};
export const base=()=>({turn:0,done:false,won:false,note:'Take your time. The next turn waits for your decision.',log:[]});
export function advance(s,message){s.turn++;s.note=message;s.log.push(message);s.log=s.log.slice(-6);}
