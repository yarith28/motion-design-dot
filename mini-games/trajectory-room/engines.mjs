import {orbits} from './orbits.mjs';
import {contact} from './contact.mjs';
import {handles} from './handles.mjs';
import {fluids} from './fluids.mjs';
import {transport} from './transport.mjs';
export const engines={...orbits,...contact,...handles,...fluids,...transport};

// Terminal outcomes are stable for both native lifecycle and pure model callers.
for(const engine of Object.values(engines)){const act=engine.act;engine.act=(state,action)=>{if(state.outcome==='playing')act(state,action)}}
