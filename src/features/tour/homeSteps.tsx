import type { TourStep } from './steps';

const at = (...s: string[]) => () => s;

/** The home screen walkthrough: what each part tells you, before you open a case. */
export const HOME_STEPS: TourStep[] = [
  {
    id: 'home-welcome',
    section: 'Home',
    title: 'Your home screen',
    body: (
      <>
        Everything before you open a case: where your day stands, how CLAIRE's suggestions are going, where your time went, and your cases.
        <span className="mt-2 block">About a minute. Each case has its own tour of the review workbench.</span>
      </>
    ),
  },
  {
    id: 'home-summary',
    section: 'Today',
    title: 'Where you stand',
    body: 'How many of your cases are completed, in progress and still to do. It follows your work: finishing a review moves it to completed straight away.',
    targets: at('[data-tour="home-summary"]'),
    placement: 'below',
  },
  {
    id: 'home-cards',
    section: 'CLAIRE',
    title: "What happened to CLAIRE's suggestions",
    body: (
      <>
        Across all your cases, counted per code: <b className="font-semibold text-ink">To review</b> first, then what you
        <b className="font-semibold text-ink"> accepted</b> as suggested, <b className="font-semibold text-ink">modified</b> (code changed
        or evidence moved) or <b className="font-semibold text-ink">rejected</b>. <b className="font-semibold text-ink">Added by you</b> is
        the codes CLAIRE missed. The bars show each share, and the counts move as you review.
      </>
    ),
    targets: at('section[aria-labelledby="claire-title"]'),
    placement: 'below',
  },
  {
    id: 'home-days',
    section: 'Time',
    title: 'Time spent by day',
    body: "Your review time over the last 14 days. It adds up each case's review sessions and the time you spend in the workbench, saved by day. Hover a bar for the exact time, or open the numbers as a table.",
    targets: at('section[aria-labelledby="days-title"]'),
    placement: 'below',
  },
  {
    id: 'home-find',
    section: 'Your cases',
    title: 'Find a case',
    body: 'Search by case, patient, document number or claim number, and narrow the list by status. The search and view stay in the address, so a refresh or the back button keeps them.',
    targets: at('[data-tour="home-find"]'),
    placement: 'below',
    keys: [[['/'], 'Search'], [['Esc'], 'Clear the search']],
  },
  {
    id: 'home-table',
    section: 'Your cases',
    title: 'Your cases',
    body: "Each case with its document and claim numbers, the downcode, its status and CLAIRE's counts for that case. Open starts a review, Continue picks one up, View opens a completed review, read-only until you reopen it.",
    targets: at('[data-tour="home-table"]'),
  },
  {
    id: 'home-today',
    section: 'Today',
    title: 'Completed today, and where you left off',
    body: 'What you finished today and your average time on it, then the reviews you have started, one click from where you stopped.',
    targets: at('aside[aria-label="Today"]'),
  },
  {
    id: 'home-time',
    section: 'Time',
    title: 'Time per case',
    body: 'The same time, split by case, longest first. The case you are reviewing counts up while it is open.',
    targets: at('section[aria-labelledby="time-title"]'),
  },
  {
    id: 'home-tools',
    section: 'Settings',
    title: 'Theme and this tour',
    body: 'Switch between the system theme, light and dark; your choice is remembered in this browser. Take this tour again from here, or press ?.',
    targets: at('[data-tour="home-tools"]', '[data-tour="home-tools-narrow"]'),
    placement: 'below',
  },
  {
    id: 'home-done',
    section: 'Next',
    title: 'Open a case',
    body: 'Pick a case to review. Inside it, the Tour button shows the workbench: the record, CLAIRE\'s findings, the original scan, the notepad and completing the review.',
  },
];
