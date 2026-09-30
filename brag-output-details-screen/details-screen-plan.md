# /brag plan: CLAIRE case workbench (details screen) tour

**What it is:** the review workbench for a single downcode reconsideration. The coder reads the medical record, checks CLAIRE's AI findings against the claim, and decides whether the record supports the billed level.

**The idea to land:** *stay in the record.* The document fills the screen, evidence is boxed where you read it, and everything else (evidence cards, notepad, full notes, the original scan, the palette) comes to the page instead of taking you away. The tour's own words are "Stay in the record and let the rest come to you."

**Who it's for:** coders opening a case for the first time, and the team deciding whether to adopt the workbench.

**Direction from the user:** show the features, explain them, and cover both the idea of the screen and how it is used. That calls for an explainer rather than a 20-second teaser, so the target is about 60 seconds in chapters, each with a small label and one plain line.

**Show it in use (real app states, captured live):**
- Accept a finding: the box turns from dashed blue to green, "11 to review" drops to 10, and the "Accepted J45.901 · 2 places" toast appears.
- Drag-select words, and the Add toolbar (+ Diagnosis, + Service, + MAR, + Doc, + Note, ⚑ Flag) appears.
- Type "overlay" into the command palette letter by letter, and the list narrows.

**Tone:** `polished`, the same look as the Home tour video: the app's own tokens, Public Sans and IBM Plex Mono, and the real tour outline and cards.

**Format:** 1920×1080, 30fps, about 60.5s.

**Music:** Happy Beats / Business Moves vol. 9, about 114.8 BPM. Every chapter cut lands on a beat, and soft UI clicks sit under the music.

## Storyboard

| # | Start | Tour step | Chapter | Caption |
|---|---|---|---|---|
| 0 | 0.00 | Welcome | CLAIRE REVIEW | One screen for every downcode review. / Stay in the record. The rest comes to you. |
| 1 | 6.30 | Claim checked against the record | THE CASE | Every claim field, checked against the record. |
| 2 | 9.95 | The medical record | THE RECORD | Each finding is boxed where its evidence is. |
| 3 | 13.61 | Stay in the record (notepad) | THE IDEA | The notepad follows the pages you're reading. |
| 4 | 17.79 | Check a finding, then a real Accept click | REVIEW | Open a finding: confidence, reasoning, evidence. / Accept it once. It covers every place. |
| 5 | 24.06 | Add what CLAIRE missed (live drag-select) | REVIEW | Select words to add what CLAIRE missed. |
| 6 | 27.72 | Say what is wrong (flag editor) | EXTRACTION | Flag what the extraction got wrong. |
| 7 | 31.38 | Side by side | THE ORIGINAL | Check the scan side by side. |
| 8 | 35.04 | Overlay | THE ORIGINAL | Or lay it over the text, line by line. |
| 9 | 38.17 | Two ways to focus (Spotlight on) | FOCUS | Spotlight the evidence. Or read it clean. |
| 10 | 41.83 | Full notes: Claim | FULL NOTES | Every claim line against the record. |
| 11 | 45.48 | Full notes: Interventions | FULL NOTES | How each intervention was reached. |
| 12 | 49.14 | Command palette (live typing) | GETTING AROUND | Every action in one place. Ctrl K. |
| 13 | 52.80 | Complete the review | FINISH | Then complete the review. |
| Outro | 55.93 | Dip to ink | | **Stay in the record.** Press ? for the full tour. |

## Two cuts

- `details-screen-voice.mp4` (1:44) is narrated. Kokoro `af_heart` reads the lines below, with the music ducked underneath. Chapter lengths follow the narration (`work/timing.json`).
- `details-screen-music.mp4` (1:01) is the music-only cut, with step changes on the beat as in the storyboard above.

## Voiceover script

| Start | Line |
|---|---|
| 0.9s | This is the CLAIRE case workbench, where you review a downcode reconsideration from start to finish. |
| 6.8s | The idea is simple. Stay in the record, and let everything else come to you. |
| 12.0s | Up top, every field on the claim is checked against the record. Green is verified, amber is a mismatch. |
| 19.4s | The record fills the screen, and each of CLAIRE's findings is boxed right where its evidence appears. |
| 25.8s | The notepad follows the pages you're reading, so the findings beside you are the ones in front of you. |
| 32.2s | Open a finding to see CLAIRE's confidence, its reasoning, and every place the record supports it. |
| 38.5s | Accept it once, and it covers every place. Or just press A. |
| 42.9s | If CLAIRE missed something, select the words, and say what they are: a diagnosis, a service, a MAR entry, or a note. |
| 51.3s | And if the text itself came out wrong, flag it, and write what the original actually shows. |
| 57.6s | To check the source, open the original scan side by side. It scrolls right along with the record. |
| 64.6s | Or lay the scan over the text, and compare them line by line. |
| 69.1s | Spotlight dims everything but the evidence. Clean read hides every mark, so you read the record as written. |
| 76.4s | Full notes puts it all in one place. Every claim line, checked against the record. |
| 82.1s | And every intervention, with the path from the findings, through the rules, to the result. |
| 87.8s | Every action is one shortcut away. Press Control K, type a few letters, and go. |
| 93.9s | When you're done, complete the review with a closing comment. |
| 98.5s | Stay in the record. Press the question mark in any case for the full tour. |
