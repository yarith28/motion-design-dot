const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const base = path.resolve(__dirname, '../../..');
const out = __dirname;
const run = process.argv[2] || 'original';
function hashes(label) {
  const result = {};
  for (const root of ['mini-games/trajectory-room','mini-games/journey']) {
    function visit(p) {
      for (const entry of fs.readdirSync(path.join(base,p), {withFileTypes:true})) {
        const rel = path.posix.join(p,entry.name);
        if (entry.isDirectory()) visit(rel);
        else result[rel] = crypto.createHash('sha256').update(fs.readFileSync(path.join(base,rel))).digest('hex');
      }
    }
    visit(root);
  }
  fs.writeFileSync(path.join(out,`${label}-hashes.json`),JSON.stringify({at:new Date().toISOString(),files:result},null,2)+'\n');
  return result;
}
(async()=>{
  hashes(run === 'original' ? 'before' : run+'-before');
  const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1180,height:1000}, reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(2000);
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  const log = fs.createWriteStream(path.join(out,run === 'original' ? 'public-actions.jsonl' : run+'-public-actions.jsonl'),{flags:'a'});
  async function snap(label){const p=path.join(out,label+'.png');await page.screenshot({path:p,fullPage:true});return p;}
  async function state(){return {url:page.url(),text:await page.locator('body').innerText(),buttons:await page.getByRole('button').allTextContents(),ranges:await Promise.all((await page.locator('input[type=range]').all()).map(async(r)=>({id:await r.getAttribute('id'),name:await r.getAttribute('aria-label'),min:await r.getAttribute('min'),max:await r.getAttribute('max'),step:await r.getAttribute('step'),value:await r.inputValue()}))),errors:[...errors]};}
  const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
  process.stdout.write('READY\n');
  for await(const line of rl){
    let c;
    try{
      c=JSON.parse(line); let result;
      if(c.op==='goto'){await page.goto('http://127.0.0.1:8790/mini-games/trajectory-room/?game='+c.game+'&seed=20261002');await page.waitForTimeout(100);result=await state();}
      else if(c.op==='state') result=await state();
      else if(c.op==='click'){await page.getByRole('button',{name:c.name,exact:true}).click();await page.waitForTimeout(80);result=await state();}
      else if(c.op==='locator'){await page.locator(c.selector).click();await page.waitForTimeout(80);result=await state();}
      else if(c.op==='key'){if(c.selector)await page.locator(c.selector).focus();else if(c.name)await page.getByRole('button',{name:c.name,exact:true}).focus();await page.keyboard.press(c.key);await page.waitForTimeout(80);result=await state();}
      else if(c.op==='range'){const r=page.locator('input[type=range]').nth(c.index||0);await r.focus();await page.keyboard.press('Home');for(let i=0;i<c.steps;i++)await page.keyboard.press('ArrowRight');await page.waitForTimeout(80);result=await state();}
      else if(c.op==='point'){await page.mouse.click(c.x,c.y);await page.waitForTimeout(80);result=await state();}
      else if(c.op==='inspect'){result={canvases:await Promise.all((await page.locator('canvas').all()).map(async(x)=>({box:await x.boundingBox(),width:await x.getAttribute('width'),height:await x.getAttribute('height')}))),html:await page.locator(c.selector||'main').innerHTML()};}
      else if(c.op==='screenshot')result={path:await snap(c.label)};
      else if(c.op==='hash')result=hashes(c.label||'after');
      else if(c.op==='close'){hashes(run === 'original' ? 'after' : run+'-after');await browser.close();log.end();rl.close();break;}
      else throw new Error('unknown operation');
      log.write(JSON.stringify({at:new Date().toISOString(),command:c,result})+'\n');
      let summary=result;
      if(result.text){
        const t=result.text, start=t.indexOf('Changing mode starts a fresh run.')+35;
        const end=t.includes('Rail x') ? t.indexOf('Open circuit',start) : t.includes('Excitation beat') ? t.indexOf('Injector cell 0',start) : t.includes('Selected channel') ? t.indexOf('Select channel 1',start) : t.indexOf('Undo action',start);
        summary={publicState:t.slice(start,end).trim(),challenge:(t.match(/Challenge \d \/ \d/)||[])[0],score:(t.match(/Score\n(\d+)/)||[])[1],outcome:t.includes('Campaign complete.')?'Campaign complete.':t.includes('Challenge complete.')?'Challenge complete.':t.includes('Try a new approach.')?'Try a new approach.':'playing',buttons:result.buttons,errors:result.errors};
      }
      process.stdout.write(JSON.stringify(summary)+'\n');
    }catch(e){const result={error:String(e)};log.write(JSON.stringify({at:new Date().toISOString(),command:c,result})+'\n');process.stdout.write(JSON.stringify(result)+'\n');}
  }
})().catch(e=>{console.error(e);process.exit(1)});
