# Reading cut, measured: drop transition lines the art already shows, merge repeats, shorten letters.
import sys; sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
d=load('ch1-elshanta'); ns=d['nodes']
drop(ns,'c1_d3'); get(ns,'c1_d4')['cast']=['hoda','naima']
T(ns,'c1_d5','نعيمة حطّت في إيدك بقجة هدوم، وورقة بعنوان مشطوب.')
drop(ns,'c1_d6')
T(ns,'c1_d7b','خليها عندك كام يوم لحد ما نوصل لأمها. شقتي مليانة.')
T(ns,'c1_g_kneel2','صوتها واطي. بس عينها اترفعت ثانية.')
T(ns,'c1_d11','نعيمة نزلت.')
T(ns,'c1_t_photo6','وبعدها على طول سألت عن البلكونة، والحنفية اللي بتصفّر، والإزاز الأزرق.')
drop(ns,'c1_meal_end')
T(ns,'c1_evening','الليل نزل.')
T(ns,'c1_night1','قبل ما تنام، طلّعت من الشنطة كراسة وقلم رصاص قصير، وقعدت ترسم.')
get(ns,'c1_night1')['variants']=[V({'all':[F('bag_on_closet'),{'not':F('bag_returned')}]},'نزّلتي لها الشنطة من فوق الدولاب. طلّعت كراسة وقلم رصاص، وقعدت ترسم.')]
get(ns,'c1_draw_hub')['effects']=get(ns,'c1_night2').pop('effects',None); get(ns,'c1_night1')['scene']='night'
drop(ns,'c1_night2')
T(ns,'c1_bedtime','طفيتي النور.')
drop(ns,'c1_peek_intro')
get(ns,'c1_peek_intro2')['effects']=merge_effects(get(ns,'c1_peek_intro2').get('effects'),{'flags':{'hoda_asleep':True}})
T(ns,'c1_peek_intro2','هدى نامت. الشنطة جنب السرير، وقفلها مش مقفول كويس.')
for v in get(ns,'c1_peek_intro2')['variants']: v['text']='هدى نامت. '+v['text']
drop(ns,'c1_m1')
T(ns,'c1_m_close','تحت، الجرايد وصلت. هدى بصّت ناحية الباب.')
T(ns,'c1_m_cost_spent','الطعمية خدت تلات قروش من علبة الصفيح، ومفيش فلوس جاية النهارده.')
T(ns,'c1_m_cost_saved','القروش فضلت في علبة الصفيح.')
T(ns,'c1_ev_th1','هدى لبست الكستبان بتاعك في صباعها الكبير.')
T(ns,'c1_ev_th_b2','كلّمتوا صوابعكم شوية، وضحكت من غير ما تبص على الشنطة.')
T(ns,'c1_bed_end','المكان اتجهز.')
save('ch1-elshanta',d)

d=load('chwar-sout-elradio'); ns=d['nodes']
T(ns,'w_oct6','هدى بتدوّر على مشطها تحت الكراسة.')
T(ns,'w_afternoon','الخبر قطع شغلك.')
T(ns,'w_radio','الراديو: قواتنا عبرت قناة السويس. ونعيمة من الباب: «عبروا يا فاطمة!»')
T(ns,'w_oct7','تاني يوم، نعيمة من الباب: «ابني رجع من عند عم فوزي.»')
T(ns,'w_letter_send','ابن نعيمة خد الجواب للبوستة. هدى كتبت تحت: «أنا كويسة».')
T(ns,'w_oct16','النشرة: قوات إسرائيلية بقت غرب القناة.')
T(ns,'w_oct22','وقف إطلاق النار في النشرة. ونعيمة طلعت بعلبة صفيح: حاجة سنية.')
T(ns,'w_box','جوابات بخط واحد. آخرهم لسه مقفول.')
T(ns,'w_letter','«يا سنية، المصنع شغال ورديتين والإجازات واقفة. لقيت أوضة مع زمايلي، وأول ما أقبض هاجي آخد هدى. — زينب»')
T(ns,'w_hostel','على ضهر الظرف: «سكن العاملات، جنب ترعة المحمودية، كرموز، إسكندرية». أول عنوان بجد.')
T(ns,'w_reply_hoda','أنا هكتب: «أنا عند خالتي فاطمة، وبعدّ السلالم هنا كمان.»')
drop(ns,'w_reply_sent')
T(ns,'w_oct25','دعوة تانية لوقف النار.')
T(ns,'w_answer','«لسه.» هدى عدّت الأيام على صوابعها.')
save('chwar-sout-elradio',d)

d=load('ch2-elkelma'); ns=d['nodes']
T(ns,'c2_o1','أول يوم مدرسة. هدى بتشد كم المريلة وترجّعه.')
drop(ns,'c2_o2')
T(ns,'c2_dress_q','المريلة لسه في الشنطة، مكرمشة، وكمّها طويل.')
drop(ns,'c2_lunch_done')
T(ns,'c2_leave','على الباب، هدى شايلة شنطة القماش اللي خيطتيها.')
T(ns,'c2_leave_end','نزلت مع سعاد، حفيدة نعيمة.')
T(ns,'c2_return','العصر. رجلين صغيرين على السلم، أبطأ من الصبح.')
drop(ns,'c2_ret2')
T(ns,'c2_q_wait','عدّت ساعة. هدى بتشخبط على طرف الكراسة.')
drop(ns,'c2_after')
save('ch2-elkelma',d)

d=load('ch3-elkhabar'); ns=d['nodes']
drop(ns,'c3_a2')
T(ns,'c3_a3','الحاجة نعيمة سايبة لك ده. جالها رد.')
T(ns,'c3_a4','رد المشرفة: «اللي عندنا بالاسم ده بنتها ست سنين. وفيه واحدة بنفس الاسم سابت السكن الشهر اللي فات.»')
drop(ns,'c3_sew')
T(ns,'c3_history_yes','جواب العلبة كان بيقول «لقيت أوضة». يبقى هي اللي سابت السكن، ولسه في المصنع.')
T(ns,'c3_proof_send','الجواب للمشرفة: «سلّميه لها في المصنع، إيد بإيد.»')
drop(ns,'c3_evening')
T(ns,'c3_bag1','المغرب. هدى قاعدة على الأرض، بتطبّق الفستان الأصفر في الشنطة.')
T(ns,'c3_night','بالليل، الرد في درج الماكينة.')
T(ns,'c3_day2','الصبح، عند نعيمة على السلم.')
T(ns,'c3_naima','ابني حط الجواب في البوستة.')
save('ch3-elkhabar',d)

d=load('ch4-lamma-tergaai'); ns=d['nodes']
DET={'egg':'لسه مابتحبيش البيض المسلوق؟','cat':'مشمش لسه بتسرق سمك؟','ball':'الكورة الشراب لسه معاكي؟ الخياطة الحمرا من فستاني.','sky':'السما لسه بتدخل البيت؟','count':'لسه بتعدّي السلالم؟'}
base='«يا هدى، جوابك وصلني في المصنع. {d} ده عنواني الجديد، وهاجي أول الشهر. سلّمي على خالتك فاطمة. — ماما» وفي الظرف تلاتين قرش.'
mr=get(ns,'mother_reply'); mr['text']=base.format(d=DET['egg']); mr['variants']=[V(F('proof_detail',eq=k),base.format(d=v)) for k,v in DET.items()]
T(ns,'s_ordinary','نعيمة خبطت بجواب من إسكندرية. هدى عرفت الخط قبلك.')
T(ns,'s_doctor','الطبيب كشف عليها: راحة ومتابعة.')
T(ns,'s_rash','الطفح ظهر. الطبيب قال: حصبة، وتبعد عن العيال. وخلّوا بالكم من نفَسها.')
T(ns,'s_cough','بالليل كحّت، وجبهتها سخنة.')
T(ns,'s_search','كتبتي لأمها: «هدى عندها حصبة، والطبيب بيتابعها.»')
T(ns,'s_mother_reply','يوم ٢٦ جه رد: «قلبي معاها. هاجي أول الشهر، على أول قطر.»')
T(ns,'s_breath','نفَسها بقى صعب. في المستشفى قالوا: التهاب رئوي شديد بعد الحصبة.')
T(ns,'s_urgent','نعيمة: «ابني راح يبعت برقية لأمها.»')
T(ns,'s_waiting','الممرضة: «هاتي من حاجتها المسموح.»')
T(ns,'s_bedside','شافت الكراسة: «هاتيها هنا.»')
for k in ('s_help','s_later','s_refuse'): get(ns,k)['effects']=merge_effects(get(ns,k).get('effects'),{'setTime':{'day':1,'slot':2}}); get(ns,k)['next']='s_hub'
remove(ns,'s_hub_in')
save('ch4-lamma-tergaai',d)

d=load('ch5-elshanta'); ns=d['nodes']
T(ns,'g_contact','نعيمة خبطت: «أمها وصلت على البرقية، تاني يوم الصبح. قلتلها. وعايزة تشوفك.»')
T(ns,'g_identity','«كانت بتبعت على أوضة سنية. جوابكم بس اللي وصلها.»')
T(ns,'g_news','«عايزة حاجات بنتها، وعايزة تسمع منك.»')
T(ns,'g_arrival','دخلت أم هدى ومعاها نعيمة. قالت اسم بنتها كله قبل ما تقعد.')
save('ch5-elshanta',d)
print('cut ok')
