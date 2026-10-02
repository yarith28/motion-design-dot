import{durable,pipeline}from'../protocol-room/execution.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
export function durablePlan(initial){const s=clone(initial),a=[];const act=k=>{a.push(k);durable.act(s,k);if(s.outcome==='loss')throw Error(s.note)};for(let i=0;i<s.updates[0].length;i++)act('append:0:'+i);act('commit');act('flush');if(s.capacity<s.updates.flat().length+1)act('checkpoint');for(let i=0;i<s.updates[1].length;i++)act('append:1:'+i);act('flush');act('disk:'+s.journal.filter(e=>e.tx===1&&!e.commit).at(-1).lsn);act('crash');while(s.phase==='redo')act('redo:'+s.redo[0]);while(s.phase==='undo')act('undo:'+s.undo[0]);act('audit');return a}
export function pipelinePlan(initial){const s=clone(initial),a=[];const act=k=>{a.push(k);pipeline.act(s,k);if(s.outcome==='loss')throw Error(s.note)};for(let i=0;i<s.program.length;i++){if(s.jobs[i].state==='squashed')continue;act('issue:'+i);while(s.jobs[i].state==='running')act('tick');if(i===5)act('resolve');act('retire')}act('audit');return a}
export const executionModels={'durable-ink':durable,'pipeline-parade':pipeline};
export const executionPlans={'durable-ink':durablePlan,'pipeline-parade':pipelinePlan};
