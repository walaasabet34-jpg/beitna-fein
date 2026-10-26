# Narration directly before a character's line becomes that line's `lead`: one screen instead of two.
import sys; sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
def rewire(ns, frm, to):
    for m in ns:
        for k in ('next','else','exit'):
            if m.get(k)==frm: m[k]=to
        for coll in ('cases','options','hotspots','events'):
            for x in m.get(coll,[]):
                if x['goto']==frm: x['goto']=to
total=0
for name in ['ch1-elshanta','chwar-sout-elradio','ch2-elkelma','ch3-elkhabar','ch4-lamma-tergaai','ch5-elshanta']:
    d=load(name); ns=d['nodes']
    # transition lines the stage already shows
    DROP={'ch1-elshanta':['c1_d11','c1_evening','c1_bed_end','c1_ball_pre'],'chwar-sout-elradio':['w_afternoon','w_oct25','war_tune'],
          'ch2-elkelma':['c2_leave_end','c2_naima_day2b'],'ch4-lamma-tergaai':['s_mother_reply2','s_waiting'],'ch3-elkhabar':['c3_a3'],'ch5-elshanta':[]}[name]
    for x in DROP:
        try: drop(ns,x)
        except AssertionError as e: print('skip',x,e)
    n_merged=0; changed=True
    while changed:
        changed=False
        for i,a in enumerate(ns):
            if a['type']!='line' or a['speaker']!='narrator' or a.get('variants') or a.get('lead'): continue
            bid=successor(ns,a['id']);
            if not bid: continue
            b=get(ns,bid)
            if b['type']!='line' or b['speaker']=='narrator' or b.get('lead'): continue
            if refs(ns,bid)!=1: continue
            if any(k in b for k in ('scene','cast')) and any(k in a for k in ('scene','cast')): continue
            if len((a['text']+' '+b['text']).split())>34: continue
            # the earlier node keeps its id (saves and links point at it); it takes the speaker's line
            keep_id=a['id']; lead=a['text']; eff=merge_effects(a.get('effects'),b.get('effects'))
            stage={k:a[k] for k in ('scene','cast','music','ambience','broadcast','sfx') if k in a}
            nb=successor(ns,bid)
            new=dict(b); new['id']=keep_id; new['lead']=lead
            if 'next' not in new and nb: new['next']=nb
            if eff: new['effects']=eff
            for k,v in stage.items(): new.setdefault(k,v)
            j=idx(ns,bid); ns[i]=new; ns.pop(j); record(bid, keep_id)
            if 'next' not in new and j!=i+1:
                pass
            n_merged+=1; changed=True; break
    save(name,d); total+=n_merged; print(name,'lead',n_merged)
print('lead total',total)
