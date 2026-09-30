/* Real UI completion tests. Solvers read curated source data and the rendered board;
   no state injection, internal mutation, artificial win events or shipped test hooks. */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'word-room/data.js'),'utf8'),sandbox);
const D=sandbox.window.WordRoomData, games=sandbox.window.WordRoomCatalog;
const base=process.env.BASE_URL||'http://127.0.0.1:8790';
const coveragePath=process.env.COVERAGE_PATH||path.join(root,'coverage/word-room.json');
const report={room:'word-room',checkedAt:new Date().toISOString(),browser:'Chromium',method:'Unmodified browser UI; curated data and rendered DOM used by solvers.',games:[],limits:['English curated offline dictionaries, not comprehensive language dictionaries.','Chromium only; mobile device emulated, no physical device or screen-reader audit.']};
const assert=(value,message)=>{if(!value)throw Error(message)};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:960},isMobile:mobile,hasTouch:mobile,reducedMotion:mobile?'reduce':'no-preference'});
  if(mobile)await context.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked storage')};Storage.prototype.setItem=()=>{throw Error('blocked storage')};});
  if(process.env.TEST_RANDOM)await context.addInitScript(value=>{Math.random=()=>value;},Number(process.env.TEST_RANDOM));
  const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const click=async locator=>{mobile?await locator.tap():await locator.click()};
  const byText=(text)=>page.locator('#board button').filter({hasText:new RegExp('^'+text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first();
  const submit=async(value)=>{await page.locator('#entry').fill(value);await page.locator('#entry').press('Enter')};
  const next=async()=>{const button=byText('Next page ↗');if(await button.count())await click(button)};
  for(const game of games.filter(g=>!process.env.ONLY_GAME||g.id===process.env.ONLY_GAME)){
   await page.goto(`${base}/mini-games/${game.url}`);await page.waitForSelector('body[data-game-ready="true"]');
   assert(await page.locator('body').getAttribute('data-game-id')===game.id,'game identity');
   assert(await page.locator('#result').isHidden(),'starts active');
   const startErrors=errors.length;
   const invalid=async()=>{
    switch(game.id){
     case 'hidden-grove':await click(page.locator('[data-cell="0"]'));await click(page.locator('[data-cell="8"]'));break;
     case 'one-letter-away':case 'center-letter':case 'vowel-weather':await submit('ZZZZ');break;
     case 'last-letter':{const clue=await page.locator('.prompt').textContent(),word=D.words.find(w=>w[1]===clue)[0],letter=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].find(c=>!word.includes(c));await click(byText(letter));break;}
     case 'crossings':await click(byText('Check grid ↗'));assert((await page.locator('#message').textContent()).includes('Fill all'),'incomplete crossword guarded');break;
     case 'wordbreak':await click(byText('Check spaces ↗'));break;
     case 'secret-post':await click(byText('Check message ↗'));break;
     case 'odd-company':{const q=await page.locator('.prompt').textContent(),p=D.odd.find(a=>a[0]===q);await click(byText(p[1].find(w=>w!==p[2])));break;}
     case 'alphabet-trail':await click(byText('Y'));break;
     case 'sentence-studio':await click(byText('Check saying ↗'));assert((await page.locator('#message').textContent()).includes('every word'),'incomplete sentence guarded');break;
     case 'compound-works':case 'rhyme-lines':{await click(page.locator('[data-side="0"][data-pair="0"]'));await click(page.locator('[data-side="1"][data-pair="1"]'));break;}
     case 'chain-reaction':{const last=(await page.locator('.progress-path span').last().textContent()).at(-1);const all=await page.locator('.tiles button').all();for(const b of all){if(!(await b.textContent()).startsWith(last)){await click(b);break;}}break;}
     case 'proofreader':{const text=await page.locator('.sentence-words').textContent();const first=page.locator('.sentence-words button').first();await click(first);break;}
    }
   };
   await invalid();assert(await page.locator('#result').isHidden(),'invalid input cannot complete');
   switch(game.id){
    case 'hidden-grove':{
     const cells=await page.locator('.grid button').allTextContents(),words=await page.locator('.list li').allTextContents();
     for(const word of words){let found;for(let at=0;at<36&&!found;at++)for(const[dx,dy]of[[1,0],[0,1],[1,1],[-1,0],[0,-1],[-1,-1],[1,-1],[-1,1]]){const x=at%6,y=Math.floor(at/6),ex=x+dx*(word.length-1),ey=y+dy*(word.length-1);if(ex<0||ex>5||ey<0||ey>5)continue;const indices=[...word].map((_,i)=>at+dx*i+dy*i*6);if(indices.map(i=>cells[i]).join('')===word){found=indices;break;}}assert(found,'search solution');await click(page.locator(`[data-cell="${found[0]}"]`));await click(page.locator(`[data-cell="${found.at(-1)}"]`));}break;}
    case 'one-letter-away':{
     const [start,target]=(await page.locator('.prompt').textContent()).split(' → '),vocab=[...new Set(D.ladders.flat())],queue=[[start]],seen=new Set([start]);let solution;
     while(queue.length){const chain=queue.shift(),last=chain.at(-1);if(last===target){solution=chain;break;}for(const w of vocab)if(!seen.has(w)&&[...w].filter((c,i)=>c!==last[i]).length===1){seen.add(w);queue.push([...chain,w]);}}
     assert(solution,'ladder solvable');for(const w of solution.slice(1))await submit(w);break;}
    case 'last-letter':{const clue=await page.locator('.prompt').textContent(),word=D.words.find(w=>w[1]===clue)[0];for(const letter of new Set(word)){if(mobile)await click(byText(letter));else await page.keyboard.press(letter);}break;}
    case 'crossings':{
     const down=await page.locator('.clues>div').nth(1).textContent(),puzzle=D.crosswords.find(p=>down.includes(p.down[1])),answer=Array(25).fill(null);[0,2,4].forEach((r,i)=>[...puzzle.across[i][0]].forEach((c,x)=>answer[r*5+x]=c));[...puzzle.down[0]].forEach((c,r)=>answer[r*5+2]=c);
     for(let i=0;i<25;i++)if(answer[i])await page.locator(`[data-cell="${i}"]`).fill(answer[i]);await click(byText('Check grid ↗'));break;}
    case 'wordbreak':for(let r=0;r<3;r++){const clue=await page.locator('.prompt').textContent(),phrase=D.breaks.find(p=>p[1]===clue)[0];let count=0;for(const word of phrase.split(' ').slice(0,-1)){count+=word.length;await click(page.locator(`[data-boundary="${count-1}"]`));}await click(byText('Check spaces ↗'));await next();}break;
    case 'secret-post':{
     const clue=await page.locator('.prompt').textContent(),plain=D.ciphers.find(p=>p[1]===clue)[0].replaceAll(' ',''),codes=await page.locator('.cipher-unit button').evaluateAll(nodes=>nodes.map(n=>n.dataset.code)),map={};codes.forEach((c,i)=>map[c]=plain[i]);
     for(const [code,letter]of Object.entries(map)){await click(page.locator(`[data-code="${code}"]`).first());if(mobile)await click(page.locator('.keyboard button').filter({hasText:new RegExp(`^${letter}$`)}));else await page.keyboard.press(letter);}await click(byText('Check message ↗'));break;}
    case 'center-letter':{const center=await page.locator('.honey strong').textContent(),clues=await page.locator('.list').textContent(),puzzle=D.centers.find(p=>p.center===center&&clues.includes(p.words[0][1]));for(const [word]of puzzle.words)await submit(word);break;}
    case 'odd-company':for(let r=0;r<3;r++){const question=await page.locator('.prompt').textContent(),puzzle=D.odd.find(p=>p[0]===question);await click(byText(puzzle[2]));await next();}break;
    case 'alphabet-trail':for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXY')await click(byText(letter));break;
    case 'sentence-studio':for(let r=0;r<3;r++){const clue=await page.locator('.prompt').textContent(),sentence=D.sentences.find(p=>p[1]===clue)[0];for(const word of sentence.split(' ')){const b=page.locator('#board>.tiles button:not(:disabled)').filter({hasText:new RegExp('^'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first();await click(b);}await click(byText('Check saying ↗'));await next();}break;
    case 'compound-works':case 'rhyme-lines':for(let i=0;i<4;i++){await click(page.locator(`[data-side="0"][data-pair="${i}"]`));await click(page.locator(`[data-side="1"][data-pair="${i}"]`));}break;
    case 'vowel-weather':for(let r=0;r<3;r++){const clue=await page.locator('.prompt').textContent(),word=D.words.find(w=>w[1]===clue)[0];await submit(word);await next();}break;
    case 'chain-reaction':{const first=await page.locator('.progress-path span').first().textContent(),chain=D.chains.find(c=>c[0]===first);for(const word of chain.slice(1))await click(byText(word));break;}
    case 'proofreader':for(let r=0;r<3;r++){const words=await page.locator('.sentence-words button').allTextContents(),sentence=words.join(' '),puzzle=D.proofs.find(p=>p[0]===sentence);await click(page.locator('.sentence-words button').filter({hasText:new RegExp('^'+puzzle[1]+'[.,!?]?$')}));await submit(puzzle[2]);await next();}break;
   }
   assert(await page.locator('#result').isVisible(),game.id+' full completion');
   assert((await page.locator('#result-title').textContent()).includes('well played'),'win state');
   assert(Number((await page.locator('#best').textContent()).replaceAll(',',''))>0,'session best');
   if(mobile)assert((await page.locator('#storage-note').textContent()).includes('unavailable'),'storage fallback');
   for(let n=0;n<3;n++){await click(page.locator('#restart'));assert(await page.locator('#result').isHidden(),'restart active');assert(await page.locator('#mistakes').textContent()==='0','restart reset');}
   if(mobile)await page.setViewportSize({width:320,height:900});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),game.id+' no horizontal overflow');
   await page.screenshot({path:`/tmp/word-room-${game.id}-${mobile?'mobile':'desktop'}.png`,fullPage:true});
   await click(page.locator('.back'));await page.waitForURL('**/mini-games/');assert(new URL(page.url()).pathname.endsWith('/mini-games/'),'return catalog');
   assert(errors.length===startErrors,'no JS errors: '+errors.slice(startErrors).join(';'));
   report.games.push({id:game.id,passed:true,completed:true,restart:true,invalidInput:true,legalInput:true,mobile,storageBlocked:mobile,reducedMotion:mobile,noOverflow:true,noPageErrors:true});
   console.log('PASS',game.id,mobile?'mobile':'desktop');
   if(mobile)await page.setViewportSize({width:390,height:844});
  }
  await context.close();
 }
 if(!process.env.SKIP_DEEP)report.deepChecks=await require('./word-room-edges.cjs')(browser);await browser.close();report.passed=true;fs.mkdirSync(path.dirname(coveragePath),{recursive:true});fs.writeFileSync(coveragePath,JSON.stringify(report,null,2)+'\n');console.log('ALL WORD ROOM CHECKS PASSED');
})().catch(error=>{report.passed=false;report.error=String(error);fs.mkdirSync(path.dirname(coveragePath),{recursive:true});fs.writeFileSync(coveragePath,JSON.stringify(report,null,2)+'\n');console.error(error);process.exit(1)});
