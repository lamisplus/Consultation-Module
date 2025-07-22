import { useMemo } from "react";
export function useSortedVisitsByDate(visits) {
  return useMemo(() => {
    const grouped = visits.reduce((acc, visit) => {
      const date = visit.encounterDate;
      if (!acc[date]) acc[date] = [];
      acc[date].push(visit);
      return acc;
    }, {});

    const result = Object.entries(grouped)
      .map(([date, visits]) => ({
        date,
        visits: visits.sort((a, b) => b.id - a.id),
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return result;
  }, [visits]);
}
