import { useState, useEffect } from "react";

/**
 * Hook to detect if component is mounted on client side
 * Useful for preventing hydration mismatches with i18n or localStorage
 */
export const useClientOnly = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
};
