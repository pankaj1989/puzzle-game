import { useEffect } from 'react';

let lockCount = 0;

/**
 * Ref-counted body scroll lock for stacked modals (dev Strict Mode safe).
 */
export function useModalStack(isActive) {
  useEffect(() => {
    if (!isActive) return undefined;
    lockCount += 1;
    if (lockCount === 1) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      lockCount -= 1;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = '';
      }
    };
  }, [isActive]);
}
