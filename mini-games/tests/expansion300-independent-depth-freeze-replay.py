import json,pathlib,urllib.request,hashlib
root=pathlib.Path(__file__).resolve().parents[2];base=root/'mini-games/coverage/independent300'
def call(q):return json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8793',data=json.dumps(q).encode(),headers={'Content-Type':'application/json'})))
report=[]
for game in ['elbow-room','common-meadow','folded-cuttings','domino-relay','siding-stories','across-the-current','watchtower-bend','through-and-through','orchard-acrobat','crossfire-courtyard']:
 d=json.loads((base/f'depth-{game}-public-win.json').read_text());url=d.get('url',f'http://127.0.0.1:8781/mini-games/motion-room/?game={game}');call({'op':'mobile','width':390,'url':url});r=call({'op':'open','game':game,'url':url});count=0
 for q in d['actions']:
  if q['op'] in ['click','tap']:
   q={**q,'op':'tap'}
   if q.get('name','').startswith('Next') and any(x['text'].startswith('Finish journey') for x in r['buttons']):q['name']=next(x['text'] for x in r['buttons'] if x['text'].startswith('Finish journey'))
  r=call(q);count+=1
 assert 'Complete. All studies complete' in r['text'],(game,r['text'])
 assert not r['overflow'],game
 report.append({'gameId':game,'passed':True,'actions':count,'methods':'Reproduction through ordinary DOM buttons/keyboard of previously independent source-unexposed public win fixture; no source-guided moves.','lastText':r['text'],'runtimeHashes':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'mini-games/motion-room').glob('*') if p.is_file()}})
 (base/'depth-motion-final-freeze-replays.json').write_text(json.dumps(report,indent=2)+'\n');print(game,count,'PASS',flush=True)
