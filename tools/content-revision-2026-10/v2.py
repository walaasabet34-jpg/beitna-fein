# Canon v2: the mother works on a contract in Benghazi and collects her mail on the first of each month.
# One chain, no returned letters: Sonia's box (5 Oct) → our letter → her October letter (22 Oct) → payday (1 Nov)
# → her reply (10 Nov) → our reply → measles letter → her telegram (28 Nov) → our telegram (30 Nov) → 1 Dec.
import sys; sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
def rewire(ns, frm, to):
    for m in ns:
        for k in ('next','else','exit'):
            if m.get(k)==frm: m[k]=to
        for coll in ('cases','options','hotspots','events'):
            for x in m.get(coll,[]):
                if x['goto']==frm: x['goto']=to
def kill(ns, id, to):
    """remove a node; references and saves go to `to`"""
    rewire(ns, id, to); record(id, to); ns.pop(idx(ns,id))
def COMB(id, lines, **p):
    p['lines']=lines; return A(id,'comb',p)

# ───────────── ch1: 4–5 Oct ─────────────
d=load('ch1-elshanta'); ns=d['nodes']
T(ns,'c1_d5','نعيمة حطّت في إيدك بقجة هدوم، وورقة عليها عنوان أوضة سنية، مشطوب.')
T(ns,'intro_sonia','اتعملها عملية من أسبوع. النهارده بس فاقت واتكلمت.')
get(ns,'intro_address')['effects']={'flags':{'knows_box':True}}
T(ns,'intro_address','الأوضة اتأجّرت، وحاجتها عند صاحب البيت. ابني هيجيبها بكرة. جوابات أمها جوّاها.')
T(ns,'c1_d7b','أمها بتشتغل في ليبيا، وجاية أول ديسمبر. شقتي مليانة عيال. خليها عندك لحد ما تيجي. سلّمي على خالتك فاطمة.')
# morning: comb, then Sonia's box arrives
new=[
 COMB('comb_c1',['ماما بتعمل ضفيرتين. سنية كانت بتعمل واحدة بس.','المشط ده سنّته اتكسرت في القطر، لما مشينا من السويس.','إنتي إيدك أخف من سنية.'],strokes=6,selfIf={'var':'trust','lte':16},effects={'vars':{'trust':1}}),
 L('c1_box1','naima','حاجة سنية من عند صاحب البيت. جوابات أمها جوّه. اقري إنتي يا فاطمة، أنا مابعرفش أقرا.',scene='door',cast=['naima','hoda'],lead='ابن نعيمة طلع السلم بعلبة صفيح عليها ورد باهت.',effects={'flags':{'search_box':True}}),
 C('c1_box_read',[O('«افتحيه إنتي يا هدى. ده خط ماما.»','c1_box_hoda',effects={'flags':{'mother_letter_read':'hoda'},'vars':{'trust':2,'openness':2}}),
                  O('(تقريه بصوت عالي، على مهلك)','c1_box_fatma',effects={'flags':{'mother_letter_read':'fatma'},'vars':{'safety':1}})]),
 H('c1_box_hoda','ده خطها! بتكتب الزاي بنقطة كبيرة كده.','smile',next='c1_box_letter'),
 N('c1_box_fatma','قريتيه كلمة كلمة. عند «المقاول» وقفتي، وهدى قالتها قبلك.'),
 N('c1_box_letter','«يا سنية، الشغل في ورشة بنغازي كتير والقبض كويس. العقد بيخلص آخر نوفمبر، والمقاول بيدفع التذكرة ساعتها. أول ديسمبر أكون عندكم، ونأجر أوضة لينا. ابعتولي على مكتب المقاول، باخد الجوابات أول كل شهر وأنا بقبض. بوسيلي هدى. — زينب»',scene='paper',effects={'flags':{'mother_reason_known':True}}),
 H('c1_box_far','أول ديسمبر. هو ده بعيد؟','worried',scene='living',cast=['hoda']),
 C('c1_box_count',[O('(تشاوري على النتيجة اللي على الحيطة) «تعالي نعدّ.»','c1_box_cal',effects={'flags':{'calendar_counted':True},'vars':{'trust':2}}),
                   O('«بعيد شوية. بس جاي.»','c1_box_honest',effects={'vars':{'trust':1}}),
                   O('«قريب يا حبيبتي.»','c1_box_soon',effects={'flags':{'soon_promise':True}})]),
 H('c1_box_cal','…خمسة وخمسين، ستة وخمسين، سبعة وخمسين! سبعة وخمسين ورقة.','focused',lead='هدى وقفت على الكرسي، وقلبت ورق النتيجة ورقة ورقة.',next='c1_box_write'),
 H('c1_box_honest','بس جاي. ماما مابتقولش حاجة وماتعملهاش.','neutral',next='c1_box_write'),
 H('c1_box_soon','قريب قد إيه؟ بكرة؟','surprised',next='c1_box_write'),
 L('c1_box_write','fatma','نكتبلها النهارده، على مكتب المقاول. تحبي تقوليلها حاجة من عندك؟'),
 C('c1_box_detail',[O('«اكتبي عن البيض المسلوق.»','c1_proof_egg',effects={'flags':{'proof_detail':'egg'}}),
                    O('«اكتبي إنك بتعدّي السلالم هنا كمان.»','c1_proof_count',effects={'flags':{'proof_detail':'count'}}),
                    O('«ارسمي لها الكورة الشراب.»','c1_proof_ball',effects={'flags':{'proof_detail':'ball'}}),
                    O('«اكتبي عن مشمش.»','c1_proof_cat',effects={'flags':{'proof_detail':'cat'}},**{'if':F('cat')}),
                    O('«اختاري إنتي.»','c1_proof_own',effects={'flags':{'proof_detail':'sky'},'vars':{'autonomy':2}})],prompt='هدى عايزة تكتب حاجة تضحّك ماما.'),
 H('c1_proof_egg','«أنا لسه مابحبش البيض المسلوق.» هي هتضحك.','laugh',next='c1_box_tele'),
 H('c1_proof_count','«عدّيت سلالم البيت الجديد: اتنين وتلاتين.»','proud',next='c1_box_tele'),
 H('c1_proof_cat','«مشمش لسه بتسرق سمك أم رضا؟» ماما هتعرف إنها أنا.','smile',next='c1_box_tele'),
 N('c1_proof_ball','رسمت الكورة الشراب بالخياطة الحمرا اللي في نصها، وكتبت تحتها: «اللي إنتي عملتيها».',next='c1_box_tele'),
 H('c1_proof_own','«السما هنا كمان بتدخل من الإزاز الأزرق.» دي بتاعة ماما.','proud',next='c1_box_tele'),
 L('c1_box_tele','naima','فكّرت في تلغراف. بس هيستنى في نفس المكتب لحد أول الشهر، وبيتحسب بالكلمة. الجواب زيه، وفيه كلام أكتر.',effects={'flags':{'hoda_corrected_fatma':True}},lead='كتبتي بخطك الكبير، وهدى صحّحت «المقاول» تاني. وتحت كتبت اسمها.'),
 N('c1_box_send','ابن نعيمة خد الجواب على البوستة. الطابع اللي رايح ليبيا خد قرشين من علبة الصفيح.',effects={'money':-2,'flags':{'search_first_letter':True}}),
]
rewire(ns,'c1_m_close','comb_c1')
insert_before(ns,'c1_m_close',new)
T(ns,'c1_m_close','هدى حطّت جواب ماما في جيب الشنطة اللي من جوّه. وبرضه، كل ما حد يعدّي على السلم، تبص ناحية الباب.')
save('ch1-elshanta',d)

# ───────────── war: 6–25 Oct ─────────────
d=load('chwar-sout-elradio'); ns=d['nodes']
T(ns,'w_oct7','الجواب اللي بعتناه امبارح… هيعدّي والحرب قايمة؟')
n=get(ns,'w_oct7'); n['speaker']='hoda'; n['expr']='worried'; n['lead']='تاني يوم الصبح، هدى واقفة قدام النتيجة.'; n['effects']={'setTime':{'day':2,'slot':0}}
get(ns,'w_address')['options']=[
 O('«البوستة شغالة. يمكن يتأخر شوية.»','w_details',effects={'flags':{'war_post_honest':True},'vars':{'trust':1}}),
 O('«ماما بتاخده أول الشهر. لسه بدري.»','w_naima',effects={'vars':{'openness':1}}),
 O('(تقطعوا ورقة النتيجة سوا)','w_later',effects={'flags':{'calendar_torn':True},'vars':{'trust':2}})]
n=get(ns,'w_details'); n['text']='يعني يوصل قبل أول الشهر؟ عشان ماما تاخده.'; n['speaker']='hoda'; n['expr']='neutral'; n.pop('effects',None)
n=get(ns,'w_naima'); n['text']='أول الشهر. أنا هعدّ.'
n=get(ns,'w_later'); n.update({'speaker':'hoda','expr':'smile','text':'خمسة وخمسين. أنا اللي هقطعها كل يوم.'}); n.pop('lead',None)
n=get(ns,'w_letter_send'); n['text']='من يومها، أول حاجة هدى بتعملها الصبح: تقطع ورقة النتيجة، وتقول الرقم.'; n['effects']={'flags':{'calendar_ritual':True}}
n=get(ns,'w_oct22'); n['text']='وقف النار في النشرة. ونعيمة طلعت بظرف عليه طوابع ليبيا، مكتوب عليه «سنية».'; n['effects']={'setTime':{'day':4,'slot':3},'flags':{'mother_oct_letter':True}}
n=get(ns,'w_box'); n['lead']='«الناس اللي في أوضة سنية ادّوهولي. جه بعد ما الحرب قامت.»'; n['text']='إنتي عارفة إني مابعرفش أقرا يا فاطمة. ده من أمها.'
get(ns,'w_box_c')['options']=[
 O('«اقريه إنتي يا هدى.»','w_read_hoda',effects={'flags':{'oct_letter_read':'hoda'},'vars':{'trust':2,'openness':2}}),
 O('(تفتحيه وتقريه بصوت عالي)','w_read_fatma',effects={'flags':{'oct_letter_read':'fatma'},'vars':{'safety':1}}),
 O('«خدي هدى تحت يا نعيمة. أقراه الأول.»','w_read_first',effects={'flags':{'oct_letter_read':'first'},'vars':{'autonomy':-2,'distress':2}})]
T(ns,'w_read_hoda','«يا سنية»… ده لسنية، بس ماما كاتبة اسمي كتير.')
T(ns,'w_read_fatma','قريتيه على مهلك، كلمة كلمة. عند «ماردّيتيش» صوتك وطي، وهدى قربت.')
T(ns,'w_read_first','قريتيه لوحدك جنب الشباك: مفيهوش حاجة تخوّف. لما هدى طلعت، ادّتيهولها تقراه بنفسها.')
T(ns,'w_letter','«يا سنية، ماردّيتيش ليه؟ أول الشهر رحت المكتب ومالقيتش جواب. طمّنيني على هدى. وقوليلها تقطع ورقة من النتيجة كل يوم لحد ديسمبر، وأنا هنا بقطع زيها. — زينب، ٣ أكتوبر»')
n=get(ns,'w_hostel'); n['text']='ماما مش عارفة إن سنية تعبت. ولا إني عندك.'; n['speaker']='hoda'; n['expr']='sad'; n['effects']={'flags':{'mother_worried_known':True}}
get(ns,'w_reply_c')['prompt']='جوابكم الأولاني لسه في السكة. تكتبوا تاني؟'
get(ns,'w_reply_c')['options']=[
 O('«اكتبي إنتي، وأنا أمسك الورقة.»','w_reply_hoda',effects={'flags':{'second_letter_by':'hoda'},'vars':{'trust':2}}),
 O('«أنا أكتب، وإنتي تكتبي اسمك تحت.»','w_reply_fatma',effects={'flags':{'second_letter_by':'fatma'}})]
T(ns,'w_reply_hoda','أنا هكتب: «ماتزعليش. أنا عند خالتي فاطمة، وبقطع النتيجة زيك.»')
T(ns,'w_reply_fatma','كتبتي إن هدى كويسة وبتاكل وبتروح المدرسة قريب. وهي كتبت اسمها، ورسمت تحته نتيجة صغيرة.')
n=get(ns,'w_question'); n['text']='ماما هتاخد الجوابين أول الشهر؟'; n['effects']={'flags':{'search_second_letter':True},'setTime':{'day':5,'slot':3}}
T(ns,'w_answer','«أول الشهر.» هدى قطعت ورقة ٢٥، وعدّت اللي فاضل لأول نوفمبر على صوابعها: سبعة.')
e=get(ns,'w_end')
for m in e['memories']:
    f=m['if'].get('flag')
    if f=='hoda_corrected_fatma': m['text']='هدى صحّحت لك «المقاول» على الظرف.'
    if f=='mother_letter_read': m['if']={'flag':'oct_letter_read','eq':'hoda'}; m['text']='هدى قرت جواب أمها لسنية بنفسها.'
    if f=='hostel_letter_by': m['if']={'flag':'second_letter_by','eq':'hoda'}; m['text']='هدى كتبت لأمها: «بقطع النتيجة زيك.»'
e['memories'].append({'if':{'flag':'calendar_ritual'},'text':'كل صبح، ورقة من النتيجة، والرقم بصوت عالي.'})
T(ns,'w_end','في نفس الأوضة فرحتوا، وخفتوا، واستنيتوا. وعلى الحيطة، النتيجة بتخسّ ورقة كل يوم.')
save('chwar-sout-elradio',d)

# ───────────── ch2: 3–4 Nov ─────────────
d=load('ch2-elkelma'); ns=d['nodes']
n=get(ns,'c2_factory_back'); n.update({'speaker':'hoda','expr':'smile','text':'تلاتة نوفمبر. ماما قبضت أول امبارح… يبقى خدت جواباتنا! فاضل تمانية وعشرين.','lead':'هدى قطعت ورقة النتيجة قبل ما تغسل وشها.','effects':{'flags':{'calendar_ritual':True}}})
insert_after(ns,'c2_factory_back',[COMB('comb_c2',['هو فيه بنات من السويس في المدرسة؟','أنا شاطرة في الإملا. ماما معاها شهادتي.','لو الأبلة سألت ماما فين… أقول إيه؟'],strokes=6,selfIf={'var':'trust','lte':14},effects={'vars':{'safety':1}})])
T(ns,'c2_n_office','لسه. أمها بتاخد الجوابات أول الشهر، يعني خدتها امبارح بس. الرد عايز أسبوع ولا اتنين.')
n=get(ns,'c2_n_office2'); n.pop('lead',None); n['text']='وسنية خرجت من المستشفى. أخوها خدها الفيوم، وبعتتلك السلام، وبتقول: الحمد لله إنها عندك.'
T(ns,'c2_naima_day2','ابني سأل في البوستة: الجواب من ليبيا بياخد أسبوع، ساعات أكتر. يعني نستنى لحد نص الشهر.')
T(ns,'c2_ev_radio_yes','سمعت الأخبار. مفيش حاجة عن ليبيا. ماما بعيد عن الحرب.')
T(ns,'c2_true2','إنتي ضيفتي يا هدى، لحد ما ماما تيجي أول ديسمبر.')
save('ch2-elkelma',d)

# ───────────── ch3: 10–11 Nov ─────────────
d=load('ch3-elkhabar'); ns=d['nodes']
d['init']['slot']=2
T(ns,'c3_a1','العصر. هدى رجعت من المدرسة، والخيط خلص والطلبية في نصها.')
new=[
 H('c3_a4','ده من ليبيا! ده خط ماما!','surprised',scene='door',lead='البواب نده من تحت: «جواب يا ست فاطمة! عليه طوابع غريبة.» هدى سبقتك على السلم.',effects={'flags':{'mother_contacted':True,'search_supervisor_reply':True}}),
 C('c3_paper',[O('«افتحيه إنتي يا هدى. ده بتاعك.»','c3_ask',effects={'flags':{'reply_read_by':'hoda'},'vars':{'trust':2}}),
               O('(تقريه بصوت عالي، وهي لازقة فيكي)','c3_keep',effects={'flags':{'reply_read_by':'fatma'},'vars':{'safety':1}})]),
 N('c3_ask','فتحته بصوابع بتترعش. قرت أول سطر بصوت عالي، وبعدين ادّتهولك: «كمّلي إنتي.»',next='clue_compare',scene='living'),
 N('c3_keep','قريتي على مهلك. هدى بتسبقك بكلمة كل شوية، وصباعها على السطر.',scene='living'),
 N('clue_compare','«يا هدى يا نور عيني. عدّي السلالم لحد ما آجي، وأنا أطلعهم معاكي.»',scene='paper',variants=[
   V(F('proof_detail',eq='egg'),'«يا هدى يا نور عيني. لسه مابتحبيش البيض المسلوق؟ ضحّكتيني وعيّطتيني في نفس الوقت.»'),
   V(F('proof_detail',eq='ball'),'«يا هدى يا نور عيني. الكورة اللي رسمتيها لسه فيها الخياطة الحمرا؟ خلّي بالك منها لحد ما آجي.»'),
   V(F('proof_detail',eq='cat'),'«يا هدى يا نور عيني. مشمش؟ إنتي لسه فاكراها! لما آجي ندوّر لك على قطة في الشارع الجديد.»'),
   V(F('proof_detail',eq='sky'),'«يا هدى يا نور عيني. الإزاز الأزرق؟ أنا كمان بشوف السما من شباك الورشة وأفتكرك.»')]),
 N('c3_history','«جوابكم وصلني أول الشهر. ماكنتش أعرف إن سنية تعبت. العقد بيخلص آخر نوفمبر؛ لو سبته قبلها أخسر التذكرة وفلوس الشهور. أول ديسمبر أكون عندك. ابعتوا على الورشة على طول: ورشة الخياطة، شارع عمر المختار، بنغازي. ست فاطمة، ربنا يخليكي. ومعاه حوالة بخمسين قرش لهدى. — ماما»',scene='paper'),
 H('c3_notice','هي فاكرة! …طب ليه ماتجيش دلوقتي؟ ما هي عرفت.','worried',scene='living'),
 C('c3_truth',[O('«لو سابت الشغل قبل ما يخلص، تخسر التذكرة وفلوس شهور. هي هناك عشان تأجر لكم أوضة.»','c3_truth_yes',effects={'vars':{'trust':3,'openness':2},'flags':{'c3_why':'truth'}}),
               O('(تقربيها من النتيجة) «نعدّ اللي فاضل سوا.»','c3_truth_later',effects={'vars':{'trust':2,'safety':2},'flags':{'c3_why':'count'}}),
               O('«الكبار عندهم حسابات.»','c3_truth_no',effects={'vars':{'openness':-2,'distress':2},'flags':{'c3_why':'short'}})]),
 H('c3_truth_yes','يعني هي بتشتغل عشاني. زي ما إنتي بتشتغلي على الماكينة.','sad',next='c3_money'),
 H('c3_truth_later','واحد وعشرين. صوابع إيديا ورجليا… وواحد زيادة.','laugh',next='c3_money'),
 N('c3_truth_no','هدى طبّقت الجواب ورجّعته في الظرف، من غير ما تسأل تاني.',next='c3_money'),
 C('c3_money',[O('«الخمسين قرش دول بتوعك يا هدى. نحطهم في ظرف ليكي.»','c3_money_hoda',effects={'flags':{'mother_money':'hoda'},'vars':{'autonomy':3,'trust':1}}),
               O('«نحطهم في علبة الصفيح، للأكل والجزمة الشتوي.»','c3_money_tin',effects={'flags':{'mother_money':'tin'},'money':50})],prompt='ابن نعيمة هيصرف الحوالة من البوستة.'),
 H('c3_money_hoda','بتوعي أنا؟ …هفكّر هشتري إيه. حاجة مهمة.','proud',next='c3_bag1'),
 N('c3_money_tin','علبة الصفيح تقلت. أول مرة من شهور تسمعي فيها صوت فلوس كتير. هدى قالت: «ماما بتساعدك.»',next='c3_bag1'),
]
replace_range(ns,'c3_a4','c3_bag1',new)
# old ids that no longer exist go to the letter
for old in ['c3_avoid','clue_age','clue_shop','clue_source','c3_history_yes','c3_history_no','c3_proof_b','c3_proof','c3_proof_c','c3_proof_egg','c3_proof_cat','c3_proof_ball','c3_proof_own','c3_proof_alone','c3_proof_alone_c','c3_proof_send']:
    record(old,'c3_money')
for x in ns:
    if x['id']=='c3_bag1': x['lead']='المغرب. هدى بتطبّق الفستان الأصفر في الشنطة، والجواب جنبها.'
T(ns,'c3_bag5','عشان لما ماما تيجي أبقى جاهزة. لما مشينا من السويس ما لحقتش آخد كل حاجتي.')
for o in get(ns,'c3_bag_choice')['options']:
    if o['goto']=='c3_bag_open': o['text']='«سيبيها مفتوحة. لسه هتحتاجي هدومك عشرين يوم.»'
T(ns,'c3_bag_open','هدى سابت الفستان على ركبتها. «يعني أقفلها يوم تلاتين؟» قلتي: «يوم تلاتين.»')
T(ns,'c3_question','لما ماما تيجي… هتزعلي إني أمشي؟')
T(ns,'c3_night','بالليل، جواب ماما تحت مخدة هدى، وطرفه باين.')
# day 2 (Sunday, before school): the red ribbon, then the reply to the workshop
new=[
 COMB('c3_day2',['النهارده الشريطة الحمرا. عشان جواب ماما.','هكتب لها إن الأبلة قالتلي برافو في الإملا.','ماما هتضفّرني يوم واحد ديسمبر. وإنتي تتفرجي.'],strokes=6,special=True,effects={'flags':{'ribbon_day':'letter'}}),
 L('c3_check_w','fatma','نرد على الورشة قبل المدرسة؟'),
 C('c3_check',[O('«اكتبي إنتي. هاتي الورقة وأنا أمسكها.»','c3_check_careful',effects={'flags':{'letter_started':True},'vars':{'trust':2}}),
               O('«قوليلي إنتي، وأنا أكتب.»','c3_check_name',effects={'flags':{'letter_dictated':True}}),
               O('«نكتبه بالليل، بعد الطلبية.»','c3_check_home',effects={'flags':{'letter_delayed':True}})]),
 N('c3_check_careful','عند «الإجازة» وقفت: «بالألف ولا بالهمزة؟» وصحّحتها لنفسها. وكتبت تحت: «فاضل عشرين.»',next='c3_return'),
 N('c3_check_name','قالت الجملة، وإنتي كتبتي بخطك الكبير. قرت وراكي وصحّحت كلمتين.',next='c3_return',effects={'inc':{'hoda_corrected_fatma':1}}),
 N('c3_check_home','بالليل كتبتوه على الطبلية. هدى نامت قبل ما تكتب اسمها، فكتبتيه إنتي، وحطيتي جنبه نقطة كبيرة زي ما بتعمل.',next='c3_return'),
 H('c3_return','لما ماما تيجي، هوريها الكراسة والكورة. والشنطة هتبقى جاهزة.','smile',lead='ابن نعيمة خد الجواب على البوستة. هدى وقفت في البلكونة لحد ما لفّ الناصية.',next='c3_place',effects={'flags':{'search_reply_sent':True}}),
]
n=new[0]; n['scene']='morning'; n['music']=None; n['effects']={'setTime':{'day':2,'slot':0},'vars':{'trust':1}}
replace_range(ns,'c3_day2','c3_place',new)
for old in ['c3_final_choice','c3_final_clear','c3_final_hope','c3_final_short']: record(old,'c3_place')
T(ns,'c3_end_closed','هدى فطرت في هدوء. ما اتكلمتش عن ماما، بس الجواب كان في جيب المريلة.')
T(ns,'c3_end_middle','هدى قعدت تفطر. بعد شوية قالت: «لو ماما جت وأنا في المدرسة، قوليلها تستناني.» قلتي: «هقول.»')
e=get(ns,'c3_end'); e['text']='جواب ماما في جيب مريلة هدى. وجواب جديد في الطريق للورشة. وعلى الحيطة، عشرين ورقة.'
e['memories']=[m for m in e['memories'] if m['if'].get('flag') not in ('c3_told',)]+[
 {'if':{'flag':'c3_why','eq':'truth'},'text':'قلتي لهدى ليه أمها مش جاية دلوقتي، بالظبط.'},
 {'if':{'flag':'mother_money','eq':'hoda'},'text':'الخمسين قرش بتوع هدى في ظرف باسمها.'},
 {'if':{'flag':'ribbon','eq':'red'},'text':'لبست الشريطة الحمرا يوم ما ردّت على أمها.'}]
d['_notes']['history']='تواريخ الفصل مؤقتة. الحوالة البريدية والطوابع لليبيا تفاصيل معقولة، مش مصدر رسمي.'
save('ch3-elkhabar',d)

# ───────────── ch4: 18–30 Nov ─────────────
d=load('ch4-lamma-tergaai'); ns=d['nodes']
d['dayNames']=['','18/11','19/11','22/11','28/11','30/11','30/11']
d['calendar']={'1':'1973-11-18','2':'1973-11-19','3':'1973-11-22','4':'1973-11-28','5':'1973-11-30','6':'1973-11-30'}
n=get(ns,'s_ordinary'); n.update({'speaker':'hoda','expr':'laugh','text':'تلاتاشر! فاضل تلاتاشر يوم!','lead':'١٨ نوفمبر. هدى قطعت ورقة النتيجة، وعدّت الباقي بصوت عالي.','next':'s_ribbon_ask'})
T(ns,'s_ribbon_ask','الدنيا برد النهارده. ألبس إيه؟')
get(ns,'s_ribbon_dress')['params'].update({'special':False,'today':'الجو بقى برد · فاضل ١٣ يوم'})
for old in ['mother_read','mother_reply','mother_reply_hoda','mother_reply_pick','mother_write','mother_dictate','mother_postpone']:
    kill(ns,old,'s_stitch')
get(ns,'s_stitch')['prompt']='«كتبت اسمي بالقلم على حتة قماش. تورّيني أطرّزه قبل ما ماما تيجي؟»'
hub=get(ns,'s_hub'); hub['events'].append({'id':'gift','if':{'all':[{'flag':'mother_money','eq':'hoda'},{'slot':{'gte':3}}]},'goto':'s_gift'})
insert_after(ns,'s_ev_cold',[
 H('s_gift','غمّضي. …ومدّي إيدك.','smile',lead='هدى رجعت من الخردواتي وإيدها ورا ضهرها.'),
 N('s_gift2','في كفّك كستبان جديد، لامع. «من فلوسي. بتاعك مخروم من فوق.»'),
 C('s_gift_c',[O('(تلبسيه في صباعك) «أهلاً يا ست طاقية.»','s_gift_a',effects={'flags':{'new_thimble':True},'vars':{'trust':2}}),
               O('«دي فلوسك يا هدى…»','s_gift_b',effects={'flags':{'new_thimble':True}})]),
 H('s_gift_a','لسه فاكرة! أول يوم!','laugh',next='s_hub'),
 H('s_gift_b','ما أنا اخترت. حاجة مهمة.','proud',next='s_hub'),
])
T(ns,'s_cough','بالليل كحّت، وجبهتها سخنة. سعاد كانت قالت إن نص الفصل غايب.')
T(ns,'s_search','كتبتي لأمها على الورشة: «هدى عندها حصبة، والطبيب بيتابعها. ماتقلقيش.» هدى كتبت تحت: «فاضل تسعة.»')
T(ns,'s_wait','طب اكتبي «فاضل تسعة» كبير، عشان تشوفه.')
n=get(ns,'s_mother_reply'); n['text']='يوم ٢٨ وصل تلغراف من بنغازي: «سلامة هدى. العقد يخلص بعد بكرة. جاية أول ديسمبر.»'; n['effects']={'setTime':{'day':4,'slot':1},'flags':{'mother_reply_illness':True}}
insert_after(ns,'s_mother_reply',[H('s_tel_hoda','تلاتة… تلاتة بس.','sick',scene='sickroom',lead='قريتيه لها مرتين. ابتسمت وعينيها مقفولة.')])
T(ns,'s_urgent','نعيمة: «ابني راح السنترال. المكالمة لبرّه عايزة حجز لبكرة، فبعت تلغراف على الورشة: هدى في المستشفى. تعالي.»')
save('ch4-lamma-tergaai',d)

# ───────────── ch5: 1–4 Dec ─────────────
d=load('ch5-elshanta'); ns=d['nodes']
insert_before(ns,'g_home',[N('g_burial','الضهر دفنوها. أمها وصلت والناس راجعين من المدافن، وشنطتها لسه في إيدها. نعيمة راحت لها. إنتي ماقدرتيش تقربي.',scene='landing')])
rewire(ns,'g_home','g_burial'); get(ns,'g_burial').pop('next',None)
n=get(ns,'g_home'); n['scene']='living'
get(ns,'g_objects')['options'].insert(0,O('(تقطعي ورقة النتيجة)','g_cal',effects={'flags':{'tore_dec1':True}},**{'if':F('calendar_ritual')}))
insert_after(ns,'g_leave',[N('g_cal','١ ديسمبر. اليوم اللي كانت بتعدّ له. حطيتي الورقة في الكراسة، مكان ما كانت بتكتب الأرقام.',next='g_war_memory')])
n=get(ns,'g_contact'); n['lead']='تاني يوم الصبح، نعيمة: «أمها نامت عندي. تلغرافنا لحقها في الورشة آخر يوم، وطلعت على المطار بالليل.»'; n['text']='عايزة حاجات بنتها. وعايزة تسمع منك إنتي.'
insert_before(ns,'g_mother_seam',[
 L('g_guilt','mother','لو كنت سبت الشغل أول ما جوابكم وصلني…',expr='sad'),
 C('g_guilt_c',[O('«الحصبة كانت في المدرسة كلها. محدش كان يعرف إنها هتقلب كده.»','g_guilt_fact',effects={'flags':{'guilt_answer':'fact'}}),
                O('«كانت بتقطع النتيجة كل يوم وتقول الرقم. ماكانتش زعلانة منك.»','g_guilt_count',effects={'flags':{'guilt_answer':'count'}},**{'if':F('calendar_ritual')}),
                O('(تسكتي، وتقعدي جنبها)','g_guilt_quiet',effects={'flags':{'guilt_answer':'quiet'}})]),
 L('g_guilt_fact','mother','…وأنا كنت بعدّ معاها من هناك.',expr='sad',next='g_mother_seam'),
 L('g_guilt_count','mother','آخر رقم قالته كام؟',expr='sad',next='g_guilt_count2'),
 L('g_guilt_count2','fatma','تلاتة.',next='g_mother_seam'),
 N('g_guilt_quiet','قعدتي جنبها. ولا واحدة فيكم لقت كلام، والسكوت ما كانش تقيل.',next='g_mother_seam'),
])
for x in ns:
    for k in ('next',):
        pass
for m in ns:
    if m.get('next')=='g_mother_seam' and m['id'] not in ('g_guilt_fact','g_guilt_count2','g_guilt_quiet'): m['next']='g_guilt'
for e in ns:
    if e['type']=='end':
        e['memories']+= [{'if':{'flag':'new_thimble'},'text':'الكستبان الجديد من فلوسها لسه في صباعك.'},{'if':{'flag':'calendar_ritual'},'text':'آخر رقم قالته كان «تلاتة».'}]
save('ch5-elshanta',d)
print('v2 done')

# ───────────── trims (measured with tools/transcript/word-cost.ts) ─────────────
d=load('ch1-elshanta'); ns=d['nodes']
T(ns,'c1_box_letter','«يا سنية، الشغل في ورشة بنغازي كويس. العقد بيخلص آخر نوفمبر، والمقاول بيدفع التذكرة. أول ديسمبر أكون عندكم. ابعتوا على مكتب المقاول؛ باخد الجوابات أول كل شهر. بوسيلي هدى. — زينب»')
n=get(ns,'c1_box1'); n['lead']='ابن نعيمة طلع بعلبة صفيح: حاجة سنية.'; n['text']='جوابات أمها جوّه. اقري إنتي يا فاطمة، أنا مابعرفش أقرا.'
n=get(ns,'c1_box_tele'); n.pop('lead'); n['text']='تلغراف؟ هيستنى في نفس المكتب لأول الشهر، وبيتحسب بالكلمة. الجواب أحسن.'
get(ns,'c1_box_send')['text']='هدى صحّحت «المقاول» على الظرف، وكتبت اسمها. الطابع لليبيا خد قرشين من علبة الصفيح.'
save('ch1-elshanta',d)
d=load('chwar-sout-elradio'); ns=d['nodes']
T(ns,'w_letter','«يا سنية، ماردّيتيش ليه؟ طمّنيني على هدى. وقوليلها تقطع ورقة من النتيجة كل يوم لحد ديسمبر، زيي. — زينب، ٣ أكتوبر»')
n=get(ns,'w_box'); n.pop('lead',None); n['text']='ده جه أوضة سنية بعد الحرب. إنتي عارفة إني مابعرفش أقرا.'
save('chwar-sout-elradio',d)
d=load('ch3-elkhabar'); ns=d['nodes']
T(ns,'c3_history','«جوابكم وصلني أول الشهر بس. العقد يخلص آخر نوفمبر؛ لو سبته قبلها أخسر التذكرة وفلوس الشهور. أول ديسمبر أكون عندك. ابعتوا على الورشة على طول. ست فاطمة، ربنا يخليكي. ومعاه حوالة بخمسين قرش. — ماما»')
get(ns,'c3_return')['lead']='ابن نعيمة خد الجواب. هدى وقفت في البلكونة لحد ما لفّ الناصية.'
get(ns,'c3_a4')['lead']='البواب من تحت: «جواب يا ست فاطمة! طوابع غريبة.»'
save('ch3-elkhabar',d)
d=load('ch5-elshanta'); ns=d['nodes']
get(ns,'g_contact')['lead']='تاني يوم، نعيمة: «أمها نامت عندي. التلغراف لحقها آخر يوم في الورشة.»'
save('ch5-elshanta',d)
d=load('ch1-elshanta'); ns=d['nodes']
T(ns,'c1_m_close','هدى حطّت الجواب في شنطتها. وكل ما حد يعدّي على السلم، تبص ناحية الباب.')
T(ns,'c1_d7b','أمها في ليبيا، وجاية أول ديسمبر. شقتي مليانة. خليها عندك لحد ما تيجي. سلّمي على خالتك فاطمة.')
T(ns,'c1_box_write','نكتبلها النهارده. عايزة تقوليلها حاجة؟')
T(ns,'c1_box_send','هدى صحّحت «المقاول» على الظرف. الطابع لليبيا خد قرشين من علبة الصفيح.')
T(ns,'c1_d5','نعيمة حطّت في إيدك بقجة هدوم، وورقة بعنوان مشطوب.')
save('ch1-elshanta',d)
d=load('ch2-elkelma'); ns=d['nodes']
n=get(ns,'c2_factory_back'); n.pop('lead',None); n['text']='تلاتة نوفمبر! ماما قبضت أول امبارح، يبقى خدت جواباتنا. فاضل تمانية وعشرين.'
T(ns,'c2_naima_day2','ابني سأل في البوستة: الجواب من ليبيا بياخد أسبوع وأكتر.')
save('ch2-elkelma',d)

# ───────────── independent review (30 findings) ─────────────
d=load('ch1-elshanta'); ns=d['nodes']
T(ns,'c1_m_close','هدى حطّت جواب ماما في شنطتها. ومحمود نزل بجوابنا البوستة. وكل ما حد يعدّي على السلم، هدى تبص ناحية الباب.')
T(ns,'c1_box_send','هدى صحّحت «المقاول» على الظرف. الطابع لليبيا خد قرشين من علبة الفلوس اللي على الماكينة.')
get(ns,'c1_box1')['lead']='محمود ابن نعيمة طلع بعلبة صفيح عليها ورد: حاجة سنية.'
T(ns,'c1_d5','نعيمة حطّت في إيدك بقجة هدوم، وورقة فيها عنوان أوضة سنية، مشطوب عليه: «اتأجّرت».')
# the father, set up through the ball (shared loss with Fatma)
n=get(ns,'c1_ball_post'); n['next']='c1_father'
insert_after(ns,'c1_ball_post',[
 H('c1_father','الكورة دي ماما عملتها من شراب بابا. بابا مات وأنا صغيرة.','sad'),
 C('c1_father_c',[O('(تحطي إيدك على الكورة جنب إيدها)','c1_father_hand',effects={'flags':{'knows_father':True},'vars':{'trust':2,'safety':1}}),
                  O('«جوزي كمان مات. صورته على الحيطة.»','c1_father_share',effects={'flags':{'knows_father':True,'photo_told':True},'vars':{'openness':3}})]),
 N('c1_father_hand','سابت إيدها تحت إيدك ثانيتين. وبعدين شدّت الكورة: «تاني.»',next='c1_hub'),
 H('c1_father_share','يعني إحنا الاتنين.','neutral',next='c1_hub'),
])
save('ch1-elshanta',d)

d=load('chwar-sout-elradio'); ns=d['nodes']
T(ns,'w_oct7','الجواب اللي بعتناه أول امبارح… هيعدّي والحرب قايمة؟')
T(ns,'w_answer','«أول الشهر.» هدى قطعت ورقة ٢٥، وعدّت اللي فاضل على صوابعها: سبعة.')
get(ns,'w_question')['lead']='بعدها بتلات أيام.'
T(ns,'w_box','ده جه أوضة سنية امبارح. اتأخر من الحرب. وإنتي عارفة إني مابعرفش أقرا.')
get(ns,'w_oct16')['lead']='النشرة: قوة صغيرة للعدو اتسللت غرب القناة.'
insert_after(ns,'w_oct22',[L('w_naima_son','naima','ابني اللي في الجبهة لسه مابعتش. …كنت فاكرة الظرف ده منه.',expr='worried')])
save('chwar-sout-elradio',d)

d=load('ch2-elkelma'); ns=d['nodes']
e=[x for x in ns if x['id']=='c2_end'][0]
for m in e.get('variants',[])+e.get('memories',[]):
    if m['if'].get('flag')=='c2_office_lead': m['text']='محمود سأل في البوستة: جواب ليبيا بياخد أسبوع وأكتر.'
T(ns,'c2_n_office','لسه. أمها بتاخد الجوابات أول الشهر، يعني خدتها أول امبارح بس. الرد عايز أسبوع ولا اتنين.')
T(ns,'c2_note_q','سعاد حفيدة نعيمة قالت إن الأبلة هتطلب كراسة جديدة وقلم.')
get(ns,'c2_o1')['lead']='أول يوم في المدرسة الجديدة، بعد ما فتحت تاني. سعاد حفيدة نعيمة هتعدّي عليها. هدى بتشد كم المريلة.'
save('ch2-elkelma',d)

d=load('ch3-elkhabar'); ns=d['nodes']
T(ns,'c3_history','«جوابينكم وصلوني سوا أول الشهر. ألف سلامة على سنية، قلبي وقع. العقد يخلص آخر نوفمبر؛ لو سبته قبلها أخسر التذكرة وفلوس الشهور. أول ديسمبر أكون عندك. ابعتوا على الورشة، العنوان ورا الظرف. ست فاطمة، ربنا يخليكي. ومعاه حوالة بخمسين قرش. — ماما»')
for o in get(ns,'c3_bag_choice')['options']:
    if o['goto']=='c3_bag_open': o['text']='«سيبيها مفتوحة. لسه هتحتاجي هدومك تلات أسابيع.»'
T(ns,'c3_answer_honest','طب تيجي معانا أول يوم في الأوضة الجديدة؟')
T(ns,'c3_check_home','بالليل كتبتوه على الطبلية. هدى نامت قبل ما تكمّل، فكتبتي تحت: «هدى نامت، وبتبوسك.»')
save('ch3-elkhabar',d)

d=load('ch4-lamma-tergaai'); ns=d['nodes']
hub=get(ns,'s_hub')
for h in hub['hotspots']:
    if h['id']=='hoda': h['once']=True
hub['hotspots'].append({'id':'rehearse','target':'doorway','label':'هدى عايزة تتمرّن على يوم ما ماما تيجي','once':True,'goto':'s_reh'})
insert_after(ns,'s_gift_b',[
 H('s_reh','اعملي إنتي ماما وهي داخلة من الباب. وأنا أفتح.','laugh'),
 C('s_reh_c',[O('«هدى! كبرتي كده إمتى؟»','s_reh_a',effects={'flags':{'rehearsal':'grown'},'vars':{'trust':2}}),
              O('(تفتحي دراعاتك من غير كلام)','s_reh_b',effects={'flags':{'rehearsal':'arms'},'vars':{'safety':2}}),
              O('«فين الضفيرتين؟»','s_reh_c2',effects={'flags':{'rehearsal':'braids'},'vars':{'openness':2}})]),
 H('s_reh_a','كبرت تلات سنتي! وبعدّ بالاتنين. وأوريكي الكورة.','proud',next='s_reh_end'),
 N('s_reh_b','جريت عليكي وخبطت في بطنك. «لأ، استني. هي هتعيّط. نعيدها.» وعادوها مرتين.',next='s_reh_end'),
 H('s_reh_c2','خالتي فاطمة بتعملهم! بس ماما هتعملهم أحسن… شوية بس.','laugh',next='s_reh_end'),
 H('s_reh_end','يوم واحد ديسمبر إنتي تقفي هنا. جنب الباب.','smile',next='s_hub'),
])
insert_after(ns,'s_tel_hoda',[N('s_cal29','٢٩. ماقدرتش تقوم للنتيجة: «قطّعيها إنتي وقولي الرقم.» قطعتيها وقلتي: «اتنين.» ابتسمت.',effects={'flags':{'fatma_tore':True}})])
n=get(ns,'s_breath'); n['text']='ليلة ٣٠، نفَسها بقى صعب. الفجر كنتوا في المستشفى: التهاب رئوي بعد الحصبة.'
T(ns,'s_collect_bag','حطيتي الكراسة والمشط في شنطة القماش، وإيدك لسه دافية من إيدها.')
T(ns,'s_decline','البقية في حياتك يا ست فاطمة. عملنا كل اللي نقدر عليه.')
save('ch4-lamma-tergaai',d)

d=load('ch5-elshanta'); ns=d['nodes']
T(ns,'g_burial','استنّوا أمها لحد الضهر، وماحدش عارف هتوصل إمتى. دفنوها، ووصلت والناس راجعين من المدافن، وشنطتها في إيدها. نعيمة راحت لها. إنتي ماقدرتيش تقربي.')
T(ns,'g_cal','قطعتي ورقة ٣٠ اللي ماحدش قطعها، وبعدين ١ ديسمبر. اليوم اللي كانت بتعدّ له. حطيتيهم في الكراسة.')
n=get(ns,'g_contact'); n['lead']='تاني يوم، نعيمة: «أمها نامت عندي. التلغراف لحقها آخر يوم في الورشة، والمقاول ركّبها أول طيارة.»'; n['text']='عايزة حاجات بنتها، وعايزة تسمع منك إنتي. وبعد بكرة هتسافر الفيوم عند سنية.'
for v in get(ns,'g_war_memory').get('variants',[]):
    v['text']=v['text'].replace('يوم الخبر','يوم العبور')
for o in get(ns,'final_send_note')['options']:
    if o['goto']=='final_send_letter': o['text']='(تكتبي سطر: «بابي مفتوح لما تحبي»، وتحطيه في جيب الشنطة)'
T(ns,'final_send_letter','كتبتي السطر. نعيمة حطّته في جيب الشنطة، وأخدتها ونزلت.')
T(ns,'g_guilt_count2','تلاتة. يوم التلغراف بتاعك.')
n=get(ns,'g_relation'); n.setdefault('variants',[]).insert(0,{'if':{'flag':'rehearsal'},'text':'افتكرتي هدى عند الباب: «إنتي تقفي هنا.» وقفتي جنب الباب.'})
for e in ns:
    if e['type']=='end':
        for m in e['memories']:
            if m['text']=='آخر رقم قالته كان «تلاتة».': m['text']='آخر رقم قالته كان «تلاتة»، يوم تلغراف أمها.'
        e['memories'].append({'if':{'flag':'knows_father'},'text':'الكورة من شراب أبوها. الأم سابتها هنا.'} if False else {'if':{'flag':'rehearsal'},'text':'اتمرّنتوا على يوم وصول أمها عند الباب.'})
save('ch5-elshanta',d)

# ───────────── trims after the review ─────────────
d=load('ch1-elshanta'); ns=d['nodes']
T(ns,'c1_m_close','هدى حطّت جواب ماما في شنطتها، ومحمود نزل بجوابنا البوستة.')
T(ns,'c1_d5','نعيمة حطّت في إيدك بقجة هدوم، وورقة بعنوان أوضة سنية، مشطوب: «اتأجّرت».')
get(ns,'c1_box1')['lead']='محمود ابن نعيمة طلع بحاجة سنية: علبة صفيح.'
save('ch1-elshanta',d)
d=load('ch2-elkelma'); ns=d['nodes']
get(ns,'c2_o1')['lead']='أول يوم في المدرسة الجديدة. هدى بتشد كم المريلة.'
save('ch2-elkelma',d)
d=load('ch3-elkhabar'); ns=d['nodes']
T(ns,'c3_history','«جوابينكم وصلوني سوا أول الشهر. ألف سلامة على سنية. العقد يخلص آخر نوفمبر، ولو سبته قبلها أخسر التذكرة وفلوس الشهور. أول ديسمبر أكون عندك. ابعتوا على الورشة؛ العنوان ورا الظرف. ست فاطمة، ربنا يخليكي. — ماما»')
get(ns,'c3_money')['prompt']='وفي الظرف حوالة بخمسين قرش لهدى. محمود هيصرفها من البوستة.'
get(ns,'c3_return')['lead']='محمود خد الجواب للبوستة.'
save('ch3-elkhabar',d)
d=load('ch4-lamma-tergaai'); ns=d['nodes']
T(ns,'s_urgent','نعيمة: «المكالمة لبرّه عايزة حجز لبكرة. ابني بعت تلغراف للورشة: هدى في المستشفى، تعالي.»')
save('ch4-lamma-tergaai',d)
d=load('ch5-elshanta'); ns=d['nodes']
T(ns,'g_burial','استنّوها لحد الضهر. دفنوها، ووصلت والناس راجعين، وشنطتها في إيدها. نعيمة راحت لها. إنتي ماقدرتيش تقربي.')
n=get(ns,'g_contact'); n['lead']='تاني يوم، نعيمة: «أمها نامت عندي. المقاول ركّبها أول طيارة.»'; n['text']='عايزة حاجات بنتها، وعايزة تسمع منك. وبعد بكرة مسافرة الفيوم عند سنية.'
save('ch5-elshanta',d)
