import {base,action,card,advance,finish,sum} from './core.mjs';
export const scenarios=[
 {name:'Island circuit',goal:89,waves:[[[2,4,1],[3,8,2],[1,4,3]],[[4,10,1],[1,3,2],[3,9,3]],[[2,6,2],[4,13,1],[2,7,3]],[[3,9,1],[3,10,2],[4,14,3]],[[5,15,1],[2,7,2],[3,12,3]],[[2,8,1],[4,15,2],[1,5,3]],[[3,12,1],[2,9,2],[4,16,3]]]},
 {name:'Storm evacuation',goal:96,waves:[[[2,8,3],[3,9,1],[1,3,2]],[[4,14,2],[1,5,3],[3,8,1]],[[2,5,1],[4,15,3],[2,8,2]],[[3,13,2],[3,8,1],[4,17,3]],[[5,18,3],[2,6,1],[3,12,2]],[[2,10,2],[4,14,1],[1,6,3]],[[3,12,3],[2,8,1],[4,18,2]]]}
];
const data=s=>scenarios[s.scenario];
export const rules=[
 'Seven waves each have three cargo lanes. Assign your six escorts, then sail all lanes together. A lane delivers only if assigned escorts meet its printed threat. Assignments can be recalled until sailing. The full threat, cargo and trip-length calendar is public.',
 'A protected lane delivers its cargo immediately, but its escorts stay away for the printed number of waves, including the departure wave. A 1-wave trip returns before the next allocation; a 3-wave trip skips the next two allocations. The return ledger shows exactly when escorts come home. Escorts cannot serve two lanes at once.',
 'Meet the scenario’s cargo target in seven waves. There are no replacement escorts. Underprotected lanes lose all cargo and one assigned escort permanently; the others return after that lane’s trip. Partial cover offers no cargo benefit, so abandon a lane with zero escorts if you cannot protect it. Long voyages can deny protection to tomorrow’s more valuable cargo. Restart repeats the scenario; the other scenario changes trip priorities.'
];
export const init=(which=0)=>({...base(),scenario:which===1?1:0,fleet:6,alloc:[0,0,0],away:[],cargo:0,lost:0});
export const choices=s=>[
 ...s.alloc.flatMap((n,i)=>[...(sum(s.alloc)<s.fleet&&n<data(s).waves[s.turn][i][0]?[action('a'+i,`Escort lane ${i+1}`,`${n}/${data(s).waves[s.turn][i][0]} assigned; ${data(s).waves[s.turn][i][2]}-wave trip`)]:[]),...(n?[action('r'+i,`Recall from lane ${i+1}`)]:[])]),
 action('sail','Sail the convoy',`${s.fleet-sum(s.alloc)} stay in port; protected cargo ${sum(data(s).waves[s.turn].map(([t,v],i)=>s.alloc[i]>=t?v:0))}`)
];
export function apply(s,a){
 if(a[0]==='a'){s.alloc[+a[1]]++;s.note='Escort assigned; inspect trip length and later waves before sailing.';return;}
 if(a[0]==='r'){s.alloc[+a[1]]--;s.note='Escort recalled to port.';return;}
 let got=0,lost=0;data(s).waves[s.turn].forEach(([threat,value,days],i)=>{const n=s.alloc[i];if(n>=threat)got+=value;const casualty=n>0&&n<threat?1:0;lost+=casualty;s.fleet-=n;if(n>casualty)s.away.push({count:n-casualty,left:days});});
 s.cargo+=got;s.lost+=lost;s.alloc=[0,0,0];s.away.forEach(p=>p.left--);const returned=sum(s.away.filter(p=>p.left===0).map(p=>p.count));s.fleet+=returned;s.away=s.away.filter(p=>p.left>0);
 advance(s,`${got} cargo delivered; ${lost} escorts lost; ${returned} returned. ${s.fleet} ready for next wave.`);
 if(s.turn===7)return finish(s,s.cargo>=data(s).goal,`${s.cargo}/${data(s).goal} cargo delivered; ${s.lost} escorts lost. ${sum(s.away.map(p=>p.count))} escorts still returning.`);
}
export const view=s=>({
 stats:[['Wave',`${Math.min(7,s.turn+1)}/7`],['In port',`${s.fleet} (${sum(s.alloc)} assigned)`],['Cargo',`${s.cargo}/${data(s).goal}`]],
 cards:[...(data(s).waves[s.turn]||data(s).waves[6]).map(([threat,value,days],i)=>card(`Lane ${i+1}`,`${s.alloc[i]}/${threat} escorts`,`${value} cargo; ${days}-wave trip; ${s.alloc[i]>=threat?'protected':s.alloc[i]?'UNPROTECTED: no cargo, one escort lost':'abandoned unless assigned'}`)),card('Fleet ledger',`${s.lost} permanently lost`,`${sum(s.away.map(p=>p.count))} away; ${s.fleet} in port`),...(s.done?[]:s.away.map(p=>card(`${p.count} escorts returning`,`Before wave ${s.turn+p.left+1}`,`${p.left} more sailing phase${p.left===1?'':'s'} until available`)))],
 forecast:data(s).waves.slice(s.turn+1).map((wave,i)=>`Wave ${s.turn+i+2}: ${wave.map(([t,v,d])=>`${t} threat / ${v} cargo / ${d}-wave trip`).join(' · ')}`)
});
