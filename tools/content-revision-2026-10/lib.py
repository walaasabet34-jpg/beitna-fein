import json, os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'content', 'chapters') + '/'
def load(name): return json.load(open(ROOT+name+'.json'))
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
