import { useEffect } from 'react';

/**
 * Hook to add keyboard navigation support
 * Tracks when user is navigating with keyboard vs mouse
 */
export const useKeyboardNavigation = () => {
  useEffect(() => {
    let isUsingKeyboard = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isUsingKeyboard = true;
        document.body.setAttribute('data-keyboard-focus', 'true');
      }
    };

    const handleMouseDown = () => {
      isUsingKeyboard = false;
      document.body.removeAttribute('data-keyboard-focus');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
};

/**
 * Hook to announce messages to screen readers
 */
export const useScreenReaderAnnouncement = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.classList.add('sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
};
