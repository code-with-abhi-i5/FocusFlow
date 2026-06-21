import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToGoals, updateGoals } from '../services/firebase/goalService';
import type { Goal } from '../types';

export function useGoals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToGoals(user.uid, (data) => {
      setGoals(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateUserGoals = async (dailyProductiveHours: number, socialMediaLimit: number) => {
    if (!user) throw new Error('User not logged in');
    await updateGoals(user.uid, dailyProductiveHours, socialMediaLimit);
  };

  return {
    loading,
    goals,
    updateUserGoals,
  };
}
