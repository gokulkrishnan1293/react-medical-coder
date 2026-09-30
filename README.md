# CLAIRE Review Workbench (prototype)

A review screen for coders working ED and E/M downcode reconsiderations. The coder reads the medical record, checks CLAIRE's AI findings against the claim, marks what the AI missed, and decides whether the record supports the billed level. MDM and ED interventions are derived from the findings, so the case updates as the coder works.

All patient data is synthetic. The full spec, rules and decision log are in **[docs/SPEC.md](docs/SPEC.md)**.

![Workbench](docs/screenshots/01-workbench.png)

## Tour

### Checkpoint bar
Claim number, then patient, DOB, age, date of service and reason for visit, each checked against the claim: ✓ verified, ≠ mismatch, ! invalid. Hover an indicator for the claim and record values. The right side holds the review status and **Complete review**.

![Checkpoint bar](docs/screenshots/08a-checkpoint-bar.png)

Completing the review warns about open work and takes a closing comment. Afterwards it can be reopened.

![Complete review](docs/screenshots/08b-complete-review.png)

### Evidence on the page
Every finding is boxed on the exact words, with its code and derived MDM tag. Hover or click for the card: status, AI confidence, MDM, quote, where it goes, comment, and actions (accept, reject, remove, change evidence).

![Evidence card](docs/screenshots/02-evidence-card.png)

### Mark what the AI missed
Select words and add a diagnosis, service, MAR entry, documentation (code-less statements such as a decision to admit) or note. The code search is pre-filled from the selection.

![Selection toolbar](docs/screenshots/03a-selection-toolbar.png)
![Add finding](docs/screenshots/03b-add-finding.png)

### Right-click menu
Add from a selection, copy, zoom, jump to the same spot in the original, and switch views.

![Right-click menu](docs/screenshots/04-context-menu.png)

### Compare with the original scan
Three views of the original PDF/TIFF pages. `O` cycles through them; `Esc` returns to reading.

**Reading:** a stack of the originals in the margin, plus grips on the page edges.

![Reading view with stack and grips](docs/screenshots/07-reading-stack-grips.png)

**Side by side:** the scan in its own column, scroll-locked to the record, with its own zoom.

![Side by side](docs/screenshots/05-side-by-side.png)

**Overlay:** the scan laid over the extracted text on the same page. Drag the divider (or a page-edge grip), use ← →, or hold Space to see the whole scan.

![Overlay slider](docs/screenshots/06-overlay-slider.png)

### Change the evidence
Point a finding at different words: pick **Change evidence**, select the right text, and confirm.

![Change evidence](docs/screenshots/14-change-evidence.png)

### Notepad
Floating, docked or minimised, with Findings, Claim and Interventions tabs.

![Notepad interventions](docs/screenshots/09-notepad-interventions.png)

### Full notes (`F`)
**Findings:** filter by type and status, AI confidence, and evidence. Codes on the claim are locked; other codes can be edited in place.

![Full notes findings](docs/screenshots/10-full-notes-findings.png)
![Edit a code](docs/screenshots/11-edit-code.png)

**Claim:** each billed line and diagnosis checked against the record.

![Claim](docs/screenshots/12-full-notes-claim.png)

**Interventions:** how each intervention was derived, drawn as a flowchart. It runs from the findings and claim lines, through the rule conditions, to the intervention and the ED level. Click a finding to see it in the record.

![Interventions flow](docs/screenshots/13-interventions-flow.png)

### Keyboard
`J`/`K` next/previous finding · `A` accept · `R` reject (removes a coder-added finding) · `N` notepad · `F` full notes · `S` spotlight · `C` clean read · `O` original views · `+` `−` `0` zoom · `⌘K`/`Ctrl+K` palette · `⌘Z`/`Ctrl+Z` undo. The modifier follows the platform. Full list in [SPEC §6.11](docs/SPEC.md#611-keyboard-and-commands).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run typecheck
npm run build      # production build to dist/
```

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion · zustand · React Flow (`@xyflow/react`) · Vitest

## Structure

```
server/                Dev-server endpoint that saves review.json into the case folder
src/
├─ app/                 Router (home, case), workbench shell (layout + floating layers)
├─ components/ui/       Shared building blocks: Button, Icon, Kbd, Modal, HoverTip, SegmentedTabs, StatusChip, Table
├─ features/            One folder per business function; import through each folder's index.ts
│  ├─ case-header/      Header, checkpoint bar, claim-vs-record field checks
│  ├─ review/           Review status and Complete review
│  ├─ record-viewer/    Record pages, overlay pages and page-edge grips, evidence boxes and card, minimap
│  ├─ source-view/      Original pages: margin stack, side-by-side column, view switching, scroll sync
│  ├─ zoom/             Per-column zoom, fit width, wheel/pinch/keys
│  ├─ doc-menu/         Right-click menu
│  ├─ add-finding/      Select text → add a finding; change a finding's evidence
│  ├─ findings/         Findings store (accept, reject, add, remove, edit code, move evidence, undo), MDM scoring
│  ├─ interventions/    Derived interventions, their paths, notepad list and React Flow chart
│  ├─ claim/            Claim lines and diagnoses checked against the record
│  ├─ notepad/          Floating / docked / minimised notepad
│  ├─ full-notes/       Findings table, claim tables, interventions tab
│  ├─ command-palette/  ⌘K / Ctrl+K
│  ├─ worklist/         Home screen: CLAIRE's suggestions accepted / modified / rejected / to review, your cases with search, today
│  ├─ shortcuts/        Global keyboard shortcuts
│  └─ tour/            Guided tours over the live screen: one for Home, one for the case workbench (Tour button, ?, or ?tour in the URL)
├─ api/                 The only data access: load and autosave the review (review.json via the dev server, or the browser)
├─ data/                Readers for case folders (cases/<id>/: case, claim, record.md, findings, images) and reference JSON (codes, MDM, interventions, user)
├─ hooks/               useMediaQuery, useScrollTick
├─ lib/                 Document positions, platform keys, shared refs, helpers
├─ stores/              Cross-feature UI state
├─ types/               Domain types
└─ styles/globals.css   Tailwind + design tokens (light and dark)
```

The MDM and intervention rule tables in `src/data/` are **placeholders** until they're replaced with the team's criteria (see [SPEC §11](docs/SPEC.md#11-open-questions-and-known-gaps)).

Colours are tokens on `:root` exposed to Tailwind (`bg-paper`, `text-ink-2`, `border-line`, `text-ai`…). Status colours come from `.st-ai` / `.st-confirmed` / `.st-added` / `.st-rejected` and are used as `text-st`, `bg-st-fill` and `border-st`. Finding types have their own colours (`text-t-dx`, `text-t-svc`, `text-t-mar`).

## Docs

- [docs/SPEC.md](docs/SPEC.md): the single spec, covering the domain model and rules, every feature, the data model, architecture, open questions and the decision log.
- [docs/screenshots/](docs/screenshots/): the screenshots in this README, taken from the running app.
