import { useEffect } from 'react';

export const useAntiCheat = (onViolation?: (reason: string) => void) => {
  useEffect(() => {
    // Disable copy, paste, right-click, selection
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolation?.('Copy attempt detected');
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolation?.('Paste attempt detected');
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onViolation?.('Right-click attempt detected');
    };
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      onViolation?.('Text selection attempt detected');
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.body.style.userSelect = 'none';

    // Detect tab switch
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onViolation?.('Tab switch or window blur detected');
        alert('You switched tabs! Please stay focused on the quiz.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Request fullscreen on first click
    const requestFullScreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {
          console.warn('Fullscreen request denied by browser');
        });
      }
      document.removeEventListener('click', requestFullScreen);
    };
    document.addEventListener('click', requestFullScreen);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', requestFullScreen);
      document.body.style.userSelect = '';
    };
  }, [onViolation]);
};
