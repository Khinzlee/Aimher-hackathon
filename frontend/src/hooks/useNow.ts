'use client';

import { useEffect, useState } from 'react';

/** Returns the current Date after mount (null during prerender). */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  return now;
}
