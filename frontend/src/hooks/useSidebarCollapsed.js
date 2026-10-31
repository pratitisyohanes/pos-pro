import { useCallback, useState } from 'react';

const KEY = 'pos-pro:sidebar-collapsed';

function read() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

// Remembers whether the desktop admin sidebar is collapsed to an icon rail
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(read);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(KEY, next ? '1' : '0');
      } catch {
        // storage unavailable, keep the in-memory value
      }
      return next;
    });
  }, []);

  return [collapsed, toggle];
}
