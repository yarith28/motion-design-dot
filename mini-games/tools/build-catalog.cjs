/* Build static cards from playable room manifests. No runtime/build dependency. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const rooms=process.argv.slice(2);
const old=[['signal-run','Signal Run','reflex'],['double-take','Double Take','memory'],['pocket-orbit','Pocket Orbit','reflex'],['good-order','Good Order','puzzle'],['afterglow','Afterglow','adventure'],['lantern-lines','Lantern Lines','puzzle'],['tide-pool','Tide Pool','strategy'],['word-weave','Word Weave','puzzle'],['sky-stack','Sky Stack','reflex'],['pebble-post','Pebble Post','strategy']].map(([id,name,category])=>({id,name,category,url:id+'/',family:'original',status:'playable'}));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const games=rooms.flatMap(room=>{
 const data=JSON.parse(fs.readFileSync(path.join(root,room,'games.json')));
 const expected={'systems-room':20,'tabletop-room':20,'puzzle-lab':20,'kinetic-room':20,'discovery-room':20,'construct-room':14,'parlour-room':35,'motion-room':24,'workbench-room':27}[room]||15;
 if(data.length!==expected)throw Error(room+' must have '+expected+' distinct games');
 if(!fs.existsSync(path.join(root,'coverage',room+'.json')))throw Error('Missing browser evidence for '+room);
 if(['construct-room','parlour-room','motion-room','workbench-room'].includes(room))require('./evidence.cjs').expansionEvidence(room);
 return data.map(g=>({...g,family:room,status:'playable'}));
});
const all=[...old,...games];if(new Set(all.map(g=>g.id)).size!==all.length)throw Error('Duplicate game ids');
for(const g of games){if(!g.mechanic||!g.description||!g.rules?.length||!g.url.startsWith(g.family+'/?game='))throw Error('Incomplete game '+g.id);}
const cards=games.map((g,i)=>{
 const preview=fs.existsSync(path.join(root,'previews',g.id+'.png'))?`<img class="game-preview row-art" src="previews/${esc(g.id)}.png" alt="" loading="lazy" width="640" height="420">`:'';
 const art=`<svg class="row-art" viewBox="0 0 120 110" aria-hidden="true"><rect x="20" y="16" width="80" height="80" rx="17" fill="none" stroke="currentColor" opacity=".3"/><path d="M28 103h64M8 53h9m86 0h9" stroke="currentColor" opacity=".4"/><text x="60" y="72" text-anchor="middle" font-size="48" fill="currentColor" font-family="Georgia,serif">${esc(g.symbol||'✳')}</text></svg>`;
 return `<article class="game-card room-card" data-category="${esc(g.category)}" data-game-id="${esc(g.id)}">
<div class="mini-poster room-art" style="--poster-bg:${esc(g.accent||'#d3dcc7')}" aria-hidden="true"><div class="mono"><span>SH—${String(i+11).padStart(3,'0')}</span><span>${esc(g.category)}</span></div>${preview||art}</div>
<div class="card-copy"><span class="pill">${esc(g.category)} / ${esc(g.mechanic)}</span><h2>${esc(g.name)}</h2><p>${esc(g.description)}</p><span class="mono">${esc(g.controls?.split('.')[0]||'Keys or touch')}</span><a class="cta" href="${esc(g.url)}"><span class="play-label">Play ${esc(g.name)}</span><span class="row-play-label" aria-hidden="true">Play</span><span aria-hidden="true">↗</span></a></div></article>`;
}).join('\n');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\n<!-- ROOM CARDS START -->[\s\S]*?<!-- ROOM CARDS END -->/,'');
html=html.replace('\n</div>\n<div id="empty-results"',`\n<!-- ROOM CARDS START -->\n${cards}\n<!-- ROOM CARDS END -->\n</div>\n<div id="empty-results"`);
const order=['all','adventure','reflex','arcade','sports','memory','puzzle','strategy','word','number','creative'];
const names={all:'All games',word:'Wordplay',number:'Numbers',creative:'Creative'};
const filters=order.filter(c=>c==='all'||all.some(g=>g.category===c)).map(c=>`<button data-filter="${c}" aria-pressed="${c==='all'}">${names[c]||c[0].toUpperCase()+c.slice(1)} <span>${String(c==='all'?all.length:all.filter(g=>g.category===c).length).padStart(2,'0')}</span></button>`).join('');
html=html.replace(/(<div class="filters"[^>]*>)[\s\S]*?(<\/div><div class="view-switch")/,'$1'+filters+'$2');
html=html.replace(/(<span id="game-count"[^>]*>)[^<]*/,`$1${all.length} games / ready to play`);
html=html.replace(/\b(?:Ten|\d+) little games:[^"]*/,`${all.length} little games: quick reflexes, thoughtful puzzles, wordplay, and small adventures.`);
fs.writeFileSync(path.join(root,'index.html'),html);
fs.writeFileSync(path.join(root,'inventory.json'),JSON.stringify({version:1,total:all.length,games:all},null,2)+'\n');
const readme=path.join(root,'README.md');fs.writeFileSync(readme,fs.readFileSync(readme,'utf8').replace(/with (?:ten|\d+) (?:finished|playable) games/,`with ${all.length} playable games`));
console.log(`Generated ${all.length} playable entries from ${rooms.length} playable rooms.`);
