import sys; sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
d=load('ch5-elshanta'); ns=d['nodes']
go=get(ns,'g_objects')
go['prompt']='الطلبية قدامك. تبدأي بإيه؟'
go['options']=[
  O('(تطلّعي الكورة من تحت الماكينة)','ball_alone',**{'if':{'any':[F('ball_games'),F('ball_stairs')]}}),
  O('(تفتحي علبة الزراير)','g_buttons'),
  O('(تفتحي الكراسة)','g_notebook',effects={'flags':{'grief_opened_book':True}}),
  O('(تسيبي كل حاجة مكانها النهارده)','g_leave',effects={'flags':{'grief_left_room':True}})]
insert_before(ns,'g_notebook',[
  A('ball_alone','ball',{'variant':'alone','rounds':3}),
  N('g_ball_after','الكورة وقفت تحت الماكينة. ماحدش قال الرقم.',next='g_war_memory',variants=[
    V(F('ball_alone_caught'),'مسكتيها. وقفتي مستنية حد يقول الرقم.'),
    V(F('knows_high'),'رميتيها عالي، زي ما كانت بتحب. نزلت ووقفت تحت الماكينة.')]),
  A('g_buttons','buttons',{'order':'قميص ابن نعيمة','helper':'none','skill':0,'redLine':'الزرار الأحمر اللي كانت بتحطه على جنب.'}),
  N('g_buttons_after','السلطانيتين اتملوا. الصينية ساكتة.',next='g_war_memory',variants=[
    V(F('red_button',eq='hoda'),'السلطانيتين اتملوا. الزرار الأحمر مش في العلبة؛ متخيّط على شريطتها.')]),
])
get(ns,'g_notebook')['text']='في الكراسة إملا وحساب ورسم ناقص. في آخر صفحة أرقام بخطها: ٢، ٤، ٦، ٨…'
get(ns,'g_contact')['text']='نعيمة خبطت: «أمها وصلت الصبح بدري يوم ما رجعنا، على البرقية. قلتلها. وهي عندي من ساعتها، وطالبة تشوفك.»'
get(ns,'g_identity')['text']='«كانت بتبعت على أوضة سنية، ومارجعلهاش رد غير جوابكم اللي جالها في المصنع.»'
get(ns,'g_news')['text']='«عايزة تاخد حاجات بنتها، وعايزة تسمع منك.»'
# pack her things (a real action) before the keepsake decision
for k in ('g_yes','g_later','g_send'): get(ns,k)['next']='g_pack'
CAP=[
  {'item':'yellow','if':F('cl_yellow',eq='flower'),'text':'الوردة الستان على الشق اللي من لعب الأولى.'},
  {'item':'yellow','if':F('cl_yellow',eq='mended'),'text':'الرقعة اللي تحت مش باينة غير لو دوّرتي عليها.'},
  {'item':'yellow','if':F('cl_yellow',eq='torn'),'text':'الشق اللي من لعب الأولى. ماتخيّطش.'},
  {'item':'yellow','text':'الفستان اللي جت بيه.'},
  {'item':'navy','if':F('cl_navy',eq='fitted'),'text':'الكم اللي قصّرتيه على قدّها.'},
  {'item':'navy','text':'المريلة، وكمّها الطويل.'},
  {'item':'cardigan','text':'الجاكتة اللي قالت إنها بتشوّك، ولبستها.'},
  {'item':'comb','text':'المشط أبو سنة مكسورة.'},
  {'item':'notebook','if':F('ball_last',gte=10),'text':'الكراسة الزرقا. في آخرها «عشرة» بخط كبير.'},
  {'item':'notebook','text':'الكراسة الزرقا.'},
  {'item':'doll','text':'زوزو، عينيها مش قد بعض.'},
  {'item':'redButton','text':'الزرار الأحمر، متخيّط على شريطة.'},
  {'item':'ribbon','if':F('ribbon',eq='red'),'text':'الشريطة الحمرا اللي لبستها يوم جواب أمها.'},
  {'item':'ribbon','text':'الشريطة الحمرا. كانت مستنية يوم مخصوص.'},
  {'item':'ball','text':'الكورة الشراب.'},
]
insert_before(ns,'g_prepare',[A('g_pack','dress',{'mode':'pack','captions':CAP})])
# what Fatma tells the mother: precise, from this route
ga=get(ns,'g_account')
ga['options']=[
  O('«كانت بتعدّ كل حاجة.»','g_account_count',effects={'flags':{'mother_account':'count'}}),
  O('«كانت بتدوّر على المشط كل شوية.»','g_account_true',effects={'flags':{'mother_account':'truth'}}),
  O('«كنت ساعات بصدّها لما تطلب مني حاجة…»','g_account_fault',effects={'flags':{'mother_account':'admitted'}},**{'if':{'any':[F('memory_refused'),F('war_snap'),F('news_dismissed'),F('sew_denied'),F('ball_waiting'),{'all':[F('ball_promised'),{'not':F('ball_games')}]}]}}),
  O('«فتحت شنطتها من غير إذنها.»','g_account_bag',effects={'flags':{'mother_account':'admitted_bag'}},**{'if':{'any':[F('bag_peeked'),F('c2_peek'),F('c2_bag_opened')]}}),
  O('«مش عارفة أتكلم. تحبي تشوفي كراستها؟»','g_account_silent',effects={'flags':{'mother_account':'silent'}})]
insert_before(ns,'g_account_true',[
  L('g_account_count','fatma','السلالم، والبلاط، والعيال اللي تحت الشباك.',variants=[
    V(F('ball_wall'),'كانت بتعدّ بالاتنين زي المدرسة. والكورة لازم تخبط في الحيطة الأول.'),
    V({'any':[F('ball_games'),F('ball_stairs')]},'السلالم، والكورة. لما تقع، تقول «من الأول».')]),
  L('g_account_count2','mother','دي أنا اللي علّمتها. «اللي يعدّ مايتوهش».',expr='sad',next='g_mother_seam'),
  L('g_account_bag','mother','وهي عرفت؟',next='g_account_bag2'),
  N('g_account_bag2','هزّيتي راسك. الأم بصّت للقفل شوية، وماقالتش حاجة.',next='g_mother_seam'),
])
get(ns,'g_account_fault')['text']='قولي لي حصل إيه. وكانت بتعمل إيه لوحدها.'
# the mother can leave the ball — her decision
insert_before(ns,'g_handover',[
  B('g_ball_b',[({'any':[F('ball_games'),F('ball_stairs')]},'g_ball_mother')],'g_handover'),
  N('g_ball_mother','الأم شالت الكورة الشراب من فوق الهدوم، ولفّتها في إيدها. الخياطة الحمرا ناحيتك.'),
  L('g_ball_mother2','mother','دي من شرابات أبوها. …خلّيها هنا. هنا كانت بتلعب.',effects={'flags':{'ball_left_by_mother':True}}),
])
for k in ('g_seam_truth','g_seam_nod'):
    pass
gk=get(ns,'g_keepsake'); gk['else']='g_ball_b'
get(ns,'g_ask_drawing')['next']='g_ball_b'
fm=get(ns,'final_machine')
fm['options'].insert(0,O('(تحطي الكورة على الكرسي التاني)','final_ball',effects={'flags':{'final_work':'ball'}},**{'if':F('ball_left_by_mother')}))
insert_before(ns,'final_unthread',[N('final_ball','حطيتيها على الكرسي. اتدحرجت شوية، ووقفت. عدّيتي لحد اتنين، ووقفتي.',next='g_end_met')])
for eid in ('g_end_met','g_end_sent','g_end_hold'):
    e=get(ns,eid)
    e['memories']=[
      V(F('ball_stairs'),'أول ما شفتيها، كانت بتعدّ السلم بالكورة.'),
      V(F('ball_last',gte=10),'عدّت العشرة، وطلبت تكتبيها في الكراسة.'),
      V(F('red_button',eq='hoda'),'الزرار الأحمر اللي خدته من العلبة.'),
      V(F('cl_yellow',eq='flower'),'وردة ستان على طرف فستانها.'),
      V(F('hoda_corrected_fatma'),'كانت بتصحّحلك الكلمات.'),
      V(F('fatma_counts'),'علّمتك تعدّي بالاتنين.'),
    ]+[m for m in e.get('memories',[]) if 'الغرزة' in m['text'] or 'خيط' in m['text'] or 'العبور' in m['text'] or 'بتصدّي' in m['text'] or 'عروسة' in m['text']]
save('ch5-elshanta',d)
print('ch5 ok',len(ns))
d=load('ch5-elshanta'); ns=d['nodes']
remove(ns,'g_clothes')
ga=get(ns,'g_account'); ga['options'].insert(4,O('«كانت كويسة معايا.»','g_account_hide',effects={'flags':{'mother_account':'evasive'}}))
save('ch5-elshanta',d)
d=load('ch5-elshanta'); ns=d['nodes']
r=get(ns,'g_reply')
r['variants']=[V(F('keepsake_request',eq='drawing'),'نعيمة رجعت بعد يومين: «الحاجات وصلت. سألتها على الرسمة؛ قالت لسه ماشافتش كل حاجتها، وهي اللي هتقول بعدين. ولو حبيتي تحكيلها في يوم، أنا أعرف أوصّلك.»')]
save('ch5-elshanta',d)
