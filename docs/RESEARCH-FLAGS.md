# Historical research flags

Status of every historical detail the game relies on. Nothing marked **OPEN** should be presented as fact.

| # | Detail | Where in the game | Status | Notes / what's needed |
|---|---|---|---|---|
| 1 | In-game dates: Ch1 = 4–5 Oct 1973, school chapter = 3–4 Nov 1973 | `calendar` in each chapter JSON (`calendarStatus: "provisional"`) | **OPEN — provisional** | Family dates are fictional. School attendance is not presented as the nationwide reopening date. The war chapter uses sourced event dates; see STORY-HISTORY-1973.md. |
| 2 | Armed Forces General Command communiqué aired on 27 Oct 1973 | Ch1 radio news line (`c1_r_news1`) | **LIKELY NOT — line changed** | group73historians lists communiqués No. 1–63 for 6–26 Oct; none for 27 Oct. Ch1's line no longer claims one. Re-open only if a 27 Oct communiqué is found. |
| 3 | Displaced-families office and "name lists" (كشوف) | Ch2: الحاجة نعيمة (`c2_n_office`, `c2_naima_day2`) — sets up Ch3 | **OPEN** | Office/list assertions removed in the 25 October revision; the family now uses acquaintances and old addresses. |
| 4 | Cairo schools in Oct/Nov 1973 | Ch2 opening | **CONFLICTING SOURCES** | One source: study paused only in Canal cities. Another: schools resumed by 3 Nov. The school chapter now describes Hoda’s personal school day, without asserting a national reopening. |
| 5 | Displaced Suez children enrolled in local schools | Ch2 | Supported | Al-Watan family testimonies. |
| 6 | Suez evacuation began after 1967, families returned 1974+ | Backstory ("من سنين") | Supported | Al-Watan family testimonies. |
| 7 | Abla Fadila's programme on the General Programme | Radio, Ch1–2 | Partly supported | Station confirmed; exact airtime not. Real episodes from Egyptian Radio's official channel play (undated, not presented as the game's dates). |
| 8 | Blue-painted window glass, early blackout in Cairo | Ch1 window, evening | **OPEN** | General blackout claim removed; blue glass remains an artistic color/detail only. |
| 9 | Prices in piasters (groceries, notebook, thread, sewing pay, the mother's 30 pt) | Kitchen, Ch1–4 | **OPEN** except bread | Bread was half a piaster per loaf 1952–1977 (csmonitor.com 1984; egyptianstreets.com 2022). All other prices are game values, not claims. |
| 10 | Monthly allowance for displaced families | Not used yet (Ch3 candidate) | Partly supported | One testimony mentions 14 EGP/month. |

| 11 | Circulating 'original' recordings of the 1973 communiqués | Radio | **WARNING** | Al-Youm Al-Sabea (11 Oct 2026): widely shared recordings use the wrong announcers' voices. Only archive-provenance copies may be labelled authentic. See docs/ARCHIVE-SOURCES.md. |

## Current approved story direction (25 October 2026)
Supersedes the earlier three-ending guardrail: begin before 6 October, experience the crossing and the war through the household, then search for the mother. Hoda dies of severe pneumonia complicating measles despite medical care. The mother is contacted after her death. The final choices concern meeting her, telling the truth and returning Hoda's belongings. See `STORY-HISTORY-1973.md` for the implemented chronology and sources.

The old office/name-list assertions have been replaced by an explicitly informal contact chain. School scenes describe Hoda's attendance, not a nationwide reopening date. The old general assertion about blue-painted windows after raids has been removed.

## Audio rights
All archival recordings stay **Pending rights clearance** (see `docs/AUDIO.md`). Sources without cleared rights are not served in the public build. Cleared sources remain subject to the runtime registry gates.
| 12 | Domestic telegram (برقية) and the Cairo–Alexandria train in 1973 | Ch4–5 (telegram on 30 Nov, first morning train) | Plausible, not specifically sourced | Telegraph service existed since the 19th c.; one source gives ≈3 h for the express. No 1973 timetable found. |
| 13 | Wartime factory shifts / cancelled leave | Mother's October letter | Character's own statement | Presented only as what she wrote, not as a documented fact. |
