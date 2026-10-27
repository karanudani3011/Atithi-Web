import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, LoaderCircle } from 'lucide-react';

let activeDropdownClose = null;

export default function StatusDropdown({ value, options, onChange, disabled = false, loading = false }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));
  const selected = options[selectedIndex] || { value, label: String(value || ''), color: 'grey' };

  const close = useCallback(() => {
    setOpen(false);
    if (activeDropdownClose === close) activeDropdownClose = null;
  }, []);

  useEffect(() => () => {
    if (activeDropdownClose === close) activeDropdownClose = null;
  }, [close]);

  const openMenu = useCallback(() => {
    if (disabled || loading || !triggerRef.current) return;
    activeDropdownClose?.();
    activeDropdownClose = close;
    setActiveIndex(selectedIndex);
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedHeight = Math.min(options.length * 36 + 12, 252);
    const above = rect.bottom + estimatedHeight + 6 > window.innerHeight;
    const menuWidth = Math.min(220, window.innerWidth - 16);
    setPosition({ top: above ? Math.max(8, rect.top - estimatedHeight - 6) : rect.bottom + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)) });
    setOpen(true);
  }, [close, disabled, loading, options.length, selectedIndex]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const height = menuRef.current.getBoundingClientRect().height;
    const width = menuRef.current.getBoundingClientRect().width;
    const above = rect.bottom + height + 6 > window.innerHeight;
    setPosition({ top: above ? Math.max(8, rect.top - height - 6) : Math.min(rect.bottom + 6, window.innerHeight - height - 8), left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)) });
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = event => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) close();
    };
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };
    const onScroll = () => close();
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [close, open]);

  const choose = option => {
    close();
    if (option.value !== value) onChange(option.value);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu();
      else setActiveIndex(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) openMenu();
      else if (options[activeIndex]) choose(options[activeIndex]);
    }
  };

  const menu = open && createPortal(
    <div
      ref={menuRef}
      id={menuId}
      className="status-dropdown-menu"
      role="listbox"
      aria-label="Choose status"
      tabIndex={-1}
      style={{ top: position.top, left: position.left }}
    >
      {options.map((option, index) => (
        <button
          id={`${menuId}-option-${index}`}
          key={option.value}
          type="button"
          className={`status-dropdown-option${index === activeIndex ? ' is-active' : ''}`}
          role="option"
          aria-selected={option.value === value}
          tabIndex={-1}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(option)}
        >
          <i className={`status-dropdown-dot ${option.color || 'grey'}`} />
          <span>{option.label}</span>
          {option.value === value && <Check size={15} aria-hidden="true"/>}
        </button>
      ))}
    </div>,
    document.body,
  );

  return <>
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      className={`booking-status-pill status-dropdown-trigger ${selected.color || 'grey'}`}
      aria-label={`Status: ${selected.label}`}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={menuId}
      aria-activedescendant={open ? `${menuId}-option-${activeIndex}` : undefined}
      disabled={disabled || loading}
      onClick={() => open ? close() : openMenu()}
      onKeyDown={onTriggerKeyDown}
    >
      <i className="status-dropdown-current-dot" aria-hidden="true"/>
      <span>{selected.label}</span>
      {loading ? <LoaderCircle className="admin-spin" size={13} aria-label="Saving status"/> : <ChevronDown size={13} aria-hidden="true"/>}
    </button>
    {menu}
  </>;
}
