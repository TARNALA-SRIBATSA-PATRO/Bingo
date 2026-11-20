import { useEffect } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keyboard behaviour every dialog needs: focus moves into the panel when it
// opens, Tab stays inside it, Escape closes it, and focus returns to where it
// was when it closes. `active` lets a component that renders null while closed
// keep the hook call unconditional.
export default function useModalA11y(panelRef, onClose, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const panel = panelRef.current;
    if (!panel) return undefined;
    const previous = document.activeElement;

    const focusables = () => Array.from(panel.querySelectorAll(FOCUSABLE));
    const first = focusables()[0];
    if (first) first.focus({ preventScroll: true });
    else { panel.setAttribute('tabindex', '-1'); panel.focus({ preventScroll: true }); }

    const onKey = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); return; }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [panelRef, onClose, active]);
}
