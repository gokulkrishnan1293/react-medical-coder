# Appeal Review Workbench (prototype)

Clickable React prototype of a provider-side coder workspace for E&M downcode reconsiderations and appeals.
All patient data is synthetic.

- `src/app.jsx` — React UI (record viewer, evidence boxes, floating/dockable notepad, minimap, checkpoints, full notes, command palette)
- `src/data.js` — synthetic record pages, AI findings, code dictionary, MDM descriptors
- `src/style.css` — styles (light + dark)
- `build.sh` — compiles JSX with esbuild and assembles `build/appeal-review.html` (single self-contained page; React loaded from cdnjs)

Build: `npm install && bash build.sh`
