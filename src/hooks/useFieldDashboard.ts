import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { ApiError } from '../lib/apiClient';
import { fieldDashboardService } from '../services/fieldDashboard.service';
import type { FieldDashboard } from '../types/fieldOperations';

export function useFieldDashboard() {
  const [data, setData] = useState<FieldDashboard | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(
    async (background = false) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const dashboard =
          await fieldDashboardService.getDashboard();
        if (mounted.current) {
          setData(dashboard);
          setError(null);
        }
      } catch (requestError) {
        if (mounted.current) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Unable to load field operations.',
          );
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    mounted.current = true;
    void load();
    const interval = window.setInterval(
      () => void load(true),
      10_000,
    );
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void load(true);
      }
    };
    const refreshOnFocus = () => void load(true);
    document.addEventListener(
      'visibilitychange',
      refreshWhenVisible,
    );
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      mounted.current = false;
      window.clearInterval(interval);
      document.removeEventListener(
        'visibilitychange',
        refreshWhenVisible,
      );
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
    retry: () => load(false),
  };
}
