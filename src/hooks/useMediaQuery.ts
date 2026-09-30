import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const h = () => setMatch(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, [query]);
  return match;
}

export const NARROW_QUERY = '(max-width: 760px)';
export const useNarrow = () => useMediaQuery(NARROW_QUERY);
