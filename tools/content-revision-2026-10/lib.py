import json, os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'content', 'chapters') + '/'
CURRENT=[None]
REMOVED_FILE=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'removed.json')
def record(old, new):
    r=json.load(open(REMOVED_FILE)) if os.path.exists(REMOVED_FILE) else {}
    ch=CURRENT[0]; r.setdefault(ch,{})
    for k,v in list(r[ch].items()):
        if v==old: r[ch][k]=new
    r[ch][old]=new
    json.dump(r, open(REMOVED_FILE,'w'), ensure_ascii=False, indent=1)
def load(name):
    d=json.load(open(ROOT+name+'.json')); CURRENT[0]=d['id']; return d
def save(name, d):
    json.dump(d, open(ROOT+name+'.json','w'), ensure_ascii=False, indent=2); open(ROOT+name+'.json','a').write('\n')
def L(id, speaker, text, **kw):
    n={'id':id,'type':'line','speaker':speaker,'text':text}; n.update(kw); return n
def N(id, text, **kw): return L(id,'narrator',text,**kw)
def H(id, text, expr=None, **kw):
    n=L(id,'hoda',text,**kw)
    if expr: n['expr']=expr
    return n
def C(id, options, prompt=None, **kw):
    n={'id':id,'type':'choice','options':options}
    if prompt: n['prompt']=prompt
    n.update(kw); return n
def O(text, goto, **kw):
    o={'text':text,'goto':goto}; o.update(kw); return o
def B(id, cases, els, **kw):
    n={'id':id,'type':'branch','cases':[{'if':c,'goto':g} for c,g in cases],'else':els}; n.update(kw); return n
def A(id, activity, params, **kw):
    n={'id':id,'type':'activity','activity':activity,'params':params}; n.update(kw); return n
def V(cond, text, **kw):
    v={'if':cond,'text':text}; v.update(kw); return v
def F(name, **kw):
    c={'flag':name}; c.update(kw); return c
def idx(nodes, id):
    for i,n in enumerate(nodes):
        if n['id']==id: return i
    raise KeyError(id)
def get(nodes,id): return nodes[idx(nodes,id)]
def replace_range(nodes, a, b, new):
    """replace nodes from id a up to (excluding) id b"""
    i=idx(nodes,a); j=idx(nodes,b) if b else len(nodes)
    nodes[i:j]=new
def insert_after(nodes, a, new):
    i=idx(nodes,a); nodes[i+1:i+1]=new
def insert_before(nodes, a, new):
    i=idx(nodes,a); nodes[i:i]=new
def remove(nodes, *ids):
    for id in ids: nodes.pop(idx(nodes,id))

def successor(ns, id):
    n = get(ns, id); i = idx(ns, id)
    return n.get('next') or (n.get('else') if n['type']=='branch' else None) or (ns[i+1]['id'] if i+1 < len(ns) else None)

def merge_effects(a, b):
    """effects a happen before b"""
    if not a: return b
    if not b: return dict(a)
    out = {}
    for k in sorted(set(a) | set(b)):
        if k in ('flags','vars','inc','setTime'):
            m = dict(a.get(k, {}))
            for kk, vv in b.get(k, {}).items():
                m[kk] = (m.get(kk, 0) + vv) if k in ('vars','inc') else vv
            out[k] = m
        elif k in ('money','slots'): out[k] = a.get(k, 0) + b.get(k, 0)
        else: out[k] = b.get(k, a.get(k))
    return out

def drop(ns, id):
    """Remove a plain line; its effects/scene/cast move to the next node; every reference is rewired."""
    n = get(ns, id); assert n['type'] == 'line', id
    to = successor(ns, id); t = get(ns, to)
    assert t['type'] != 'hub' or not n.get('effects'), f'{id}: effects would repeat on every hub entry'
    t['effects'] = merge_effects(n.get('effects'), t.get('effects'))
    if not t['effects']: t.pop('effects')
    for k in ('scene','cast','ambience','music','broadcast'):
        if k in n and k not in t: t[k] = n[k]
    for m in ns:
        if m.get('next') == id: m['next'] = to
        if m.get('else') == id: m['else'] = to
        if m.get('exit') == id: m['exit'] = to
        for c in m.get('cases', []):
            if c['goto'] == id: c['goto'] = to
        for o in m.get('options', []):
            if o['goto'] == id: o['goto'] = to
        for h in m.get('hotspots', []):
            if h['goto'] == id: h['goto'] = to
        for e in m.get('events', []):
            if e['goto'] == id: e['goto'] = to
    # implicit fall-through: the node before now falls into `to` (removing keeps order, so only explicit refs matter)
    i = idx(ns, id); prev = ns[i-1] if i > 0 else None
    record(id, to)
    ns.pop(i)
    if prev and prev['type'] in ('line','card') and 'next' not in prev and ns[i]['id'] != to: prev['next'] = to

def T(ns, id, text): get(ns, id)['text'] = text

def refs(ns, id):
    c=0
    for i,m in enumerate(ns):
        for k in ('next','else','exit'):
            if m.get(k)==id: c+=1
        c+=sum(1 for x in m.get('cases',[]) if x['goto']==id)
        c+=sum(1 for x in m.get('options',[]) if x['goto']==id)
        c+=sum(1 for x in m.get('hotspots',[]) if x['goto']==id)
        c+=sum(1 for x in m.get('events',[]) if x['goto']==id)
        if i+1<len(ns) and ns[i+1]['id']==id and m['type'] in ('line','card') and 'next' not in m: c+=1
    return c
