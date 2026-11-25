'use client';

import { useEffect, useState } from 'react';

/** Returns the current Date after mount (null during prerender). */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  // Deferred read of current time — required for Cache Components prerendering
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(new Date()), []);
  return now;
}
