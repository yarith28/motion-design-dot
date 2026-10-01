export const win=(s,note='Every requirement is satisfied.')=>{s.outcome='win';s.note=note};
export const lose=(s,note)=>{s.outcome='loss';s.note=note};
export const reject=(s,note)=>{s.errors=(s.errors||0)+1;s.note=note+' Review '+s.errors+'/3.';if(s.errors>=3)lose(s,'Three unsuccessful certifications. '+note)};
export const base=()=>({outcome:'playing',note:'Read the current brief. Choose your first action.',errors:0});
export const sum=a=>a.reduce((x,y)=>x+y,0);
export const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
