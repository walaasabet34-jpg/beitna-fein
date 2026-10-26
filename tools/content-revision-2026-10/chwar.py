import sys; sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
d=load('chwar-sout-elradio'); ns=d['nodes']
get(ns,'w_start')['effects']={'flags':{'cl_yellow':'clean'}}
get(ns,'w_oct6')['text']='الفستان الأصفر اتغسل ونشف. هدى بتدوّر على مشطها، وطرف كراستها مغطّي نص الترابيزة.'
# the crossing game after the news (her rule)
fl=get(ns,'w_flag')

for k in ('w_flag_keep','w_flag_book','w_flag_put'): get(ns,k)['next']='w_cross'
insert_after(ns,'w_flag_put',[
  H('w_cross','نلعب عبور؟ الطبلية هي القناة، والكورة لازم تعدّي من فوق!','laugh'),
  C('w_cross_c',[
    O('«يلا. بس من فوق الطبلية.»','ball_crossing'),
    O('«بعد النشرة.»','w_cross_no',effects={'flags':{'war_cross_later':True}})]),
  A('ball_crossing','ball',{'variant':'crossing','rounds':5,'effects':{'vars':{'trust':2,'safety':2,'distress':-3}}}),
  H('w_cross_after','الساتر وقع!','laugh',next='w_oct7',variants=[
    V(F('ball_stopped'),'خلاص؟ ماشي. بكرة نعبر تاني.',expr='neutral'),
    V(F('ball_last',gte=4),'عبرنا أربع مرات! نعيمة، شفتي؟',expr='proud')]),
  N('w_cross_no','خبّطت الكورة في الحيطة مرتين، وبعدين قعدت تلوّن العلم.',next='w_oct7'),
])
# 7 October: Fawzi's answer, and the first letter
replace_range(ns,'w_oct7','w_oct16',[
  N('w_oct7','تاني يوم الصبح، نعيمة نادت من الباب: «ابني رجع من عند عم فوزي.»',cast=['hoda','naima'],effects={'setTime':{'day':2,'slot':0}}),
  L('w_search','naima','أمها سابت المحل في الربيع، واشتغلت في مصنع ملابس في إسكندرية. عنوانها ماعندوش.',effects={'flags':{'search_fawzi':True}}),
  C('w_address',[
    O('«نكتب لها على المصنع، باسمها.»','w_details',effects={'flags':{'search_details':True},'vars':{'trust':1}}),
    O('«هدى، إنتي فاكرة حاجة عن المصنع؟»','w_naima',effects={'flags':{'search_asked_hoda':True},'vars':{'openness':2}}),
    O('«وحاجة سنية؟ صاحب البيت شايلها؟»','w_later',effects={'flags':{'search_landlord':True}})],prompt='الخطوة الجاية:'),
  N('w_details','كتبتي على الظرف اسمها، و«مسنع الملابس، إسكندرية». هدى مدّت صباعها: «مصنع بالصاد يا خالتي.»',next='w_letter_send',effects={'flags':{'hoda_corrected_fatma':True}}),
  H('w_naima','كانت بتقول «المصنع اللي جنبه الترعة». وبتيجي بالقطر، وتجيبلي جوافة.','neutral',next='w_letter_send'),
  L('w_later','naima','شايلها في المخزن. هيطلّعها لما يلاقي مفتاحه. وكمان نكتب على المصنع، مش هنخسر حاجة.',next='w_letter_send'),
  N('w_letter_send','ابن نعيمة خد الجواب للبوستة: اسمها، والمصنع، وإسكندرية. هدى كتبت تحت: «أنا كويسة».',effects={'flags':{'search_factory_letter':True}}),
])
# 22 October: Sonia's tin box — the hostel address and a letter that came too late
replace_range(ns,'w_oct22','w_oct25',[
  N('w_oct22','النشرة جابت خبر الدعوة لوقف إطلاق النار. وبعدها نعيمة طلعت ومعاها علبة صفيح: حاجة سنية من عند صاحب البيت.',cast=['hoda','naima'],effects={'setTime':{'day':4,'slot':3},'flags':{'search_box':True}}),
  N('w_box','جوه العلبة جوابات بخط واحد. آخر جواب لسه مقفول، وعليه اسم سنية.'),
  L('w_box_naima','naima','اقري إنتي يا فاطمة. أنا مابعرفش أقرا.'),
  C('w_box_c',[
    O('«اقريه إنتي يا هدى.»','w_read_hoda',effects={'flags':{'mother_letter_read':'hoda'},'vars':{'trust':2,'openness':2}}),
    O('(تفتحيه وتقريه بصوت عالي)','w_read_fatma',effects={'flags':{'mother_letter_read':'fatma'},'vars':{'safety':1}}),
    O('«خدي هدى تحت يا نعيمة. أقراه الأول.»','w_read_first',effects={'flags':{'mother_letter_read':'first'},'vars':{'autonomy':-2,'distress':2}})]),
  H('w_read_hoda','ده خط ماما. هي بتكتب الزاي بنقطة كبيرة كده.','smile',next='w_letter'),
  N('w_read_fatma','قريتيه على مهلك، كلمة كلمة. عند كلمة «ورديتين» وقفتي، وهدى قالتها قبلك.',next='w_letter'),
  N('w_read_first','قريتيه لوحدك جنب الشباك. لما هدى طلعت، عينها كانت على العلبة: «ده جواب ماما؟»',next='w_letter'),
  N('w_letter','«يا سنية، المصنع شغال ورديتين والإجازات واقفة. لقيت أوضة مع اتنين زمايلي، وأول ما أقبض هاجي آخد هدى. بوسيها. — زينب»',scene='paper',cast=[],effects={'flags':{'mother_reason_known':True}}),
  N('w_hostel','على ضهر الظرف: «سكن العاملات، مصنع الملابس». أول عنوان بجد.',scene='living',cast=['hoda','naima'],effects={'flags':{'search_hostel_address':True}}),
  C('w_reply_c',[
    O('«اكتبي إنتي، وأنا أمسك الورقة.»','w_reply_hoda',effects={'flags':{'hostel_letter_by':'hoda'},'vars':{'trust':2}}),
    O('«أنا أكتب، وإنتي تكتبي اسمك تحت.»','w_reply_fatma',effects={'flags':{'hostel_letter_by':'fatma'}})],prompt='الرد على سكن العاملات:'),
  H('w_reply_hoda','اكتبي… لأ، أنا هكتب: «أنا عند خالتي فاطمة، وبعدّ السلالم هنا كمان. سبعة وتمانين.»','focused',next='w_reply_sent'),
  N('w_reply_fatma','كتبتي عنوانك بخط كبير، وهي كتبت اسمها، وتحته رسمت كورة صغيرة.',next='w_reply_sent'),
  N('w_reply_sent','ابن نعيمة خد الجواب على البوستة تاني يوم.',effects={'flags':{'search_hostel_letter':True}}),
])
get(ns,'w_oct25')['text']='فيه دعوة جديدة لوقف النار. «لسه؟» سألت نعيمة، وإنتي بتلمّي الزراير.'
get(ns,'w_question')['text']='«الجواب وصل ماما؟»'
get(ns,'w_answer')['text']='«لسه. لما يوصل، هترد.» هدى عدّت على صوابعها الأيام من ساعة ما ابن نعيمة نزل بيه.'
end=get(ns,'w_end')
end['text']='في نفس الأوضة فرحتوا، وخفتوا، واستنيتوا. وفي العلبة الصفيح بقى فيه عنوان.'
end['memories']+= [
  V(F('ball_crossing'),'عبرتوا بالكورة من فوق الطبلية.'),
  V(F('hoda_corrected_fatma'),'هدى صحّحت لك «مصنع» على الظرف.'),
  V(F('mother_letter_read',eq='hoda'),'هدى قرت جواب أمها بنفسها.'),
  V(F('hostel_letter_by',eq='hoda'),'هدى كتبت لأمها إنها بتعدّ السلالم هنا كمان.'),
]
save('chwar-sout-elradio',d)
print('chwar ok',len(ns))
