import {base,action,card,advance,finish,sum} from './core.mjs';
export const scenarios=[
 {name:'Storm window',weather:['calm','wind','flood','flood','calm','dry','wind','calm','flood','calm'],quotes:[[6,5,7],[7,6,5],[10,8,4],[12,6,7],[6,9,8],[7,5,9],[6,10,6],[9,6,5],[8,7,6],[5,4,5]],goal:44},
 {name:'Long dry season',weather:['dry','calm','dry','wind','calm','dry','dry','flood','calm','calm'],quotes:[[9,5,8],[5,9,6],[7,6,11],[6,11,7],[10,5,8],[7,9,12],[8,6,10],[11,7,6],[7,6,5],[6,5,4]],goal:58}
];
const types=[
 {id:'home',name:'Riverside homes',bond:22,days:3,loss:{flood:7,wind:2,dry:0}},
 {id:'boat',name:'Harbor boats',bond:16,days:2,loss:{wind:7,flood:2,dry:0}},
 {id:'farm',name:'Market farms',bond:18,days:4,loss:{dry:6,flood:2,wind:0}}
];
const scenario=s=>scenarios[s.scenario],reserved=s=>sum(s.active.map(p=>types.find(t=>t.id===p.type).bond));
export const rules=[
 'Each day accept one insurance quote or decline. Homes cover 3 days, boats 2, farms 4, including today. Premium arrives now; every active policy pays its listed loss on every matching weather day. The complete weather and quote calendar is public.',
 'Before accepting, free capital must cover collateral: homes 22, boats 16, farms 18. Free capital is total capital minus all active collateral. A new premium cannot fund its own collateral. Collateral is locked until that policy finishes its last daily claim check; overlapping policies compete for the same capital. Claims can push free capital below zero, but total capital must stay positive.',
 'Start with 24 capital. In 10 days write at least 5 policies and reach the scenario’s free-capital target. Collateral still locked at closing does not count toward the target. A longer contract may block a valuable later quote. Restart repeats this scenario; choose the other scenario for a different weather and quote schedule.'
];
export const init=(which=0)=>({...base(),scenario:which===1?1:0,cash:24,active:[],written:0,claims:0});
export const choices=s=>[
 ...types.filter(t=>s.cash-reserved(s)>=t.bond).map((t,i)=>action(t.id,`Insure ${t.name}`,`Premium ${scenario(s).quotes[s.turn][types.indexOf(t)]}; lock ${t.bond} for ${t.days} days`)),
 action('decline','Decline today','Keep capital free; current policies still settle')
];
export function apply(s,a){
 const data=scenario(s);if(a!=='decline'){const t=types.find(t=>t.id===a);s.cash+=data.quotes[s.turn][types.indexOf(t)];s.active.push({type:a,left:t.days});s.written++;}
 const w=data.weather[s.turn],paid=sum(s.active.map(p=>types.find(t=>t.id===p.type).loss[w]||0));s.cash-=paid;s.claims+=paid;
 s.active.forEach(p=>p.left--);const released=sum(s.active.filter(p=>p.left===0).map(p=>types.find(t=>t.id===p.type).bond));s.active=s.active.filter(p=>p.left>0);
 advance(s,`${w}: ${paid} claims paid; ${released} collateral released. Free capital ${s.cash-reserved(s)}.`);
 if(s.cash<=0)return finish(s,false,'Claims exhausted total capital. Overlapping policies share each weather loss.');
 if(s.turn===10)return finish(s,s.cash-reserved(s)>=data.goal&&s.written>=5,`Free capital ${s.cash-reserved(s)}/${data.goal}; ${s.written}/5 policies. Total ${s.cash}, locked collateral ${reserved(s)}.`);
}
export const view=s=>({
 stats:[['Day',`${s.turn}/10`],['Free capital',`${s.cash-reserved(s)}/${scenario(s).goal}`],['Written',`${s.written}/5`]],
 cards:[card('Capital account',s.cash,`${reserved(s)} locked; new policy collateral must fit before its premium arrives`),...types.map((t,i)=>card(t.name,`${s.active.filter(p=>p.type===t.id).length} active`,`${t.days} days; collateral ${t.bond}; ${scenario(s).quotes[s.turn]?'today premium '+scenario(s).quotes[s.turn][i]+'; ':''}loss flood ${t.loss.flood}, wind ${t.loss.wind}, dry ${t.loss.dry}`)),...s.active.map((p,i)=>card(`Policy ${i+1}: ${p.type}`,`${p.left} claim checks left`,`Collateral releases after day ${s.turn+p.left}; ${types.find(t=>t.id===p.type).bond} locked`))],
 forecast:scenario(s).weather.slice(s.turn).map((w,i)=>`Day ${s.turn+i+1}: ${w}; premiums homes/boats/farms ${scenario(s).quotes[s.turn+i].join('/')}`)
});
