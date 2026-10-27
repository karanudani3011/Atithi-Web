import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useModalA11y from '../useModalA11y.js';
import useRoomTypes from '../../hooks/useRoomTypes.js';
import { createRoomType, deleteRoomType, updateRoomType } from '../../services/roomTypes.js';

export default function RoomTypesModal({ open, onClose }) {
  const { types, loading, error } = useRoomTypes();
  const [drafts, setDrafts] = useState({});
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [busy, setBusy] = useState('');
  const [formError, setFormError] = useState('');
  const ref = useRef(null);
  useModalA11y(open, onClose, ref);

  useEffect(() => {
    setDrafts(Object.fromEntries(types.map(type => [type.id, {
      name: type.name, description: type.description || '', sort_order: type.sort_order,
    }])));
  }, [types]);

  async function addType(event) {
    event.preventDefault(); setFormError('');
    const clean = newName.trim();
    if (!clean || clean.length > 60) return setFormError('Enter a room type name up to 60 characters.');
    if (types.some(type => type.name.toLowerCase() === clean.toLowerCase())) return setFormError('A room type with this name already exists.');
    setBusy('add');
    try {
      await createRoomType({ name: clean, description: newDescription });
      setNewName(''); setNewDescription(''); setAdding(false); toast.success('Room type added');
    } catch (failure) { setFormError(failure.message); }
    finally { setBusy(''); }
  }

  async function save(type) {
    setBusy(type.id); setFormError('');
    try {
      await updateRoomType(type.id, drafts[type.id]);
      toast.success('Room type updated');
    } catch (failure) { setFormError(failure.message); }
    finally { setBusy(''); }
  }

  async function toggle(type) {
    setBusy(type.id); setFormError('');
    try {
      await updateRoomType(type.id, { is_active: !type.is_active });
      toast.success(type.is_active ? 'Room type deactivated' : 'Room type activated');
    } catch (failure) { setFormError(failure.message); }
    finally { setBusy(''); }
  }

  async function remove(type) {
    setBusy(type.id); setFormError('');
    try { await deleteRoomType(type.id); toast.success('Room type deleted'); }
    catch (failure) { setFormError(failure.message); }
    finally { setBusy(''); }
  }

  return <AnimatePresence>{open && <motion.div className="admin-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <motion.section ref={ref} className="admin-dialog room-types-dialog" role="dialog" aria-modal="true" aria-labelledby="room-types-title" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }}>
      <div className="admin-dialog-head"><div><span className="admin-eyebrow">ROOM INVENTORY</span><h2 id="room-types-title">Manage room types</h2></div><button type="button" className="admin-icon-btn" aria-label="Close dialog" onClick={onClose}><X/></button></div>
      <p className="admin-muted">Keep type names consistent across room listings and filters. Lower order values appear first.</p>
      {formError && <p className="room-type-error" role="alert">{formError}</p>}
      {adding ? <form className="room-type-add-form" onSubmit={addType}><label>Room type name<input autoFocus maxLength={60} value={newName} onChange={event => setNewName(event.target.value)} placeholder="e.g. Deluxe"/></label><label>Description (optional)<input value={newDescription} onChange={event => setNewDescription(event.target.value)} placeholder="Short description"/></label><div><button type="button" className="admin-btn admin-btn-light" onClick={() => { setAdding(false); setFormError(''); }}>Cancel</button><button className="admin-btn admin-btn-gold" disabled={busy === 'add'}>{busy === 'add' ? 'Adding…' : 'Add room type'}</button></div></form> : <button type="button" className="admin-btn admin-btn-gold room-type-add-trigger" onClick={() => setAdding(true)}><Plus size={16}/>Add room type</button>}
      {loading ? <p className="admin-muted">Loading room types…</p> : error ? <p className="room-type-error">{error}</p> : <div className="room-type-manage-list">{types.map(type => <article className="room-type-manage-row" key={type.id}>
        <div className="room-type-fields"><label>Name<input maxLength={60} value={drafts[type.id]?.name ?? type.name} onChange={event => setDrafts(current => ({ ...current, [type.id]: { ...current[type.id], name: event.target.value } }))}/></label><label>Description<input value={drafts[type.id]?.description ?? ''} onChange={event => setDrafts(current => ({ ...current, [type.id]: { ...current[type.id], description: event.target.value } }))}/></label><label className="room-type-sort">Order<input type="number" value={drafts[type.id]?.sort_order ?? 0} onChange={event => setDrafts(current => ({ ...current, [type.id]: { ...current[type.id], sort_order: Number(event.target.value) } }))}/></label></div>
        <div className="room-type-actions"><button type="button" className="admin-btn admin-btn-light" disabled={Boolean(busy)} onClick={() => save(type)}>{busy === type.id ? 'Saving…' : 'Save'}</button><button type="button" className={`admin-switch ${type.is_active ? 'on' : ''}`} role="switch" aria-checked={type.is_active} aria-label={`${type.is_active ? 'Deactivate' : 'Activate'} ${type.name}`} disabled={Boolean(busy)} onClick={() => toggle(type)}><i/></button><button type="button" className="admin-icon-btn delete" aria-label={`Delete ${type.name}`} disabled={Boolean(busy)} onClick={() => remove(type)}><Trash2 size={15}/></button></div>
      </article>)}</div>}
      <div className="admin-dialog-actions"><button type="button" className="admin-btn admin-btn-light" onClick={onClose}>Done</button></div>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}
