# Appeal Review Workbench — Product Spec

| | |
|---|---|
| **Status** | Draft v0.1, from design discussion (26–29 Sep 2026) and the clickable prototype |
| **Owner** | Gokul Krishnan |
| **Prototype** | `build/appeal-review.html` (commit `e8f3b47`), all patient data synthetic |
| **Detail specs** | [Checkpoint bar](checkpoint-bar.md) |

---

## 1. Summary

A web application for **provider-side medical coders** who work reconsiderations and appeals after a payer downcodes or denies a claim. The coder opens the original medical record, scrolls through it, and captures evidence right on the page. Every finding lands in a notepad that follows the scroll and builds itself into a claim worksheet and an appeal letter.

The core idea is **capturing evidence at the moment of reading**. Today coders jump between a PDF, an encoder, a spreadsheet or Word worksheet, and the case system. Every jump loses time and context (which page, which date of service, what exactly the note said). Here the coder never leaves the document.

AI extraction (the existing CLAIRE pipeline) pre-marks likely evidence. The coder confirms, rejects, or adds what the AI missed.

## 2. Problem

- A payer downcodes a claim, e.g. CPT 99215 paid as 99214 with CARC 150 ("Payer deems the information submitted does not support this level of service").
- The provider's coding or appeals staff must review a long record (often hundreds of pages), decide whether the billed level is supported, and send a reconsideration or appeal with page-cited evidence before a payer deadline.
- The work is slow, context switching is constant, evidence citations get lost, and missed documentation means lost revenue.
- Appealing claims the record doesn't support wastes effort and creates compliance risk.

## 3. Users and context

- **Primary user:** provider-side coder or appeals specialist (hospital, physician group, or revenue-cycle vendor working on behalf of providers).
- **Framing:** the coder is **building a case** ("the documentation supports what we billed, and here is the evidence on page X"), not acting as a neutral auditor. The tool is an **appeal argument builder**.
- **Secondary users:** QA reviewers who sample cases; billing staff who receive corrected-claim items; leadership who want denial analytics.
- **Working conditions:** coders spend full days in this tool and are measured on cases per hour, so every extra click works against adoption. Keyboard flow matters.

## 4. Workflow

1. **Denial arrives.** The payer remittance (835/EOB) shows the downcode and reason codes (CARC/RARC). Ideally ingested automatically so the coder starts from "what was cut and why".
2. **Work queue and triage.** Prioritise by dollars at stake × days to appeal deadline × likelihood of winning. Payer windows are often 60–180 days. Low-value cases may not be worth appealing.
3. **Pull the record.** Retrieve the record from the EMR (e.g. Epic) for the denied claim's **date of service**.
4. **Review the record (core screen).**
   - For E/M: find evidence for the three MDM elements (Problems, Data, Risk) or documented total time.
   - For diagnoses and procedures: find documentation that each was performed, treated or addressed (MEAT: Monitored, Evaluated, Assessed, Treated).
   - Exclude anything documented on a different date of service.
5. **Honest verdict.** If the record does not support the billed level, the tool says so. "Accept the downcode, don't appeal" is a valid outcome.
6. **Draft the appeal.** Generate the letter from confirmed findings: each disputed item with its evidence, page citations and the guideline it meets.
7. **Submit and track.** Log submission, level (reconsideration → appeal → second level → external review) and outcome. A denial at one level pre-fills the next.
8. **QA.** A second reviewer checks a sample; disagreements feed training.

### 4.1 Appeals vs corrected claims

Diagnoses or services found in the record but **never billed** usually can't be added through an appeal. An appeal disputes what was already submitted; new codes normally go through a **corrected or replacement claim** (frequency code 7) within timely filing limits. The worksheet therefore has two separate outputs:

- **Appeal evidence:** supports what was billed.
- **Corrected-claim items:** new findings, routed to billing.

Payer rules vary and must be checked per payer.

## 5. Domain background: E/M levelling by MDM

Office visit codes 99212–99215 are levelled by **Medical Decision Making (MDM)** or by total time on the date of the encounter.

MDM has three elements, each scored Straightforward, Low, Moderate or High:

| Element | Measures | Demo example |
|---|---|---|
| Problems | Number and complexity of problems addressed | Type 2 diabetes with severe hyperglycemia: chronic illness with severe exacerbation (**High**) |
| Data | Data reviewed, ordered or discussed | Review of external ED note, A1c ordered, BMP ordered (**Moderate**) |
| Risk | Risk of management decisions | Starting insulin: prescription drug management (**Moderate**). Decision regarding hospitalization (**High**) |

The visit level requires **2 of 3 elements** at or above that level:

| Overall MDM | Code | Time (established patient) |
|---|---|---|
| Straightforward | 99212 | 10+ min |
| Low | 99213 | 20+ min |
| Moderate | 99214 | 30+ min |
| High | 99215 | 40+ min |

## 6. UI concept

### 6.1 Design principles

- **Document first.** The record is the hero and fills the screen. Everything else floats over it or tucks away.
- **Merged, not split.** The initial idea of a fixed split screen was replaced by a merged layout: the record is full width, with a notepad that floats and can be docked to a collapsible right-hand panel.
- **Seamless.** Scroll sync, no mode switches, minimal clicks, fast motion (about 150–250 ms).
- **Two-way links.** Every note points to its evidence on the page, and every box on the page points to its note.
- **Client-demo quality.** Polished enough to impress in a sales demo.

### 6.2 Screen layout

```
┌───────────────────────────────────────────────────────────────┐
│ Case header: case ID · patient · payer · claim · DOS ·        │
│ Downcoded 99215 → 99214 · CARC 150 · $ at stake ·             │
│ Reconsideration due Oct 23 · 24 days      [view controls]     │
├───────────────────────────────────────────────────────────────┤
│ Checkpoint bar: Problems · Data · Risk · Level · DOS · AI     │
├──────────────────────────────────────────────────┬──┬─────────┤
│                                                  │▮ │         │
│   Medical record (continuous scroll of pages)    │▮ │ Docked  │
│   ▓ boxed evidence with code tags                │  │ notepad │
│                          ┌──────────────┐        │▮ │ (opt.,  │
│                          │ Floating     │        │  │ resiz-  │
│                          │ notepad      │        │▮ │ able,   │
│                          └──────────────┘        │  │ collap- │
│                                                  │  │ sible)  │
└──────────────────────────────────────────────────┴──┴─────────┘
                                          minimap ─┘
```

### 6.3 Features

**Case header**
- Case ID, patient, MRN, payer, claim number, date of service.
- Downcode shown as `99215 → 99214` with CARC and dollars at stake.
- Appeal level and deadline with days remaining.
- View controls: Spotlight, Clean read, DOS only, Notepad (with count), command palette.

**Checkpoint bar** — live progress toward the billed level. Pills for Problems, Data, Risk, Level, Date of service and AI review, each met / partial / open, clickable to jump to evidence. Full rules in [checkpoint-bar.md](checkpoint-bar.md).

**Record viewer**
- Continuous scroll of pages with a paper look, EHR print footer and page numbers.
- Pages from another date of service carry a warning banner and are dimmed when "DOS only" is on.
- Page indicator ("Page 3 of 6").

**Evidence boxes ("mounted" annotations)**
- The exact words are boxed on the page with a small tag above showing the code and MDM element (e.g. `E11.65 · PROB·H`, `RISK·H`, `DATA·C1`).
- Status colours: blue dashed = AI suggested, green = confirmed, orange = coder added, red strike-through = rejected.
- Hover shows an evidence card: status, AI confidence, code and description, MDM element and level, notes (e.g. "Replaces billed I10"), date-of-service warning, quoted text, page, where it goes (appeal, corrected claim, note, excluded), and Accept / Reject / Restore buttons.
- Click pins the card.

**Mark what the AI missed (signature interaction)**
1. Select any words on the page.
2. A toolbar appears above the selection: `+ Diagnosis · + Procedure · + MDM element · + Note`.
3. A compose panel opens with a code search pre-filled from the selected text (ICD-10-CM or CPT/HCPCS), a ranked list of MDM descriptors with a suggested one, or a free-text note. It says whether the item goes to the appeal (code on claim) or the corrected claim (not on claim).
4. On add, a chip animates from the selection into the notepad, the text gets an orange box, and a row appears.
5. Selections overlapping an existing box are blocked with a hint to edit that box instead.

Coder-added findings are also labelled training data for the extraction model.

**Notepad**
- Floating panel. Drag it by the header.
- Resizable from all four edges and all four corners (minimum about 290 × 240). Double-click the header to fit it to screen height; double-click again to restore.
- Drag it to the right edge (a "Release to dock" hint appears) to dock it as a right-hand panel. The docked panel can be resized by dragging its left edge (double-click to reset), collapsed to a thin tab, or floated again.
- Minimise to a bubble with the finding count and number still to review. Close it entirely and reopen from the header.
- **Scroll sync:** the "In view" tab shows only findings on the pages currently visible ("Following p. 3–4"). A pin button freezes it on the current pages. The "All" tab lists every finding.
- **Ghost mode:** fades to about 30% opacity while the record scrolls, returns when scrolling stops or on hover.
- Rows are grouped by page and show code, description, quoted evidence, MDM tag, destination and inline accept/reject.
- Footer shows a compact MDM scorecard (Problems, Data, Risk, "Supports 99214 of 99215") and a button to open full notes.

**Full notes (F)**
- **Findings:** table of every finding with status filters, click to jump to evidence, inline accept/reject.
- **Claim worksheet:** each billed line with what the record shows and the action (e.g. "Appeal: reinstate 99215", "Correct to I12.9", "No change"), plus a "Found in the record, not on the claim" list for corrected-claim routing.
- **Appeal draft:** letter generated from confirmed findings with page citations per MDM element, a note when time is not the basis, and a banner when the evidence doesn't yet support the billed code. Copy button.

**Minimap**
- A slim strip on the scroll edge with a coloured mark for every finding, page boundaries, other-visit pages tinted, and the current viewport. Click a mark or the strip to jump.

**Focus modes**
- **Spotlight (S):** dims all text except the evidence boxes.
- **Clean read (C):** hides all boxes for plain reading.
- **DOS only:** dims pages from other dates of service.

**Keyboard and commands**
- `J` / `K` next or previous finding, `A` accept, `R` reject, `N` notepad, `D` dock or float, `F` full notes, `S` spotlight, `C` clean read, `Esc` close, `⌘Z` undo.
- `⌘K` command palette: go to page, next AI suggestion, toggle modes, open worksheet or appeal draft, dock/float/minimise notepad, undo.
- Every change shows a toast with Undo.

**Responsive**
- At phone width the notepad starts as a bubble, the docked panel opens as a full-height overlay, and header labels collapse to icons. The page never scrolls sideways.
- Light and dark themes.

### 6.4 Removed from the prototype

- The on-screen demo script panel (guided 7-step walkthrough) was removed at the user's request on 29 Sep.

## 7. Demo scenario (synthetic)

- **Case:** APL-2026-0418, patient "DEMO, Alex", Northstar Health Plan (fictional), DOS 03/14/2026, established office visit, Riverbend Internal Medicine Associates (fictional).
- **Claim:** 99215, E11.65, I10, 83036. Paid as 99214 (CARC 150).
- **Record:** 6 pages. History, exam, results and data, assessment and plan, time and attestation (34 minutes), and a prior visit from 01/09/2026 appended to the packet.
- **AI starting state:** Problems High confirmed; Data has two Category 1 items confirmed and the BMP order pending; Risk Moderate (insulin start) confirmed. New codes suggested: E11.22, N18.31, I12.9 (replaces I10), 93000. Time finding notes that 34 minutes supports 99214 only. Pneumonia (J18.9) suggested from the prior visit, which is outside the date of service.
- **Story:**
  1. The coder rejects the pneumonia suggestion (wrong visit).
  2. Accepts the BMP order, so Data becomes Moderate.
  3. Selects "Discussed direct hospital admission…" on page 4, which the AI missed, and adds it as Risk · Decision regarding hospitalization (High).
  4. Problems and Risk are both High, so the Level checkpoint turns green at 99215 and the appeal draft is ready.
  5. Optionally adds E86.0 (dehydration) from the exam for the corrected claim.

## 8. Data model (prototype)

**Finding**

| Field | Meaning |
|---|---|
| `id` | Unique id |
| `page`, `block`, `text` | Anchor: page number, text block, exact quoted words |
| `type` | `dx`, `px`, `mdm`, `time`, `note` |
| `code`, `desc` | ICD-10-CM / CPT / HCPCS code and description |
| `mdm` | `{ el: problems/data/risk, level: 0–3, cat: 1–3 (data), label }` |
| `status` | `ai`, `confirmed`, `added`, `rejected` |
| `source` | `ai` or `coder` |
| `conf` | AI confidence |
| `outsideDos` | Evidence from a different date of service |
| `replaces` | Billed code this finding replaces (e.g. I12.9 replaces I10) |
| `note` | Explanation shown on the card |

**Derived:** route (appeal evidence / corrected claim / reviewer note / excluded) and the MDM summary (per-element levels, overall level, supported code).

**Case:** id, patient, MRN, payer, claim, DOS, billed and paid codes, CARC, dollars at stake, appeal level, due date, claim lines.

In production, anchors become `{ documentId, page, boundingBox[], textSpan }` from OCR output.

## 9. Architecture and tech stack

### 9.1 Prototype (current)

- React 18 (UMD from cdnjs), JSX compiled with esbuild into one self-contained HTML page.
- Record rendered as HTML text blocks; boxes are `<mark>` spans found by text match.
- Files: `src/app.jsx` (UI), `src/data.js` (synthetic record, findings, code dictionary, MDM descriptors), `src/style.css`, `build.sh`.

### 9.2 Production direction

| Need | Choice |
|---|---|
| App scaffold | Vite + React + TypeScript |
| PDF rendering | `react-pdf` (pdf.js); TIFF converted to images server-side |
| Large records | `@tanstack/react-virtual`, only visible pages rendered |
| Evidence boxes | Absolutely positioned overlays from normalised bounding boxes, scaled per page |
| Selectable text on scans | **Invisible OCR text layer** built from Azure Document Intelligence word output. Build this first: without it the "mark what the AI missed" flow breaks on scanned pages |
| Floating notepad | `react-rnd` (or current custom drag/resize) with edge snapping |
| Scroll sync | `IntersectionObserver` feeding a shared store |
| State | `zustand` |
| Tables | `@tanstack/react-table` |
| Motion | `framer-motion` |
| Command palette | `cmdk` |
| Components | shadcn/ui (Radix) + Tailwind |

### 9.3 Integration with CLAIRE

- CLAIRE's pipeline (Azure Document Intelligence → markdown → LangGraph extraction agent with Collibra reference data) produces candidate codes and MDM evidence with page references, shown as AI-suggested boxes.
- Document Intelligence already returns bounding boxes, so findings map directly onto the rendered page.
- Pre-compute a "likely supported level" per case to support queue triage.
- Every accept / reject / add is a labelled example for extraction evaluation.

## 10. Risks and design responses

| Risk | Response |
|---|---|
| Automation bias (coders accept AI blindly) | Require viewing evidence before accepting; track acceptance rates per coder |
| Poor scan quality (handwriting, rotation, faxes, duplicates) | Page rotation, duplicate detection, OCR confidence shown |
| Code validity changes yearly | Code lookup uses the code set in effect on the date of service |
| Performance on 500+ page records | Virtualised rendering, lazy page loading |
| PHI | HIPAA controls, audit trail of every view and change, role-based access, synthetic data only in demos |
| Productivity pressure | Keyboard-first flow, minimal clicks |
| Appealing unsupported claims | Honest verdict; "not ready to send" banner when evidence falls short |

## 11. Analytics (beyond single cases)

Each case records payer, reason code, evidence and outcome, which enables:
- win rates by payer and denial reason;
- which payers systematically downcode which codes;
- which physicians' documentation habits cause downcodes, feeding clinical documentation improvement (CDI).

## 12. Roadmap

| Phase | Scope |
|---|---|
| **Prototype (done)** | Clickable demo: evidence boxes, floating/dockable resizable notepad, scroll sync, select-to-add, checkpoints, minimap, full notes, appeal draft |
| **MVP** | Real PDF/TIFF viewer with OCR text layer; anchored findings; claim worksheet; inline ICD-10 / CPT lookup; exported page-cited rationale |
| **Phase 2** | CLAIRE AI pre-annotation; E/M MDM scoring helper; work queue with triage |
| **Phase 3** | Remittance (835) ingestion; submission tracking across appeal levels; analytics and CDI feedback |

## 13. Open questions

1. Case types in scope: E/M downcoding only, or also procedure and inpatient (DRG) downgrades?
2. Customer: in-house hospital or physician-group team, or a revenue-cycle vendor serving many providers (multi-tenant)?
3. Is submission in scope (payer portals, fax, mail), or does the app stop at the letter packet?
4. Integration: standalone work queue, or embedded in an existing case management system?
5. Checkpoint-bar decisions listed in [checkpoint-bar.md §9](checkpoint-bar.md#9-known-gaps-and-open-decisions): billed-code-aware thresholds, time-based levelling, new-patient and other E/M families, payer-specific rules.

## 14. Decision log

| Date | Decision |
|---|---|
| 26 Sep 2026 | Explore an app for coders reviewing records in reconsideration and appeals, with the record open and a notepad that fills as they scroll |
| 26 Sep 2026 | Suggested synced record + margin notes + worksheet rather than a pop-up notepad |
| 29 Sep 2026 | Provider side: coders review records after the payer downcodes a submitted claim |
| 29 Sep 2026 | Focus on UI first, to impress the client; built in React |
| 29 Sep 2026 | Merged layout instead of split: full-width record, collapsible right panel, movable/resizable/closable notepad, "full notes" view, scroll sync, mark AI-missed terms that turn into rows |
| 29 Sep 2026 | Prototype built and published; code pushed to `gokulkrishnan1293/react-medical-coder` |
| 29 Sep 2026 | Removed the demo script panel |
| 29 Sep 2026 | Notepad resizable from all edges and corners; docked panel width adjustable |
| 29 Sep 2026 | Checkpoint bar layout kept; detail spec written |
