# Merge consecutive same-speaker lines that always follow each other (fewer screens, same words).
import sys; sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
total=0
for name in ['ch1-elshanta','chwar-sout-elradio','ch2-elkelma','ch3-elkhabar','ch4-lamma-tergaai','ch5-elshanta']:
    d=load(name); ns=d['nodes']; changed=True; merged=0
    while changed:
        changed=False
        for a in list(ns):
            if a['type']!='line' or a.get('variants'): continue
            bid=successor(ns,a['id'])
            if not bid: continue
            b=get(ns,bid)
            if b['type']!='line' or b.get('variants') or b['speaker']!=a['speaker']: continue
            if refs(ns,bid)!=1: continue
            if any(k in b for k in ('scene','cast','music','ambience','broadcast','sfx')): continue
            if (b.get('effects') or {}).get('setTime') or (a.get('effects') or {}).get('setTime'): continue
            if len((a['text']+' '+b['text']).split())>26: continue
            a['text']=a['text']+' '+b['text']
            e=merge_effects(a.get('effects'),b.get('effects'))
            if e: a['effects']=e
            if 'expr' in b: a['expr']=b['expr']
            nb=successor(ns,bid); ns.pop(idx(ns,bid)); record(bid,a['id'])
            if nb: a['next']=nb
            else: a.pop('next',None)
            merged+=1; changed=True; break
    save(name,d); total+=merged; print(name,merged)
if __name__=='__main__': print('merged',total)
