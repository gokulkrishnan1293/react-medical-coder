# Builds timeline.json: every screen, click, drag, caption and voice line, timed from the narration lengths.
import json
d = json.load(open('vo/durs.json')); M = json.load(open('meta.json')); P = M['pos']
S = {int(k): v for k, v in M['steps'].items()}
T = dict(bg=[], mode=[], cam=[], cur=[], clicks=[], keys=[], reveals=[], caps=[], vo=[None]*len(d))
CAPS = [
 ('CLAIRE REVIEW', 'The case workbench for ED downcode reviews.'),
 ('CLAIRE REVIEW', 'CLAIRE suggests the codes. You decide.'),
 ('THE IDEA', 'Stay in the record. The rest comes to you.'),
 ('THE CASE', 'Every claim field, checked against the record.'),
 ('THE RECORD', 'Each finding is boxed where its evidence is.'),
 ('THE IDEA', 'The notepad follows the pages you’re reading.'),
 ('REVIEW', 'Confidence, reasoning and every place it’s documented.'),
 ('ACCEPT', 'Accept once. It covers every place.'),
 ('EDIT', 'Not quite right? Edit the finding.'),
 ('EDIT', 'Change evidence to the exact words.'),
 ('EDIT → ACCEPT', 'Comment, accept. Marked revised.'),
 ('ADD', 'Select words to add what CLAIRE missed.'),
 ('EXTRACTION', 'Flag what the extraction got wrong.'),
 ('SCREEN CAPTURE', 'Capture the evidence from the original scan.'),
 ('EXTRACTION', 'Kept apart from the review. PDF or JSON.'),
 ('THE ORIGINAL', 'The scan side by side, scrolling with the record.'),
 ('THE ORIGINAL', 'Or laid over the text, line by line.'),
 ('FOCUS', 'Spotlight the evidence. Or read it clean.'),
 ('FULL NOTES', 'Every finding in one table.'),
 ('FULL NOTES', 'Filter, then accept or reject from the row.'),
 ('FULL NOTES', 'Every claim line against the record.'),
 ('FULL NOTES', 'How each intervention was reached.'),
 ('GETTING AROUND', 'Every action in one place. <k>Ctrl</k> <k>K</k>'),
 ('FINISH', 'Then complete the review.'),
]
t = 0.0
def rect(r, px=0, py=None):
    py = px if py is None else py
    return [r['x'] - px, r['y'] - py, r['w'] + 2 * px, r['h'] + 2 * py]
def uni(*rs):
    x0 = min(r[0] for r in rs); y0 = min(r[1] for r in rs); x1 = max(r[0] + r[2] for r in rs); y1 = max(r[1] + r[3] for r in rs)
    return [x0, y0, x1 - x0, y1 - y0]
def bg(at, name): T['bg'].append([round(at, 3), name])
def tour(at, step): T['mode'].append([round(at, 3), step])          # step number, or None for no tour
def cam(at, r): T['cam'].append([round(at, 3), r])                 # r: [x,y,w,h] to frame, or 'step:N'
def click(at, x, y): T['cur'].append([round(at - 0.6, 3), None, None, 0]); T['cur'].append([round(at, 3), x, y, 0]); T['clicks'].append(round(at + 0.04, 3))
def dragc(t0, t1, a, b): T['cur'].append([round(t0 - 0.5, 3), None, None, 0]); T['cur'].append([round(t0, 3), a[0], a[1], 1]); T['cur'].append([round(t1, 3), b[0], b[1], 1]); T['cur'].append([round(t1 + 0.05, 3), b[0], b[1], 0]); T['clicks'].append(round(t0, 3))
def reveal(t0, t1, frm, to, r, mode): T['reveals'].append(dict(t0=round(t0, 3), t1=round(t1, 3), frm=frm, to=to, r=r, mode=mode))
def say(i, at):
    T['vo'][i] = round(at, 3)
    if i < len(CAPS): T['caps'].append([round(at - 0.05, 3), round(at + d[i] + 0.3, 3), *CAPS[i]])
    return at + d[i]
nb = lambda s, name='Next': next(b for b in S[s]['btns'] if b['t'] in (name, 'Start the tour'))
GAP, LEAD, BETWEEN = 0.3, 0.45, 0.3

# C0: welcome
bg(0, '0'); tour(0, 0); cam(0, 'hook')
e = say(0, 0.9); e = say(1, e + BETWEEN); e = say(2, e + BETWEEN)
def next_step(e, frm, to, name='Next'):
    b = nb(frm, name); at = e + GAP; click(at, b['x'] + 6, b['y'] + 4)
    bg(at, str(to)); tour(at, to); cam(at, f'step:{to}'); return at
for frm, to, li in [(0, 2, 3), (2, 4, 4), (4, 5, 5), (5, 6, 6)]:
    s = next_step(e, frm, to); e = say(li, s + LEAD)
# accept in the card
a = e + 0.25; click(a, P['accept6']['x'], P['accept6']['y']); bg(a + 0.05, '6b')
e = say(7, a + 0.4)

# C5: edit a finding, then accept it (no tour)
s = e + GAP; tour(s, None); bg(s, 'e0'); cam(s, rect(P['dialog'], 20))
e = say(8, s + LEAD)
c = s + LEAD + 1.3; click(c, P['chipSvc']['x'], P['chipSvc']['y']); bg(c + 0.05, 'e1')
ev = P['evCell']; h = s + LEAD + d[8] * 0.62
T['cur'].append([round(h - 0.6, 3), None, None, 0]); T['cur'].append([round(h, 3), ev['x'] + ev['w'] * 0.55, ev['y'] + ev['h'] * 0.5, 0]); bg(h + 0.1, 'e2')
cam(h, uni(rect(ev, 380, 120), [P['dialog']['x'], ev['y'] - 60, 10, 10]))
l9 = e + BETWEEN; c = l9 + 0.15; click(c, P['change']['x'], P['change']['y']); bg(c + 0.05, 'e3')
cam(c + 0.05, uni(rect(P['oldEv'], 60, 30), rect(P['banner'], 20), rect(P['selE'], 60)))
e = say(9, l9)
sel = P['selE']; d0 = l9 + d[9] * 0.45; d1 = d0 + 0.75
dragc(d0, d1, (sel['x'] + 1, sel['y'] + sel['h'] * 0.6), (sel['x'] + sel['w'] - 1, sel['y'] + sel['h'] * 0.6))
reveal(d0, d1, 'e3', 'e4', rect(sel, 4, 3), 'wipe'); reveal(d1 + 0.05, d1 + 0.3, 'e3', 'e4', rect(P['useBar'], 6), 'fade'); bg(d1 + 0.3, 'e4')
u = max(e - 0.2, d1 + 0.7); click(u, P['use']['x'], P['use']['y']); bg(u + 0.05, 'e5')
l10 = max(e, u) + BETWEEN + 0.1
c = l10; n = P['newEv']; click(c, n['x'] + 24, n['y'] + n['h'] / 2); bg(c + 0.05, 'e6')
cam(c + 0.05, uni(rect(P['card6'], 40), rect(n, 40)))
e = say(10, l10 + 0.3)
ty = c + 0.55
for j, k in enumerate(M['typedE']): bg(ty + j * 0.28, f'e7-{k}'); T['keys'] += [round(ty + j * 0.28 + q * 0.07, 3) for q in range(3)]
acc = max(ty + 1.4, l10 + 0.3 + d[10] * 0.42); click(acc, P['acceptE']['x'], P['acceptE']['y']); bg(acc + 0.05, 'e8')

# C6: add what CLAIRE missed (tour step 7)
s = e + GAP + 0.1; tour(s, 7); bg(s, '7a'); cam(s, 'step:7')
e = say(11, s + LEAD)
w = P['sel7']; d0 = s + LEAD + 1.0; d1 = d0 + 0.8
dragc(d0, d1, (w['x'] + 2, w['y'] + w['h'] * 0.6), (w['x'] + w['w'] - 2, w['y'] + w['h'] * 0.6))
reveal(d0, d1, '7a', '7', rect(w, 6, 3), 'wipe'); reveal(d1 + 0.08, d1 + 0.33, '7a', '7', rect(P['bar7'], 6), 'fade')
T['bar7grow'] = [round(d1 + 0.05, 3), round(d1 + 0.35, 3)]

# C7: flag an extraction problem (no tour)
s = e + GAP; tour(s, None); bg(s, 'x0'); sx = P['selX']; cam(s, uni(rect(sx, 380, 200), rect(P['barX'], 30)))
e = say(12, s + LEAD)
d0 = s + LEAD + d[12] * 0.58; d1 = d0 + 0.7
dragc(d0, d1, (sx['x'] + 1, sx['y'] + sx['h'] * 0.6), (sx['x'] + sx['w'] - 1, sx['y'] + sx['h'] * 0.6))
reveal(d0, d1, 'x0', 'x1', rect(sx, 4, 3), 'wipe'); reveal(d1 + 0.05, d1 + 0.3, 'x0', 'x1', rect(P['barX'], 6), 'fade'); bg(d1 + 0.3, 'x1')
f = d1 + 0.55; click(f, P['flag']['x'], P['flag']['y']); bg(f + 0.05, 'x2'); cam(f + 0.05, uni(rect(P['composer'], 40), rect(sx, 40)))
fm = max(f + 0.9, e - 0.3); click(fm, P['fmt']['x'], P['fmt']['y']); bg(fm + 0.05, 'x3')

# C8: capture from the original
l13 = max(e, fm + 0.3) + BETWEEN
c = l13 + 0.2; click(c, P['capture']['x'], P['capture']['y']); bg(c + 0.05, 'x4'); cam(c + 0.05, rect(P['capBox'], 260, 170))
e = say(13, l13)
cb = P['capBox']; d0 = l13 + d[13] * 0.62; d1 = d0 + 0.9
dragc(d0, d1, (cb['x'], cb['y']), (cb['x'] + cb['w'], cb['y'] + cb['h']))
reveal(d0, d1, 'x4', 'x5', rect(cb, 3), 'box'); bg(d1 + 0.02, 'x5')
uc = max(d1 + 0.6, e - 0.1); click(uc, P['useCap']['x'], P['useCap']['y']); bg(uc + 0.05, 'x6'); cam(uc + 0.05, rect(P['composer2'], 60))

# C9: flag it, then the extraction notes (tour step 10)
l14 = max(e, uc) + BETWEEN + 0.1
fi = l14 + 0.1; click(fi, P['flagIt']['x'], P['flagIt']['y']); bg(fi + 0.05, 'x7'); cam(fi + 0.05, uni(rect(sx, 420, 220)))
e = say(14, l14 + 0.2)
s = l14 + 0.2 + d[14] * 0.42; tour(s, 10); bg(s, '10'); cam(s, 'step:10')

# C10..: the rest of the tour
def step_ch(e, frm, to, li, name='Next', btn=None):
    if btn: at = e + GAP; click(at, *btn); bg(at, str(to)); tour(at, to); cam(at, f'step:{to}')
    else: at = next_step(e, frm, to, name)
    return say(li, at + LEAD), at
e, _ = step_ch(e, 10, 14, 15)
e, _ = step_ch(e, 14, 15, 16)
e, _ = step_ch(e, 15, 16, 17)
e, s18 = step_ch(e, 16, 18, 18)
l19 = e + BETWEEN; e = say(19, l19)
c = l19 + 0.5; click(c, P['chipMar']['x'], P['chipMar']['y']); bg(c + 0.05, '18m')
c = l19 + d[19] * 0.72; click(c, P['rowAccept']['x'], P['rowAccept']['y']); bg(c + 0.05, '18a')
e, _ = step_ch(e, 18, 19, 20, btn=(998, 84))
e, _ = step_ch(e, 19, 20, 21, btn=(1078, 84))
s = e + GAP; T['keys'] += [round(s - 0.2, 3), round(s - 0.1, 3)]; bg(s, '21'); tour(s, 21); cam(s, 'step:21')
e = say(22, s + LEAD)
ty = s + LEAD + d[22] * 0.52
for j, k in enumerate(M['typedP']): bg(ty + j * 0.12, f'21-{k}'); T['keys'].append(round(ty + j * 0.12, 3))
e, _ = step_ch(e, 21, 22, 23)
T['out'] = round(e + 0.5, 3)
say(24, T['out'] + 1.0)
T['end'] = round(T['vo'][24] + d[24] + 1.2, 3)
T['nocard'] = [18, 19, 20]
for k in ('bg', 'mode', 'cam', 'cur'): T[k].sort(key=lambda x: x[0])
T['clicks'].sort(); T['keys'].sort()
json.dump(T, open('timeline.json', 'w'))
print('end', T['end'], 'out', T['out'], 'bg', len(T['bg']), 'clicks', len(T['clicks']))
