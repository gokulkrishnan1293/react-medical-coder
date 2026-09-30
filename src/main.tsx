import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { router } from '@/app/router';
import { loadAndAutosave } from '@/api';
import '@/styles/globals.css';

// the saved review is in the stores before anything draws, so the screen never shows CLAIRE's state first
loadAndAutosave().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
