import { useEffect, useRef } from 'react';

function useAutoRefresh(refreshFn, options = {}) {
  const {
    enabled = true,
    intervalMs = 30000,
    runOnMount = true,
    runOnFocus = true
  } = options;

  const refreshRef = useRef(refreshFn);

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const runRefresh = () => refreshRef.current?.();

    if (runOnMount) {
      runRefresh();
    }

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        runRefresh();
      }
    }, intervalMs);

    const onWindowFocus = () => {
      if (runOnFocus) {
        runRefresh();
      }
    };

    if (runOnFocus) {
      window.addEventListener('focus', onWindowFocus);
    }

    return () => {
      clearInterval(intervalId);
      if (runOnFocus) {
        window.removeEventListener('focus', onWindowFocus);
      }
    };
  }, [enabled, intervalMs, runOnFocus, runOnMount]);
}

export default useAutoRefresh;
