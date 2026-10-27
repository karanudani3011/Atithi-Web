import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import './RoleSelect.css';

const roles = [
  { value: 'admin', label: 'Admin', description: 'Full access, team manage kari sake' },
  { value: 'staff', label: 'Staff', description: 'Bookings, Rooms, Services, Messages' },
];

export default function RoleSelect({ value = 'staff', onChange, disabled = false, compact = false, id, label = 'Role' }) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, roles.findIndex((role) => role.value === value)));
  const [position, setPosition] = useState(null);
  const selectedIndex = Math.max(0, roles.findIndex((role) => role.value === value));
  const selected = roles[selectedIndex];
  const listboxId = `${id || 'role-select'}-listbox`;

  const placeMenu = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(Math.max(rect.width, compact ? 220 : 280), window.innerWidth - 24);
    const height = Math.min(roles.length * 66 + 12, 260);
    const below = window.innerHeight - rect.bottom;
    const top = below >= height + 8 || below >= rect.top ? rect.bottom + 6 : Math.max(12, rect.top - height - 6);
    setPosition({ top, left: Math.min(Math.max(12, rect.left), window.innerWidth - width - 12), width });
  }, [compact]);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    setPosition(null);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const show = useCallback((index = selectedIndex) => {
    if (disabled) return;
    setActiveIndex(index);
    placeMenu();
    setOpen(true);
  }, [disabled, placeMenu, selectedIndex]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    placeMenu();
    optionRefs.current[activeIndex]?.focus();
    const reposition = () => placeMenu();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, activeIndex, placeMenu]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) close();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); }
      if (event.key === 'Tab') close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  function choose(role) {
    onChange?.(role.value);
    close(true);
  }

  function handleTriggerKeyDown(event) {
    if (disabled) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); show(open ? Math.min(activeIndex + 1, roles.length - 1) : selectedIndex); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); show(open ? Math.max(activeIndex - 1, 0) : roles.length - 1); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open ? choose(roles[activeIndex]) : show(); }
    else if (event.key === 'Escape' && open) { event.preventDefault(); close(true); }
  }

  return <div ref={rootRef} className={`role-select ${compact ? 'is-compact' : ''} ${disabled ? 'is-disabled' : ''}`}>
    <button ref={triggerRef} id={id} type="button" className={`role-select-trigger role-${selected.value}`}
      aria-label={compact ? `${label}: ${selected.label}` : undefined} aria-haspopup="listbox" aria-expanded={open}
      aria-controls={open ? listboxId : undefined} disabled={disabled} title={disabled ? 'Tame potanu role badli na sako' : undefined}
      onClick={() => open ? close() : show()} onKeyDown={handleTriggerKeyDown}>
      <span className="role-select-value">{selected.label}</span><ChevronDown size={compact ? 14 : 17} aria-hidden="true"/>
    </button>
    {open && position && createPortal(<div ref={menuRef} id={listboxId} className="role-select-menu" role="listbox" aria-label="Choose role"
      style={{ position: 'fixed', top: position.top, left: position.left, width: position.width }}>
      {roles.map((role, index) => <div key={role.value} ref={(node) => { optionRefs.current[index] = node; }} role="option"
        aria-selected={role.value === value} tabIndex={activeIndex === index ? 0 : -1} className={`role-select-option ${role.value === value ? 'selected' : ''}`}
        onFocus={() => setActiveIndex(index)} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(role)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const next = event.key === 'ArrowDown' ? (index + 1) % roles.length : (index + roles.length - 1) % roles.length;
            setActiveIndex(next); optionRefs.current[next]?.focus();
          } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(role); }
          else if (event.key === 'Escape') { event.preventDefault(); close(true); }
        }}>
        <span className={`role-select-option-icon role-${role.value}`}>{role.value === value ? <Check size={15}/> : null}</span>
        <span className="role-select-option-copy"><strong>{role.label}</strong><small>{role.description}</small></span>
      </div>)}
    </div>, document.body)}
  </div>;
}
