import json,urllib.request,re

def call(q):return json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8793',data=json.dumps(q).encode(),headers={'Content-Type':'application/json'})))
r=call({'op':'open','game':'one-last-card','url':'http://127.0.0.1:8781/mini-games/parlour-room/?game=one-last-card'});r=call({'op':'click','name':'Take a seat'})
for i in range(150):
 opts=[x['text'] for x in r['buttons'] if not x['disabled']]
 if 'Try this deal again' in opts:print('TERMINAL',i,r['text']);break
 if 'Deal next round' in opts:name='Deal next round'
 elif any(x.startswith('Guess 2') for x in opts):name=next(x for x in opts if x.startswith('Guess 2'))
 elif 'Moss' in opts:name='Moss'
 elif 'June' in opts:name='June'
 elif 'You' in opts:name='You'
 else:
  cards=[x for x in opts if re.match('[1-7] ·',x)];name=max(cards,key=lambda x:int(x[0]))
 r=call({'op':'click','name':name,'index':0})
else:raise RuntimeError('No terminal after150public inputs')
