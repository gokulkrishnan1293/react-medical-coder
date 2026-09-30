import { Navigate, createBrowserRouter } from 'react-router';
import { HomePage } from '@/features/worklist';
import { CaseRoute } from './CaseRoute';

/** Home (CLAIRE counts, worklist, today) and the review workbench for one case. */
export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/cases/:caseId', element: <CaseRoute /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
