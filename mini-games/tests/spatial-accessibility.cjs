const browserType=require('playwright')[process.env.BROWSER_ENGINE||'chromium'];
const assert = require('node:assert/strict');

// Public controls and accessibility tree only: no private state or script interception.
(async () => {
  const browser = await browserType.launch({headless:true,...(process.env.BROWSER_ENGINE==='webkit'?{}:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']})});
  console.log(JSON.stringify({suite:'spatial-accessibility',browserEngine:process.env.BROWSER_ENGINE||'chromium',browserVersion:browser.version(),base:process.env.BASE_URL||'local default',sourceSha:process.env.GITHUB_SHA||null,startedAt:new Date().toISOString(),physicalDevice:false}));
  const base = (process.env.BASE_URL || 'http://127.0.0.1:8790') + '/mini-games/spatial-room/?game=';
  for (const touch of [false, true]) {
    const context = await browser.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: touch, hasTouch: touch });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const control = action => page.locator(`[data-action="${action}"]`);
    const activate = async action => {
      const button = control(action);
      if (touch) await button.tap();
      else { await button.focus(); await page.keyboard.press('Enter'); }
    };
    const open = async game => { await page.goto(base + game); await page.waitForSelector('body[data-game-ready=true]'); };
    const board = () => page.locator('#board').ariaSnapshot();
    const replay = async () => {
      assert.equal(await page.locator('#result').isVisible(), true);
      assert.equal(await page.locator('#again').evaluate(el => el === document.activeElement), true);
      if (touch) await page.locator('#again').tap();
      else await page.keyboard.press('Enter');
      assert.equal(await page.locator('#result').isHidden(), true);
    };

    await open('stamp-studio');
    const initialStampTree = await board();
    assert.match(initialStampTree, /Your print.*filled squares: none/);
    assert.match(initialStampTree, /Target print.*row 1 columns 1, 2; row 2 columns 1, 2, 3, 4; row 3 columns 3, 4/);
    assert.match(await control('stamp:0').getAttribute('aria-label'), /Fills row 1 columns 1, 2; row 2 columns 1, 2/);
    assert.equal(await control('stamp:0').getAttribute('aria-pressed'), 'false');
    // Native Tab navigation reaches the game from its restart control.
    if (!touch) {
      await page.locator('#restart').focus();
      await page.keyboard.press('Tab');
      assert.equal(await control('stamp:0').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Space');
    } else await activate('stamp:0');
    assert.equal(await control('stamp:0').getAttribute('aria-pressed'), 'true');
    assert.match(await board(), /Your print.*row 1 columns 1, 2; row 2 columns 1, 2/);
    assert.match(await page.locator('#message').innerText(), /Stamp 1 added/);
    await activate('stamp:0');
    assert.equal(await control('stamp:0').getAttribute('aria-pressed'), 'false');
    assert.match(await board(), /Your print.*filled squares: none/);
    for (const action of ['stamp:0', 'stamp:3', 'stamp:1', 'stamp:2', 'stamp:2', 'stamp:4']) await activate(action);
    await replay();
    assert.match(await board(), /Your print.*filled squares: none/);

    await open('shadow-turn');
    const firstShape = await control('turn:0').getAttribute('aria-label');
    assert.match(firstShape, /current squares: row 1 columns 1; row 2 columns 1; row 3 columns 1, 2/);
    assert.match(firstShape, /Target squares: row 1 columns 1, 2, 3; row 2 columns 1/);
    assert.match(await board(), /Target squares:/);
    await activate('turn:0');
    assert.match(await control('turn:0').getAttribute('aria-label'), /current squares: row 1 columns 1, 2, 3; row 2 columns 1/);
    assert.match(await page.locator('#message').innerText(), /matches its reference/);
    assert.equal(await control('turn:0').evaluate(el => el === document.activeElement), true);
    for (const [study, turns] of [[0,[0,3,2,1]], [1,[3,2,1,2]], [2,[2,1,3,3]]]) {
      for (let i=0; i<4; i++) for (let j=0; j<turns[i]; j++) await activate('turn:'+i);
      if (study===0) assert.match(await control('turn:0').getAttribute('aria-label'), /Target squares: row 2 columns 3; row 3 columns 1, 2, 3/);
    }
    await replay();
    assert.equal(await control('turn:0').getAttribute('aria-label'), firstShape);

    await open('loose-ends');
    const originalGraph = await page.locator('#board svg').getAttribute('aria-label');
    assert.match(await board(), /img "Necklace.*Point 1 at upper left.*Cords join 1 to 2/);
    await activate('node:0');
    assert.equal(await control('node:0').getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('#message').innerText(), /Point 1 selected at upper left/);
    await activate('node:1');
    assert.equal(await control('node:0').getAttribute('aria-pressed'), 'false');
    assert.equal(await control('node:0').getAttribute('aria-label'), 'Point 1, upper right');
    assert.match(await board(), /Point 1 at upper right/);
    assert.match(await page.locator('#message').innerText(), /Point 1 is now at upper right/);
    await activate('node:0'); await activate('node:1');
    assert.equal(await page.locator('#board svg').getAttribute('aria-label'), originalGraph);
    for (const action of ['node:1','node:3','node:2','node:3','node:3','node:5','node:4','node:5']) await activate(action);
    assert.match(await board(), /No cords cross/);
    await replay();
    assert.equal(await page.locator('#board svg').getAttribute('aria-label'), originalGraph);
    assert.deepEqual(errors, []);
    console.log(`PASS spatial accessibility: three complete ${touch ? 'emulated touch' : 'keyboard'} games, geometry, state changes, replay`);
    await context.close();
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
