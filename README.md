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
│  ├─ case-header/      Case identity, billed → paid, deadline, view controls
│  ├─ checkpoints/      MDM progress pills
│  ├─ record-viewer/    Record pages, evidence boxes, evidence card, minimap, scroll sync
│  ├─ add-finding/      Select text → add diagnosis / procedure / MDM / note
│  ├─ findings/         Findings store (accept, reject, add, undo), MDM scoring, shared finding UI
│  ├─ notepad/          Floating / docked / minimized notepad
│  ├─ full-notes/       Full view: findings table and claim view
│  ├─ command-palette/  ⌘K
│  └─ shortcuts/        Global keyboard shortcuts
├─ data/                Synthetic demo case (to be replaced by CLAIRE / claim data)
├─ hooks/               useMediaQuery, useScrollTick
├─ lib/                 cn, clamp, shared refs, fly-to-notes animation
├─ stores/              Cross-feature UI state
├─ types/               Domain types
└─ styles/globals.css   Tailwind + design tokens (light and dark)
```

Colours are tokens on `:root` exposed to Tailwind (`bg-paper`, `text-ink-2`, `border-line`, `text-ai`…). Status colours come from `.st-ai / .st-confirmed / .st-added / .st-rejected` and are used as `text-st`, `bg-st-fill`, `border-st`.

## Docs

- [Product spec](docs/specs/product-spec.md): written for the earlier provider-side prototype; being rewritten for the payer workflow
- [Checkpoint bar spec](docs/specs/checkpoint-bar.md)
