import{deltas,watermarks}from'../protocol-room/streams.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
export function deltaPlan(initial){const s=clone(initial),a=[];const act=k=>{a.push(k);deltas.act(s,k);if(s.outcome==='loss')throw Error(s.note)};while(s.outcome==='playing'){const e=s.epochs[s.at];if(e.left.some(Boolean)){act('left:delta');act('right:old');act('join')}if(e.right.some(Boolean)){act('left:new');act('right:delta');act('join')}act('commit')}return a}
export function watermarkPlan(initial){const s=clone(initial),a=[];const act=k=>{a.push(k);watermarks.act(s,k);if(s.outcome==='loss')throw Error(s.note)};for(let w=0;w<s.count;w++){for(let i=0;i<s.n;i++)while(s.progress[i]<(w+1)*s.width){if(s.buffer.length>=s.capacity&&s.queue[i][s.at[i]].kind==='event')act('spill');act('next:'+i)}act('mark:'+((w+1)*s.width));act('publish');act('close:'+w)}act('audit');return a}
export const streamModels={'delta-garden':deltas,'timestamp-current':watermarks};
export const streamPlans={'delta-garden':deltaPlan,'timestamp-current':watermarkPlan};
