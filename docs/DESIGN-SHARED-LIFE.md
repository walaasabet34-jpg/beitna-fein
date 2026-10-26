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
4. **Poverty you can see.** The coin tin on the machine fills or empties with the real money. Thread spools on the table go down by one per order, and they run out in Nov (pay, borrow from Naima and read her son's letter to her, or unpick old thread with Hoda counting). A patched sofa cushion and a tear-off calendar showing the in-game day. The mother's reply includes a 50-piaster money order: the player puts it in Hoda's own envelope (she later buys Fatma a new thimble with it) or in the household tin. Free actions (play, listening, mending with scraps, borrowing) are often the warmer ones.
5. **Fatma reads and writes simply; Naima cannot read; Hoda is the speller.** Lines were changed to fit: Naima never writes; Hoda corrects "مسنع" and "بحار".
6. **One contact chain with no contradictions (canon v2, after the producer's second review).** The first version had the mother write with an address, and then our reply came back for an "insufficient address". That contradiction is gone. The mother is on a 9-month contract at a workshop in Benghazi and collects her mail on payday, the 1st of each month. The contract ends on 30 Nov, and the contractor pays her ticket only then. From this one fact every delay follows: Sonia's box (5 Oct) gives the office address and "أول ديسمبر"; her October letter arrives late at Sonia's old room (22 Oct); our two letters reach her together on 1 Nov; her reply (10 Nov) answers the detail Hoda chose, explains why she can't leave early, and encloses 50 pt; measles (22 Nov); her telegram (28 Nov); our telegram, because a trunk call needs booking (30 Nov); she lands on 1 Dec, as the burial ends. Full chain and per-chapter gap table in STORY-BIBLE.md.
7. **Opening by action.** The first interaction is catching her ball on the stairs (under 40 words in). The biography at the door was cut. Naima explains only what she knows.
8. **Endings come from habits.** The mother can choose to leave the ball ("here is where she played"). The last actions use what this route actually did (counting in twos, the ball on the second chair). End memories are guarded by tests to only mention what happened.
9. **Art: one rig for everyone** (`src/art/figure.tsx`). A jointed 2D skeleton (shoulders, elbows, hips, knees, lean, head tilt) with tapered, shaded limbs. Faces are built from brows, lids, gaze and mouth. There are 14 expressions, and bored, tired, worried and sick are distinct. Clothes carry dust, tear, patch and the long sleeve. Adults use the same system. All original SVG code; no external or AI-generated images; nothing from the reference games.
10. **Saves v3.** Removed nodes map to the nearest equivalent; the thread spools start at 2; clothes states derive from existing flags. A save that points to an unknown node resumes the chapter with all flags kept, instead of restarting the game.

## Remaining limits

- No human playtest has been run. Automated runs prove the game can be played and is continuous, not that it is fun or moving.
- Prices other than bread remain game values, not historical data (RESEARCH-FLAGS #9).
- Telegrams, trunk-call booking, Libya postal times and a Benghazi–Cairo flight are plausible but not sourced specifically (RESEARCH-FLAGS #12, #14). Egyptian labour migration to Libya in 1973 is sourced (#13); the mother's contract details are fiction.
- The rig is a large step from the old shapes but is still vector illustration, not painted art; a human illustrator could repaint parts one at a time.

## Second review: coherence and empathy (same day)

The producer found the story still incoherent (the returned-letter contradiction) and asked for more interaction and empathy, chapter by chapter. What changed:

- The contact chain was rebuilt (decision 6). No returned letters, no wrong woman, no factory in Alexandria.
- Each chapter was audited for gaps: who knows what and when, who can read, and whether every "فاضل N يوم" matches the date. A test now checks every day count against the chapter calendar.
- New interactions with Hoda: **braiding** each morning (`CombGame`; taps are strokes; hurrying hurts; she talks when you're gentle; red ribbon only on the letter day); the **wall calendar** (count 57 days together; she tears a page each morning; on 29 Nov she asks Fatma to tear it); choosing **what she writes** to make her mother laugh (the reply answers it); "**why doesn't she come now?**" answered honestly, by counting, or brushed off; her **own money** and the thimble she buys Fatma; **rehearsing the arrival** at the door; her **father's** socks in the ball, which Fatma can answer with her own loss.
- Other characters: Naima waits for her own soldier son's letter; the mother blames herself and Fatma chooses how to answer; Sonia gets a closing line; the errand son has a name (محمود).
- A second independent reviewer read three full routes against the new canon and reported 30 findings (wrong "yesterday"s, an epilogue line left from the old plot, an ambiguous tin, the burial timing, the flight, "مدام", a repeated hub line…). All were fixed except two homework spelling slips, which were kept on purpose (she rushes; she still corrects Fatma elsewhere).

## Reading, measured

Measured with `tools/transcript/word-cost.ts` (300 simulated full routes mixing random, kind and harsh choices), on the same routes for the base commit and this revision:

| | Base `d2a1514` | This revision |
|---|---|---|
| Words read per full route | 1,977 | ≈1,900 (−4%; was ≈1,640 before the coherence pass) |
| Text screens ("كمّلي") per route | 210 | ≈196 (−7%) |
| Played activities per route (ball, sorting, clothes, braiding, kitchen, bed…) | 2 | 14 |
| Choices per route | 53 | 60 |

The first version of this revision *increased* reading (2,221 words) because the search steps and the ritual set-ups added lines. Cut by measurement: lines the stage already shows were dropped, letters were shortened, same-speaker lines that always follow each other were merged, and narration directly before a character's line became that line's `lead` (shown above it on the same screen, one tap). Every removed node id is mapped for old saves (`src/engine/removed-nodes.json`).

## Independent review

A separate reviewer read three complete simulated routes (kind, harsh, random) against STORY-BIBLE.md and reported 25 concrete continuity problems. All were fixed in `tools/content-revision-2026-10/fixes.py`. Examples: the suitcase in two places at once; Nadia referred to before she was named; a "real address" as vague as the failed one; isolation ordered before the diagnosis; cold hands followed by fever the same night, which read as cause and effect, now given an outside cause; the embroidered name never set up.

The coherence pass added about 250 words (the box scene, the mother's three letters, the telegrams, the guilt exchange). They were cut back where possible, but the chain needs its letters. Reading is still slightly below the original, and the number of played activities rose from 11 to 14.
