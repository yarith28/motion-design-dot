import cards from './cards.mjs';
import boards from './boards.mjs';
const games={...cards,...boards};
export const ids=Object.keys(games);
export function start(id,seed=87321){if(!games[id])throw Error('Unknown game '+id);const s={id,seed:seed>>>0,done:false,outcome:null,note:'Your move. Take your time.'};games[id].init(s);return s;}
export function actions(s){return s.done?[]:games[s.id].actions(s);}
export function step(s,code){if(s.done||!actions(s).some(a=>a.code===String(code)))return s;const n=structuredClone(s);games[n.id].move(n,String(code));return n;}
export function view(s){return games[s.id].view(s);}
