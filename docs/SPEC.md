# CLAIRE Review Workbench — Spec

| | |
|---|---|
| **Status** | Living spec, v0.2 (30 Sep 2026). The single spec for this app: it replaces `docs/specs/product-spec.md` and `docs/specs/checkpoint-bar.md` |
| **Owner** | Gokul Krishnan |
| **Code** | This repo (React 19 · TypeScript · Vite). All patient data is synthetic |
| **Screenshots** | [README](../README.md#tour) |

How to keep it current: when a behaviour changes, update the section that describes it and add a line to the [decision log](#12-decision-log). Rules that are still placeholders say so.

---

## 1. Summary

A review screen for **coders who work E/M and ED downcode reconsiderations**. A claim was billed at one level (here ED 99285) and paid at a lower one (99284, CARC 150). The coder opens the medical record, checks CLAIRE's AI findings against the claim, marks what the AI missed, and decides whether the record supports the billed level.

The core idea is **capturing evidence at the moment of reading**: the record fills the screen, every finding is boxed on the page, and the notepad, claim checks and derived results update as the coder works. The coder never leaves the document.

## 2. Problem

- A claim is downcoded with a reason code such as CARC 150 ("information submitted does not support this level of service").
- Someone must read a long record (often scanned PDF or TIFF), find the evidence for or against the billed level, and record a decision with page-cited evidence before a deadline.
- Today that means jumping between a PDF, an encoder, a spreadsheet and the case system. Every jump loses context: which page, which date of service, what exactly the note said.
- Extracted (OCR) text can differ from the scan, so the coder also needs a quick way to check the extraction against the original.

## 3. Users and context

- **Primary user:** a coder or clinical reviewer working reconsiderations. The app is framed as a payer-side review (uphold or overturn the downcode); the evidence model works the same for a provider-side appeal.
- **Working conditions:** full days in the tool, measured on throughput. Keyboard flow and few clicks matter. Must work on Mac and Windows.
- **Secondary users:** QA reviewers sampling cases; leadership wanting outcome analytics.

## 4. Domain model

### 4.1 Findings

A **finding** is a piece of evidence anchored to exact words in the record.

| Type | What it is | Code |
|---|---|---|
| `dx` Diagnosis | ICD-10-CM diagnosis the record documents | Required |
| `svc` Service | Service performed | CPT/HCPCS when separately billable; none otherwise (e.g. cardiac monitoring) |
| `mar` MAR entry | A medication administration row, taken whole | HCPCS drug code, with billing units |
| `doc` Documentation | Something the record states that has no code, e.g. a decision to admit | None; has a *kind* (§4.3) |
| `note` Note | The reviewer's own note | None |

**Interventions and MDM are not finding types.** Both are derived from the findings above (§4.3, §4.4).

**Status:** `ai` (AI suggested) → `confirmed` (accepted) or `rejected`; coder-added findings are `added`. Only accepted and coder-added findings count toward anything. **Source:** `ai` or `coder`.

**Goes to** (where a finding lands):

| Label | Meaning |
|---|---|
| On claim | Its code is billed: evidence for that claim line |
| New | Has a code that is not on the claim: a possible addition |
| Supporting | Has no code: counts toward the level through MDM or interventions |
| Note | Reviewer note: review file only |
| Excluded | Rejected: counts nowhere |

### 4.2 Claim checks

Each claim line and claim diagnosis is checked against the findings: *Supported*, *Needs review* (only AI evidence), *Partial* / units short (MAR units add across administrations), *Not found*, or *Review suggestion* when a finding `replaces` a billed code (e.g. E11.10 replaces E11.65). The ED level line shows the MDM-supported code, e.g. "Supports 99284 of 99285". Codes found but not billed are listed under "In record, not on claim".

### 4.3 MDM (derived)

MDM has three elements (Problems, Data, Risk) scored Straightforward / Low / Moderate / High; the visit level is the second-highest element (2 of 3), mapped to 99282–99285. Each finding's MDM credit is **derived** by `mdmOf()` from a rule table (`src/data/mdmRules.ts`). **The table is a placeholder**; it follows the shape of the AMA 2023 E/M table and must be replaced with the team's criteria.

| Element | Derived from | Placeholder rule |
|---|---|---|
| Problems | Diagnoses | Level per ICD-10 code (E11.10, N17.9 High; E87.5, E86.0, R11.2 Moderate); others Low |
| Data | Services and documentation | Lab codes = category 1 (unique test); an ECG whose text says "independently interpreted" = category 2; documentation kinds give category 1–3 |
| Risk | MAR and documentation | Any MAR drug except IV fluids = Moderate (prescription drug management); documented decision to admit = High |

Documentation kinds and their credit: decision regarding hospitalization (Risk High), discussion with external physician (Data cat 3), independent interpretation (Data cat 2), review of external notes (Data cat 1), independent historian (Data cat 1), social determinants limit care (Risk Moderate), other (none).

MDM tags on evidence boxes and cards (e.g. `E11.10 · PROB·H`, `J2405 · RISK·M · MAR`) are shown from the same derivation; they are never stored.

### 4.4 ED interventions (derived)

Facility ED levels are often set by the interventions the facility provided. Interventions are **derived** from service and MAR findings (and claim lines) by a declarative rule table (`src/data/interventionRules.ts`). **The table is a placeholder.**

Each rule has *any-of* conditions and an optional *because* (the diagnoses that make it necessary):

| Condition kind | Matches |
|---|---|
| Code | A finding's code, **and** claim lines billed with that code |
| Words | A regular expression on the finding's quoted text or description |
| MAR route | The MAR row's route (e.g. continuous, IV push) |

Placeholder rules: continuous cardiac monitoring, titrated or continuous IV infusion, IV fluids, IV push or piggyback medication, serial point-of-care testing, serial lab monitoring, serial reassessments, ECG.

States: **Documented** (an accepted finding meets a condition), **Needs review** (only AI suggestions do), **Billed, not in record** (only a claim line matches), **Not found**. The derivation keeps the full path (conditions, findings, claim lines, reasons) so the UI can draw it (§6.10).

Known gap: the ED level check (§4.2) still uses MDM; interventions are shown alongside it but do not yet set the facility level. See [§11](#11-open-questions-and-known-gaps).

### 4.5 Claim-vs-record field checks

The checkpoint bar checks patient and encounter fields (`checkFields()`):

| Field | Verified | Mismatch | Invalid |
|---|---|---|---|
| Patient | Claim name equals record (case and punctuation ignored) | Differs | — |
| DOB | Equal | Differs | Not a real date, or after the DOS |
| Age | Agrees with DOB and DOS | — | Disagrees, or dates invalid |
| DOS | Equal | Differs | Not a real date |
| Reason for visit | Claim reason-for-visit diagnosis (UB-04 FL 70) is among the record's diagnoses | Not found | Claim has none |

## 5. Screen layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Header: case ID · Reconsideration · received · billed → paid · CARC      │
│                                   Spotlight · Clean read · Notepad · ⌘K  │
├──────────────────────────────────────────────────────────────────────────┤
│ Checkpoint bar: [left slot]  Claim │ Patient ✓ DOB ✓ Age ✓ │ DOS ✓ Reason ≠ │
│                              [right slot] ● In progress [Complete review] │
├───────┬──────────────────────────────────────────────┬──┬────────────────┤
│ stack │ [zoom · views]                 Page 3 of 5   │▮ │ Notepad        │
│ of    │ ┌──────────────── record page ─────────────┐ │▮ │ (float / dock /│
│ orig- │⋮│  boxed evidence with tags                │⋮│  │  bubble)       │
│ inals │ └──────────────────────────────────────────┘ │▮ │                │
└───────┴──────────────────────────────────────────────┴──┴────────────────┘
          ⋮ = page-edge grips for the overlay        minimap ─┘
```

Design principles: **document first** (the record is the hero), **merged not split** (panels float over or dock beside it), **seamless** (scroll sync, few mode switches, 150–250 ms motion), **two-way links** (every note points to its evidence and back), **client-demo quality**.

## 6. Features

### 6.1 Header
Case ID, stage, received date, billed → paid with CARC (full CARC text on hover), and view controls: Spotlight, Clean read, Notepad (with finding count), command palette. The payer line and the "decision due" badge were removed (§12).

### 6.2 Checkpoint bar
- **Centre:** Claim number, then Patient, DOB, Age │ DOS, Reason for visit. The reason is truncated with "…"; hovering shows it in full. Clicking a value goes to its record page.
- **Indicators:** each checked field has ✓ Verified, ≠ Mismatch or ! Invalid (§4.5). Hovering explains the result, with the claim value, record value and page.
- **Left slot:** empty, reserved for review checkpoints.
- **Right slot:** review status ("● In progress") and **Complete review**. The button opens a panel that warns about open work (unreviewed AI suggestions, unverified fields), takes a closing comment and completes ("Complete anyway" when work is open). Once completed the button shows "✓ Review completed" (comment and time on hover) with **Reopen**.
- Below 1100 px the left slot hides; fields scroll sideways; the right slot stays.

### 6.3 Record viewer
- Continuous scroll of paper-look pages with EHR print footer; "Page N of M" indicator; minimap on the right edge with page bounds, a tick per finding and the viewport.
- **Zoom** per column: − 100% + and fit-width in the floating toolbar; ⌘/Ctrl + wheel and trackpad pinch zoom around the cursor; `+` `−` `0` zoom the column under the pointer. The spot you were reading stays in place.
- **Focus modes:** Spotlight (S) dims everything except evidence; Clean read (C) hides all boxes.

### 6.4 The original document
Originals are page images of the source PDF/TIFF (in the prototype, generated stand-ins). Three views, from the toolbar radio, `O` to cycle, `Esc` back to reading, or the right-click menu:

| View | What it is |
|---|---|
| **Reading** (default) | A Stage Manager-style stack in the left margin: the current page's original and its neighbours, tilted. Tucks behind the edge when the margin is narrow. Click a card to compare |
| **Side by side** | A column of page images beside the record, full size, **scroll-locked** both ways by page and position. Own zoom and fit-width; link button to unlink scrolling; close button |
| **Overlay** | The scan laid over the extracted text on the same page, with a draggable divider: scan on the left, extracted text on the right, word for word in the same place |

**Overlay details:** the extracted text is drawn on the OCR line boxes in the scan's typeface, so words line up. One handle held mid-viewport moves the divider on every page. Enter it by dragging the **grips on either edge of the page** (left grip brings the scan in from the left; right grip starts from the full scan) or clicking a grip (opens at 50%). Drag the divider back to an edge to return to reading. `←` `→` move it (Shift for fine steps), hold `Space` to see the whole scan. Evidence boxes, hover cards, J/K, selection and adding findings all work on the text side.

### 6.5 Evidence boxes and card
Exact words are boxed with a tag above (code and derived MDM, e.g. `E11.10 · PROB·H`). Colours: blue dashed = AI suggested, green = accepted, orange = coder added, red strike-through = rejected. Hover shows the card; click pins it. The card shows type, status, AI confidence, code, description, derived MDM, notes, the quote, page and "goes to", a comment box, and actions: Accept / Reject / Unaccept / Restore for AI findings, **Remove** for coder-added findings, and **Change evidence**.

### 6.6 Adding what the AI missed
Select words → toolbar `+ Diagnosis · + Service · + MAR · + Doc · + Note` (or right-click). The compose panel searches codes pre-filled from the selection, reads MAR rows whole with billing units, offers documentation kinds with their MDM credit, or takes a free note. On add, a chip flies into the notepad and the words get an orange box. Selections overlapping another box are refused with a hint.

### 6.7 Changing evidence
"Change evidence" (card, or the Full notes table) closes Full notes, jumps to the current evidence and shows a banner. Select the right words → **Use as evidence for {code}**. The finding moves; derived MDM, interventions and the minimap follow. Undo works. The new words may overlap the finding's own old box but not another finding's.

### 6.8 Right-click menu
On the record: Add diagnosis / service / MAR entry / documentation / note and Copy (when text is selected), zoom in / out / actual size / fit width, **Show this in the original** (opens side by side at that spot and highlights it), and the three views. On the original column: zoom, **Show this in the record**, scroll with the record (toggle), close. Arrow keys, Enter and Esc work; the menu re-fits when items change so it stays on screen.

### 6.9 Notepad
Floating (drag, resize from every edge and corner), docked right (resizable, collapsible), or a bubble. Tabs: **Findings** (In view follows the scroll, with pin; All), **Claim** (lines, diagnoses, not on claim), **Interventions** (each with status and pages; the flow icon opens its path). Footer: Full notes. The Problems / Data / Risk scorecard was removed from the notepad (§12).

### 6.10 Full notes (F)
- **Findings:** filter by type (pills) and status (dropdown with counts). Columns: type, status, page, code, description, evidence (with **Change evidence** on hover), AI confidence (bar and %), goes to, comment, actions. **Codes on the claim are locked** (lock icon). Other diagnosis, service and MAR codes are **editable in place**: search, pick, and the row shows "was {old code}"; undoable. Coder-added rows have **Remove** (trash).
- **Claim:** MDM scorecard, service lines, diagnoses, and "Found in the record, not on the claim".
- **Interventions:** the list, and for the selected one a **React Flow** chart of how it was reached: found in record / on claim → rule conditions (any one) → intervention → ED level, with the diagnosis reason feeding in. Nodes are coloured by status; clicking a finding opens it in the record.

### 6.11 Keyboard and commands
The modifier follows the platform: **⌘ on Mac, Ctrl on Windows/Linux** (hints show the right one).

| Keys | Action |
|---|---|
| J / K | Next / previous finding |
| A / R | Accept / reject (R removes a coder-added finding) |
| Delete, Backspace | Remove the selected coder-added finding |
| N · D · F | Notepad · dock/float · Full notes |
| S · C | Spotlight · Clean read |
| O · Esc | Cycle original views · back to reading / close |
| ← → · Space | Overlay: move divider · hold to see the whole scan |
| + − 0 | Zoom the column under the pointer (with or without ⌘/Ctrl) |
| ⌘/Ctrl + K | Command palette (pages, views, zoom, notepad, Full notes tabs) |
| ⌘/Ctrl + Z | Undo; every change also shows a toast with Undo |
| ⌘/Ctrl + ↵ | Add note, save comment, complete review |

Pinch and wheel zoom accept either modifier on every platform (a Mac trackpad pinch arrives as Ctrl + wheel). On Mac, Ctrl + click opens the right-click menu.

### 6.12 Responsive and themes
At phone width the notepad starts as a bubble, header labels collapse to icons, the original views hide, and the page never scrolls sideways. Light and dark themes via tokens.

## 7. Demo case (synthetic)

- **Case** RC-2026-1187, Reconsideration, received Sep 18. Patient "DEMO, Jordan", F, 47, DOB 11/19/1978. DOS 05/02/2026. Meridian Regional Medical Center (fictional), ED facility claim NSH-ED-55120-03 (UB-04 / 837I, TOB 0131).
- **Claim:** 99285 paid as 99284 (CARC 150); IV push 96374, hydration 96360, J7030 × 2, J2405 × 4, ECG 93005, CMP 80053; diagnoses E11.65 (principal), E86.0, R11.2. Reason-for-visit diagnosis R10.9, deliberately not supported, so the bar shows a mismatch.
- **Record:** 5 pages: triage and history, exam, labs and ECG, MAR, ED course and disposition. DKA with AKI and hyperkalemia; insulin infusion; admitted to observation.
- **Starting state:** MDM Moderate / Moderate / Moderate, supports 99284 of 99285. Accepting DKA (E11.10, replaces E11.65) and the decision to admit makes Problems and Risk High → 99285. 3 of 8 interventions documented, 5 need review.

## 8. Data model

`src/types/index.ts` is the source of truth. Key shapes:

| Entity | Fields |
|---|---|
| Finding | `id`, `page`, `block`, `text` (anchor); `type`; `code?`, `desc?`; `docKind?`; `mar?` (time, drug, dose, route, units); `status`; `source`; `conf?`; `replaces?`; `editedFrom?` (code before the coder changed it); `note?`; `comment?` |
| Claim | `id`, `form`, `billType`, `patient { name, dob }`, `dos`, `reasonDx`, `lines[]` (line, rev, code, units, dx pointers, charge, paid code/units), `dx[]` |
| Page layout | `PAGE_LAYOUT[page]` = lines `{ block, start, text, x, y, size, bold?, center?, bullet? }` in page pixels (850 × 1100) |
| Review | `status` (inProgress / completed), `comment`, `completedAt` |

Derived, never stored: route ("goes to"), MDM credit and summary, claim checks, interventions and their paths, field checks.

## 9. Architecture

- **Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion, zustand, @xyflow/react (React Flow), Vitest.
- **Structure:** one folder per business function under `src/features/` (case-header, claim, record-viewer, source-view, zoom, doc-menu, add-finding, findings, interventions, review, notepad, full-notes, command-palette, shortcuts), each imported through its `index.ts`. Rules and demo data live in `src/data/`; shared geometry (`docPosition.ts`), platform keys (`platform.ts`) and helpers in `src/lib/`.
- **State:** findings store (with undo history), add-finding store, notepad store, review store, and a UI store (views, zoom per column, divider, menus).
- **Positions:** both the record and the original column mark pages with `data-page`; a position is "page n, fraction f". Scroll sync, zoom-around-a-point and "show this in…" all use it, so columns stay aligned at different zooms.

### 9.1 Production direction

| Need | Direction |
|---|---|
| Original pages | Render PDF/TIFF pages to images server-side; replace `PAGE_IMAGES` with their URLs |
| Line boxes for the overlay | Fill `PAGE_LAYOUT` from Azure Document Intelligence line/word polygons, normalised to page coordinates |
| Selectable text on scans | The overlay's text layer is the invisible OCR layer; build it before relying on select-to-add for scans |
| Large records | Virtualise pages (`@tanstack/react-virtual`) |
| Rules | Replace the MDM and intervention placeholder tables with the team's criteria; consider per-payer rule sets |
| Persistence | Findings, edits, review status and comments to a backend with an audit trail |

CLAIRE's pipeline (Document Intelligence → extraction agent) supplies the AI findings with page anchors; every accept, reject, add, code edit and evidence change is a labelled example for evaluation.

## 10. Risks

| Risk | Response |
|---|---|
| Automation bias | Evidence always visible before accepting; confidence shown; acceptance rates trackable |
| Extraction errors | Side-by-side and overlay views to check text against the scan |
| Poor scans | Show OCR confidence; page rotation and duplicate handling (future) |
| Code sets change yearly | Look up codes valid on the DOS |
| 500+ page records | Virtualised rendering, lazy page images |
| PHI | HIPAA controls, audit trail, role-based access; synthetic data only in demos |
| Throughput pressure | Keyboard-first, few clicks, undo everywhere |

## 11. Open questions and known gaps

1. **MDM and intervention criteria are placeholders.** Need the team's tables (and whether they vary by payer).
2. **Facility level:** the ED level check uses MDM. Decide whether interventions set the facility level, MDM does, or both.
3. **MDM on the evidence card:** kept as is for now; to be discussed.
4. **"Supporting" label:** consider "Supports level", or naming the path (→ MDM / → Interventions).
5. **Completed reviews are not locked;** decide whether completing should make the case read-only until reopened.
6. **On-claim rows:** code is locked, but evidence can still be changed and findings accepted/rejected; confirm.
7. **Nothing persists;** a reload resets the demo.
8. **Incorrect-extraction flags** (mark text that OCR got wrong) were deferred.
9. **Checkpoints for the left and right slots** of the bar are to be defined. The superseded MDM pill bar (Problems, Data, Risk, Level, DOS, AI review) is a candidate source.
10. **Record/claim scope:** ED facility only today; office E/M, other visit families and inpatient are not modelled.

## 12. Decision log

| Date | Decision |
|---|---|
| 26 Sep 2026 | Explore an app for coders reviewing records in reconsiderations and appeals, with the record open and a notepad that fills as they scroll |
| 29 Sep 2026 | Merged layout instead of split: full-width record; notepad floats, docks or minimises; Full notes view; scroll sync; mark what the AI missed |
| 29 Sep 2026 | Prototype built; demo script panel removed; notepad resizable from every edge and corner |
| 29 Sep 2026 | Checkpoint bar (MDM pills) specified; later superseded by the patient strip |
| 30 Sep 2026 | Converted to React + TypeScript + Tailwind; switched to a payer-side ED case (claim vs record, MAR, notepad tabs) |
| 30 Sep 2026 | Zoom controls for the record |
| 30 Sep 2026 | Originals are page images of the source PDF/TIFF; the centre shows the extracted text |
| 30 Sep 2026 | Stage Manager-style stack of originals in the margin |
| 30 Sep 2026 | Keep only one side-by-side view (two scroll-locked columns); drop the one-page fitted view |
| 30 Sep 2026 | Separate zoom per column, in a floating toolbar and a right-click menu; ⌘/Ctrl + wheel, pinch and + − 0 zoom the column under the pointer |
| 30 Sep 2026 | Overlay view with a before/after slider on the same page, drawn on OCR line boxes so words line up; kept as a third view alongside reading and side by side |
| 30 Sep 2026 | Overlay entered from grips on the page's own left and right edges, not a separate control |
| 30 Sep 2026 | Incorrect-extraction flagging deferred |
| 30 Sep 2026 | Double-click to leave the overlay: not done (double-click selects words for findings) |
| 30 Sep 2026 | Problems / Data / Risk scorecard removed from the notepad (kept in Full notes → Claim) |
| 30 Sep 2026 | Interventions are not findings: derived from services and MAR by rules; the five INTV highlights became Service findings without codes |
| 30 Sep 2026 | Coder-added findings can be removed outright (with undo); AI suggestions are rejected so they stay on file |
| 30 Sep 2026 | MDM is not a finding type: derived from diagnoses (Problems), tests and documentation (Data), drugs and decisions (Risk); new **Documentation** finding for code-less statements |
| 30 Sep 2026 | Intervention rules are data, and each intervention's path is shown as a React Flow chart; Interventions got their own tab next to Findings and Claim |
| 30 Sep 2026 | Full notes table: "Not on claim" renamed **New**; AI confidence column; "Pg" renamed Page; on-claim codes locked, other codes editable in place with "was …" |
| 30 Sep 2026 | Coders can change a finding's evidence by re-selecting words in the record |
| 30 Sep 2026 | Status filter in Full notes became a dropdown |
| 30 Sep 2026 | Shortcuts follow the platform: ⌘ on Mac, Ctrl on Windows/Linux |
| 30 Sep 2026 | Patient strip redesigned as the checkpoint bar: centred Claim, Patient, DOB, Age, DOS, Reason for visit with verified / mismatch / invalid indicators; left and right slots reserved for checkpoints |
| 30 Sep 2026 | Header: payer line and "decision due" badge removed; claim number moved into the checkpoint bar |
| 30 Sep 2026 | Complete review (with closing comment) in the checkpoint bar; "In progress" status sits beside the button, not in the header |
| 30 Sep 2026 | One spec file (this one) and a README tour with screenshots |
