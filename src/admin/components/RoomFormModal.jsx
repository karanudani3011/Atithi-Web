import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useModalA11y from '../useModalA11y.js';
import ImageUploader from './ImageUploader.jsx';
import ChipInput from './ChipInput.jsx';
import { ROOM_STATUS } from '../constants.js';
import { getProperties, uploadRoomImage } from '../../services/admin/adminRoomService.js';
import useRoomTypes from '../../hooks/useRoomTypes.js';
import { createRoomType } from '../../services/roomTypes.js';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';

const empty = { room_name: '', room_type: '', room_type_id: '', description: '', price_per_night: '', capacity: 2, amenities: [], image_urls: [], status: 'available', is_published: true, badge: '', bed_info: '', size_sqft: '', rating: 4.5, sort_order: 0, units_left: 1, total_units: 1, property_id: '' };

export default function RoomFormModal({ open, room, onClose, onSave }) {
  const { types, loading: typesLoading } = useRoomTypes();
  const { user } = useAdminAuth();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState(empty), [images, setImages] = useState([]), [properties, setProperties] = useState([]);
  const [busy, setBusy] = useState(false), [errors, setErrors] = useState({}), [addTypeOpen, setAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState(''), [newTypeDescription, setNewTypeDescription] = useState(''), [typeError, setTypeError] = useState('');
  const ref = useRef(null);
  const activeTypes = types.filter(type => type.is_active);
  const currentInactiveType = room && form.room_type_id && !activeTypes.some(type => type.id === form.room_type_id)
    ? types.find(type => type.id === form.room_type_id) : null;

  useEffect(() => {
    if (!open) return;
    setForm({ ...empty, ...room, room_type: room?.room_type || '', room_type_id: room?.room_type_id || '', amenities: room?.amenities || [], property_id: room?.property_id || '' });
    setImages((room?.image_urls || []).map(url => ({ url })));
    setErrors({}); setAddTypeOpen(false); setTypeError('');
    getProperties().then(setProperties).catch(failure => toast.error(failure.message));
  }, [open, room]);

  useEffect(() => {
    if (!open || !room?.room_type || form.room_type_id || !types.length) return;
    const match = types.find(type => type.name.trim().toLowerCase() === room.room_type.trim().toLowerCase());
    if (match) setForm(current => ({ ...current, room_type_id: match.id, room_type: match.name }));
  }, [open, room, room?.room_type, form.room_type_id, types]);

  useModalA11y(open, onClose, ref);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  function chooseType(id) {
    const selected = types.find(type => type.id === id);
    setForm(current => ({ ...current, room_type_id: id, room_type: selected?.name || '' }));
    setErrors(current => ({ ...current, room_type: '' }));
  }
  function validate() {
    const next = {};
    if (!form.room_name.trim()) next.room_name = 'Room name is required.';
    if (!form.room_type_id || !form.room_type.trim()) next.room_type = 'Room type is required.';
    if (!(Number(form.price_per_night) > 0)) next.price_per_night = 'Enter a price above zero.';
    if (!(Number(form.capacity) >= 1 && Number(form.capacity) <= 10)) next.capacity = 'Capacity must be 1–10.';
    if (form.size_sqft !== '' && Number(form.size_sqft) < 0) next.size_sqft = 'Size cannot be negative.';
    if (Number(form.rating) < 0 || Number(form.rating) > 5) next.rating = 'Rating must be between 0 and 5.';
    if (Number(form.units_left) < 0) next.units_left = 'Units cannot be negative.';
    if (!Number.isInteger(Number(form.total_units)) || Number(form.total_units) < 1) next.total_units = 'Total units must be at least 1.';
    if (properties.length !== 1 && !form.property_id) next.property_id = 'Select a property.';
    setErrors(next);
    return !Object.keys(next).length;
  }
  async function addType(event) {
    event?.preventDefault(); setTypeError('');
    const name = newTypeName.trim();
    if (!name || name.length > 60) return setTypeError('Enter a room type name up to 60 characters.');
    if (types.some(type => type.name.toLowerCase() === name.toLowerCase())) return setTypeError('A room type with this name already exists.');
    try {
      const created = await createRoomType({ name, description: newTypeDescription });
      setForm(current => ({ ...current, room_type_id: created.id, room_type: created.name }));
      setErrors(current => ({ ...current, room_type: '' }));
      setNewTypeName(''); setNewTypeDescription(''); setAddTypeOpen(false);
      toast.success('Room type added');
    } catch (failure) { setTypeError(failure.message); }
  }
  async function submit(event) {
    event.preventDefault();
    if (!validate() || busy) return;
    setBusy(true);
    try {
      const urls = [];
      for (const item of images) urls.push(item.file ? await uploadRoomImage(item.file) : item.url);
      await onSave({ ...form, room_name: form.room_name.trim(), room_type: form.room_type.trim(), room_type_id: form.room_type_id,
        price_per_night: Number(form.price_per_night), capacity: Number(form.capacity), size_sqft: form.size_sqft ? Number(form.size_sqft) : null,
        rating: Number(form.rating), sort_order: Number(form.sort_order) || 0, units_left: Number(form.units_left), total_units: Number(form.total_units),
        property_id: properties.length === 1 ? properties[0].id : form.property_id, image_urls: urls });
      onClose();
    } catch (failure) { toast.error(failure.message); }
    finally { setBusy(false); }
  }
  const field = (key, label, type = 'text', opts = {}) => <label>{label}<input type={type} value={form[key] ?? ''} min={opts.min} max={opts.max} step={opts.step} onChange={event => set(key, event.target.value)}/>{errors[key] && <small className="admin-field-error">{errors[key]}</small>}</label>;

  return <AnimatePresence>{open && <motion.div className="admin-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <motion.section ref={ref} className="admin-dialog room-form-dialog" role="dialog" aria-modal="true" aria-labelledby="room-modal-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
      <div className="admin-dialog-head"><div><span className="admin-eyebrow">ROOM INVENTORY</span><h2 id="room-modal-title">{room ? 'Edit room' : 'Add new room'}</h2></div><button type="button" className="admin-icon-btn" aria-label="Close dialog" onClick={onClose}><X/></button></div>
      <form className="admin-form-grid" onSubmit={submit} noValidate>
        {field('room_name', 'Room name *')}
        <label>Room type *<select value={form.room_type_id} onChange={event => chooseType(event.target.value)}><option value="">{typesLoading ? 'Loading room types…' : 'Select room type'}</option>{currentInactiveType && <option value={currentInactiveType.id}>{currentInactiveType.name} (inactive)</option>}{activeTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select>{errors.room_type && <small className="admin-field-error">{errors.room_type}</small>}{isAdmin && <button type="button" className="room-type-inline-trigger" onClick={() => { setAddTypeOpen(value => !value); setTypeError(''); }}><Plus size={14}/>Add new room type</button>}</label>
        {addTypeOpen && isAdmin && <div className="room-type-inline-form span-2"><strong>New room type</strong><label>Name<input autoFocus maxLength={60} value={newTypeName} onChange={event => setNewTypeName(event.target.value)} placeholder="e.g. Deluxe"/></label><label>Description (optional)<input value={newTypeDescription} onChange={event => setNewTypeDescription(event.target.value)} placeholder="Short description"/></label>{typeError && <small className="admin-field-error span-2">{typeError}</small>}<div className="admin-dialog-actions span-2"><button type="button" className="admin-btn admin-btn-light" onClick={() => setAddTypeOpen(false)}>Cancel</button><button type="button" className="admin-btn admin-btn-gold" onClick={() => addType()}>Add & select</button></div></div>}
        {field('price_per_night', 'Price per night (₹) *', 'number', { min: 1, step: '0.01' })}{field('capacity', 'Capacity *', 'number', { min: 1, max: 10 })}{field('size_sqft', 'Size (sq ft)', 'number', { min: 0 })}{field('bed_info', 'Bed info')}{field('rating', 'Rating', 'number', { min: 0, max: 5, step: .1 })}{field('badge', 'Badge')}{field('total_units', 'Total room units *', 'number', { min: 1, step: 1 })}{field('sort_order', 'Sort order', 'number')}
        <label>Status<select value={form.status} onChange={event => set('status', event.target.value)}>{ROOM_STATUS.map(status => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label>
        {properties.length > 1 && <label>Property *<select value={form.property_id} onChange={event => set('property_id', event.target.value)}><option value="">Choose property</option>{properties.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}</select>{errors.property_id && <small className="admin-field-error">{errors.property_id}</small>}</label>}
        <label className="span-2">Description<textarea rows="3" value={form.description || ''} onChange={event => set('description', event.target.value)}/></label><label className="span-2">Amenities<ChipInput value={form.amenities} onChange={value => set('amenities', value)} suggestions={['Wi-Fi', 'TV', 'AC', 'Room Service', 'Breakfast', 'Pool']}/></label><label className="span-2">Room images<ImageUploader images={images} onChange={setImages}/></label><label className="admin-check-field span-2"><input type="checkbox" checked={form.is_published} onChange={event => set('is_published', event.target.checked)}/> Published on website</label>
        <div className="admin-dialog-actions span-2"><button type="button" className="admin-btn admin-btn-light" onClick={onClose}>Cancel</button><button disabled={busy} className="admin-btn admin-btn-gold">{busy ? 'Saving…' : room ? 'Save changes' : 'Add room'}</button></div>
      </form>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}
