import { ui, useUiStore } from '@/stores/uiStore';
import { evidenceEl, pageEl } from '@/lib/dom';
import { prefersReducedMotion, scrollBehavior } from '@/lib/utils';

/* Moving around the record: jump to evidence, hover and pin evidence cards. */

let cardTimer: ReturnType<typeof setTimeout> | undefined;

export function flash(id: string, ms = 1300) {
  ui().set({ flashId: id });
  setTimeout(() => { if (ui().flashId === id) ui().set({ flashId: null }); }, ms);
}

export function jumpTo(id: string, openCard = true) {
  ui().set({ activeId: id });
  const el = evidenceEl(id);
  if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
  flash(id);
  if (openCard) setTimeout(() => ui().set({ card: { id, pinned: true } }), prefersReducedMotion() ? 0 : 420);
}

export function goPage(n: number) {
  pageEl(n)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
}

export function hoverEvidence(id: string) {
  const { card, set } = ui();
  set({ hoverId: id });
  clearTimeout(cardTimer);
  if (card?.pinned && card.id !== id) return;
  cardTimer = setTimeout(() => {
    const c = ui().card;
    if (!c?.pinned) ui().set({ card: { id, pinned: false } });
  }, 140);
}

export function leaveEvidence() {
  ui().set({ hoverId: null });
  scheduleCardClose();
}

export function scheduleCardClose() {
  clearTimeout(cardTimer);
  cardTimer = setTimeout(() => {
    const c = ui().card;
    if (c && !c.pinned) ui().set({ card: null });
  }, 240);
}

export const keepCardOpen = () => clearTimeout(cardTimer);

export function pinEvidence(id: string) {
  const ws = window.getSelection();
  if (ws && !ws.isCollapsed) return;
  ui().set({ activeId: id, card: { id, pinned: true } });
}

export const closeCard = () => useUiStore.setState({ card: null });
