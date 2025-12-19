import { useState, useEffect } from 'react';

// Custom hook for data fetching with loading and error states
export const useDataFetching = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFunction();
        setData(result);
      } catch (err) {
        setError(err);
        console.error('Error in useDataFetching:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies); // Re-run when dependencies change

  return { data, loading, error, setData };
};