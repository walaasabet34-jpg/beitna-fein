import sys; sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
d=load('ch4-lamma-tergaai'); ns=d['nodes']
d['dayNames']=['','18/11','19/11','22/11','26/11','30/11','30/11']
d['calendar']={'1':'1973-11-18','2':'1973-11-19','3':'1973-11-22','4':'1973-11-26','5':'1973-11-30','6':'1973-11-30'}
get(ns,'s_ordinary')['text']='نعيمة خبطت ومعاها جواب. على الظرف ختم إسكندرية، وخط هدى عارفاه قبلك.'
get(ns,'s_ordinary')['cast']=['hoda','naima']
DET={'egg':'لسه مابتحبيش البيض المسلوق؟ أنا كمان مابحبوش.','cat':'مشمش لسه بتسرق سمك أم رضا؟','ball':'الكورة الشراب لسه معاكي؟ الخياطة الحمرا اللي فيها من فستاني القديم.','sky':'السما لسه بتدخل البيت من الإزاز الأزرق؟','count':'لسه بتعدّي السلالم وانتي طالعة؟'}
base='«يا هدى يا حبيبتي، الجواب وصلني في المصنع من إيد المشرفة. {d} أنا ساكنة مع زمايلي، وده عنواني. الإجازة أول الشهر، هاجي على طول. سلّمي على خالتك فاطمة. — ماما» وفي الظرف تلاتين قرش.'
replace_range(ns,'mother_reply','mother_reply_pick',[
  C('mother_read',[
    O('«اقريه إنتي يا هدى.»','mother_reply',effects={'flags':{'reply_read_by':'hoda'},'vars':{'trust':1}}),
    O('(تقريه بصوت عالي، على مهلك)','mother_reply',effects={'flags':{'reply_read_by':'fatma'}})],prompt='الجواب:'),
  N('mother_reply',base.format(d=DET['egg']),scene='paper',cast=[],effects={'flags':{'mother_contacted':True},'money':30},
    variants=[V(F('proof_detail',eq=k),base.format(d=v)) for k,v in DET.items()]),
  H('mother_reply_hoda','هي فاكرة!','laugh',scene='living',cast=['hoda'],variants=[
    V(F('reply_read_by',eq='hoda'),'قريته كله من غير ما أغلط. حتى «المشرفة».',expr='proud'),
    V(F('proof_detail',eq='ball'),'الخياطة الحمرا من فستانها! أنا ماكنتش أعرف.',expr='surprised')]),
  H('s_ribbon_ask','النهارده ينفع الشريطة الحمرا؟','smile'),
  A('s_ribbon_dress','dress',{'mode':'dress','school':False,'cold':True,'special':True,'today':'يوم جواب ماما · الجو بقى برد'}),
])
mp=get(ns,'mother_reply_pick')
mp['options'][1]['text']='«قوليلي إنتي، وأنا أكتب.»'
get(ns,'mother_write')['text']='كتبت أول سطر بسرعة. عند «الإجازة» وقفت: «بالألف ولا بالهمزة؟» قلتي اللي تعرفيه. شطبته هي وكتبتها صح.'
get(ns,'mother_dictate')['text']='قالت الجملة، وإنتي كتبتي بخطك الكبير. قرت وراكي وصحّحت كلمتين.'
get(ns,'mother_dictate')['effects']={'inc':{'hoda_corrected_fatma':1}}
get(ns,'mother_postpone')['text']='بعد ما خلصتي الكم كتبتوا الرد. ابن نعيمة خده البوستة.'
for k in ('mother_write','mother_dictate'): get(ns,k)['text']+=' ابن نعيمة خد الجواب.'
# after the name stitch: an ordinary afternoon before anything goes wrong
for k in ('s_help','s_later','s_refuse'): get(ns,k)['next']='s_hub_in'
insert_before(ns,'s_cough',[
  N('s_hub_in','العصر. الطلبية على الماكينة، والكورة جنب الكنبة.',effects={'setTime':{'day':1,'slot':2}}),
  {'id':'s_hub','type':'hub','scene':'living','cast':['hoda'],'hint':'فاضل وقت لحاجتين قبل الليل.','exitWhen':{'slot':{'gte':4}},'exit':'s_cough',
   'events':[{'id':'cold','if':{'all':[{'not':F('cl_cardigan',eq='made')},{'slot':{'gte':3}}]},'goto':'s_ev_cold'}],
   'ambient':[V(F('ribbon',eq='red'),'هدى لابسة الشريطة الحمرا، وكل شوية تلمسها.'),V(F('red_button',eq='hoda'),'الزرار الأحمر متخيّط على شريطتها.'),{'text':'هدى بتعدّ الزراير اللي في السلطانية، بالاتنين.'}],
   'hotspots':[
     {'id':'ball','target':'ball','label':'الكورة','takesTime':True,'once':True,'effects':{'slots':1},'goto':'s_ball_pre'},
     {'id':'sew','target':'sewing','label':'قميص ابن نعيمة (الزراير)','takesTime':True,'once':True,'effects':{'slots':1},'goto':'s_sew'},
     {'id':'cardigan','target':'wardrobe','label':'تقصّي جاكتتك القديمة على قدّها','takesTime':True,'once':True,'effects':{'slots':1},'goto':'s_cardigan'},
     {'id':'hoda','target':'hoda','label':'تقعدي جنبها','goto':'s_sit'}]},
  N('s_ev_cold','هدى نفخت في إيديها: «إيدي ساقعة.»',next='s_hub'),
  H('s_ball_pre','النهارده هعدّي العشرة. أنا عارفة.','proud'),
  A('ball_c4','ball',{'variant':'count','rounds':8,'effects':{'vars':{'trust':2,'distress':-3}}}),
  H('s_ball_post','ماما لما تيجي هتلعب معانا.','smile',next='s_hub',variants=[
    V(F('ball_last',gte=10),'عشرة! وأكتر! اكتبيها في الكراسة عشان ماما تشوف.',expr='laugh'),
    V(F('ball_stopped'),'ماشي. بس بكرة.',expr='neutral')]),
  N('s_sew','قميص ابن نعيمة ناقصه زراير. هدى قعدت قصادك قبل ما تناديها.'),
  A('s_buttons','buttons',{'order':'قميص ابن نعيمة','helper':'hoda','skill':0.88,'pay':15,'effects':{'vars':{'trust':2}}}),
  H('s_sew_after','أنا بقيت أشوف الحجم قبل اللون.','proud',effects={'inc':{'thread':-1}},next='s_hub'),
  N('s_cardigan','فكّيتي جاكتتك الصوف القديمة، وقصّيتيها على قد كتافها. الكم طلع أطول شوية؛ ثنيتيه.',effects={'flags':{'cl_cardigan':'made','layer':'cardigan'}}),
  H('s_cardigan2','بتشوّك… بس دافية.','neutral',next='s_hub'),
  H('s_sit','خالتي، تعرفي تعدّي بالاتنين؟ قولي: اتنين، أربعة…','smile'),
  C('s_sit_c',[O('«اتنين، أربعة، ستة، تمانية.»','s_sit_ok',effects={'vars':{'trust':1},'flags':{'fatma_counts':True}}),O('«اتنين، أربعة، سبعة.»','s_sit_joke',effects={'vars':{'openness':2},'flags':{'fatma_counts':True}})]),
  H('s_sit_ok','شاطرة. زي سعاد.','laugh',next='s_hub'),
  H('s_sit_joke','سبعة؟! إنتي بتغلطي عشان أضحك.','laugh',next='s_hub'),
])
get(ns,'s_cough')['text']='بالليل كحّت كذا مرة، وجبهتها سخنة. طلبتي من نعيمة ابنها يجيب الطبيب الصبح.'
get(ns,'s_rash')['effects']={'setTime':{'day':3,'slot':0},'flags':{'hoda_rash':True}}
sa=get(ns,'sick_activity')
sa['options']=[
  O('(تدحرجي لها الكورة على البطانية)','ball_bed'),
  O('(تحطي طبق الزراير جنبها على السرير)','buttons_bed'),
  O('(تفتحي الكراسة على صفحة فاضية)','sick_letter',effects={'flags':{'letter_to_mother':True}}),
  O('«نرتاح شوية، ونكمّل بعدين.»','sick_rest',effects={'flags':{'sick_rest':True}})]
remove(ns,'sick_buttons')
insert_before(ns,'sick_letter',[
  A('ball_bed','ball',{'variant':'bed','rounds':4,'effects':{'vars':{'safety':2}}}),
  N('sick_ball_after','سندت راسها. «كمّلي العد إنتي.» عدّيتي لحد عشرة، بصوت واطي.',effects={'flags':{'sick_ball':True,'fatma_counts':True}},next='s_company'),
  A('buttons_bed','buttons',{'order':'زراير القميص','helper':'bed','skill':0.9}),
  N('sick_buttons','عدّت صف صغير، وبعدين زقّت الطبق: «كفاية.» شلتيه من قدامها.',effects={'flags':{'sick_buttons':True}},next='s_company'),
])
get(ns,'s_search')['text']='كتبتي لأمها على عنوانها الجديد: «هدى عندها حصبة، والطبيب بيتابعها.» ابن نعيمة خد الجواب.'
get(ns,'s_search')['effects']={'flags':{'mother_told_illness':True}}
insert_before(ns,'s_breath',[
  N('s_mother_reply','يوم ٢٦ جه رد: «قلبي معاها. طلبت أقدّم الإجازة، قالولي أول الشهر. هاجي على أول قطر.»',scene='paper',cast=[],effects={'setTime':{'day':4,'slot':1},'flags':{'mother_reply_illness':True}}),
  H('s_mother_reply2','أول الشهر… فاضل أربع أيام.','tired',scene='sickroom',cast=['hoda']),
])
get(ns,'s_breath')['effects']={'setTime':{'day':5,'slot':2}}
get(ns,'s_urgent')['text']='نعيمة خرجت من عند الطبيب: «ابني راح البوستة يبعت برقية لأمها على العنوان الجديد.»'
get(ns,'s_urgent')['effects']={'flags':{'mother_urgent_message':True,'mother_telegram':True}}
r=get(ns,'s_reply')
r['options'].insert(1,O('(تعدّي على صوابعها، بالاتنين زي ما علّمتك)','s_reply_count',effects={'flags':{'last_count':True}},**{'if':F('fatma_counts')}))
insert_after(ns,'s_reply_quiet',[N('s_reply_count','عدّيتي على صوابعها بالراحة. عند ستة، فتحت عينها: «تمانية.» وغمّضت تاني.',next='s_decline')])
get(ns,'s_decline')['effects']={'setTime':{'day':6,'slot':4},'flags':{'hoda_died':True}}
get(ns,'s_return')['effects']={'setTime':{'day':6,'slot':4}}
get(ns,'s_return')['text']='رجعتي ومعاكي حاجتها. عند الباب، فتحتي على مهلك عشان ماتصحيهاش. بعدين افتكرتي.'
save('ch4-lamma-tergaai',d)
print('ch4 ok',len(ns))
d=load('ch4-lamma-tergaai'); ns=d['nodes']
get(ns,'s_ordinary')['next']='mother_read'
save('ch4-lamma-tergaai',d)
d=load('ch4-lamma-tergaai'); ns=d['nodes']
for k in ('s_honest','s_wait','s_false'): get(ns,k)['next']='s_mother_reply'
save('ch4-lamma-tergaai',d)
d=load('ch4-lamma-tergaai'); ns=d['nodes']
get(ns,'s_doctor')['cast']=['hoda','doctor']; get(ns,'s_rash')['cast']=['hoda','doctor']
get(ns,'sick_activity')['cast']=['hoda']
save('ch4-lamma-tergaai',d)
d=load('ch4-lamma-tergaai'); ns=d['nodes']
get(ns,'s_ordinary')['text']='نعيمة خبطت ومعاها جواب. على الظرف ختم إسكندرية، وهدى عرفت الخط قبلك.'
get(ns,'s_mother_reply2')['text']='أول الشهر… يعني خمس أيام.'
save('ch4-lamma-tergaai',d)
