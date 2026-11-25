'use client';

import { useEffect, useState } from 'react';

export interface UserProfile {
  full_name: string;
  date_of_birth: string;
  gender: string;
  focus: string[];
}

/** Reads the onboarding profile saved in localStorage (null until mounted). */
export function useProfile(): UserProfile | null {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('aimher-profile');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of persisted client state
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  return profile;
}
