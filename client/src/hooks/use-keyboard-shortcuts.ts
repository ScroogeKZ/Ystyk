import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        // Skip disabled shortcuts
        if (shortcut.enabled === false) {
          continue;
        }

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                        event.code.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Predefined keyboard shortcuts for POS
export const POS_SHORTCUTS = {
  HELP: 'F1',
  BARCODE_SCANNER: 'F2',
  OPEN_PAYMENT: 'F5',
  CLEAR_CART: 'F6',
  ADD_CUSTOMER: 'F8',
  CANCEL: 'Escape',
  INCREASE_QTY: '+',
  DECREASE_QTY: '-',
  COMPLETE_PAYMENT: 'F9',
  OPEN_SHIFT: 'F10',
  CLOSE_SHIFT: 'F11',
  PRINT_RECEIPT: 'F12',
} as const;
