import{boards}from'./opposed-boards.mjs';
import{markets}from'./market-games.mjs';
import{collective}from'./collective-games.mjs';
import{living}from'./living-ledgers.mjs';
import{legalActions}from'./core.mjs';
const models={...boards,...markets,...collective,...living};
// The same rendered legal controls validate pure-model and browser input.
export const engines=Object.fromEntries(Object.entries(models).map(([id,e])=>[id,{...e,act(s,k){if(s.outcome!=='playing'||!legalActions(e,s).includes(k))return;e.act(s,k)}}]));
