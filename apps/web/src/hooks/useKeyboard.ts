import { useEffect } from 'react';

type KeyCombo = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

export const useKeyboard = (combo: KeyCombo, callback: (e: KeyboardEvent) => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isKeyMatch = e.key.toLowerCase() === combo.key.toLowerCase();
      const isCtrlMatch = combo.ctrlKey ? e.ctrlKey : true;
      const isMetaMatch = combo.metaKey ? e.metaKey : true;
      const isAltMatch = combo.altKey ? e.altKey : true;
      const isShiftMatch = combo.shiftKey ? e.shiftKey : true;

      if (isKeyMatch && isCtrlMatch && isMetaMatch && isAltMatch && isShiftMatch) {
        callback(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combo, callback]);
};
