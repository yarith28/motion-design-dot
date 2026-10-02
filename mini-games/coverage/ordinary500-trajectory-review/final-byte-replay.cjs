// Native keyboard replay of paths derived independently from public UI observations.
// No game sources, planners, fixtures, storage, evaluation hooks, or state mutation.
const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');
const run=process.argv[2]||'final-byte';
if(!/^[a-z0-9-]+$/.test(run))throw new Error('Use a simple unique evidence label');
if(fs.existsSync(path.join(__dirname,run+'-commands.jsonl')))throw new Error('Evidence already exists; pass a new run label to preserve it');
const cmds=[];
const key=name=>cmds.push({op:'key',name,key:'Enter'});
const keys=names=>names.forEach(key);
const snap=label=>cmds.push({op:'screenshot',label:run+'-'+label});
function start(game,terminal){
  cmds.push({op:'goto',game});key('Begin game');
  key(terminal);snap(game+'-natural-failure');key('Reset challenge');
  key(terminal);key('Play again');
}
function next(label){snap(label);key('Next challenge →');}
function done(game){snap(game+'-campaign-win');key('Restart game');snap(game+'-restart');}
const rail='Advance rail · 0.25 s';
start('induction-coast','Clamp at receiver now');
keys(['Connect diode receiver',...Array(3).fill(rail),'Open circuit',...Array(3).fill(rail),'Resistance 0.5','Connect dissipative resistor',...Array(8).fill(rail),'Clamp at receiver now']);
next('induction-coast-study1-win');
keys(['Connect diode receiver',...Array(3).fill(rail),'Reverse receiver polarity',...Array(2).fill(rail),'Open circuit',...Array(2).fill(rail),'Resistance 0.5','Connect dissipative resistor',...Array(3).fill(rail),'Clamp at receiver now']);
next('induction-coast-study2-win');
keys(['Connect diode receiver',...Array(3).fill(rail),'Reverse receiver polarity',...Array(2).fill(rail),'Open circuit',...Array(2).fill(rail),'Resistance 0.5','Connect dissipative resistor',...Array(6).fill(rail),'Clamp at receiver now']);
done('induction-coast');
const beat='Advance excitation · one cell beat';
start('refractory-route','Certify arrivals and extinction');
keys(['Stimulate resting injector',...Array(13).fill(beat),'Certify arrivals and extinction']);
next('refractory-route-study1-win');
keys(['Select gate 6–13','Toggle selected conduction gate','Reset challenge','Select gate 6–13','Toggle selected conduction gate',...Array(2).fill(beat),'Stimulate resting injector',...Array(13).fill(beat),'Certify arrivals and extinction']);
next('refractory-route-study2-win');
keys(['Select gate 6–13','Toggle selected conduction gate','Select gate 3–8','Toggle selected conduction gate','Stimulate resting injector',...Array(12).fill(beat),'Stimulate resting injector',...Array(13).fill(beat),'Certify arrivals and extinction']);
done('refractory-route');
const menisci='Advance menisci · 0.5 s';
start('meniscus-maze','Seal isolated target cups');
keys(['Base pressure 3','Toggle selected source gate','Select channel 2','Toggle selected source gate','Prime selected entry +2 next beat',...Array(16).fill(menisci),'Toggle selected source gate','Select channel 1','Toggle selected source gate','Seal isolated target cups']);
next('meniscus-maze-study1-win');
const tallChannels=['Base pressure 3','Toggle selected source gate','Select channel 2','Toggle selected source gate','Prime selected entry +2 next beat',menisci,'Select channel 3','Toggle selected source gate',...Array(16).fill(menisci),'Prime selected entry +2 next beat',...Array(2).fill(menisci),'Select channel 1','Toggle selected source gate','Select channel 2',...Array(4).fill(menisci),'Toggle selected source gate','Select channel 3','Prime selected entry +2 next beat',menisci,'Prime selected entry +2 next beat',...Array(34).fill(menisci),'Toggle selected source gate','Seal isolated target cups'];
keys(tallChannels);next('meniscus-maze-study2-win');
keys(['Toggle competing siphon',...tallChannels]);done('meniscus-maze');
cmds.push({op:'close'});
const input=cmds.map(x=>JSON.stringify(x)+'\n').join('');
fs.writeFileSync(path.join(__dirname,run+'-commands.jsonl'),input);
const output=fs.openSync(path.join(__dirname,run+'-output.jsonl'),'w');
const child=spawn(process.execPath,[path.join(__dirname,'browser.cjs'),run],{stdio:['pipe',output,output]});
child.stdin.end(input);
child.on('exit',code=>{fs.closeSync(output);console.log(JSON.stringify({exitCode:code,commandCount:cmds.length,run}));process.exitCode=code||0;});
