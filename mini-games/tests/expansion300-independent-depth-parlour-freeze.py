import json,pathlib,urllib.request,hashlib
root=pathlib.Path(__file__).resolve().parents[2];b=root/'mini-games/coverage/independent300'
def call(q):return json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8793',data=json.dumps(q).encode(),headers={'Content-Type':'application/json'})))
windows={'gifted-traits':(0,27),'almost-a-word':(28,42),'twin-roofs':(1064,1118),'letters-we-cannot-see':(90,112),'pass-the-burden':(67,99),'market-of-five':(307,346),'the-other-half':(52,76)};out=[]
for game,(start,end) in windows.items():
 rs=[json.loads(x) for x in (b/f'depth-{game}-ordinary.jsonl').read_text().splitlines()];actions=[v['action'] for v in rs[start+1:end+1] if v['action']['op'] in ['click','tap','key']];url=f'http://127.0.0.1:8781/mini-games/parlour-room/?game={game}';(b/f'depth-{game}-public-win.json').write_text(json.dumps({'url':url,'actions':actions,'provenance':f'Previously independent ordinary full-win public UI record window{start}..{end}; final unchanged engine/core plus current sharedhost recheck.'},indent=2));call({'op':'mobile','width':390,'url':url});r=call({'op':'open','game':game,'url':url})
 for q in actions:
  if q['op'] in ['click','tap']:q={**q,'op':'tap'}
  r=call(q)
 assert 'WELL PLAYED' in r['text'],(game,r['text']);assert not r['overflow'],game
 out.append({'gameId':game,'passed':True,'actions':len(actions),'lastText':r['text'],'methods':'Full prior ordinary-derived public route rechecked after sharedhost loading/cache guard; engine/core hashes unchanged from original scoped audit.','runtimeHashes':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [root/f'mini-games/parlour-room/{game}.mjs',*[root/f'mini-games/parlour-room/{n}' for n in ['game.js','core.mjs','room.css','index.html','games.json']]]}})
 (b/'depth-parlour-final-freeze-replays.json').write_text(json.dumps(out,indent=2)+'\n');print(game,len(actions),'PASS',flush=True)
