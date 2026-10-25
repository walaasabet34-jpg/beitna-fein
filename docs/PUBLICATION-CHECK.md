# Narrative publication check

25 October 2026. Approved story implementation merges the existing main branch (8875c0f) with the six-chapter revision. Independent school clothing/bullying, budget and wall-portrait changes are retained. The older main-only alternate final chapter is replaced by the approved illness, mother's reply and belongings story; its save entry is migrated.

- 49 tests passed; 1 optional local-radio-overlay test skipped.
- 2,000 complete six-chapter simulations finish with forward time and every new story node reached.
- Chromium: mobile first-choice (321 steps), mobile random (267), desktop random using stage hotspots (292). All six chapters finish. Save/reload, menu saving, RTL and horizontal layout pass; no browser errors.
- Eight targeted screenshots/checks at 390px and 1440px cover crossing, patient, mother and delivered belongings. The patient and adults are drawn. Follow-up regression confirms Naima leaves the stage after the handover.
- TypeScript and Vite production build passed.
- First player choice occurs within 40 words. Day/continuation labels contain neutral dates, not future medical or family events.
- An optional letter and real belongings are carried through final choices; no medical-survival choice or invented historical recording is introduced.

See NARRATIVE-GUIDELINES.md for the adopted story and remaining human-playtest questions. Claude review (2)'s proposed Suez/1974 alternative remains unadopted pending historical review. Automated/browser checks establish function and layout, not player enjoyment or historical completeness.
