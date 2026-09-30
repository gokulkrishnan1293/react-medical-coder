# /brag plan: CLAIRE case workbench (details screen), v2

**What changed from v1:** the video is narrated, with voice only and no music. It runs about 2:35 so every feature gets its own explanation. It adds:
- editing a finding, then accepting it,
- the Full notes findings table (filter, then accept from the row),
- the screen-capture step in extraction flags,
- more about the product itself.

**Story:** CLAIRE reads the record and suggests the codes, and the coder checks its work and decides. The screen is built so you stay in the record and everything else comes to it.

**Captured live from the running app, in one continuous session** (edits carry forward, so the "to review" count goes 11 → 10 → 9 → 8):
1. **Accept in the evidence card:** J45.901 is accepted once and covers both places.
2. **Edit, then accept:** in Full notes, filter to Services and choose **Change evidence** on *Continuous cardiac monitoring*. Its evidence is the whole sentence "Placed on continuous pulse oximetry and cardiac monitoring". Select just "cardiac monitoring", then **Use as evidence**. Pin the card, type a comment ("Evidence narrowed to the monitoring itself."), and **Accept**. The finding is marked **Revised**.
3. **Add what CLAIRE missed:** drag-select words, and the Add toolbar appears.
4. **Flag an extraction problem with a screen capture:** select the vitals, choose ⚑ Flag, then Formatting, then **Capture from original**. The scan opens at the same spot. Drag a box around the triage line, **Use capture**, then **Flag it**. The flag shows as a pin and a wavy underline, and in the Extraction notes with its screenshot.
5. **Full notes findings:** filter to MAR, then accept magnesium sulfate from its row.
6. **Command palette:** type "overlay" letter by letter.

The app's save API was replaced by an in-memory stand-in during capture, so nothing was written to the case folders.

**Voice:** Kokoro `af_heart` at 1.08×. **Two cuts:**
- `details-screen-v2-voice-music.mp4` has the voice over a light music bed (Happy Beats / Business Moves vol. 1, about 10 dB under the voice) and very soft UI clicks.
- `details-screen-v2-voice.mp4` has the voice and soft clicks only. **Format:** 1920×1080, 30fps, 154.9s.

## Voiceover script

| Start | Line |
|---|---|
| 0.9s | This is CLAIRE's case workbench, where coders review emergency department downcodes, from the first page of the record to the final call. |
| 8.8s | CLAIRE reads the record first and suggests the codes. You check its work, fix what it got wrong, and make the decision. |
| 15.6s | The idea is simple. Stay in the record, and let everything else come to you. |
| 20.4s | Up top is the claim. Every field is checked against the record. Green is verified, amber is a mismatch. |
| 27.2s | The record fills the screen, and each finding is boxed right where its evidence appears, coloured by review status. |
| 34.5s | The notepad follows the pages you're reading, so the findings beside you are always the ones in front of you. |
| 40.9s | Open a finding to see CLAIRE's confidence, its reasoning, and every place the record supports it. |
| 47.1s | When it's right, accept it once, and it covers every place. Or just press A. |
| 51.9s | When it's not quite right, edit it. Here, the evidence for cardiac monitoring points at a whole sentence. |
| 58.0s | Choose change evidence, select the exact words in the record, and use them. |
| 62.8s | Add a comment to say why, then accept. The finding is marked revised, and the count goes down. |
| 69.1s | If CLAIRE missed something, select the words, and say what they are: a diagnosis, a service, a MAR entry, or a note. |
| 76.7s | The record was extracted from a scanned document, and extraction can slip. Select the words, flag them, and pick what went wrong. |
| 84.2s | Then capture from the original. The scan opens at the same spot. Drag a box around the evidence, and it's attached as a screenshot. |
| 92.5s | Flags are kept apart from the review, and never count toward the claim. Download them as PDF or JSON, screenshots included. |
| 101.1s | To check the source, open the original scan side by side. It scrolls right along with the record. |
| 107.6s | Or lay the scan over the text, and compare them line by line. |
| 111.7s | Spotlight dims everything but the evidence. Clean read hides every mark, so you read the record as written. |
| 118.6s | Full notes puts every finding in one table, with its evidence, CLAIRE's confidence, and where it goes. |
| 124.4s | Filter by type or status, and accept or reject right from the row. |
| 129.1s | The claim tab checks every billed line and diagnosis against the record. |
| 134.0s | And interventions show the path from the findings, through the rules, to the result. |
| 138.9s | Every action is one shortcut away. Press Control K, type a few letters, and go. |
| 144.6s | When you're done, complete the review with a closing comment. |
| 148.9s | CLAIRE finds it. You decide. Press the question mark in any case to take the full tour. |
