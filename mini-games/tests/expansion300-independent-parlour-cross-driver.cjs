// Independent ordinary-input driver: reads only rendered UI; never imports game engines.
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const dir=path.resolve(__dirname,'../coverage/independent300');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 let context=await browser.newContext({viewport:{width:1100,height:850}}),page=await context.newPage();
 let seq=0,game='unassigned';
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const server=http.createServer(async(req,res)=>{
  let raw='';for await(const chunk of req)raw+=chunk;
  try{
   const a=JSON.parse(raw||'{}');let out={};
   if(a.op==='open'){game=a.game||game;await page.goto(a.url,{waitUntil:'networkidle'});}
   else if(a.op==='click'||a.op==='tap'){const l=a.role?page.getByRole(a.role,{name:a.name,exact:a.exact!==false}):page.getByRole('button',{name:a.name,exact:a.exact!==false});await l.nth(a.index||0)[a.op]();}
   else if(a.op==='native'){let found=false;for(let i=0;i<500;i++){const target=page.getByRole(a.role||'button',{name:a.name,exact:true}).nth(a.index||0);const focused=await target.evaluate(e=>e===document.activeElement);if(focused){found=true;break}await page.keyboard.press('Tab')}if(!found)throw Error('Native tab target not found: '+a.name);await page.keyboard.press(a.key||'Enter');}
   else if(a.op==='key')await page.keyboard.press(a.key);
   else if(a.op==='focus')await page.getByRole(a.role||'button',{name:a.name,exact:true}).nth(a.index||0).focus();
   else if(a.op==='fill')await page.getByRole(a.role||'textbox',{name:a.name,exact:true}).fill(a.value);
   else if(a.op==='select')await page.getByLabel(a.name,{exact:true}).selectOption(a.value);
   else if(a.op==='mobile'){await context.close();context=await browser.newContext({viewport:{width:a.width||390,height:844},hasTouch:true,isMobile:true});page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));if(a.url)await page.goto(a.url,{waitUntil:'networkidle'});}
   else if(a.op==='desktop'){await context.close();context=await browser.newContext({viewport:{width:1100,height:850}});page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));if(a.url)await page.goto(a.url,{waitUntil:'networkidle'});}
   else if(a.op==='shot'){out.path=path.join(dir,`cross-parlour-${game}-${++seq}.png`);await page.screenshot({path:out.path,fullPage:true});}
   else if(a.op!=='read')throw new Error('Unsupported ordinary-input operation');
   out.text=await page.locator('body').innerText();
   out.buttons=await page.getByRole('button').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>({text:e.innerText,label:e.getAttribute('aria-label'),disabled:e.disabled,pressed:e.getAttribute('aria-pressed')})));
   out.focus=await page.locator(':focus').evaluateAll(es=>es.map(e=>({text:e.innerText,label:e.getAttribute('aria-label')})));
   out.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);out.errors=errors.slice();out.url=page.url();
   fs.appendFileSync(path.join(dir,`cross-parlour-${game}-ordinary.jsonl`),JSON.stringify({time:new Date().toISOString(),action:a,result:out})+'\n');
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(out));
  }catch(e){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:String(e)}));}
 });server.listen(Number(process.env.PORT||8807),'127.0.0.1',()=>console.log('ordinary UI driver ready '+(process.env.PORT||8807)));
})();
