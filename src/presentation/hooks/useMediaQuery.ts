'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook to detect desktop vs mobile screen sizes
 * Uses 640px breakpoint (Tailwind sm: breakpoint) as the boundary
 * @returns { isDesktop: boolean, isMobile: boolean }
 */
export function useMediaQuery() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // SSR safety check - window is not available on server
    if (typeof window === 'undefined') {
      return;
    }

    // Match Tailwind's sm: breakpoint (640px)
    const mediaQuery = window.matchMedia('(min-width: 640px)');

    // Set initial value
    setIsDesktop(mediaQuery.matches);

    // Create event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    // Add listener (using modern addEventListener API)
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return {
    isDesktop,
    isMobile: !isDesktop,
  };
}
