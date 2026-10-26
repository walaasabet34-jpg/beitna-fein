# Shared-life revision — research, decisions, what changed

26 October 2026. Branch `feat/huda-shared-life`, from `origin/main` at `d2a1514` (PR #2 fixes included).
Problem reported by the producer after playing: the story reads better, but the player doesn't get attached to Hoda.
Reading and picking replies had become boring, and the drawings were too simple to carry emotion.

## What the references taught (sources and their status)

No reference game was played for this work. Findings come from reviews, guides and descriptions, labelled below.

| Reference | Mechanic | Why it creates attachment / absence | Source (type) |
|---|---|---|---|
| My Child Lebensborn | Time is the resource: feeding, washing, dressing, mending, work shifts, and play (catch, drawing, a story) "if you can squeeze it in". Mood shows on the child's face and in the music, not in numbers. Bullying responses shape how the child sees you. | You protect the child from an unfair world through small daily acts. Criticised as repetitive, text-heavy and menu-tap heavy. | pocketgamer.com review; thexboxhub.com review; Wikipedia summary of reviews; cyberly.org fan guide (unofficial) |
| Florence | The interaction *is* the emotion: speech as a puzzle that needs fewer pieces as the couple gets closer; routine shown as repeated taps. | Players feel a change in the relationship through a change in their own action. | GamesBeat, Player.One interview with Ken Wong (articles) |
| Spiritfarer | Favourite dishes, a unique hug per character, small ambient signs of presence (humming, snoring). | The farewell lands because a presence you were used to stops. Late chores wear thin (review). | GameSpot, Pocket Tactics reviews |
| Unpacking | Where objects go tells the story without text. | The place of a thing says what a relationship is. | Tampere Univ. PlayLab blog; Critical Video Game Studies essay |
| *Les Misérables* (Hugo, 1862) | Deprivation in one line of arithmetic (Fantine's 12 sous a day against her daughter's 10); the candle; Cosette's lead toy and the empty shoe; dismissal because of a gossip's report. | Concrete small things show what is missing. | French text on Project Gutenberg (#17489, #17493), public domain. Modern translations not used. |

What we took: a few repeatable actions that change over time; reactions shown on Hoda's body and face; small numbers you can feel (piece pay against bread); objects that keep their history; the same actions coming back empty after her death. What we avoided: a stat dashboard, menus of chores, grind, and copying any character, line, art or interface.

## Decisions

1. **Three shared rituals instead of more text** (`src/ui/activities/`):
   - **The sock ball** (`BallGame`). Catching depends on timing (tap anywhere, or Space). Throwing back is a choice (high / to her hands / low) and she reacts to each. She counts out loud, slows down after you miss twice, gets bored if you repeat the same throw, and loves high throws (remembered as `knows_high`). The rules change by chapter, at her initiative: stairs → counting → "the crossing" over the tabliya → bouncing off the wall in twos → rolled on the blanket in bed → alone after her death, with nobody counting.
   - **The button tin** (`ButtonTin`). Sewing work and company in the same action. She sorts beside you and confuses sizes. You decide whether to show her or quietly fix it. She catches your mistakes and asks to keep the red button. A wrong button left in the bowl ends up on the garment. Her accuracy rises across chapters (0.5 → 0.72 → 0.88).
   - **Clothes** (`Wardrobe`). Dressing her for the day. She has opinions, refuses the red ribbon except on a special day, and the wool itches. Mending happens in the scene (a plain patch or a red-satin flower). Every state shows on her in later scenes. At the end, the same screen is used to fold her things into the suitcase, one memory per item.
2. **Touch and mouse equally.** Every action is a tap. Dragging is optional (buttons), with tap-then-tap as the main input. Keyboard: Space to catch, 1/2/3 to throw.
3. **Cost before commitment.** Hub buttons and choices show a ⏳ period and the cost in piasters, computed from the action's actual effects (`costBadge`). A test checks that every timed hotspot actually spends one period.
4. **Poverty you can see.** The coin tin on the machine fills or empties with the real money. Thread spools on the table go down by one per order, and they run out in Nov (pay, borrow from Naima and read her son's letter to her, or unpick old thread with Hoda counting). A patched sofa cushion and a tear-off calendar showing the in-game day. The mother's reply includes 30 piasters. Free actions (play, listening, mending with scraps, borrowing) are often the warmer ones.
5. **Fatma reads and writes simply; Naima cannot read; Hoda is the speller.** Lines were changed to fit: Naima never writes; Hoda corrects "مسنع" and "بحار".
6. **The mother search became a causal chain with results** (see STORY-BIBLE.md): the shop gives the city → the generic letter comes back → Sonia's tin box gives the hostel address and the reason she hadn't come → the supervisor's reply is the wrong woman *and* the correction → Hoda's proof detail → the reply that answers that detail → a telegram on the last day.
7. **Opening by action.** The first interaction is catching her ball on the stairs (under 40 words in). The biography at the door was cut. Naima explains only what she knows.
8. **Endings come from habits.** The mother can choose to leave the ball ("here is where she played"). The last actions use what this route actually did (counting in twos, the ball on the second chair). End memories are guarded by tests to only mention what happened.
9. **Art: one rig for everyone** (`src/art/figure.tsx`). A jointed 2D skeleton (shoulders, elbows, hips, knees, lean, head tilt) with tapered, shaded limbs. Faces are built from brows, lids, gaze and mouth. There are 14 expressions, and bored, tired, worried and sick are distinct. Clothes carry dust, tear, patch and the long sleeve. Adults use the same system. All original SVG code; no external or AI-generated images; nothing from the reference games.
10. **Saves v3.** Removed nodes map to the nearest equivalent; the thread spools start at 2; clothes states derive from existing flags. A save that points to an unknown node resumes the chapter with all flags kept, instead of restarting the game.

## Remaining limits

- No human playtest has been run. Automated runs prove the game can be played and is continuous, not that it is fun or moving.
- Prices other than bread remain game values, not historical data (RESEARCH-FLAGS #9).
- Telegram availability and train times in 1973 are plausible but not sourced specifically (one source gives about 3 hours for the Cairo–Alexandria express; the mother takes the first morning train).
- The rig is a large step from the old shapes but is still vector illustration, not painted art; a human illustrator could repaint parts one at a time.
