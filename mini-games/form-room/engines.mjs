import{ textile }from'./textile.mjs';
import{structure}from'./structure.mjs';
import{material}from'./material.mjs';
import{process}from'./process.mjs';
import{equilibrium}from'./equilibrium.mjs';
import{matter}from'./matter.mjs';
import{acoustics}from'./acoustics.mjs';
import{shaping}from'./shaping.mjs';
import{contact}from'./contact.mjs';
export const engines={...textile,...structure,...material,...process,...equilibrium,...matter,...acoustics,...shaping,...contact};
for(const engine of Object.values(engines)){const act=engine.act;engine.act=(s,a)=>{if(s.outcome==='playing')act(s,a);};}
