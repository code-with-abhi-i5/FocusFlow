import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToTimeEntries } from '../services/firebase/timeEntryService';
import type { TimeEntry } from '../types';

export interface DomainSummary {
  domain: string;
  timeSpent: number; // in minutes
  category: 'productive' | 'unproductive' | 'neutral';
}

export function useTimeData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [score, setScore] = useState(0);
  const [totalTimeMs, setTotalTimeMs] = useState(0);
  const [productiveTimeMs, setProductiveTimeMs] = useState(0);
  const [unproductiveTimeMs, setUnproductiveTimeMs] = useState(0);
  const [topDomains, setTopDomains] = useState<DomainSummary[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const unsubscribe = subscribeToTimeEntries(user.uid, todayStr, (entries) => {
      setTodayEntries(entries);

      let total = 0;
      let prod = 0;
      let unprod = 0;

      // Group by domain in case there are duplicates (though document ID prevents it)
      const domainMap: Record<string, { timeSpent: number; category: any }> = {};

      entries.forEach((entry) => {
        total += entry.timeSpent;
        if (entry.category === 'productive') prod += entry.timeSpent;
        if (entry.category === 'unproductive') unprod += entry.timeSpent;

        if (!domainMap[entry.domain]) {
          domainMap[entry.domain] = { timeSpent: 0, category: entry.category };
        }
        domainMap[entry.domain].timeSpent += entry.timeSpent;
      });

      setTotalTimeMs(total);
      setProductiveTimeMs(prod);
      setUnproductiveTimeMs(unprod);

      // Score logic: match service worker
      if (total === 0) {
        setScore(0);
      } else {
        const prodRatio = prod / total;
        const unprodRatio = unprod / total;
        const calculatedScore = Math.round(
          Math.max(0, Math.min(100, prodRatio * 100 - unprodRatio * 30))
        );
        setScore(calculatedScore);
      }

      // Convert to DomainSummary sorted by time
      const summaries: DomainSummary[] = Object.entries(domainMap)
        .map(([domain, data]) => ({
          domain,
          timeSpent: data.timeSpent / (1000 * 60), // ms to minutes
          category: data.category,
        }))
        .sort((a, b) => b.timeSpent - a.timeSpent);

      setTopDomains(summaries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return {
    loading,
    todayEntries,
    score,
    totalTimeMs,
    productiveTimeMs,
    unproductiveTimeMs,
    topDomains,
  };
}
