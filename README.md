# CLAIRE Review Workbench (prototype)

Payer-side review screen for E/M and ER downcode reconsiderations and appeals. The coder reads the formatted medical record, checks CLAIRE's AI findings (diagnoses, services, MAR, interventions) against the claim, and decides whether the downcode is upheld or overturned.
All patient data is synthetic.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run typecheck
npm run build      # production build to dist/
```

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion · zustand · Vitest

## Structure

```
src/
├─ app/                 App shell (layout + floating layers)
├─ components/ui/       Shared building blocks: Button, IconButton, Icon, Kbd, Modal, SegmentedTabs, StatusChip
├─ features/            One folder per business function; import through each folder's index.ts
│  ├─ case-header/      Case header (stage, billed → paid, deadline, view controls) and patient strip
│  ├─ claim/            Claim from ERDM checked against the record: supported, units, not found, not on claim
│  ├─ record-viewer/    Record pages, evidence boxes, evidence card, minimap, scroll sync
│  ├─ add-finding/      Select text → add diagnosis / service / MAR / note (MAR rows are taken whole)
│  ├─ findings/         Findings store (accept, reject, add, comment, undo), MDM scoring, shared finding UI
│  ├─ notepad/          Half view: floating / docked / minimized; Findings cards and Claim tabs
│  ├─ full-notes/       Full view: all findings (type/status filters, comments) and claim tables
│  ├─ command-palette/  ⌘K
│  └─ shortcuts/        Global keyboard shortcuts and navigation actions
├─ data/                Synthetic ED case: patient, encounter, ERDM claim, record with MAR, CLAIRE findings
├─ hooks/               useMediaQuery, useScrollTick
├─ lib/                 cn, clamp, shared refs, fly-to-notes animation
├─ stores/              Cross-feature UI state
├─ types/               Domain types
└─ styles/globals.css   Tailwind + design tokens (light and dark)
```

Finding types have their own colours (`text-t-dx`, `text-t-svc`, `text-t-mar`, `text-t-int`), separate from review status.

Colours are tokens on `:root` exposed to Tailwind (`bg-paper`, `text-ink-2`, `border-line`, `text-ai`…). Status colours come from `.st-ai / .st-confirmed / .st-added / .st-rejected` and are used as `text-st`, `bg-st-fill`, `border-st`.

## Docs

- [Product spec](docs/specs/product-spec.md): written for the earlier provider-side prototype; being rewritten for the payer workflow
- [Checkpoint bar spec](docs/specs/checkpoint-bar.md): superseded; the bar was replaced by the patient strip
