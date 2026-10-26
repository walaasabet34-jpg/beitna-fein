# Fixes from the independent continuity review of three full routes (26 Oct 2026).
import sys; sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
d=load('ch1-elshanta'); ns=d['nodes']
T(ns,'c1_d7b','سنية في المستشفى، وأوضتها اتأجرت، وسبت اسمي عند السكان الجداد. خليها عندك كام يوم لحد ما نوصل لأمها. شقتي مليانة.')
T(ns,'intro_sonia','اتحجزت من أسبوعين. مش هتقدر تاخدها.')
c=get(ns,'c1_ev_ball_c'); c['options'][1]['text']='«بعد شوية. وعد.»'
T(ns,'c1_ev_ball_later','وعد؟ …ماشي.')
T(ns,'c1_m_fun_promise_no','إمبارح قلتي بعد شوية… وأنا نمت.')
T(ns,'c1_m_fun_promise_ok','إمبارح لعبنا، زي ما قلتي.')
T(ns,'c1_peek3','تحت الصورة ورقة مطبّقة على قد جيب الشنطة.')
mb=get(ns,'c1_m_bag')
for v in mb['variants']:
    if v['if']==F('lied_bag'): v['text']='هدى جت الطبلية، والشنطة بين رجليها وإيدها عليها.'
save('ch1-elshanta',d)
d=load('chwar-sout-elradio'); ns=d['nodes']
for o in get(ns,'w_celebrate')['options']:
    if 'هنرجع' in o['text']: o['text']='«هترجعوا قريب، إن شاء الله.»'
for o in get(ns,'war_listen')['options']: o['text']=o['text'].replace('ترفعّي','ترفعي')
T(ns,'w_snap','«أنا بدوّر على المشط بس.» رجعت تدوّر من غير ما تحرّك الكرسي.')
save('chwar-sout-elradio',d)
d=load('ch2-elkelma'); ns=d['nodes']
insert_after(ns,'c2_start',[N('c2_factory_back','نعيمة ادّتك الظرف اللي كان على المصنع: رجع. قريتي لها الختم: «العنوان غير كافٍ». ولسه مستنيين رد السكن.',scene='morning',cast=['hoda'],effects={'flags':{'search_factory_returned':True}})])
T(ns,'c2_n_office','ولسه مافيش رد من السكن.')
T(ns,'c2_n_office2','نعيمة: «ابني هيسأل عم فوزي على اسم المشرفة.»')
get(ns,'c2_n_office2')['effects']={}
T(ns,'c2_hush1','بس أنا ماقلتش كده! نادية اللي قالت إنهم رموني!')
T(ns,'c2_angry1','لأ! لو رحتي لأم نادية، هيقولوا عليا أكتر!')
no=get(ns,'c2_note_old')
for v in no['variants']:
    if 'مشمش' in v['text']: v['text']='طيب. هوريهم رسمة القطة.'
save('ch2-elkelma',d)
d=load('ch3-elkhabar'); ns=d['nodes']
T(ns,'c3_proof_alone','كتبتي في ورقة جديدة جوه الجواب حاجة تعرّف بيها الأم بنتها. هدى كتبت تحتها اسمها.')
T(ns,'c3_check_home','طلعتي السلم وانتي بتعدّي الأيام.')
T(ns,'c3_final_clear','هدى بصت للفستان، وردّت المشط مكانه. «يعني هترد قريب؟»')
T(ns,'c3_end_closed','هدى فطرت في هدوء. قبل المدرسة اتأكدت إن شنطتها في مكانها. ما سألتش تاني عن ماما.')
T(ns,'c3_bag_fear','هدى سابت الفستان من إيدها. «أنا مش ماشية دلوقتي يا خالتي.»')
T(ns,'c3_keep','حطيتي الورقة في جيب فستانك عشان تسألي نعيمة الصبح.')
T(ns,'c3_avoid','حطيتي الورقة في جيبك. وانتي طالعة السلم، إيدك فضلت تتحسس مكانها.')
save('ch3-elkhabar',d)
d=load('ch4-lamma-tergaai'); ns=d['nodes']
get(ns,'s_stitch')['prompt']='«كتبت اسمي بالقلم على حتة قماش في الشنطة. تورّيني أطرّزه؟»'
T(ns,'s_ev_cold','الجو قلب برد. هدى نفخت في إيديها: «إيدي ساقعة.»')
get(ns,'s_hub')['events'][0]['if']={'all':[{'not':F('cl_cardigan',eq='made')},{'slot':{'gte':2}}]}
T(ns,'s_cough','بالليل كحّت كذا مرة، وجبهتها سخنة. نعيمة قالت إن فيه حصبة في عيال الشارع.')
T(ns,'s_collect_bag','حطيتي الكراسة والمشط في شنطة القماش. إيدها فضلت في إيدك.')
T(ns,'mother_postpone','بعد ما خلصتي الكم كتبتوا الرد. ابن نعيمة خده على البوستة.')
save('ch4-lamma-tergaai',d)
d=load('ch5-elshanta'); ns=d['nodes']
T(ns,'g_yes','حطيتي كرسي تاني جنب الطبلية، ورجعتي للشنطة.')
save('ch5-elshanta',d)
print('fixes ok')
