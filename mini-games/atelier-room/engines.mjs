import{mechanical}from'./mechanical.mjs';
import{materials}from'./materials.mjs';
import{optics}from'./optics.mjs';
import{construction}from'./construction.mjs';
export const engines={...mechanical,...materials,...optics,...construction};

for(const engine of Object.values(engines)){const action=engine.act;engine.act=(s,a)=>{if(s.outcome==='playing')return action(s,a);};}
