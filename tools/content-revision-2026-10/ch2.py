import sys; sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
d=load('ch2-elkelma'); ns=d['nodes']
SCHOOL={'mode':'dress','school':True,'cold':False,'today':'أول يوم مدرسة · الصبح طراوة'}
# ── Morning: the uniform is a real thing to put on, mend, argue about ──
get(ns,'c2_dress_navy')['text']='المريلة الكحلي اتغسلت واتعلّقت جنب الشباك. كمّ أطول من التاني.'
get(ns,'c2_dress_navy')['effects']={'flags':{'c2_navy_out':True}}
get(ns,'c2_dress_navy2')['text']='هي هتبقى على قدّي؟'
get(ns,'c2_dress_navy2')['expr']='worried'
get(ns,'c2_dress_navy2')['next']='c2_dress_act'
get(ns,'c2_dress_ask_yes')['text']='طلّعت المريلة من الشنطة بنفسها، وقفلت الشنطة تاني.'
get(ns,'c2_dress_ask_yes')['effects']={'vars':{'trust':2},'flags':{'c2_navy_out':True}}
get(ns,'c2_dress_ask_yes')['next']='c2_dress_act'
get(ns,'c2_dress_ask_no')['effects']={'flags':{'c2_outfit':'yellow','outfit':'yellow'}}
get(ns,'c2_dress_c')['options'][1]['effects']={'vars':{'trust':-5,'distress':4},'flags':{'c2_bag_opened':True,'c2_navy_out':True}}
get(ns,'c2_dress_c')['options'][2]['effects']={'vars':{'autonomy':1},'flags':{'c2_outfit':'yellow','outfit':'yellow'}}
get(ns,'c2_dress_took2')['text']='لبستها وهي ساكتة. ماقالتش شكرًا.'
get(ns,'c2_dress_took2')['next']='c2_dress_act'
get(ns,'c2_dress_yellow')['next']='c2_lunch'
insert_after(ns,'c2_dress_yellow',[A('c2_dress_act','dress',SCHOOL)])
# lunch follows the activity; the yellow line already jumps there
# ── Naima: what the post actually did ──
get(ns,'c2_naima_c')['options'][1]['text']='«الجوابات وصلت لحاجة؟»'
get(ns,'c2_n_office')['text']='الجواب اللي على المصنع رجع، عليه ختم. واللي على سكن العاملات لسه مارجعلوش رد.'
insert_after(ns,'c2_n_office',[
  N('c2_n_office2','نعيمة ناولتك الظرف الراجع. قريتي لها الختم بالراحة: «العنوان غير كافٍ».',effects={'flags':{'search_factory_returned':True}}),
  L('c2_n_office3','naima','يعني السكن هو اللي هيوصّل. ابني هيعدّي على عم فوزي تاني يمكن يعرف اسم المشرفة.',next='c2_naima_end'),
])
get(ns,'c2_home1')['text']='البيت فاضي. الكورة الشراب واقفة جنب رجل الكنبة.'
get(ns,'c2_sew')['effects']={'flags':{'c2_sew1':True},'inc':{'thread':-1}}
# ── Return: the dress carries the day ──
insert_after(ns,'c2_ret2',[
  B('c2_ret_tear_b',[({'all':[F('outfit',eq='yellow'),{'not':F('cl_yellow',eq='torn')}]},'c2_ret_tear')],'c2_ret_tidy_b'),
  N('c2_ret_tear','طرف الفستان الأصفر مشقوق من تحت، شق قد صباعين.',effects={'flags':{'cl_yellow':'torn'}}),
  H('c2_ret_tear2','لعبنا الأولى. الشبشب طار، وأنا نطّيت وراه.','guarded',next='c2_ret_tidy_b'),
])
# ── Evening hub: ball off the wall, buttons with her ──
hub=get(ns,'c2_hub2')
hub['hotspots'].insert(1,{'id':'ball','target':'ball','label':'الكورة على الحيطة','takesTime':True,'once':True,'effects':{'slots':1},'goto':'c2_ball_pre'})
for h in hub['hotspots']:
    if h['id']=='button' or h['goto']=='c2_button': h['label']='الزراير وجلابية أبو سيد'
hub['ambient'].insert(0,V(F('cl_yellow',eq='torn'),'هدى قاعدة وإيدها على الشق اللي في طرف فستانها.'))
insert_before(ns,'c2_talk',[
  H('c2_ball_pre','في المدرسة بنعدّ بالاتنين. اتنين، أربعة، ستة! والكورة لازم تخبط في الحيطة الأول.','laugh',cast=['hoda']),
  A('ball_c2','ball',{'variant':'wall','rounds':6,'effects':{'vars':{'trust':3,'openness':3,'distress':-4}}}),
  H('c2_ball_post','الحيطة بتاعتكم بترجّع أحسن من بتاعة المدرسة.','smile',next='c2_hub2',variants=[
    V(F('ball_stopped'),'ماشي. سعاد بتقول إن الكبار بيزهقوا بسرعة.',expr='bored'),
    V(F('ball_last',gte=5),'عشرة! اتنين، أربعة، ستة، تمانية، عشرة!',expr='proud')]),
])
replace_range(ns,'c2_button','c2_button_b',[
  N('c2_button','جلابية أبو سيد ناقصها زراير. وزرار المريلة القديمة واقع كمان.'),
  A('c2_buttons','buttons',{'order':'جلابية أبو سيد','helper':'hoda','skill':0.72,'effects':{'vars':{'trust':2,'openness':2,'distress':-2}}}),
])
# ── Homework: she corrects you too ──
replace_range(ns,'c2_w_sea','c2_fam',[
  N('c2_w_sea','كاتبة «بحر» تحت الكلمتين.'),
  C('c2_w_sea_c',[
    O('«بحر» صح. (تكمّلي)','c2_w_sea_ok',effects={'vars':{'trust':1}}),
    O('«مش ناقصها ألف؟ بحار؟»','c2_w_sea_wrong',effects={'inc':{'hoda_corrected_fatma':1},'vars':{'openness':2}})]),
  H('c2_w_sea_ok','دي صح. البحر ده أنا عارفاه كويس.','smile',next='c2_hw_hub'),
  H('c2_w_sea_wrong','بحار دي كتير يا خالتي! البحر واحد.','laugh',next='c2_hw_hub'),
])
# ── Day 2: dress again; the tear can be mended ──
insert_after(ns,'c2_d2_paid',[])
get(ns,'c2_d2_pay')['else']='c2_d2_dress'
get(ns,'c2_d2_paid')['next']='c2_d2_dress'
insert_before(ns,'c2_d2_1',[A('c2_d2_dress','dress',{'mode':'dress','school':True,'cold':False,'today':'تاني يوم · مدرسة'},scene='morning',cast=['hoda'])])
end=get(ns,'c2_end')
end['memories']+=[
  V(F('ball_wall'),'عدّيتوا بالاتنين، والكورة بتخبط في الحيطة.'),
  V(F('cl_yellow',eq='flower'),'خيطتي وردة ستان على شق فستانها.'),
  V(F('cl_yellow',eq='mended'),'رقعتي شق فستانها.'),
  V(F('cl_navy',eq='fitted'),'قصّرتي كم المريلة على قدّها.'),
  V(F('hoda_corrected_fatma'),'هدى صحّحتلك كلمة، وضحكت.'),
]
save('ch2-elkelma',d)
print('ch2 ok',len(ns))
d=load('ch2-elkelma'); ns=d['nodes']
get(ns,'c2_n_office')['next']='c2_n_office2'
save('ch2-elkelma',d)
d=load('ch2-elkelma'); ns=d['nodes']
get(ns,'c2_night')['text']='بالليل، هدى رتّبت شنطة المدرسة لبكرة، وحطّت الكورة جنبها.'
get(ns,'c2_naima_day2')['text']='ابني عدّى على عم فوزي تاني. قال إن مشرفة السكن بترد على الجوابات. نستنى.'
get(ns,'c2_naima_day2b')['text']='طلعتي السلم.'
# dress for school only on the routes that go to school
remove(ns,'c2_d2_dress')
get(ns,'c2_d2_pay')['else']='c2_d2_1'
get(ns,'c2_d2_paid')['next']='c2_d2_1'
pl=get(ns,'c2_plan')
for o in pl['options']:
    if o['goto'] in ('c2_teacher1','c2_un1','c2_prac1'):
        o.setdefault('effects',{}).setdefault('flags',{})['c2_d2_route']=o['goto']; o['goto']='c2_d2_dress'
insert_after(ns,'c2_plan',[
  A('c2_d2_dress','dress',{'mode':'dress','school':True,'cold':False,'today':'تاني يوم · مدرسة'},scene='morning',cast=['hoda']),
  B('c2_d2_route_b',[(F('c2_d2_route',eq='c2_teacher1'),'c2_teacher1'),(F('c2_d2_route',eq='c2_un1'),'c2_un1')],'c2_prac1'),
])
save('ch2-elkelma',d)
