import {a,range,shuffle,finish,turnNote,panelLog} from './core.mjs';
const names=['Ruby','Gold','Silver','Cloth','Spice','Leather','Camel'];
const initial=[[7,7,5,5,5],[6,6,5,5,5],[5,5,5,5,5],[5,3,3,2,2,1,1],[5,3,3,2,2,1,1],[4,3,2,1,1,1,1,1,1]];
const bonus=n=>n>=5?7:n===4?4:n===3?2:0;
const count=(cards,t)=>cards.filter(x=>x===t).length;
const payout=(s,t,n)=>s.tokens[t].slice(0,n).reduce((x,y)=>x+y,0)+bonus(n);
function end(s){const herd=s.herds[0]===s.herds[1]?[0,0]:s.herds[0]>s.herds[1]?[5,0]:[0,5],v=s.points.map((p,i)=>p+herd[i]);finish(s,v[0]>v[1]?'win':v[0]<v[1]?'loss':'draw',`Market closes. You ${s.points[0]} + herd ${herd[0]} = ${v[0]}; house ${s.points[1]} + herd ${herd[1]} = ${v[1]}. Unsold goods earn nothing. ${v[0]>v[1]?'You win.':v[0]<v[1]?'House wins.':'A tie.'}`);}
function replenish(s){while(s.market.length<5&&s.deck.length)s.market.push(s.deck.shift());if(s.market.length<5)end(s);}
function sell(s,p,t,n){s.points[p]+=payout(s,t,n);for(let i=0;i<n;i++){s.hands[p].splice(s.hands[p].indexOf(t),1);s.tokens[t].shift();}turnNote(s,`${p?'House':'You'} sold ${n} ${names[t]} for ${s.lastGain} coins.`);}
function perform(s,p,act){
 if(act.kind==='sell'){s.lastGain=payout(s,act.t,act.n);sell(s,p,act.t,act.n);}
 if(act.kind==='take'){const t=s.market.splice(act.i,1)[0];s.hands[p].push(t);turnNote(s,`${p?'House':'You'} took one ${names[t]}.`);replenish(s);}
 if(act.kind==='camels'){const n=count(s.market,6);s.herds[p]+=n;s.market=s.market.filter(t=>t!==6);turnNote(s,`${p?'House':'You'} gathered ${n} camels.`);replenish(s);}
 if(act.kind==='exchange'){const picked=act.market.map(i=>s.market[i]),given=act.hand.map(i=>s.hands[p][i]);s.market=s.market.filter((_,i)=>!act.market.includes(i));s.hands[p]=s.hands[p].filter((_,i)=>!act.hand.includes(i));s.hands[p].push(...picked);s.herds[p]-=act.camels;s.market.push(...given,...Array(act.camels).fill(6));turnNote(s,`${p?'House':'You'} exchanged ${given.map(t=>names[t]).join(', ')}${act.camels?' + '+act.camels+' camels':''} for ${picked.map(t=>names[t]).join(', ')}.`);}
 s.turns++;if(!s.done&&(s.tokens.filter(t=>t.length===0).length>=3||s.turns>=48))end(s);
}
function worth(s,p,t){const n=count(s.hands[p],t),left=s.tokens[t];if(!left.length)return -.5;return (left[0]||0)*.62+(n===1&&t<3?3:0)+(n===2?2.2:n===3?2.6:n===4?3:0)-n*.1;}
function subsets(arr,n){const out=[];function visit(pos,cur){if(cur.length===n){out.push(cur);return;}for(let i=pos;i<arr.length;i++)visit(i+1,[...cur,arr[i]]);}visit(0,[]);return out;}
function house(s){
 const p=1,options=[];for(let t=0;t<6;t++)for(let n=t<3?2:1;n<=count(s.hands[p],t);n++)options.push({kind:'sell',t,n,value:payout(s,t,n)*.68+(s.hands[p].length>=6?2:0)+(s.tokens.filter(x=>!x.length).length>=2?2:0)-(n<3&&count(s.hands[p],t)>=3?2:0)});
 if(s.hands[p].length<7)s.market.forEach((t,i)=>{if(t!==6)options.push({kind:'take',i,value:worth(s,p,t)});});
 const herd=count(s.market,6);if(herd)options.push({kind:'camels',value:herd*(s.herds[p]<3?1.7:.55)+(s.herds[p]===0?1:0)});
 const available=s.market.map((t,i)=>t===6?-1:i).filter(i=>i>=0);
 for(let n=2;n<=Math.min(3,available.length);n++)for(const market of subsets(available,n)){
  const handOrder=s.hands[p].map((t,i)=>({i,w:worth(s,p,t)})).sort((x,y)=>x.w-y.w);
  for(let camels=0;camels<=Math.min(n,s.herds[p]);camels++){
   const give=n-camels;if(give>handOrder.length||s.hands[p].length+camels>7)continue;
   const hand=handOrder.slice(0,give).map(x=>x.i),incoming=market.map(i=>s.market[i]);
   if(incoming.some(t=>hand.some(i=>s.hands[p][i]===t)))continue;
   const value=incoming.reduce((z,t)=>z+worth(s,p,t),0)-hand.reduce((z,i)=>z+worth(s,p,s.hands[p][i]),0)-camels*.8-.5;
   options.push({kind:'exchange',market,hand,camels,value});
  }
 }
 if(!options.length){end(s);return;}
 options.sort((x,y)=>y.value-x.value);perform(s,1,options[0]);
}
function validExchange(s){const n=s.take.length;if(n<2||n!==s.give.length+s.giveCamels||s.hands[0].length+s.giveCamels>7)return false;return !s.take.some(i=>s.give.some(j=>s.market[i]===s.hands[0][j]));}
function clear(s){s.take=[];s.give=[];s.giveCamels=0;}
export default {
 init(s){s.deck=shuffle(s,[...Array(6).fill(0),...Array(6).fill(1),...Array(6).fill(2),...Array(8).fill(3),...Array(8).fill(4),...Array(10).fill(5),...Array(8).fill(6)]);s.hands=[s.deck.splice(0,5),s.deck.splice(0,5)];s.herds=s.hands.map(h=>count(h,6));s.hands=s.hands.map(h=>h.filter(t=>t!==6));s.market=[6,6,6,...s.deck.splice(0,2)];s.tokens=initial.map(x=>[...x]);s.points=[0,0];s.turns=0;clear(s);s.note='Take a good, gather camels, build an exchange, or sell a set. Preview the competed reward stacks.';},
 actions(s){const out=[];s.market.forEach((t,i)=>{if(t!==6){out.push(a('market:'+i,`Exchange: ${names[t]} at market ${i+1}`,'Build exchange',s.take.includes(i)));if(s.hands[0].length<7)out.push(a('take:'+i,`Take ${names[t]} at market ${i+1}`,'Take'));}});if(count(s.market,6))out.push(a('camels',`Gather all ${count(s.market,6)} market camels`,'Take'));
 s.hands[0].forEach((t,i)=>out.push(a('hand:'+i,`Offer ${names[t]} card ${i+1}`,'Build exchange',s.give.includes(i))));if(s.giveCamels<s.herds[0])out.push(a('camel+','Offer another camel','Build exchange'));if(s.giveCamels)out.push(a('camel-','Return one offered camel','Build exchange'));if(s.take.length||s.give.length||s.giveCamels)out.push(a('clear','Clear exchange selection','Build exchange'));if(validExchange(s))out.push(a('exchange','Confirm balanced exchange','Build exchange'));
 for(let t=0;t<6;t++)for(let n=t<3?2:1;n<=count(s.hands[0],t);n++)out.push(a(`sell:${t}:${n}`,`Sell ${n} ${names[t]} → ${payout(s,t,n)} coins`,'Sell'));
 return out;},
 move(s,c){const [kind,z,q]=c.split(':');if(kind==='market'||kind==='hand'){const list=kind==='market'?s.take:s.give,i=Number(z);list.includes(i)?list.splice(list.indexOf(i),1):list.push(i);s.note='Selection only. No turn spent. Incoming and offered counts must match; exchange at least two goods.';return;}if(c==='camel+'||c==='camel-'){s.giveCamels+=c==='camel+'?1:-1;return;}if(c==='clear'){clear(s);return;}
 const act=kind==='take'?{kind,i:Number(z)}:kind==='sell'?{kind,t:Number(z),n:Number(q)}:kind==='exchange'?{kind,market:[...s.take],hand:[...s.give],camels:s.giveCamels}:{kind};perform(s,0,act);clear(s);if(!s.done)house(s);if(!s.done)s.note+=' Your move.';},
 view(s){return {stats:[`You ${s.points[0]} coins`,`House ${s.points[1]} coins`,`Your hand ${s.hands[0].length}/7`,`Turn ${s.turns}/48`],panels:[['Market',s.market.map((t,i)=>`${i+1}: ${names[t]}`).join(' · ')],['Your goods',names.slice(0,6).map((t,i)=>`${t}: ${count(s.hands[0],i)}`).join(' · ')],['Herds and supply',`You ${s.herds[0]} camels; house ${s.herds[1]}. House holds ${s.hands[1].length} private goods. ${s.deck.length} cards left in the unseen deck.`],['Exchange preview',`Take ${s.take.length}: ${s.take.map(i=>names[s.market[i]]).join(', ')||'none'}. Give ${s.give.length+s.giveCamels}: ${s.give.map(i=>names[s.hands[0][i]]).join(', ')||'no goods'} and ${s.giveCamels} camels. ${validExchange(s)?'Balanced and legal.':'Choose equal counts of at least two. No same-type swap back. Maximum seven held goods.'}`],['Rewards — leftmost pays next',names.slice(0,6).map((t,i)=>`${t}: ${s.tokens[i].join(', ')||'empty'}`).join('\n')+'\nSet bonuses: 3 goods +2; 4 goods +4; 5 or more +7. Rare Ruby/Gold/Silver need at least 2 per sale.'],['Closing rules','Three empty reward stacks, a market that cannot refill, or 48 combined turns closes the market. Unsold goods are worthless. Larger camel herd gains 5; tied herds gain nothing. House uses its own hand and the public market, not your private goods or deck order.'],panelLog(s)]};}
};
