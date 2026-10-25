# Editorial and continuity repair

Base: `55271180bac3429cc5e99297ddd18993ffcdf017` (latest origin/main on 25 October 2026). Branch: `editorial-review`. Approved October–December story retained.

| File | Nodes | Repair |
|---|---|---|
| ch1-elshanta | c1_m_cost_stale; c1_night1/2; c1_end | Hoda's direct address; explicit suitcase lowering; promise memories include touching the latch. |
| chwar-sout-elradio | w_radio; w_oct7/16/22; w_block | Door continuity, Naima's presence and optional flag drawing. |
| ch2-elkelma | c2_dress_*; c2_ret*; c2_day2_home; c2_o_common; c2_close | Same uniform, school bag, sleeping-place-neutral wording; staying home means no school return/report; night lighting. |
| ch2-elkelma | c2_hush_repair; c2_end | Repairing a dismissive reply is remembered differently from refusing to listen. |
| ch3-elkhabar | c3_truth_yes; c3_check; c3_final_*; c3_place_*; c3_end | Reject the wrong lead without losing that knowledge; practical Fatma; observable narration. |
| ch4-lamma-tergaai | mother_reply; mother_*; s_company; s_bedside; s_reply | Identified reader, mother's personal detail consistent with cat left elsewhere; actual letter dispatch; book on all bedside routes; apology only for actual needle refusal. |
| ch5-elshanta | g_note; g_war_memory; g_account*; g_mother_seam; g_*handover; final_*; g_end_* | Pronouns; exact recollections; conditional admission; visible referent; physical handover before delivery flag; messenger still at door for final words; refusal does not relocate bag unchosen. |

No existing node IDs removed. Two explicit Chapter 2 staging nodes added. Existing story flags retained. Pending-handover legacy saves receive a narrow normalization; no relationship/history reset.

Verification results are recorded below after execution. Automated tests verify specific invariants, not literary correctness or player attachment.

## Executed verification

- `npm test`: 65 passed, 1 skipped (the optional local-only archive recording), including 16 new editorial/continuity tests. Existing 3,000 Chapter 1, 2,000 Chapter 1→2, 2,000 Chapter 1→2→3 and 2,000 full six-chapter random simulations passed. All content validates; old saves and all new staging nodes remain navigable.
- `npm run build`: TypeScript and Vite production build passed. `git diff --check` passed.
- Built-app Chromium playthroughs: mobile first-choice (321 steps), mobile random seed 7 (267), desktop random seed 3 (294). All completed six chapters/five transitions; reload, menu, RTL and layout checks passed without JS errors.
- `scripts/editorial-e2e.mjs`: 30 targeted UI checks across 390×844 and 1440×900. Actual clicks cover both apology states, both relationship states, admission, rejected lead, old pending-handover saves, messenger, kept-home save migration, pronoun, direct address, visible morning suitcase and night→morning date/lighting. Screenshots inspected for mother, handover, home route, night, and reply scenes.
- Editorial reading: six complete resolved transcripts (kind/harsh; seeds 3, 17, 42), then eight deliberately chosen final routes (immediate/deferred meeting, messenger, refusal × kind/harsh). Unvisited alternative lines/options and stored homework strings were read separately. This caught repeated physical actions and unfounded memories beyond the initial checklist. Technical passes do not establish that the story is error-free or prove emotional attachment; no human playtest is claimed.

The existing `bed_bag: under` identifier is retained; the label now specifies the foot of Hoda's sleeping place, consistent with the existing floor placement for both sofa and mattress. No schema/version change or choice effects were needed. Save normalization also retains the corridor-light promise and reconstructs a repaired reply only where the saved visited history proves it occurred.
