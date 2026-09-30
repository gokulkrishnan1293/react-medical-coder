/* Everything the app reads about cases and reference data. Case data comes from src/data/cases/, reference data from src/data/reference/. */
export { CASE, PATIENT, ENCOUNTER, SOURCE_PAGES, CLAIM, CLAIM_CODES, PAGES, BLOCKS, PRINT_FOOTER, marCells, locate, INITIAL_FINDINGS } from './current';
export { CODES, DOC_KINDS, mdmOf, INTERVENTION_RULES, ME, REVIEWERS, reviewerById, type InterventionRule, type Condition } from './reference';
export { PAGE_IMAGES, PAGE_LAYOUT, PAGE_W, PAGE_H, SCAN_FONT, HAS_SCANS, OVERLAY_AVAILABLE, type LayoutLine } from './pageImages';
export { WORKLIST, minutesByDay } from './worklist';
export { CASE_FOLDERS, CURRENT_CASE_ID, DEFAULT_CASE_ID, type RawFinding } from './caseFolders';
