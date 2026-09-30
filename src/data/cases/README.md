# Case folders

One folder per case. Add a folder and the case appears in the worklist and opens in the workbench. No code changes. The full design is in [docs/DATA-SPEC.md](../../../docs/DATA-SPEC.md); this page is what you need to produce the files.

```
src/data/cases/
└─ RC-2026-1187/            folder name = case ID
   ├─ case.json             required: case, patient, encounter, worklist entry
   ├─ claim.json            required: the claim as ERDM returned it
   ├─ record.md             required: the extracted record
   ├─ findings.json         optional: CLAIRE's findings
   ├─ images/               optional: original page images
   ├─ review.json           written by the app: your review work (never edit by hand)
   └─ extraction.json       written by the app: extraction problems you flagged (never edit by hand)
      ├─ page-001.png
      └─ page-002.png
```

A folder missing `case.json`, `claim.json` or `record.md` is left out, with a warning in the browser console.

## record.md

The record text, page by page. Start each page with a marker:

```markdown
<!-- Page: 1 -->
**MERIDIAN REGIONAL MEDICAL CENTER**

# EMERGENCY DEPARTMENT PHYSICIAN RECORD

## CHIEF COMPLAINT

Vomiting and abdominal pain for 2 days.

<!-- Page: 2 -->
## PHYSICAL EXAMINATION
...
```

| Write | Shows as |
|---|---|
| `<!-- Page: n -->` | Start of page n. The page is named after its first `##` heading |
| `**A WHOLE LINE IN BOLD**` | Facility name at the top of a form |
| `*A whole line in italics*` | Address or sub-heading line |
| `# Title` (or a line underlined with `===`) | Form title |
| `## Heading` (or underlined with `---`) | Section heading |
| `### Heading`, `####` … | Sub-heading |
| A paragraph | Paragraph. Line breaks inside it are joined |
| `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`, `[text](url)`, `<https://…>` | The same, inside any line, table cell or list item |
| `- item`, `1. item`, indented `  - item` | Bulleted, numbered and nested lists (2 spaces a level) |
| `- [x] done`, `- [ ] to do` | Checklist items |
| `> quoted` | Quote |
| `---` on its own line | Horizontal rule |
| A ` ```text ` block (or ` ``` `) | One line per row, spacing kept (vitals, labs, the patient header) |
| A ` ```lang ` block (e.g. ` ```csv `) | Code block, line breaks kept |
| A pipe table, with or without outer `\|` | A table: header row, alignment from `:--`, `--:`, `:-:`, formatting in cells |
| An HTML `<table>` | A table, including `colspan` / `rowspan` for grouped, multi-level headers |
| `<!-- MAR -->` then a table | Medication administration record: header row, then one row per dose |
| `<!-- Columns -->` … `<!-- Column -->` … `<!-- /Columns -->` | Content laid out in columns side by side (a two-column form) |

Inline HTML such as `<b>`, `<i>`, `<br>` and `&nbsp;` is understood; other tags, `<!-- … -->` comments and images are left out. [RC-2026-1215](RC-2026-1215/record.md) uses every one of these and is the reference to copy from.

Findings anchor to the **text as shown**, without the Markdown: for `**Troponin I**` the finding's `text` is `Troponin I`. In a table row, cells are joined with ` | `, so a finding can quote one cell or a whole row.

## findings.json

CLAIRE's findings. Each one points at **exact words on a page**:

```json
{
  "schemaVersion": 1,
  "findings": [
    { "id": "d2", "page": 5, "text": "Diabetic ketoacidosis without coma, type 2 diabetes",
      "type": "dx", "code": "E11.10", "desc": "Type 2 diabetes mellitus with ketoacidosis without coma",
      "status": "ai", "conf": 0.94, "note": "Why CLAIRE suggests it." }
  ]
}
```

- `text` must appear on that `page` of `record.md` exactly as the page shows it (after the formatting rules above), within one paragraph, line or list item. If a phrase appears more than once on the page, add `"occurrence": 2` for the second.
- A finding whose words are not found is left out, with a warning in the console naming its `id`.
- `type`: `dx`, `svc`, `mar` (text is the whole MAR row, cells joined with ` | `), or `doc` (with `docKind`).
- `status`: `ai` (to review) or `confirmed` (CLAIRE pre-accepted).
- The same code in several places: one finding per place, same `type` and `code`.
- No `findings.json`: the case opens with no findings, so its CLAIRE counts are zero and every intervention shows *Not found*. Interventions are worked out from `svc` and `mar` findings (and the claim), never written into the case: to see one, give CLAIRE a finding on the words that show it, e.g. a `svc` on "Placed on continuous cardiac monitoring". `src/data/reference/interventions.json` says what each intervention looks for.

The demo case's [findings.json](RC-2026-1187/findings.json) has an example of every type.

## case.json

`case`, `patient` and `encounter` as the record states them (the checkpoint bar compares them with the claim), `sourcePages` (which page each checked field is on), and `worklist`:

```json
"worklist": {
  "documentId": "MR-26-0048117",
  "status": "inProgress",
  "receivedDaysAgo": 12,
  "dueInDays": 18,
  "sessions": [{ "daysAgo": 2, "minutes": 7 }, { "daysAgo": 1, "minutes": 5 }]
}
```

`sessions` are review time before today (how many days ago, and minutes); both time charts on the home screen add them up, plus the time you spend in the workbench, which is saved in `review.json` by day. `status` is `new`, `inProgress` or `completed`. A completed case adds `"completedToday": "11:26"` (or `"completedDaysAgo": 2`). Dates are counted from today so the sample stays current. Copy a sample folder's `case.json` as a starting point.

## claim.json

The claim: `id`, `patient`, `dos`, `reasonDx`, `dx[]` (pointer, code, description) and `lines[]` (code, units, dx pointers, charge, paid code and units). See the samples.

## images/

Optional page scans named `page-001.png`, `page-002.png` … (PNG, JPEG or WebP). The number is the record page. With images, the original shows your scans in side-by-side view; without, the app draws a stand-in scan. The overlay view is turned off for cases with real images until OCR line boxes are supplied (DATA-SPEC §1.5).

## review.json: your work, saved

While you review (in `npm run dev`), every accept, reject, code change, moved evidence, comment, finding you add, completion and minute spent is saved to `review.json` in the case folder, half a second after the change. It holds only what differs from CLAIRE's `findings.json`, which is never changed. Reload and everything is back. The save status is next to the review status in the checkpoint bar.

- **Start over:** command palette (⌘K) → *Reset review* deletes `review.json`.
- **Edited record.md or findings.json since?** Saved work is matched by finding `id` and exact words; anything that no longer fits is left out and listed on hover of the save status.
- `review.json` is git-ignored. In a static build without the dev server, work is saved in the browser instead.

## extraction.json: extraction problems you flag

`record.md` is extracted from the original, and extraction can slip. While reviewing, select words and choose **⚑ Flag** (or right-click where something is missing, on the record or the original) and mark it **Formatting**, **Wrong data** or **Missed content**, with what the original shows, a comment and, if you like, a screenshot: **Capture from original** opens that page of the original at the flag so you can drag a box around what matters, or paste / drop an image. Flags are kept apart from the review, in `extraction.json` in the case folder, and never count toward the claim.

Full notes → *Extraction* lists them and downloads them as **PDF** (for people: each flag with your screenshot) or **JSON** (for tools: the same, the screenshot as a data URL). *Clear extraction flags* in the palette deletes the file.

## Checking your folders

`npm test` checks every case folder: that it has pages, that each finding's words are on its page, that MAR findings are whole MAR rows, and that finding ids are unique. A failure names the case and the finding.

## Reference data (all cases)

`src/data/reference/` holds what is shared by every case, also as JSON:

| File | Holds |
|---|---|
| `codes.json` | Codes the search offers when a reviewer changes or adds a code |
| `mdm.json` | MDM level of each diagnosis code, tests that count as Data, ECG and IV fluid codes, documentation kinds (placeholder criteria) |
| `interventions.json` | What counts as each ED intervention: codes, words (`pattern`, a regular expression) or MAR route (placeholder criteria) |
| `user.json` | The signed-in reviewer |

When a case uses a code these files do not know, add it here: an unknown diagnosis scores Low, and the code search will not offer it.
