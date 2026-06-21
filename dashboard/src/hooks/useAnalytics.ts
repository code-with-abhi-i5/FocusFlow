import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTimeEntriesRange } from '../services/firebase/timeEntryService';
import type { TimeEntry } from '../types';

export function useAnalytics(daysRange: 7 | 30) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [trendData, setTrendData] = useState<{ dateLabel: string; productive: number; unproductive: number; total: number }[]>([]);
  const [topDomains, setTopDomains] = useState<{ domain: string; timeSpent: number; category: any }[]>([]);
  const [heatmapData, setHeatmapData] = useState<{ date: string; dayOfWeek: number; weekIndex: number; productiveHours: number }[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    avgScore: 0,
    totalTrackedHours: 0,
    productiveHours: 0,
    unproductiveHours: 0,
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRangeData = async () => {
      setLoading(true);
      const endDateObj = new Date();
      const startDateObj = new Date();
      startDateObj.setDate(endDateObj.getDate() - (daysRange - 1));

      const endDateStr = endDateObj.toISOString().split('T')[0];
      const startDateStr = startDateObj.toISOString().split('T')[0];

      const rangeEntries = await getTimeEntriesRange(user.uid, startDateStr, endDateStr);
      setEntries(rangeEntries);

      // Initialize date dictionaries to capture zero-activity days
      const dateMap: Record<string, { productiveMs: number; unproductiveMs: number; totalMs: number; scoreSum: number }> = {};
      
      for (let i = 0; i < daysRange; i++) {
        const d = new Date(startDateObj);
        d.setDate(startDateObj.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        dateMap[dStr] = { productiveMs: 0, unproductiveMs: 0, totalMs: 0, scoreSum: 0 };
      }

      // Populate dictionaries
      const domainTimes: Record<string, { timeSpentMs: number; category: any }> = {};
      let totalProd = 0;
      let totalUnprod = 0;
      let totalAll = 0;

      rangeEntries.forEach((entry) => {
        const dateKey = entry.date;
        const entryTime = entry.timeSpent;

        // Overall sums
        totalAll += entryTime;
        if (entry.category === 'productive') totalProd += entryTime;
        if (entry.category === 'unproductive') totalUnprod += entryTime;

        // Daily trend tracking
        if (dateMap[dateKey]) {
          dateMap[dateKey].totalMs += entryTime;
          if (entry.category === 'productive') dateMap[dateKey].productiveMs += entryTime;
          if (entry.category === 'unproductive') dateMap[dateKey].unproductiveMs += entryTime;
        }

        // Domain aggregation
        if (!domainTimes[entry.domain]) {
          domainTimes[entry.domain] = { timeSpentMs: 0, category: entry.category };
        }
        domainTimes[entry.domain].timeSpentMs += entryTime;
      });

      // 1. Compute summary stats
      const totalTrackedHours = totalAll / (1000 * 60 * 60);
      const productiveHours = totalProd / (1000 * 60 * 60);
      const unproductiveHours = totalUnprod / (1000 * 60 * 60);

      // Compute average daily score
      let scoreDays = 0;
      let scoreSum = 0;
      
      Object.keys(dateMap).forEach((dateKey) => {
        const day = dateMap[dateKey];
        if (day.totalMs > 0) {
          const ratioProd = day.productiveMs / day.totalMs;
          const ratioUnprod = day.unproductiveMs / day.totalMs;
          const dailyScore = Math.round(Math.max(0, Math.min(100, ratioProd * 100 - ratioUnprod * 30)));
          scoreSum += dailyScore;
          scoreDays++;
        }
      });
      const avgScore = scoreDays > 0 ? Math.round(scoreSum / scoreDays) : 0;

      setSummaryStats({
        avgScore,
        totalTrackedHours,
        productiveHours,
        unproductiveHours,
      });

      // 2. Generate Pie Data
      setPieData([
        { name: 'Productive', value: totalProd / (1000 * 60), color: '#10b981' },
        { name: 'Unproductive', value: totalUnprod / (1000 * 60), color: '#ef4444' },
        { 
          name: 'Neutral', 
          value: Math.max(0, (totalAll - totalProd - totalUnprod) / (1000 * 60)), 
          color: '#6b7280' 
        },
      ]);

      // 3. Generate Trend Data
      const computedTrends = Object.entries(dateMap).map(([dateKey, day]) => {
        // Date formatting: Mon, Tue or Jun 14
        const dateObj = new Date(dateKey + 'T00:00:00');
        const options: Intl.DateTimeFormatOptions = daysRange === 7 
          ? { weekday: 'short' } 
          : { month: 'short', day: 'numeric' };
        const dateLabel = dateObj.toLocaleDateString('en-US', options);

        return {
          dateLabel,
          productive: day.productiveMs / (1000 * 60 * 60), // to hours
          unproductive: day.unproductiveMs / (1000 * 60 * 60), // to hours
          total: day.totalMs / (1000 * 60 * 60), // to hours
        };
      });
      setTrendData(computedTrends);

      // 4. Generate Top Domains
      const computedDomains = Object.entries(domainTimes)
        .map(([domain, data]) => ({
          domain,
          timeSpent: data.timeSpentMs / (1000 * 60), // to minutes
          category: data.category,
        }))
        .sort((a, b) => b.timeSpent - a.timeSpent)
        .slice(0, 10);
      setTopDomains(computedDomains);

      // 5. Generate Heatmap Grid (Last 28 Days / 4 Weeks)
      const heatmapDays: typeof heatmapData = [];
      const oldestDate = new Date();
      oldestDate.setDate(endDateObj.getDate() - 27); // 28 days total

      // Map range entries to a quick map for productive hours
      const prodTimeByDate: Record<string, number> = {};
      rangeEntries.forEach((entry) => {
        if (entry.category === 'productive') {
          prodTimeByDate[entry.date] = (prodTimeByDate[entry.date] || 0) + entry.timeSpent;
        }
      });

      for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
        const currentDate = new Date(oldestDate);
        currentDate.setDate(oldestDate.getDate() + dayOffset);
        const currentStr = currentDate.toISOString().split('T')[0];

        // Group into 4 columns (weeks)
        const weekIndex = Math.floor(dayOffset / 7); 
        const dayOfWeek = currentDate.getDay(); // 0 (Sun) to 6 (Sat)
        const productiveMs = prodTimeByDate[currentStr] || 0;
        const productiveHours = productiveMs / (1000 * 60 * 60);

        heatmapDays.push({
          date: currentStr,
          dayOfWeek,
          weekIndex,
          productiveHours,
        });
      }
      setHeatmapData(heatmapDays);

      setLoading(false);
    };

    fetchRangeData();
  }, [user, daysRange]);

  return {
    loading,
    entries,
    pieData,
    trendData,
    topDomains,
    heatmapData,
    summaryStats,
  };
}
