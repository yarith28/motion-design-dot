import fs from 'node:fs';
import {solve,lossPlan,runSeed} from './field-room-plans.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../field-room/games.json',import.meta.url)));
const output={runSeed,provenance:'Author source-informed pure-engine search/control plans, replayed through native public UI. Not unaided or independent discovery. No shipped solver or state hook.',games:{}};
for(const g of manifest){const finite=[];for(let stage=0;stage<3;stage++){const p=solve(g.id,stage);finite.push({actions:p.actions,score:p.score});}const first=solve(g.id,0),loss=lossPlan(g.id,first.initial),optional=[];if(g.endless.supported)for(let stage=0;stage<2;stage++){const p=solve(g.id,stage,'endless');optional.push({actions:p.actions,score:p.score});}output.games[g.id]={finite,loss,optional};console.log(JSON.stringify({id:g.id,finiteActions:finite.map(p=>p.actions.length),lossActions:loss.length,optionalActions:optional.map(p=>p.actions.length)}));}
fs.writeFileSync(new URL('field-room-paths.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
