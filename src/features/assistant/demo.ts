import { CASE, CLAIM_CODES, PAGES } from '@/data';
import { groupPlaces, sortByReading, tallyReview, useFindingsStore } from '@/features/findings';
import type { Quote } from './store';

/*
 * Stand-in answers while the assistant service is not connected (server/assistantApi.ts has no credentials, or no
 * dev server). Built from the open case and the screen's own help, so the chat can be tried end to end.
 */

const HOWTO: [RegExp, string][] = [
  [/\b(add|missed|missing|new finding)\b/i, 'Select the words in the record, then pick **Diagnosis**, **Service**, **MAR**, **Doc** or **Note** in the bar that appears above them. Right-clicking the selection offers the same choices. A MAR row is always taken whole.'],
  [/\b(flag|extraction|wrong data|formatting)\b/i, 'Select the words and choose **⚑ Flag**, then mark it Formatting, Wrong data or Missed content and say what the original shows. For something missing, right-click the spot and choose **Flag missing content here**. Flags are saved apart from the review and never count toward the claim.'],
  [/\b(accept|reject|decide|undo)\b/i, 'Click a boxed finding (or press `J` / `K` to step through them) and press `A` to accept or `R` to reject. One decision covers every place the code is documented. `⌘Z` / `Ctrl+Z` undoes it.'],
  [/\b(original|scan|overlay|side by side|compare)\b/i, 'The three buttons at the top right of the record choose how the original scan shows: reading, side by side, or overlay. `O` cycles them. In overlay, drag the handle (or use ← →) and hold `Space` to see the whole scan.'],
  [/\b(notepad|notes)\b/i, 'The notepad waits in the **Notes** bubble at the bottom right; press `N` to open or minimize it, `D` to dock it. **Full notes** (`F`) shows every finding, the claim against the record, and interventions.'],
  [/\b(complete|finish|submit|done)\b/i, 'Use **Complete review** at the top right, with a closing comment. You are warned about AI suggestions still unreviewed and claim fields not verified. A completed review is read-only until reopened.'],
  [/\b(spotlight|clean read|focus)\b/i, '**Spotlight** (`S`) dims everything except marked evidence; **Clean read** (`C`) hides every mark so you read the record as written.'],
  [/\b(shortcut|keyboard|keys)\b/i, '`J` / `K` next / previous finding · `A` accept · `R` reject · `N` notepad · `F` full notes · `S` spotlight · `C` clean read · `O` original view · `Q` ask CLAIRE · `?` tour · `⌘K` command palette.'],
];

function summary() {
  const findings = sortByReading(useFindingsStore.getState().findings);
  const t = tallyReview(findings);
  const onClaim = groupPlaces(findings).filter(({ lead }) => lead.code && CLAIM_CODES.has(lead.code)).length;
  return `**${CASE.id}** is a ${CASE.stage.toLowerCase()} from ${CASE.payer}: billed \`${CASE.billed}\`, paid \`${CASE.paid}\`. The record runs ${PAGES.length} page${PAGES.length === 1 ? '' : 's'}. CLAIRE found ${findings.length} places across ${groupPlaces(findings).length} codes and notes, ${onClaim} of them on the claim. So far: ${t.accepted} accepted, ${t.rejected} rejected, ${t.pending} still to review, ${t.added} added by you.`;
}

function pending() {
  const rows = groupPlaces(sortByReading(useFindingsStore.getState().findings)).filter(({ places }) => places.some((p) => p.status === 'ai'));
  if (!rows.length) return 'Nothing is left: every CLAIRE suggestion has a decision. Check the claim fields in the patient strip, then **Complete review**.';
  return `${rows.length} still to review:\n\n${rows.slice(0, 8).map(({ lead }) => `- \`${lead.code ?? lead.type}\` ${lead.desc ?? ''} (page ${lead.page})`).join('\n')}\n\nPress \`J\` to go to the first one.`;
}

export function demoAnswer(question: string, quote?: Quote): string {
  const note = '\n\n*Demo answer: the assistant service is not connected yet.*';
  if (quote) {
    const f = useFindingsStore.getState().findings.find((x) => x.page === quote.page && (x.text.includes(quote.text) || quote.text.includes(x.text)));
    const about = f
      ? `These words on page ${quote.page} are evidence for \`${f.code ?? f.type}\` ${f.desc ?? ''}${f.note ? `: ${f.note}` : ''}.`
      : `CLAIRE has no finding on these words (page ${quote.page}). If they support a code, select them and choose **+ Diagnosis**, **+ Service** or **+ Doc**.`;
    return about + note;
  }
  if (/\b(summar|overview|about this case|dispute|downcode)\b/i.test(question)) return summary() + note;
  if (/\b(left|remaining|pending|still|next)\b/i.test(question)) return pending() + note;
  if (/\b(support|level|billed|mdm|overturn|uphold)\b/i.test(question)) {
    return `The claim was billed at \`${CASE.billed}\` and paid at \`${CASE.paid}\`. Open **Full notes → Claim** (\`F\`) for the score card: it shows the MDM level your accepted findings support against what was billed.` + note;
  }
  const how = HOWTO.find(([re]) => re.test(question));
  if (how) return how[1] + note;
  return 'I can answer questions about this case (try "Summarise this case" or "What is left to review?") and about using the screen (adding findings, flags, the original scan, shortcuts). Select words in the record and choose **Ask** to ask about them.' + note;
}

/** Hand the answer over a few words at a time, as the service would. */
export async function streamDemo(text: string, onText: (chunk: string) => void, signal: AbortSignal) {
  const parts = text.match(/\S+\s*/g) ?? [text];
  for (const p of parts) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    onText(p);
    await new Promise((r) => setTimeout(r, 18));
  }
}
