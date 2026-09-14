import { useRef, useState } from 'react';

/** Spinner only on the first list fetch so typing in search does not flash loading or steal focus. */
export function useInitialListLoading(startLoading = true) {
  const hasLoaded = useRef(false);
  const [loading, setLoading] = useState(startLoading);

  function beginListLoad() {
    if (!hasLoaded.current) setLoading(true);
  }

  function endListLoad() {
    hasLoaded.current = true;
    setLoading(false);
  }

  return { loading, beginListLoad, endListLoad };
}
