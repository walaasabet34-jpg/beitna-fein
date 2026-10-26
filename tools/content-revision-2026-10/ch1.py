import sys; sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
d=load('ch1-elshanta'); ns=d['nodes']
get(ns,'c1_start')['effects']={'flags':{'thread':2}}
# ── Opening on the stairs: a ball, not a biography ──
replace_range(ns,'c1_d1','intro_count',[
  N('c1_d1','طالعة بالعيش وبكرة الخيط. فوق، على بسطة بابك، بنت بتخبّط كورة شراب في السلمة وبتعد.',scene='landing',ambience='amb_stair'),
  H('c1_d2','…خمستاشر. ستاشر. سبعتاشر—','focused'),
  N('c1_ball_slip','الكورة فلتت منها، ونطّت على السلم ناحيتك.'),
  A('ball_stairs','ball',{'variant':'stairs','rounds':1,'effects':{'vars':{'trust':1,'openness':1}}}),
  H('c1_ball_after','…خلاص، ضاعت العدّة. إنتي ساكنة هنا؟','guarded',variants=[
    V(F('ball_last',gte=2),'تمنتاشر… تسعتاشر! إنتي ساكنة هنا؟',expr='laugh'),
    V(F('ball_last',gte=1),'تمنتاشر. إنتي ساكنة هنا؟',expr='smile')]),
  C('intro_first',[
    O('«أيوه. بتعدّي إيه؟»','intro_count',effects={'flags':{'first_words':'count'},'vars':{'openness':1}}),
    O('(تقعدي على السلمة وتحطي العيش على رجلك)','intro_bread',effects={'flags':{'first_words':'sit'},'vars':{'safety':1}}),
    O('«إنتي مستنية مين؟»','intro_wait',effects={'flags':{'first_words':'ask'}})]),
])
get(ns,'intro_count')['text']='السلالم، والنطّات. ماما بتقول اللي يعدّ مايتوهش.'
get(ns,'intro_bread')['text']='ده من الفرن اللي تحت؟ ريحته سخنة.'
get(ns,'intro_sonia')['text']='سنية اتحجزت في المستشفى. وأوضتها صاحب البيت أجّرها لناس تانيين.'
get(ns,'intro_address')['text']='سبت اسمي عند الساكنين الجداد: أي جواب ييجي لسنية يدّوهولي. وابني هيسأل عند عم فوزي، المحل اللي أمها كانت بتشتغل فيه.'
get(ns,'intro_address')['effects']={'flags':{'search_letters_to_naima':True}}
get(ns,'c1_d7b')['text']='خليها عندك كام يوم لحد ما نوصل لأمها. شقتي مليانة عيال ابني، وإنتي عندك الأوضة الصغيرة.'
for k in ('c1_g_kneel2','c1_g_bag3','c1_g_wide2'): get(ns,k)['next']='c1_d11'
remove(ns,'c1_d10')
get(ns,'c1_d11')['text']='هدى هزّت راسها. نعيمة نزلت، وصوت شبشبها فضل يبعد.'
remove(ns,'c1_d12')
get(ns,'c1_d13')['scene']='living'; get(ns,'c1_d13')['cast']=['hoda']
get(ns,'c1_d14')['text']='الشمس لسه عالية. قدامك تلات فترات قبل الليل.'
# ── Hub: play and work as real actions ──
hub=get(ns,'c1_hub')
hub['hotspots']=[h for h in hub['hotspots'] if h['id']!='buttons']
hub['hotspots'].insert(1,{'id':'ball','target':'ball','label':'الكورة الشراب','takesTime':True,'once':True,'effects':{'slots':1},'goto':'c1_ball_pre'})
for h in hub['hotspots']:
    if h['id']=='sew': h['label']='فستان أم سيد (الزراير والكفّة)'
hub['events']=[
  {'id':'thimble','if':{'any':[F('hoda_sorted'),{'slot':{'gte':2}}]},'goto':'c1_ev_th1'},
  {'id':'ballinvite','if':{'all':[{'slot':{'gte':2}},{'not':F('used:c1_hub:ball')},{'any':[{'var':'trust','gte':16},{'var':'openness','gte':13}]}]},'goto':'c1_ev_ball'},
  {'id':'riddle','if':{'all':[{'slot':{'gte':3}},{'any':[{'var':'openness','gte':14},{'var':'trust','gte':20}]}]},'goto':'c1_ev_rd1'}]
hub['ambient'].insert(0,V(F('ball_waiting'),'هدى بتخبّط الكورة في الحيطة وبتعدّ لوحدها، بصوت واطي.'))
hub['ambient'].insert(1,V(F('red_button',eq='hoda'),'هدى بتلف الزرار الأحمر بين صوابعها، وبتبصّ لك من بين خرامه.'))
remove(ns,'bond_buttons','bond_buttons_pick','bond_retry','bond_count','bond_stop')
insert_before(ns,'c1_talk',[
  N('c1_ev_ball','الكورة الشراب جت تتدحرج لحد رجلك. هدى واقفة عند الطرقة، إيديها ورا ضهرها.'),
  C('c1_ev_ball_c',[
    O('(ترميهالها)','c1_ball_pre',effects={'slots':1,'flags':{'used:c1_hub:ball':True}}),
    O('«بعد العشا. وعد.»','c1_ev_ball_later',effects={'flags':{'ball_promised':True}}),
    O('(ترجّعيها برجلك وتكمّلي)','c1_ev_ball_no',effects={'flags':{'ball_waiting':True},'vars':{'autonomy':1}})]),
  H('c1_ev_ball_later','وعد؟ …ماشي.','neutral',next='c1_hub'),
  N('c1_ev_ball_no','بعد شوية سمعتي الكورة بتخبط في الحيطة، وهي بتعدّ لوحدها.',next='c1_hub'),
  N('c1_ball_pre','هدى وقفت في نص الصالة، والكورة في إيديها الاتنين.',cast=['hoda']),
  A('ball_c1','ball',{'variant':'count','rounds':6,'effects':{'vars':{'trust':3,'openness':2,'distress':-4}}}),
  H('c1_ball_post','إنتي بتمسكي بإيديكي الاتنين زي العيال الصغيرين.','smile',next='c1_hub',variants=[
    V(F('ball_stopped'),'خلاص؟ …ماشي.',expr='neutral'),
    V(F('ball_last',gte=6),'ستة ورا بعض! بكرة نعدّي العشرة.',expr='laugh'),
    V(F('knows_high'),'ارمي عالي تاني بكرة. عالي أوي.',expr='laugh')]),
])
# ── Sewing = the button tin, with or without her ──
replace_range(ns,'c1_sew','c1_doll',[
  N('c1_sew','فستان أم سيد ناقصه زراير الكفّة. علبة الزراير على الترابيزة.'),
  B('c1_sew_b',[({'any':[{'var':'trust','gte':20},{'var':'openness','gte':17}]},'c1_sew_watch1')],'c1_sew_alone1'),
  N('c1_sew_watch1','هدى قربت خطوة خطوة، لحد ما بقت واقفة عند كتفك.'),
  H('c1_sew_watch2','أنا أعرف أفرز. ممكن؟','surprised'),
  C('c1_sew_c',[
    O('«تعالي. الكبار البني هنا، والصغيرين البيض هنا.»','c1_buttons_with'),
    O('«لما تكبري شوية. الإبرة بتعوّر.»','c1_sew_no1',effects={'vars':{'autonomy':-2,'safety':1},'flags':{'sew_denied':True}})]),
  A('c1_buttons_with','buttons',{'order':'فستان أم سيد','helper':'hoda','skill':0.5,'effects':{'vars':{'trust':3,'openness':3,'distress':-3}}}),
  H('c1_sew_pedal','ممكن أدوس أنا على الدوّاسة؟','surprised'),
  C('c1_sew_pedal_c',[
    O('(توسّعيلها) «دوسي، بس براحة.»','c1_sew_yes1',effects={'vars':{'trust':3,'openness':2},'flags':{'sewing_together':True}}),
    O('«المرة دي أنا. بصّي على الإبرة.»','c1_sew_done',effects={'vars':{'safety':1}})]),
  N('c1_sew_yes1','داست جامد. الماكينة جريت، والخيط اتعقد.'),
  H('c1_sew_yes2','هي اللي جريت لوحدها!','laugh'),
  N('c1_sew_yes3','فكّيتي العقدة، وهي ماقامتش من جنبك.',next='c1_sew_done'),
  H('c1_sew_no1','أنا مش صغيرة.','upset'),
  N('c1_sew_no2','بس فضلت واقفة تتفرج.',next='c1_buttons_alone'),
  N('c1_sew_alone1','هدى فضلت مكانها. بس صوت الزراير في السلطانية كان بيخليها تبص ناحيتك.',effects={'vars':{'safety':2}}),
  A('c1_buttons_alone','buttons',{'order':'فستان أم سيد','helper':'none','skill':0}),
  N('c1_sew_done','الفستان خلص. أم سيد هتعدّي تاخده بكرة الصبح وتدفع.',effects={'flags':{'order_done':True},'inc':{'thread':-1}},next='c1_hub',variants=[
    V(F('buttons_left_wrong'),'الفستان خلص. زرار في الكفّة أصغر من أخواته. أم سيد هتعدّي بكرة الصبح تاخده وتدفع.')]),
])
# ── Night memories, bag wording ──
get(ns,'c1_bed_bag_broken')['text']='إنتي قلتي محدش هيلمسها. وشلتيها للدولاب.'
# ── Morning: what actually happened yesterday ──
fb=get(ns,'c1_m_fun_b')
fb['cases']=[{'if':{'all':[F('ball_promised'),{'not':F('ball_games')}]},'goto':'c1_m_fun_promise_no'},
             {'if':{'all':[F('ball_promised'),F('ball_games')]},'goto':'c1_m_fun_promise_ok'},
             {'if':F('ball_last',gte=6),'goto':'c1_m_fun_ball'}]+fb['cases']
insert_after(ns,'c1_m_fun_b',[
  H('c1_m_fun_promise_no','إمبارح قلتي بعد العشا… وأنا نمت.','guarded',next='c1_m_breakfast'),
  H('c1_m_fun_promise_ok','إمبارح لعبنا بعد العشا، زي ما قلتي.','smile',next='c1_m_breakfast'),
  H('c1_m_fun_ball','النهارده العشرة. أنا هعدّ، وإنتي ترمي.','laugh',next='c1_m_breakfast'),
])
get(ns,'c1_m_breakfast')['options'][0]['text']='فول وطعمية سخنة من عربية الفول.'
get(ns,'c1_m_breakfast')['options'][1]['text']='عيش وجبنة البيت.'
get(ns,'c1_m_breakfast')['options'][2]['text']='تحمّصي العيش البايت، وشاي خفيف.'
# ── Chapter-end memories: exact, route-based ──
end=get(ns,'c1_end')
mem=[m for m in end['memories'] if 'وعدتيها' not in m['text']]
mem=[
  V({'all':[F('bag_promise'),{'not':F('bag_peeked')},{'not':F('promise_broken')},{'not':F('bag_latched')}]},'وعدتيها إن محدش هيلمس الشنطة. ووفيتي.'),
  V({'all':[F('bag_promise'),F('bag_peeked')]},'وعدتيها إن محدش هيلمس الشنطة، وفتحتيها وهي نايمة.'),
  V({'all':[F('bag_promise'),F('promise_broken'),{'not':F('bag_peeked')}]},'وعدتيها إن محدش هيلمس الشنطة، وشلتيها للدولاب.'),
  V({'all':[F('bag_promise'),F('bag_latched'),{'not':F('bag_peeked')},{'not':F('promise_broken')}]},'وعدتيها إن محدش هيلمس الشنطة، وقفلتي قفلها وهي نايمة.'),
  V(F('ball_stairs'),'أول ما شفتيها، كانت بتعدّ السلم بالكورة.'),
  V(F('ball_last',gte=6),'الكورة مارقعتش ست مرات ورا بعض.'),
  V({'all':[F('ball_promised'),{'not':F('ball_games')}]},'قلتي «بعد العشا»، ومالعبتوش.'),
  V(F('red_button',eq='hoda'),'الزرار الأحمر بقى بتاعها.'),
  V(F('hoda_caught_fatma'),'هدى لقطت زرار إنتي حطيتيه غلط.'),
]+mem
end['memories']=mem
save('ch1-elshanta',d)
print('ch1 ok', len(ns))
