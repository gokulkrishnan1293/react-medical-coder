# Spec: Review checkpoint bar

| | |
|---|---|
| **Status** | Draft. Describes the prototype as built (commit `e8f3b47`) plus open decisions. |
| **Component** | `src/features/checkpoints/`; scoring in `summarize()` (`src/features/findings/utils/mdm.ts`) |
| **Screen** | Appeal review workbench, directly under the case header |

## 1. Purpose

The checkpoint bar tells the coder, at any moment, whether the medical record supports the level of service that was billed. It turns the E/M medical decision making (MDM) rules into a short checklist that updates as the coder accepts, rejects or adds findings.

It answers three questions without opening any panel:

1. Which MDM elements are met, and at what level?
2. What visit code does the confirmed evidence support right now, compared with what was billed?
3. What review work is left (findings from other visits, AI suggestions not yet reviewed)?

## 2. Background: MDM levelling

Office visit codes 99212–99215 can be levelled on MDM. MDM has three elements, and each is scored Straightforward, Low, Moderate or High:

| Element | Measures |
|---|---|
| Problems | Number and complexity of problems addressed |
| Data | Amount and complexity of data reviewed and analysed |
| Risk | Risk of complications of patient management |

The visit level is the **second-highest** of the three element levels, which means 2 of 3 elements must meet or exceed a level:

| Overall MDM | Code |
|---|---|
| Straightforward | 99212 |
| Low | 99213 |
| Moderate | 99214 |
| High | 99215 |

## 3. Layout

```
[3/6 · 99215 needs 2 of 3 at High] (✓ Problems High) (◐ Data Low [AI has more]) (○ Risk Moderate) (○ Level 99214 of 99215) (○ Date of service 1 from another visit) (◐ AI review 4 of 12)
```

- Full-width strip between the case header and the record.
- **Lead text** (left): count of met checkpoints out of total, plus the rule for the billed code.
- **Pills**, in this order: Problems, Data, Risk, Level, Date of service, AI review.
- Each pill has a state icon, a label, a current value, and optionally an "AI has more" tag.
- On narrow screens the strip scrolls horizontally and the lead text is hidden. The page itself never scrolls sideways.

## 4. Which evidence counts

A finding counts toward a checkpoint only when all of these are true:

- `status` is `confirmed` (AI suggestion the coder accepted) or `added` (the coder marked it).
- It is not from a different date of service (`outsideDos` is false).
- It carries an MDM tag (`mdm.el` is `problems`, `data` or `risk`).

AI suggestions (`status: ai`) **never** count toward the met state. They only drive the partial state (section 5). Rejected findings never count.

## 5. Pill states

| State | Icon | When |
|---|---|---|
| **Met** | Filled green circle with a check; pill tinted green | The pill's condition in section 6 is true |
| **Partial** | Half-filled blue circle | Not met, but including pending AI suggestions would raise the value (MDM pills), or some but not all AI suggestions are reviewed (AI review pill) |
| **Open** | Dashed grey ring | Not met and not partial |

- The **"AI has more"** tag appears only on the Problems, Data and Risk pills when they are in the partial state.
- A pill turning met plays a short pop animation on its icon. It is disabled under `prefers-reduced-motion`.

## 6. Pill definitions

### 6.1 Problems
- **Value:** highest `mdm.level` among counted Problems findings (default Straightforward).
- **Met:** value is High.
- **Partial:** the same calculation including pending AI suggestions gives a higher level.
- **Click:** jumps to the first Problems finding in the record and opens its evidence card.

### 6.2 Data
- **Value:** derived from the categories of counted Data findings:
  - Category 1: each unique test ordered, test result reviewed, or external note reviewed (one item per finding).
  - Category 2: independent interpretation of a test.
  - Category 3: discussion of management with an external physician.
  - A category is satisfied when Cat 1 has 3 or more items, or when a Cat 2 or Cat 3 finding exists.
  - High = 2 or more categories satisfied; Moderate = 1; Low = 2 Cat 1 items; otherwise Straightforward.
- **Met:** value is Moderate or higher.
- **Partial:** including pending AI suggestions gives a higher level.
- **Click:** jumps to the first pending AI Data suggestion. If there is none, jumps to the first Data finding.

### 6.3 Risk
- **Value:** highest `mdm.level` among counted Risk findings.
- **Met:** value is High.
- **Partial:** including pending AI suggestions gives a higher level.
- **Click:** jumps to the first Risk finding at the current Risk level.

### 6.4 Level
- **Value:** `<supported code> of <billed code>`, e.g. `99214 of 99215`. The supported code comes from the overall MDM (section 2) using counted evidence only.
- **Met:** the supported code equals the billed code.
- **Click:** opens Full notes on the Claim worksheet tab.

### 6.5 Date of service
- **Value:** `Clear`, or `N from another visit`, where N is the number of findings from other dates of service that are not rejected.
- **Met:** N is 0.
- **Click:** jumps to the first such finding. Its evidence card explains that it can't support this claim.

### 6.6 AI review
- **Value:** `<reviewed> of <total>`, where total is every finding with `source: ai` and reviewed is those whose status is no longer `ai`.
- **Met:** no AI suggestions are pending.
- **Partial:** at least one is reviewed but some are still pending.
- **Click:** jumps to the next pending AI suggestion after the active finding, wrapping around.

## 7. Behaviour

- The bar recalculates on every change to findings: accept, reject, restore, coder add, and undo.
- It is a view of the findings only. It stores no state of its own.
- The lead count equals the number of met pills.
- Every pill is a `<button>` inside `<nav aria-label="Review checkpoints">` and is keyboard focusable. The state is conveyed by the icon and the value text, not by colour alone.

## 8. Acceptance criteria (demo record)

| # | Given | When | Then |
|---|---|---|---|
| 1 | Initial load | — | Problems High (met), Data Low (partial), Risk Moderate (open), Level `99214 of 99215` (open), Date of service `1 from another visit` (open), AI review `4 of 12` (partial). Lead shows `1/6` |
| 2 | Initial load | Coder accepts the BMP order (page 3) | Data becomes Moderate and met; Level stays `99214 of 99215` |
| 3 | Initial load | Coder selects "Discussed direct hospital admission" (page 4) and adds it as Risk · Decision regarding hospitalization | Risk becomes High and met; Level becomes `99215 of 99215` and met |
| 4 | Pneumonia suggestion on page 6 pending | Coder rejects it | Date of service shows `Clear` and is met; AI review count goes up by 1 |
| 5 | Any accepted AI finding | Coder presses ⌘Z | All pills return to their previous values |
| 6 | Any state | Coder clicks a pill | The record scrolls to the matching evidence (or the worksheet opens for Level) |

## 9. Known gaps and open decisions

1. **Billed code is hard-coded.** The lead text says "99215 needs 2 of 3 at High" regardless of the case. It should be generated from the billed code (e.g. 99214 → "needs 2 of 3 at Moderate").
2. **Data "met" threshold.** Data is marked met at Moderate, even though 99215 can be met without it (Problems + Risk at High). Decide whether met thresholds should follow the billed level, or whether Data should show "not required" when the other two elements already carry the level.
3. **Time-based levelling is not in the bar.** The record's total time (34 minutes) is only shown as a finding. Consider a Time pill, or a note in the Level pill when time supports a higher level than MDM.
4. **Only established office visits (99212–99215).** New patient codes (99202–99205), hospital, ED and other E/M families need their own rules.
5. **Data scoring is simplified.** The independent-historian path for Low and the "unique source" rules for Category 1 are not modelled.
6. **Distinct problems are not tracked.** Problems uses the single highest-rated finding. Levels that depend on counting several problems (e.g. two or more stable chronic illnesses for Moderate) need a problem grouping model.
7. **Payer-specific rules.** Some payers apply their own E/M scoring. Decide whether rules are configurable per payer.
8. **Pill set is fixed.** Consider hiding pills that don't apply to the case type, and letting teams reorder them.
