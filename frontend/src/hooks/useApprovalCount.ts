import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useApprovalCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    api('/api/v1/approvals/pending/count')
      .then((d) => setCount(d.count || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { count, refresh };
}
