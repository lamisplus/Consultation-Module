import { useMemo } from 'react';

/**
 * Custom hook to sort visits by encounterDate (descending) and map to [{date, visits}]
 * @param {Array} visitsArray - Array of visit objects
 * @returns {Array} - Sorted and mapped array: [{date, visits}]
 */
export function useSortedVisitsByDate(visits) {
  return useMemo(() => {
    const grouped = visits.reduce((acc, visit) => {
      const date = visit.encounterDate;
      if (!acc[date]) acc[date] = [];
      acc[date].push(visit);
      return acc;
    }, {});

    // Convert to array and sort
    const result = Object.entries(grouped)
      .map(([date, visits]) => ({
        date,
        // Sort visits within the date group by id descending (most recent first)
        visits: visits.sort((a, b) => b.id - a.id),
      }))
      // Sort groups by date descending (most recent first)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return result;
  }, [visits]);
}
