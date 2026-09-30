import type { MdmOption } from '@/types';

/* MDM descriptors offered when a coder marks an MDM element. */

export const MDM_OPTIONS: MdmOption[] = [
  { el: 'risk', level: 3, label: 'Decision regarding hospitalization', kw: ['admission', 'admit', 'hospital', 'hospitalization', 'inpatient'] },
  { el: 'risk', level: 3, label: 'Drug therapy requiring intensive monitoring for toxicity', kw: ['toxicity', 'intensive monitoring'] },
  { el: 'risk', level: 2, label: 'Prescription drug management', kw: ['start', 'resume', 'hold', 'mg', 'units', 'prescri', 'titrate'] },
  { el: 'problems', level: 3, label: 'Chronic illness with severe exacerbation', kw: ['severe', 'uncontrolled', 'exacerbation'] },
  { el: 'problems', level: 3, label: 'Illness that poses a threat to life or bodily function', kw: ['threat', 'life-threatening'] },
  { el: 'problems', level: 2, label: 'Chronic illness with exacerbation or progression', kw: ['progression', 'worsening', 'worse'] },
  { el: 'data', cat: 1, label: 'Review of prior external note', kw: ['reviewed', 'records', 'summary', 'discharge'] },
  { el: 'data', cat: 1, label: 'Review of result of unique test', kw: ['result', 'resulted'] },
  { el: 'data', cat: 1, label: 'Ordering of unique test', kw: ['ordered', 'order'] },
  { el: 'data', cat: 2, label: 'Independent interpretation of a test', kw: ['interpret', 'independent'] },
  { el: 'data', cat: 3, label: 'Discussion of management with external physician', kw: ['discussed with dr', 'spoke with', 'discussed with'] },
];
