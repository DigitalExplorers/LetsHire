import { useEffect } from 'react';

const usePreventPullToRefresh = () => {
  useEffect(() => {
    let maybePrevent = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      maybePrevent = window.pageYOffset === 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (maybePrevent && e.touches[0].clientY > 10) {
        e.preventDefault(); // 👈 prevent the pull-down refresh
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
};

export default usePreventPullToRefresh;
