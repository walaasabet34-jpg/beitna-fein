import sys; sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
d=load('ch3-elkhabar'); ns=d['nodes']
replace_range(ns,'c3_a1','c3_paper',[
  N('c3_a1','الخيط خلص، وجلابية الحاج لسه في نصها. آخر بكرة لفّة واحدة.',scene='living',cast=['hoda'],effects={'flags':{'thread':0}}),
  C('c3_thread',[
    O('تنزلي تجيبي بكرة من الخردواتي.','c3_buy',effects={'money':-2,'flags':{'thread':1,'thread_bought':True}},**{'if':{'money':{'gte':2}}}),
    O('تطلبي بكرة من نعيمة لحد ما تقبضي.','c3_borrow',effects={'flags':{'thread':1,'thread_borrowed':True}}),
    O('تفكّي خيط من فستان قديم مقطوع.','c3_unpick',effects={'slots':1,'flags':{'thread':1,'thread_unpicked':True}})],prompt='الخيط:'),
  N('c3_buy','نزلتي. الخردواتي لفّ البكرة في ورقة جرنال.',next='c3_a2'),
  N('c3_borrow','نعيمة ادّتك بكرة، وطلّعت من صدرها جواب: «ده من ابني اللي في الجيش. اقريهولي.» قريتيه لها مرتين.',cast=['naima'],scene='door',effects={'flags':{'read_for_naima':True}},next='c3_a2'),
  N('c3_unpick','هدى قعدت تفك معاكي. كل ما الخيط يطول، تقول رقمه: «تلاتين… واحد وتلاتين…»',effects={'vars':{'trust':1}},next='c3_a2'),
  N('c3_a2','تحت عند باب العمارة، البواب نده عليكي.',scene='door',cast=['doorman']),
  L('c3_a3','doorman','الحاجة نعيمة سايبة لك الجواب ده. جالها رد.'),
  N('c3_a4','رد من مشرفة سكن العاملات: «اللي عندنا بالاسم ده عندها بنت ست سنين. وفيه واحدة تانية بنفس الاسم سابت السكن الشهر اللي فات.»',scene='paper',cast=[],effects={'flags':{'search_supervisor_reply':True}}),
])
p=get(ns,'c3_paper'); p['prompt']='الرد:'
p['options'][0]['text']='«مين جاب الرد؟»'
get(ns,'c3_ask')['text']='البواب هز راسه: «ابن الحاجة نعيمة جابه من البوستة.»'
get(ns,'c3_keep')['text']='حطيتي الورقة في جيب الجلابية. «ست سنين» فضلت في دماغك.'
cc=get(ns,'clue_compare'); cc['prompt']='تقارني إيه؟'
cc['options'][0]['text']='السن: ست سنين، وهدى تسعة.'
cc['options'][1]['text']='المحل: عم فوزي، والسويس.'
cc['options'][2]['text']='«سابت السكن الشهر اللي فات.»'
get(ns,'clue_age')['text']='كتبتي على ضهر الورقة: «بنتها تسع سنين، مش ست».'
get(ns,'clue_shop')['text']='كتبتي: «كانت شغالة عند عم فوزي الترزي، وأصلها من السويس».'
get(ns,'clue_source')['text']='علّمتي على السطر: «سابت السكن». الأوضة اللي في جوابها.'
get(ns,'c3_history_yes')['text']='افتكرتي جواب العلبة: «لقيت أوضة مع اتنين زمايلي». يبقى هي اللي سابت السكن، ولسه شغالة في المصنع.'
get(ns,'c3_history_yes')['effects']={'flags':{'clue_moved_out':True}}
get(ns,'c3_history')['cases']=[{'if':{'any':[F('search_box'),F('c2_office_lead')]},'goto':'c3_history_yes'}]
get(ns,'c3_history_no')['text']='الاسم لوحده مش كفاية. محتاجة حاجة تعرّف بيها هدى.'
t=get(ns,'c3_truth')
t['options'][0]['text']='«جالنا رد. مش ماما، بس عرفنا إنها سابت السكن ولسه في المصنع.»'
t['options'][1]['text']='«جه رد، وهكتب تاني الأول. وبعدين أحكيلك.»'
get(ns,'c3_truth_yes')['text']='هدى سألت: «يعني نكتب لها في الشغل؟» قلتي: «في الشغل، إيد بإيد.»'
for k in ('c3_truth_yes','c3_truth_later','c3_truth_no'): get(ns,k)['next']='c3_proof_b'
insert_after(ns,'c3_truth_no',[
  B('c3_proof_b',[(F('c3_told',eq=False),'c3_proof_alone')],'c3_proof'),
  H('c3_proof','أنا هكتب حاجة ماما بس اللي تعرفها. عشان تعرف إنها أنا.','focused',cast=['hoda']),
  C('c3_proof_c',[
    O('«اكتبي عن البيض المسلوق.»','c3_proof_egg',effects={'flags':{'proof_detail':'egg'}}),
    O('«اكتبي عن مشمش.»','c3_proof_cat',effects={'flags':{'proof_detail':'cat'}},**{'if':F('cat')}),
    O('«ارسمي الكورة الشراب.»','c3_proof_ball',effects={'flags':{'proof_detail':'ball'}}),
    O('«اختاري إنتي.»','c3_proof_own',effects={'flags':{'proof_detail':'sky'},'vars':{'autonomy':2}})],prompt='الإثبات:'),
  H('c3_proof_egg','«أنا لسه مابحبش البيض المسلوق.» هي هتضحك.','laugh',next='c3_proof_send'),
  H('c3_proof_cat','«مشمش كانت بتنام عندنا وسرقت سمكة أم رضا.»','smile',next='c3_proof_send'),
  N('c3_proof_ball','رسمت الكورة الشراب بالخياطة الحمرا اللي في نصها، وكتبت تحتها: «اللي إنتي عملتيها».',next='c3_proof_send'),
  H('c3_proof_own','«السما لسه بتدخل البيت من الإزاز الأزرق.» دي بتاعة ماما.','proud',next='c3_proof_send'),
  N('c3_proof_alone','كتبتي لوحدك على ضهر الورقة: حاجة تعرّف بيها الأم بنتها.'),
  C('c3_proof_alone_c',[
    O('«بنتك مابتحبش البيض المسلوق.»','c3_proof_send',effects={'flags':{'proof_detail':'egg'}},**{'if':{'any':[F('knows_food'),F('c2_sandwich',eq='boiled')]}}),
    O('«بنتك بتعدّ السلالم وهي طالعة.»','c3_proof_send',effects={'flags':{'proof_detail':'count'}}),
    O('«بنتك معاها كورة شراب في نصها خياطة حمرا.»','c3_proof_send',effects={'flags':{'proof_detail':'ball'}})]),
  N('c3_proof_send','على الظرف للمشرفة: «سلّميه لها في المصنع، إيد بإيد. بنتها تسع سنين، وكانت شغالة عند عم فوزي.»',effects={'flags':{'search_second_letter':True}},next='c3_evening'),
])
get(ns,'c3_naima')['text']='ابني حط الجواب في البوستة الصبح، وكتب اسم المشرفة على الظرف.'
ck=get(ns,'c3_check')
ck['options'][0]['text']='«لو مارجعش رد في أسبوع، ابنك يروح المصنع بنفسه؟»'
ck['options'][0]['effects']={'vars':{'openness':2},'flags':{'c3_note_checked':True,'search_backup_plan':True}}
ck['options'][1]['text']='«تسلم إيده. وأنا هقرا لك أي جواب ييجي.»'
ck['options'][2]['text']='تشكريها وترجعي.'
get(ns,'c3_check_careful')['text']='نعيمة هزت راسها: «أسبوع. وإسكندرية مش بعيدة.»'
get(ns,'c3_check_name')['text']='نعيمة ضحكت: «ده انتي اللي بتقريلي من أول الشهر.»'
get(ns,'c3_check_home')['text']='طلعتي السلم وانتي بتعدّي الأيام لحد الأسبوع.'
fc=get(ns,'c3_final_choice')
fc['options'][0]['text']='«مش ماما. بس الجواب رايح لها في الشغل.»'
fc['options'][1]['text']='«لسه. لما الرد ييجي هقولك على طول.»'
get(ns,'c3_final_clear')['text']='هدى بصت للفستان، وردّت المشط مكانه. «يعني أسبوع؟»'
end=get(ns,'c3_end')
end['text']='الورقة رجعت درج الماكينة، جنب جواب الأم القديم. وجواب جديد في الطريق للمصنع.'
end['memories']+=[
  V(F('read_for_naima'),'قريتي لنعيمة جواب ابنها، ونعيمة ادّتك الخيط.'),
  V(F('thread_unpicked'),'هدى عدّت الخيط وإنتو بتفكّوه.'),
  V(F('proof_detail',eq='egg'),'هدى كتبت لأمها عن البيض المسلوق.'),
  V(F('proof_detail',eq='ball'),'الكورة الشراب راحت لأمها مرسومة.'),
]
save('ch3-elkhabar',d)
print('ch3 ok',len(ns))
d=load('ch3-elkhabar'); ns=d['nodes']
get(ns,'c3_a1')['text']='الخيط خلص، والطلبية الجديدة لسه في نصها. آخر بكرة لفّة واحدة.'
get(ns,'c3_night')['text']='بالليل، رد المشرفة فضل في درج الماكينة، جنب جواب الأم القديم.'
save('ch3-elkhabar',d)
