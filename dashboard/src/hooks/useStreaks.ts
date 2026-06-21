import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToStreak } from '../services/firebase/streakService';
import type { Streak } from '../types';

export function useStreaks() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToStreak(user.uid, (data) => {
      setStreak(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return {
    loading,
    streak,
  };
}
