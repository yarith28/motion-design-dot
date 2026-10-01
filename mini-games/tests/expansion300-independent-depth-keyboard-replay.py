"""Replay reviewer-observed public actions using actual Tab and native activation.
No game source/state/solutions are read. Input is this reviewer's ordinary UI log.
"""
import json,sys,urllib.request
log=sys.argv[1]
rows=[json.loads(s) for s in open(log)]
start=max(i for i,r in enumerate(rows) if r['action'].get('op')=='open')
url=rows[start]['action']['url']
actions=[r['action'] for r in rows[start+1:] if r['action'].get('op') in ('tap','click')]
def act(a):
 return json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8793',data=json.dumps(a).encode(),headers={'Content-Type':'application/json'})))
x=act({'op':'desktop','url':url})
for k,a in enumerate(actions):
 name=a['name']
 for _ in range(100):
  if any(((name in (f.get('label') or f['text'])) if a.get('exact') is False else ((f.get('label') or f['text'])==name)) for f in x['focus']):break
  x=act({'op':'key','key':'Tab'})
 else:raise RuntimeError('Native tab cannot reach '+name)
 x=act({'op':'key','key':'Enter' if k%2==0 else 'Space'})
 print(k,name,x['text'][x['text'].find('Another deal')+12:x['text'].find('Another deal')+170].strip().replace('\n',' | '))
act({'op':'shot'})
