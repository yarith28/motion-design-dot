/* Ordinary UI regressions: no source answer imports, state injection or runtime hooks. */
const browserType=require('playwright')[process.env.BROWSER_ENGINE||'chromium'];
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://127.0.0.1:8792';
(async () => {
  const browser = await browserType.launch({headless:true,...(process.env.BROWSER_ENGINE==='webkit'?{}:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']})});
  console.log(JSON.stringify({suite:'number-room-review-regressions',browserEngine:process.env.BROWSER_ENGINE||'chromium',browserVersion:browser.version(),base:process.env.BASE_URL||'local default',sourceSha:process.env.GITHUB_SHA||null,startedAt:new Date().toISOString(),physicalDevice:false}));
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext({viewport: mobile ? {width:390,height:844} : {width:1280,height:900}, isMobile:mobile,hasTouch:mobile});
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const go = async id => {await page.goto(`${base}/mini-games/number-room/?game=${id}`);await page.waitForSelector('body[data-game-ready="true"]');};
      const activate = async locator => {if(mobile) await locator.tap(); else {await locator.focus();await page.keyboard.press('Enter');}};
      await go('sequence-detective');
      for(let replay=0;replay<3;replay++) {
        const positions=[];
        // Independently solve the displayed families: double-plus-one, squares,
        // adjacent sum, alternating +5/-2, increasing differences.
        for(let chapter=0;chapter<5;chapter++) {
          const text=await page.locator('.target').textContent();
          const terms=text.match(/\d+/g).map(Number);
          const answer = chapter===0 ? terms.at(-1)*2+1 : chapter===1 ? (Math.sqrt(terms.at(-1))+1)**2 : chapter===2 ? terms.at(-1)+terms.at(-2) : chapter===3 ? terms.at(-1)+5 : terms.at(-1)+(terms.at(-1)-terms.at(-2))+1;
          const buttons=page.locator('[data-action="answer"]');
          const choices=(await buttons.allTextContents()).map(Number);
          assert.equal(new Set(choices).size,4);
          assert(choices.includes(answer));
          positions.push(choices.indexOf(answer));
          const wrong=choices.find(n=>n!==answer);
          await activate(page.getByRole('button',{name:String(wrong),exact:true}));
          assert(await page.locator('#result').isHidden());
          assert.deepEqual((await buttons.allTextContents()).map(Number),choices,'choices must stay stable after a wrong answer');
          await activate(page.getByRole('button',{name:String(answer),exact:true}));
          assert(await page.locator('#result').isVisible());
          await activate(page.locator('#next'));
        }
        assert.equal(new Set(positions).size,4,'every session covers all answer slots; no fixed-position solution');
      }
      await go('digit-forge');
      // Correct first chapter: 124. Keyboard focus follows available cards, then Check.
      for(const digit of ['1','2','4']) {
        await activate(page.getByRole('button',{name:digit,exact:true}));
        if(!mobile) {
          const expected=digit==='1'?'2':digit==='2'?'4':'Check number';
          assert.equal(await page.evaluate(()=>document.activeElement.textContent),expected);
        }
      }
      await activate(page.getByRole('button',{name:'Check number',exact:true}));
      assert(await page.locator('#result').isVisible());
      await go('fraction-mosaic');
      // Visible seams 1/4, 7/12, 5/6, 1 require 1/4, 1/3, 1/4, 1/6.
      for(const fraction of ['1/4','1/3','1/4','1/6']) {
        await activate(page.locator('[data-action="piece"]:not(:disabled)').filter({hasText:new RegExp('^'+fraction+'$')}).first());
        if(!mobile && fraction!=='1/6') assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'piece');
      }
      assert(await page.locator('#result').isVisible());
      if(!mobile) assert.equal(await page.evaluate(()=>document.activeElement.id),'next');
      assert.deepEqual(errors,[]);
      await context.close();
      console.log(`PASS ${mobile?'mobile touch':'desktop keyboard'}: 3 Sequence sessions, Digit Forge and Fraction Mosaic focus/completion`);
    }
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
