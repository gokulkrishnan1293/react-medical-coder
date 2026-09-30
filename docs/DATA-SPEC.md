# Case data and persistence — Spec

| | |
|---|---|
| **Status** | Draft v0.1 (30 Sep 2026). Not built yet |
| **Owner** | Gokul Krishnan |
| **For** | Agents that (a) prepare sample cases and (b) build the loader, the data API and persistence |
| **Related** | [SPEC.md](SPEC.md) §8 Data model, §9.1 Production direction |

Today every case detail is TypeScript in `src/data/` and nothing survives a reload. This spec moves the case into a **case folder** (the record as Markdown, page images, claim and CLAIRE's findings as JSON), loads it through **one data-access module** that has the same shape as the future backend API, and **saves the reviewer's work to the file system** so it survives a page refresh.

> **Built so far (30 Sep 2026):** case folders live in `src/data/cases/<id>/` (`case.json`, `claim.json`, `record.md`, `findings.json`, `images/`; how-to in `src/data/cases/README.md`). They are read at build time with `import.meta.glob`; the open case comes from `/cases/<id>` when the page loads, so opening another case reloads the page. `record.md` is parsed by `src/data/markdown.ts`. Reference tables are JSON in `src/data/reference/` (codes, MDM, interventions, user). **Saving is built:** `src/api/` (the only data-access module) saves the review delta (§4.1 `SavedReview`, simplified: no `base` hashes or `orphans` yet) through the dev-server plugin `server/reviewApi.ts` to `cases/<id>/review.json`, or to `localStorage` in a static build; the saved review is loaded before the first render and autosaved 500 ms after each change. Not built yet: listing and locking through the API, conflict handling (§5.3), full rebase rules (§5.4), `layout.json`, `expected.json`.

Three rules drive everything below:

1. **The client never reads files.** It calls `api.*`. In development the API is a Vite middleware that reads and writes the case folder; later it is the real backend. Swapping them changes one file.
2. **CLAIRE's output is never modified.** `findings.json` is the original; the reviewer's work is saved beside it as a delta (`review.json`). "Review vs original" is always the difference between the two.
3. **Findings are anchored by page and exact words, not by block IDs.** Block IDs are derived when the Markdown is parsed and can shift when the record changes; anchors are re-resolved on every load.

---

## 1. Case folder

```
cases/
└─ RC-2026-1187/
   ├─ case.json        case, patient and encounter as the record states them
   ├─ claim.json       claim as returned by ERDM
   ├─ record.md        extracted record text, all pages, in Markdown
   ├─ findings.json    CLAIRE's findings, anchored to record.md
   ├─ images/          original page images (optional)
   │  ├─ page-001.png
   │  └─ page-002.png
   ├─ layout.json      OCR line boxes for the overlay view (optional)
   ├─ expected.json    what the app must compute for this case: MDM, claim checks, interventions (§2.6)
   ├─ rules/           this case's own rule tables, replacing the shared ones (optional, §2.5)
   └─ review.json      the reviewer's work — written by the app, never by hand
rules/
├─ interventions.json  shared intervention rules (§2.5)
└─ mdm.json            shared MDM tables (§2.5)
```

- The folder name is the case ID and must equal `case.json` → `case.id`.
- `cases/` sits at the repo root (not `public/`): files are served through the API, never fetched directly.
- `review.json` and `audit.jsonl` are git-ignored (add `cases/*/review.json` and `cases/*/audit.jsonl` to `.gitignore`). Sample data is committed; review state is not.
- The existing demo case becomes `cases/RC-2026-1187/`, generated from today's `src/data/*.ts` so the app looks exactly the same (§8, phase 1).

### 1.1 `case.json`

```json
{
  "schemaVersion": 1,
  "case": {
    "id": "RC-2026-1187",
    "stage": "Reconsideration",
    "received": "Sep 18",
    "due": "Oct 18",
    "daysLeft": 18,
    "payer": "Northstar Health Plan",
    "billed": "99285",
    "paid": "99284",
    "levelCodes": ["99282", "99283", "99284", "99285"]
  },
  "patient": {
    "name": "DEMO, Jordan", "memberId": "NSH-4471-0928", "mrn": "ED-TEST-20931",
    "dob": "11/19/1978", "age": 47, "sex": "F", "plan": "Northstar PPO Gold"
  },
  "encounter": {
    "setting": "Emergency department · facility",
    "facility": "Meridian Regional Medical Center",
    "attending": "Priya Raman, MD",
    "dos": "05/02/2026", "arrival": "02:14", "departure": "08:05",
    "disposition": "Admitted to observation",
    "reason": "\"I can't keep anything down.\" Vomiting and abdominal pain for 2 days."
  },
  "sourcePages": { "name": 1, "dob": 1, "dos": 1, "reason": 1 }
}
```

- Shapes are `CaseInfo`, `Patient` and `Encounter` from `src/types/index.ts`, unchanged.
- `patient` and `encounter` are **what the record says**, not what the claim says. The checkpoint bar compares them with `claim.json`.
- `sourcePages` (new) says which record page each checked field comes from. Today `fieldChecks.ts` hard-codes page 1; it should read these instead.
- Dates are `MM/DD/YYYY`. Times are `HH:MM` 24-hour.

### 1.2 `claim.json`

The `Claim` type, unchanged, plus `schemaVersion`. See §2 for the rules that tie it to the record.

### 1.3 `record.md`

The extracted text of every page, in reading order. The format follows the Markdown that Azure Document Intelligence (layout model, `outputContentFormat=markdown`) produces, so a real extraction drops in with little or no clean-up. Each Markdown element maps to one of the app's block kinds (`BlockKind` in `src/types/index.ts`):

| Markdown | Block kind | Notes |
|---|---|---|
| `<!-- Page: n -->` | — | Starts page n. Text before the first marker is page 1. The page is named after its first `##` heading (`<!-- Page: n \| Label -->` names it explicitly) |
| `<!-- PageHeader="…" -->`, `<!-- PageFooter="…" -->`, `<!-- PageNumber="…" -->` | — | Emitted by Document Intelligence; ignored (not record text) |
| A paragraph that is entirely bold: `**MERIDIAN REGIONAL MEDICAL CENTER**` | `org` | Facility name at the top of a form |
| A paragraph that is entirely italic: `*Emergency Department · 400 Lakeview Parkway*` | `sub` | Address or sub-heading line |
| `# EMERGENCY DEPARTMENT PHYSICIAN RECORD` | `title` | Form title |
| `## TRIAGE` (also `###`) | `h` | Section heading |
| Paragraph | `p` | Soft line breaks inside a paragraph are joined with one space |
| `- item` or `1. item` | `li` | One block per item; nested items are flattened |
| A fenced block marked `text` | `meta` | **One block per line**; runs of spaces are kept (`Patient: DEMO, JORDAN     MRN: …`) |
| `<!-- MAR -->` then a pipe table | `marHead` + `mar` | Header row → `marHead`, each body row → `mar`. Cells are joined with `" \| "`, which is the text MAR findings anchor to |
| Any other pipe or HTML table | `meta` | One block per row (header included), cells joined with `" · "` |
| `<figure>…</figure>`, images, `:selected:` / `:unselected:` | — | Dropped, with a warning from the validator |

Inline Markdown inside a block (`**`, `*`, `` ` ``, links) is stripped to plain text: findings anchor to the plain text. The Markdown escapes `\|`, `\*`, `\_` are unescaped.

Example (start of page 1 and the MAR page):

````markdown
<!-- Page: 1 -->
**MERIDIAN REGIONAL MEDICAL CENTER**

*Emergency Department · 400 Lakeview Parkway · Tel (555) 013-2200*

# EMERGENCY DEPARTMENT PHYSICIAN RECORD

```text
Patient: DEMO, JORDAN     MRN: ED-TEST-20931     DOB: 11/19/1978     Sex: F
Date of service: 05/02/2026     Arrival: 02:14     Attending: Priya Raman, MD
```

## HISTORY OF PRESENT ILLNESS

47-year-old woman with type 2 diabetes on metformin and glipizide presents with 2 days of
nausea, repeated vomiting, diffuse abdominal pain, polyuria and increasing thirst.

<!-- Page: 4 -->
## MEDICATION ADMINISTRATION RECORD

<!-- MAR -->
| Time | Medication | Dose | Route | Given by |
|---|---|---|---|---|
| 02:40 | Sodium chloride 0.9% bolus | 1000 mL | IV | K. Ortiz, RN |
| 02:42 | Ondansetron | 4 mg | IV push | K. Ortiz, RN |
````

**Block IDs** are `p{page}b{index}`, where index counts the blocks on that page from 0, exactly as `src/data/pages.ts` numbers them today. They are an internal detail: nothing saved to disk may depend on them.

### 1.4 `images/`

- One image per page: `page-001.png`, `page-002.png` … (PNG, JPEG or WebP; three-digit, 1-based page numbers).
- The count must equal the number of pages in `record.md`.
- Any size, but every page in a case has the same aspect ratio. Page size is taken from `layout.json` when present, otherwise from the first image, otherwise the default 850 × 1100.
- **No `images/` folder:** the app keeps drawing the synthetic fax-style scans it draws today (`pageImages.ts`), from the generated layout. Most sample cases can skip images.

### 1.5 `layout.json` (optional)

The overlay view lays the extracted words over the scan, line by line. That needs each line's position on the page image.

```json
{
  "schemaVersion": 1,
  "unit": "pixel",
  "page": { "width": 850, "height": 1100 },
  "pages": {
    "1": [
      { "text": "MERIDIAN REGIONAL MEDICAL CENTER", "x": 425, "y": 92, "size": 16, "bold": true, "center": true },
      { "text": "47-year-old woman with type 2 diabetes on metformin and glipizide presents with 2 days of", "x": 64, "y": 402, "size": 13 }
    ]
  }
}
```

- One entry per printed line, in reading order: `x`, `y` = start of the baseline (the middle when `center`), `size` = font size, all in page pixels. `LayoutLine` in `pageImages.ts` is the target shape.
- The loader fills in `block` and `start` by walking the page's blocks in order and finding each line's text inside them. A line that matches no block is a validation error.
- Converting Document Intelligence output: take `pages[].lines[]`, use `polygon[0..1]` (top-left) for `x`, `y + 0.77 × lineHeight` for the baseline, `lineHeight` for `size`, and scale inches to pixels with `page.width / pageWidthInches`.
- **Real images without `layout.json`:** the overlay cannot line words up with the scan. Hide the overlay (grips, view switch, `O` cycle) for that case; reading and side-by-side still work.
- **No images and no layout:** generate both, as today.

### 1.6 `findings.json`

CLAIRE's findings. The fields are `Finding` minus what the loader derives:

```json
{
  "schemaVersion": 1,
  "generatedBy": "claire-extraction v0.4",
  "generatedAt": "2026-09-30T10:12:00Z",
  "findings": [
    {
      "id": "d2", "page": 5, "text": "Diabetic ketoacidosis without coma, type 2 diabetes",
      "type": "dx", "code": "E11.10", "desc": "Type 2 diabetes mellitus with ketoacidosis without coma",
      "replaces": "E11.65",
      "note": "Record documents DKA (anion gap 23, pH 7.21, beta-hydroxybutyrate 5.9). Claim lists E11.65.",
      "status": "ai", "conf": 0.94
    },
    {
      "id": "m4", "page": 4, "text": "03:50 | Insulin regular infusion | 8 units/hr | IV continuous | K. Ortiz, RN",
      "type": "mar", "code": "J1815", "desc": "Insulin injection, per 5 units",
      "mar": { "time": "03:50", "drug": "Insulin regular infusion", "dose": "8 units/hr", "route": "IV continuous", "units": 7 },
      "note": "32 units total per nursing note = 7 billing units.",
      "status": "ai", "conf": 0.9
    }
  ]
}
```

| Field | Rule |
|---|---|
| `id` | **Stable across regenerations.** The same finding keeps the same ID when the sample data or CLAIRE is re-run; saved decisions are matched to it (§5.4). Unique in the file |
| `page`, `text` | The anchor: exact words on that page, after the plain-text rules in §1.3 |
| `occurrence` | Optional, 1-based. Needed only when `text` appears more than once on the page; default 1 |
| `block` | **Not in the file.** Resolved by the loader |
| `source` | **Not in the file.** Always `ai` |
| `type` | `dx`, `svc`, `mar`, `doc` (not `note`: notes are the reviewer's) |
| `status` | `ai` (suggested) or `confirmed` (CLAIRE pre-accepted it). Never `added` or `rejected` |
| `conf` | 0–1 |
| `code`, `desc` | Required for `dx` and `mar`. Optional for `svc` (services without their own code, such as cardiac monitoring) |
| `docKind` | Required for `doc` (one of `DocKind`) |
| `mar` | Required for `mar`: `time`, `drug`, `dose`, `route` from the row, `units` in the code's billing units |
| `replaces` | A claim diagnosis this code should replace. Must be a code in `claim.json` → `dx` |
| `note` | CLAIRE's reasoning. The card shows the note of the most confident place of a code as "Why CLAIRE suggests this code" |

**The same code in several places** is several findings with the same `type` and `code`, one per place (SPEC §6.5). Only the first place needs the full `note`; the others may add a short note of their own ("Assessment restates DKA"). `mar` findings never repeat: each MAR row is its own administration.

---

## 2. Aligning sample data

A sample case is useful only when the record, the claim and the findings agree on the details below. The validator (§3) checks every row marked ✓; the rest are review points for whoever writes the case.

### 2.1 Record ↔ findings

| Rule | Checked | What breaks otherwise |
|---|---|---|
| Every `text` appears on its `page` (at `occurrence`) | ✓ | The finding cannot be drawn and is dropped |
| `text` is at least 3 characters and inside one block (no crossing a heading or line of a list) | ✓ | Same |
| Two findings in the same block do not overlap | ✓ | Evidence boxes cannot nest; the later one is dropped |
| A `mar` finding's `text` is a whole MAR row, exactly | ✓ | MAR rows are always taken whole |
| `mar.time`, `drug`, `dose`, `route` equal the row's cells | ✓ | The card and the row disagree |
| `mar.units` is the dose divided by the code's billing unit (`per` in `codes.ts`), rounded up | warning | Unit checks against the claim are wrong |
| A place on the same code is a different piece of text | ✓ | Duplicate boxes |
| An ECG finding's text contains "independently interpreted" only if the physician says so | review | Data credit (category 2 vs 1) comes from this wording (`mdmRules.ts`) |

### 2.2 Claim ↔ findings ↔ rules

| Rule | Checked | What breaks otherwise |
|---|---|---|
| `case.billed` is a service line on the claim, and its `paidCode` equals `case.paid` | ✓ | The visit-level line cannot be checked |
| `case.levelCodes` has four codes, lowest to highest, and contains `billed` and `paid` | ✓ | MDM level cannot map to a code |
| Every `dxPointers` letter is a `dx[].pointer` | ✓ | Pointer column shows unknown letters |
| Every `replaces` is a claim diagnosis | ✓ | "Replaces … on claim" points at nothing |
| Every finding `code` is in `src/data/codes.ts` | warning | The code search cannot find it, so a reviewer cannot switch back to it |
| Every `dx` code has a Problems level in `PROBLEM_BY_DX` (`mdmRules.ts`) | warning | It scores the default (Low) |
| Every lab or test code that should count as Data is in `TESTS` / `ECG` | warning | It gives no Data credit |
| Codes that should meet an intervention appear in `interventionRules.ts` | review | The intervention shows "Not found" |
| Drug lines on the claim have a matching `mar` code with enough units, if the case means them to be supported | review | Line shows "n of m units" (often intended) |

MDM and intervention tables are placeholders (SPEC §11.1). When a sample case needs a code they do not list, **add it to the rule file in the same change** as the case (§2.5), and say so in the case's `README.md`.

### 2.3 Case ↔ claim ↔ record (checkpoint bar)

| Field | Verified when | To make a deliberate mismatch |
|---|---|---|
| Patient | `patient.name` equals `claim.patient.name`, ignoring case and punctuation | Change one letter on the claim |
| DOB | Same string, valid date, not after the DOS | Different date, or a DOB after the DOS (invalid) |
| Age | `patient.age` equals the age on the DOS | Off by one (invalid) |
| DOS | `encounter.dos` equals `claim.dos` | Different date |
| Reason for visit | A `dx` finding (not rejected) has the code `claim.reasonDx` | Use a code no finding has (the demo does this with R10.9) |

The record text should also show these values (e.g. the `meta` line `Patient: DEMO, JORDAN … DOB: 11/19/1978`) on the page named in `sourcePages`, because the bar links there.

### 2.4 Each sample case documents its intent

Add `cases/<id>/README.md`: a few lines saying what the case is meant to show and its expected starting state, e.g. *"MDM starts Moderate / Moderate / Moderate → 99284. Accepting E11.10 and the admission decision gives 99285. Reason for visit deliberately mismatched."* The same expectations are written as data in `expected.json` (§2.6), which the tests check.

### 2.5 Interventions from your data

Interventions are never written into a case. The app **derives** them from the case's service (`svc`) and MAR (`mar`) findings and its claim lines, using rule tables (SPEC §4.4). To get the interventions you want out of a sample case, you supply two things: **the rules** (what counts as each intervention) and **the evidence** (findings that meet them). Rejected findings never count.

#### Rules as data

`src/data/interventionRules.ts` and the tables in `src/data/mdmRules.ts` move to JSON, so rules come from the data you give rather than from code:

- `rules/interventions.json` — shared by every case.
- `cases/<id>/rules/interventions.json` — optional. When present it **replaces** the shared file for that case (for payer- or facility-specific criteria). No merging, so a case's rules are always readable in one place.
- `rules/mdm.json` and `cases/<id>/rules/mdm.json` — the same for MDM: `problemByDx` (code → level 0–3 and label), `problemDefault`, `tests` (codes that count as a unique test), `ecg`, `fluids` (drug codes that are not drug management). `DOC_KINDS` stays in code: it is the app's vocabulary, not a rule.

```json
{
  "schemaVersion": 1,
  "rules": [
    {
      "id": "specimen",
      "label": "Specimen collection and prep (lab)",
      "anyOf": [
        { "kind": "code", "codes": ["80048", "80053", "82010", "82803", "85025", "36415", "36600"], "label": "Lab test or draw code on the record" },
        { "kind": "text", "pattern": "venipuncture|blood (drawn|collected)|specimen", "flags": "i", "label": "Record says “specimen” or “blood drawn”" }
      ]
    },
    {
      "id": "ivAccess",
      "label": "IV access and IV medication administered",
      "anyOf": [
        { "kind": "code", "codes": ["36000", "36410"], "label": "IV placement code 36000 / 36410" },
        { "kind": "text", "pattern": "IV access|IV (line|placed)|antecubital", "flags": "i", "label": "Record says “IV access”" },
        { "kind": "route", "pattern": "^IV", "flags": "i", "label": "A MAR entry was given IV" }
      ],
      "because": { "codes": ["E86.0"], "label": "Dehydration" }
    }
  ]
}
```

- `id`: stable, used by `expected.json` and the path chart. `label`: shown in the list.
- `anyOf`: any one condition met by one finding is enough.
  - `code`: the finding's `code` is in `codes`. Code conditions also match **claim lines** with those codes, which is how "billed only" is found.
  - `text`: `pattern` (a JavaScript regular expression, without slashes, plus `flags`) matches the finding's `text` (the anchored words) or its `desc`.
  - `route`: `pattern` matches the finding's `mar.route`. Only `mar` findings have a route.
- `because` (optional): diagnosis codes that make it necessary. Shown as the reason in the path chart; never required for the state.
- The loader compiles patterns once and rejects the file if one does not compile.

#### How each state comes out

| State (label in the app) | When | To produce it in a sample case |
|---|---|---|
| `met` (Documented) | At least one **accepted or coder-added** `svc` or `mar` finding meets a condition | Give a finding that meets it `"status": "confirmed"` |
| `pending` (Needs review) | Findings meet it, but all are still AI suggestions | Same finding with `"status": "ai"` |
| `billedOnly` (Billed, not in record) | No finding meets it, but a claim line has one of its `code` condition codes | Put the code on a claim line and give no matching finding |
| `none` (Not found) | Neither | Leave it out of both |

Things that commonly go wrong:

- **Only `svc` and `mar` findings count.** A `dx` or `doc` finding with the right words does not meet a `text` condition. The demo's "Record says IV access" condition shows "Nothing found" because the sentence "IV access established 02:35" is not tagged as a service. To make it count, add a `svc` finding on those words.
- **`text` conditions test the anchored words, not the whole page.** Anchor the finding on the words the pattern looks for.
- **A code-less service** (`svc` without `code`, e.g. "Placed on continuous cardiac monitoring") can only meet `text` conditions.
- **Every intervention a case is meant to show needs a rule.** If your list has an intervention the rules do not, add the rule first.

#### What to hand over for a new intervention

Write each one as a row; an agent turns the rows into `rules/interventions.json` entries and the findings that meet them:

| Intervention | Counts when the record shows… | Codes | Needed because (optional) | In this case, expect |
|---|---|---|---|---|
| Specimen collection and prep (lab) | a lab test ordered, a blood draw | 80048, 80053, 82010, 82803, 85025, 36415 | — | Documented |
| Radiology prep | a CT, x-ray or ultrasound ordered | 70450, 71045, 71046, 74176, 74177, 76705 | — | Not found |
| IV access and IV medication administered | an IV placed, any MAR entry given IV | 36000, 36410 | Dehydration | Documented |

The last column goes into `expected.json` (§2.6).

### 2.6 `expected.json`: what the app must compute

Each case states what the app should show, so a changed rule or finding that breaks it fails the tests instead of going unnoticed. States are the ones the app computes (`ClaimState`, `InterventionState`, `FieldState`).

```json
{
  "schemaVersion": 1,
  "start": {
    "mdm": { "problems": 2, "data": 2, "risk": 2, "supports": "99284" },
    "fields": { "name": "verified", "dob": "verified", "age": "verified", "dos": "verified", "reason": "mismatch" },
    "claimLines": { "1": "short", "2": "supported", "6": "pending" },
    "claimDx": { "A": "pending", "B": "supported", "C": "supported" },
    "interventions": { "specimen": "met", "imaging": "none", "ivAccess": "met", "infusion": "pending" }
  },
  "after": [
    {
      "name": "Accept DKA and the decision to admit",
      "accept": ["d2", "r1"],
      "expect": { "mdm": { "problems": 3, "risk": 3, "supports": "99285" }, "claimLines": { "1": "supported" } }
    },
    {
      "name": "Reject the only hydration evidence",
      "reject": ["s6", "m1", "m3"],
      "expect": { "interventions": { "fluids": "billedOnly" } }
    }
  ]
}
```

- `start` is checked against the case as loaded, before any review. `after` steps each start from `start` and apply `accept` / `reject` by finding ID (using the same whole-code accept as the app, SPEC §6.5), then check `expect`.
- Only what is listed is checked, so a case can assert just the parts it is about. MDM levels are 0 Straightforward · 1 Low · 2 Moderate · 3 High.
- Claim lines are keyed by `line` number, diagnoses by `pointer`, interventions by rule `id`.
- A Vitest test runs every case's `expected.json` through the same derivation code the screen uses (`summarize`, `checkLine`, `checkDx`, `checkFields`, `deriveInterventions`). A mismatch prints the case, the step, the key, and expected vs actual.

---

## 3. Loading and validation

### 3.1 Ingest

`src/data/ingest/` (new), pure TypeScript with no DOM or Node APIs, so the dev server, the validator and Vitest all use the same code:

| Module | Does |
|---|---|
| `parseRecord(md) → { pages: RecordPage[], warnings }` | §1.3 mapping |
| `resolveAnchors(pages, raw findings) → { findings: Finding[], errors }` | Sets `block` and `source: 'ai'`; checks §2.1 |
| `resolveLayout(pages, layout?) → Record<number, LayoutLine[]>` | §1.5; falls back to the generated layout |
| `loadRules(shared, override?) → { interventions: InterventionRule[], mdm: MdmTables }` | §2.5; compiles patterns, checks rule IDs are unique |
| `validateCase(bundle) → Issue[]` | All ✓ and warning rows in §2, plus: every rule ID in `expected.json` exists; every finding ID in `after` steps exists |
| `checkExpected(bundle, expected) → Mismatch[]` | §2.6 |
| `buildBundle(files) → CaseBundle` | Puts it together (§4.1) |

`Issue = { level: 'error' | 'warning', file, where, message }`. Errors stop the case loading (the API returns 422 with the list); warnings load it and are logged.

### 3.2 Validator

- `npm run validate:cases` validates every folder in `cases/` and prints issues grouped by file. Non-zero exit on any error.
- A Vitest test runs the same over `cases/`, so `npm test` fails on a broken sample.
- A sample-data agent runs `npm run validate:cases` until it is clean, then `npm test`.

---

## 4. Data access (the API seam)

### 4.1 Types

Added to `src/types/`:

```ts
/** Everything the screen needs for one case. The same shape from the dev server and from the future backend. */
export interface CaseBundle {
  schemaVersion: 1;
  case: CaseInfo;
  patient: Patient;
  encounter: Encounter;
  sourcePages: Partial<Record<'name' | 'dob' | 'dos' | 'reason', number>>;
  claim: Claim;
  pages: RecordPage[];                          // blocks included
  layout: Record<number, LayoutLine[]>;         // per page, block and start resolved
  pageSize: { width: number; height: number };
  /** Image URL per page, or null to draw synthetic scans. */
  images: Record<number, string> | null;
  /** Overlay needs line boxes that match the images. */
  overlay: boolean;
  /** CLAIRE's findings as generated. Never changed by the client. */
  findings: Finding[];
  /** Rule tables for this case: its own `rules/` if present, else the shared ones. */
  rules: { interventions: InterventionRule[]; mdm: MdmTables };
  /** Content hashes, so saved reviews can tell when the sample changed. */
  base: { record: string; findings: string };
}

/** The reviewer's work on one case, stored beside the original (review.json). */
export interface SavedReview {
  schemaVersion: 1;
  caseId: string;
  /** Increments on every save; used to refuse stale writes. */
  revision: number;
  savedAt: string;                               // ISO time
  /** `base` of the bundle this review was made on. */
  base: { record: string; findings: string };
  review: { status: 'inProgress' | 'completed'; comment: string; completedAt: string | null };
  /** Changes to CLAIRE's findings, by finding ID. Only fields that differ from findings.json. */
  decisions: Record<string, FindingDecision>;
  /** Findings the reviewer added (source: 'coder'), without `block`. */
  added: Omit<Finding, 'block'>[];
  /** Saved changes that no longer apply after the sample changed (§5.4). Kept, not shown. */
  orphans?: { id: string; reason: string; decision: FindingDecision | Omit<Finding, 'block'> }[];
}

export type FindingDecision = Partial<Pick<Finding,
  'status' | 'code' | 'desc' | 'editedFrom' | 'editedFromDesc' | 'page' | 'text' | 'movedFrom' | 'comment'>>;
```

### 4.2 Interface

`src/api/index.ts` (new) is the only module the app uses for data. Everything is async, even when the adapter is local.

```ts
export interface CaseApi {
  /** The worklist: `WorkItem` in src/types (status, assignee, who has it open, completion and outcome). */
  listCases(): Promise<WorkItem[]>;
  /** Take the case's lock before opening it; refused (LockedError, with who holds it) when another reviewer has it. */
  openCase(id: string): Promise<{ lockedBy: null } | { lockedBy: string; since: string }>;
  /** Give the lock back when leaving the case (route change, tab close). */
  closeCase(id: string): Promise<void>;
  getCase(id: string): Promise<CaseBundle>;
  getReview(id: string): Promise<SavedReview | null>;
  /** Refuses (ConflictError) when `review.revision` is not the stored revision + 1. */
  saveReview(id: string, review: SavedReview): Promise<{ revision: number; savedAt: string }>;
  resetReview(id: string): Promise<void>;
}

export const api: CaseApi = pick(import.meta.env.VITE_DATA_SOURCE);
```

| `VITE_DATA_SOURCE` | Adapter | Reads | Writes | Use |
|---|---|---|---|---|
| `fs` (default in `npm run dev`) | `src/api/httpApi.ts` against the dev middleware | `cases/` | `cases/<id>/review.json` | Local work on sample data |
| `bundled` (default in `npm run build`) | `src/api/bundledApi.ts` | Cases compiled in with `import.meta.glob('/cases/*/…', { query: '?raw' })`, ingested in the browser | `localStorage` key `claire-review.review.<id>` | Static demo deploys |
| `http` | `src/api/httpApi.ts` with `VITE_API_BASE` | Real backend | Real backend | Production |

The `fs` and `http` adapters are the same code. The dev middleware implements the same REST contract (§4.3) the backend will, so moving to production is setting `VITE_API_BASE`.

### 4.3 REST contract

The dev middleware (`server/casesPlugin.ts`, registered in `vite.config.ts` with `configureServer`) implements exactly this. The backend must match it.

| Method and path | Response |
|---|---|
| `GET /api/cases` | `200` list as in `listCases` |
| `GET /api/cases/:id` | `200 CaseBundle` · `404` · `422 { issues }` when validation fails |
| `GET /api/cases/:id/pages/:n/image` | `200` image bytes, `Cache-Control: no-cache` · `404` |
| `GET /api/cases/:id/review` | `200 SavedReview` · `204` none saved |
| `PUT /api/cases/:id/review` | Body `SavedReview`. `200 { revision, savedAt }` · `409 { revision }` when stale · `400` bad body |
| `DELETE /api/cases/:id/review` | `204`. Deletes `review.json` (the audit log stays) |
| `POST /api/cases/:id/lock` | `200` lock taken or renewed · `423 { reviewer, since }` held by someone else. The client renews it every 60 s while the case is open |
| `DELETE /api/cases/:id/lock` | `204`. Sent on leaving the case; a lock not renewed for 3 minutes expires |
| `PUT /api/cases/:id/review` while completed | `409 { reason: 'completed' }` unless the body reopens it (`review.status: 'inProgress'`) |

- `CaseBundle.images` URLs point at the image route; the client never builds file paths.
- Writes are atomic: write `review.json.tmp`, then rename.
- The middleware validates `:id` against the folder list (no path traversal) and caps bodies at 5 MB.
- In the dev middleware, locks live in memory and the reviewer is `ME` from `src/data/worklist.ts`, so two browser profiles with different `?as=<reviewerId>` can exercise locking. `listCases` reads `WorkItem` fields from `case.json` → `worklist` (assignee, received, due) plus live lock and `review.json` status.
- Every successful `PUT` also appends one line to `cases/<id>/audit.jsonl`: `{ at, revision, changes: [...] }`, where changes are the decision fields that differ from the previous revision. That is the record of every accept, reject, edit and comment, and the labelled examples SPEC §9.1 asks for.

---

## 5. Persistence

### 5.1 What is saved where

| State | Where | Why |
|---|---|---|
| Finding decisions, coder-added findings, comments, code and evidence edits | `review.json` via `api.saveReview` | The review itself |
| Review status, closing comment, completed time | `review.json` | Same |
| Undo history | Memory only | Undo covers the current session; after a reload it starts empty |
| Notepad position and mode, zoom, original view, sync scroll, tour seen | `localStorage`, per browser | Viewer conveniences, not part of the review |
| Selection, open card, palette, menus | Nothing | Transient |

### 5.2 From stores to file and back

Two pure functions in `src/api/review.ts`, each with unit tests:

- `toSavedReview(original: Finding[], current: Finding[], reviewState, prev?: SavedReview) → SavedReview` — for each AI finding, keeps only the fields that differ from the original; coder findings go to `added`; `revision = (prev?.revision ?? 0) + 1`.
- `applySavedReview(bundle: CaseBundle, saved: SavedReview) → { findings: Finding[], review, notices: string[] }` — the reverse, with the rebase rules in §5.4 when `saved.base` differs from `bundle.base`.

Round trip: `applySavedReview(bundle, toSavedReview(bundle.findings, x, r)).findings` deep-equals `x`, for any `x` the stores can produce.

### 5.3 When it saves

- A small `src/api/autosave.ts` subscribes to the findings store (`findings`) and the review store (`status`, `comment`, `completedAt`). On change it saves after **500 ms** of quiet; changes during a save are sent right after it.
- On `pagehide` and `visibilitychange → hidden`, a pending save is sent at once with `fetch(…, { keepalive: true })`.
- On `409`: fetch the stored review, show "This case was changed in another tab" with **Reload** (discard local, load stored) and **Keep mine** (save again on the stored revision). No silent merging.
- On a network or 5xx error: retry at 2 s, 5 s, 15 s, then every 30 s. Keep the unsaved review in `localStorage` (`claire-review.unsaved.<id>`) until a save succeeds, and offer it on the next load.
- **Save status** in the checkpoint bar's right slot, next to the review status: `Saved`, `Saving…`, or `Not saved — retrying` (with the error on hover). Quiet when saved.

### 5.4 Re-running with new sample data

You will regenerate cases. Saved reviews must follow sensibly. When `saved.base` differs from `bundle.base`, `applySavedReview` works finding by finding:

| Situation | Result |
|---|---|
| Same `id`, same `type`, `code` and anchor (page + text) in the new `findings.json` | Decision applied in full |
| Same `id`, but CLAIRE's `code` changed | Status back to `ai`; comment kept; `editedFrom` dropped. Notice: "CLAIRE changed E11.65 → E11.10 on d2; review it again" |
| Same `id`, anchor text changed, still found on the page | Decision applied to the new anchor |
| Saved evidence move (`page` + `text` in the decision) no longer found | Move dropped (`orphans`); finding keeps CLAIRE's new anchor |
| `id` gone from `findings.json` | Decision moved to `orphans` |
| New `id` | Comes in as CLAIRE wrote it (`ai` or `confirmed`) |
| Coder-added finding whose anchor still resolves | Kept |
| Coder-added finding whose anchor no longer resolves | Moved to `orphans` |
| Review was `completed` and anything above changed | Status back to `inProgress`, closing comment kept. Notice says why |

Notices appear once, as a dismissible banner under the checkpoint bar ("Sample data changed since your last save: 2 findings to review again, 1 removed"). The next save writes the new `base` and keeps `orphans`, so nothing is lost silently. **Reset review** in the command palette calls `api.resetReview` and reloads the case.

---

## 6. Client changes

### 6.1 Boot

Today modules read `PAGES`, `CASE`, `CLAIM`, `INITIAL_FINDINGS`, `BLOCKS`, `PAGE_LAYOUT` and more (33 files import from `@/data`) as constants, and several compute from them when the module loads (`BLOCKS`, `CLAIM_CODES`, `PAGE_LAYOUT`, `PAGE_IMAGES`, `INITIAL_FINDINGS`). So data must be in place **before the app's modules evaluate**:

```ts
// src/main.tsx
const id = new URLSearchParams(location.search).get('case') ?? DEFAULT_CASE_ID;
const [bundle, saved] = await Promise.all([api.getCase(id), api.getReview(id)]);
setCaseData(bundle);                                  // fills src/data/caseData.ts
hydrateStores(bundle, saved);                         // applySavedReview → findings + review stores
const { App } = await import('@/app/App');            // app modules evaluate after this
createRoot(root).render(<App />);
startAutosave(id, bundle);
```

- `src/data/caseData.ts` (new) holds the loaded bundle and exports the same names as today (`PAGES`, `BLOCKS`, `CASE`, `PATIENT`, `ENCOUNTER`, `CLAIM`, `CLAIM_CODES`, `PAGE_LAYOUT`, `PAGE_IMAGES`, `PAGE_W`, `PAGE_H`, `INITIAL_FINDINGS`) as `export let` bindings that `setCaseData` assigns. ES module live bindings mean existing imports keep working unchanged.
- `src/data/index.ts` re-exports them. `pages.ts`, `case.ts`, `claim.ts`, `findings.ts` and `pageImages.ts` stop holding data; the synthetic scan and generated layout move to `src/data/ingest/synthetic.ts`.
- `INTERVENTION_RULES` and the MDM tables come from `bundle.rules` the same way; `mdmOf` reads the loaded tables. `codes.ts` (the code search list) and `DOC_KINDS` stay in code.
- `findingsStore` and `reviewStore` start empty and are filled by `hydrateStores`; `INITIAL_FINDINGS` stays for tests and for "Reset review".
- A loading screen while `getCase` runs; an error screen listing validation issues on `422`.
- Switching cases is a full page load (`?case=…`). No in-app case switching yet.
- Tests: a Vitest setup file calls `setCaseData(buildBundle(<demo case files>))`, so existing tests run against the case folder.

### 6.2 Fixes this depends on

- `fieldChecks.ts`: use `sourcePages` instead of page 1.
- `pageImages.ts` fax header ("FROM: MERIDIAN RMC HIM …") and `PRINT_FOOTER`: take facility and dates from the case, or drop them.
- Overlay hidden when `bundle.overlay` is false (§1.5).

---

## 7. Preparing a sample case — checklist

For the agent that writes or converts sample data:

1. Make `cases/<id>/` with `case.json`, `claim.json`, `record.md`, `findings.json`, `README.md` (§2.4). Images and `layout.json` only if the case is about the original document.
2. Write `record.md` with the §1.3 mapping. Start each page with `<!-- Page: n -->`, matching the source pages.
3. Put the checkpoint-bar values in the record text on the pages named in `sourcePages` (§2.3).
4. Write `findings.json`: copy each anchor's text straight out of the parsed block (run the validator to see block text), give every finding a stable `id` (`d1`, `s3`, `m2`… or a UUID, never positional), add every other place a code is documented as its own finding.
5. Check every code against `codes.ts` and the rule files; add what is missing (§2.2).
6. For each intervention the case should show, make sure a rule exists and a `svc` or `mar` finding meets it with the status that gives the state you want (§2.5).
7. Write `expected.json`: the starting MDM, checkpoint fields, claim lines and diagnoses, interventions, and one `after` step per thing the case is meant to demonstrate (§2.6).
8. `npm run validate:cases` until clean; `npm test` (includes `expected.json`).
9. `npm run dev`, open `?case=<id>`, and confirm the starting state in the case README. Accept a few findings, reload, and check they are still accepted.

---

## 8. Plan

| Phase | Scope | Done when |
|---|---|---|
| **1. Case folder** | `src/data/ingest/*`; export today's demo to `cases/RC-2026-1187/`; rules to `rules/*.json`; `expected.json` for the demo (today's test expectations); `caseData.ts` with live bindings; `bundled` adapter; boot sequence; validator, rule loader and `expected.json` test | The app looks and behaves exactly as before (same 38 tests pass, screenshots unchanged); deleting a word from `record.md` that a finding needs fails `validate:cases` with that finding's ID; changing a rule so an intervention changes state fails the `expected.json` test |
| **2. Persistence** | `server/casesPlugin.ts` (REST contract); `httpApi`; `review.ts` with round-trip tests; autosave; save status; conflict and retry handling; Reset review | In `npm run dev`: accept, reject, edit a code, move evidence, add a finding, comment, complete the review, reload → all still there, and `review.json` holds only the changes. Two tabs editing: the second save gets the conflict prompt |
| **3. Re-run** | Rebase rules (§5.4), notices banner, `orphans`, `audit.jsonl` | Unit tests for each row of the §5.4 table; regenerating `findings.json` with one code changed shows the notice and puts that finding back to `ai` |
| **4. Real originals** | Image route, `layout.json` resolution, overlay off without layout | A case with PNG pages and `layout.json` lines words up in the overlay; the same case without `layout.json` hides the overlay |
| **5. Backend** | `VITE_DATA_SOURCE=http` against the service | No client changes beyond configuration |

## 9. Open questions

1. ~~Case ID in the URL or a case list first?~~ Decided: the worklist is the home screen (`/`), a case opens at `/cases/:caseId` (React Router). The boot sequence in §6.1 runs per case route, not at app start.
2. **Who may reset a review**, and should reset keep the audit log (this spec: yes)?
3. ~~Completed reviews read-only?~~ Decided: yes. Completing locks every change until the reviewer reopens it; the API refuses writes to a completed review (§4.3).
4. **Where page images come from in production:** rendered by the backend from the PDF/TIFF (SPEC §9.1) — confirm the image route stays the contract.
5. **Rules per payer:** is a per-case `rules/` override enough, or do rules need to be chosen by payer (`rules/<payer>/…`)?
6. **Multiple reviewers on one case** (QA second review): one `review.json` per reviewer, or one shared with an author on each decision?
