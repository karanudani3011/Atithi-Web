import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, Star, Trash2, Tags } from 'lucide-react';
import toast from 'react-hot-toast';
import Img from '../../components/Img.jsx';
import { listRooms, saveRoom, setRoomPublished, deleteRoom, roomHasBookings } from '../../services/admin/adminRoomService.js';
import useRoomTypes from '../../hooks/useRoomTypes.js';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import RoomFormModal from '../components/RoomFormModal.jsx';
import RoomTypesModal from '../components/RoomTypesModal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmDialog from '../ConfirmDialog.jsx';

export default function Rooms() {
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [search, setSearch] = useState(''), [typeId, setTypeId] = useState(''), [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null), [modal, setModal] = useState(false), [typesModal, setTypesModal] = useState(false);
  const [deleting, setDeleting] = useState(null), [hasBookings, setHasBookings] = useState(false), [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  const { types } = useRoomTypes();
  const { user } = useAdminAuth();
  const isAdmin = user?.role === 'admin';

  async function load() {
    setLoading(true); setError('');
    try { const result = await listRooms({ search, typeId, status }); setRows(result.data); }
    catch (failure) { setError(failure.message); toast.error(failure.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [search, typeId, status, types]);
  useEffect(() => {
    if (params.get('new') === '1') { setEditing(null); setModal(true); setParams({}, { replace: true }); }
  }, [params, setParams]);

  async function toggle(room) {
    const previous = room.is_published;
    setRows(current => current.map(item => item.id === room.id ? { ...item, is_published: !previous } : item));
    try { await setRoomPublished(room.id, !previous); toast.success(!previous ? 'Room published' : 'Room unpublished'); }
    catch (failure) { setRows(current => current.map(item => item.id === room.id ? { ...item, is_published: previous } : item)); toast.error(failure.message); }
  }
  async function askDelete(room) {
    setDeleting(room);
    try { setHasBookings(await roomHasBookings(room.id)); }
    catch (failure) { toast.error(failure.message); setDeleting(null); }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      if (hasBookings) {
        await setRoomPublished(deleting.id, false);
        setRows(current => current.map(item => item.id === deleting.id ? { ...item, is_published: false } : item));
        toast.success('Room unpublished');
      } else {
        await deleteRoom(deleting.id); toast.success('Room deleted'); await load();
      }
      setDeleting(null);
    } catch (failure) { toast.error(failure.message); }
    finally { setBusy(false); }
  }
  async function save(row) {
    await saveRoom(row, editing?.id);
    toast.success(editing ? 'Room updated' : 'Room added');
    await load();
  }
  const openNewRoom = () => { setEditing(null); setModal(true); };

  return <div className="admin-page">
    <div className="admin-page-heading"><div><span className="admin-eyebrow">ROOM INVENTORY</span><h1>Rooms <i>& Suites</i></h1><p>Manage published spaces, rates, and availability.</p></div>
      <div className="admin-room-heading-actions">{isAdmin && <button type="button" className="admin-btn admin-btn-light" onClick={() => setTypesModal(true)}><Tags size={16}/>Manage room types</button>}<button type="button" className="admin-btn admin-btn-gold" onClick={openNewRoom}><Plus size={18}/>Add New Room</button></div>
    </div>
    <div className="admin-toolbar"><label className="admin-search"><Search/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search room name"/></label>
      <div className="admin-filter"><SlidersHorizontal size={16}/><select aria-label="Filter room type" value={typeId} onChange={event => setTypeId(event.target.value)}><option value="">All room types</option>{types.map(type => <option key={type.id} value={type.id}>{type.name}{!type.is_active ? ' (inactive)' : ''}</option>)}</select></div>
      <div className="admin-filter"><select aria-label="Filter room status" value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{['available', 'reserved', 'occupied', 'cleaning', 'maintenance', 'blocked'].map(value => <option key={value}>{value}</option>)}</select></div>
    </div>
    {loading ? <div className="admin-room-grid">{[1, 2, 3].map(item => <div className="admin-panel admin-skeleton-card" key={item}><span/><span/><span/></div>)}</div>
      : error ? <div className="admin-empty"><p>{error}</p><button className="admin-btn admin-btn-light" onClick={load}>Retry</button></div>
        : rows.length ? <div className="admin-room-grid">{rows.map(room => <article className="admin-room-card" key={room.id}>
          <div className="admin-room-img"><Img src={room.image_urls?.[0]} alt={room.room_name}/><StatusBadge status={room.status}/>{room.badge && <span className="admin-room-badge">{room.badge}</span>}</div>
          <div className="admin-room-info"><div className="admin-room-title"><span className="admin-type-tag">{room.room_type}</span>{room.rating && <span className="admin-rating"><Star size={14} fill="currentColor"/>{room.rating}</span>}</div>
            <h2>{room.room_name}</h2><p>{room.capacity ?? '—'} guests · {room.size_sqft || '—'} sq ft · {room.total_units ?? 1} units</p><strong className="admin-room-price">₹{Number(room.price_per_night).toLocaleString('en-IN')} <small>/ night</small></strong>
            <div className="admin-chip-row">{(room.amenities || []).slice(0, 4).map(amenity => <span key={amenity}>{amenity}</span>)}</div>
            <div className="admin-publish-row"><span>{room.is_published ? 'Published' : 'Hidden'}</span><button className={`admin-switch ${room.is_published ? 'on' : ''}`} role="switch" aria-checked={!!room.is_published} aria-label={`Toggle ${room.room_name} publication`} onClick={() => toggle(room)}><i/></button></div>
            <div className="admin-room-actions"><button className="admin-btn admin-btn-light" onClick={() => { setEditing(room); setModal(true); }}>Edit</button><button className="admin-btn admin-btn-danger-soft" onClick={() => askDelete(room)}><Trash2 size={15}/>Delete</button></div>
          </div>
        </article>)}</div> : <div className="admin-empty"><h2>No rooms found</h2><p>Add a room or adjust your filters.</p><button className="admin-btn admin-btn-gold" onClick={openNewRoom}><Plus size={16}/>Add room</button></div>}
    <RoomFormModal open={modal} room={editing} onClose={() => setModal(false)} onSave={save}/>
    {isAdmin && <RoomTypesModal open={typesModal} onClose={() => setTypesModal(false)}/>}
    <ConfirmDialog open={Boolean(deleting)} title={hasBookings ? 'This room has bookings' : 'Delete this room?'} confirmText={hasBookings ? 'Unpublish instead' : busy ? 'Deleting…' : 'Delete room'} danger={!hasBookings} onCancel={() => !busy && setDeleting(null)} onConfirm={remove}>{hasBookings ? 'This room is referenced by bookings and cannot be deleted safely. You can unpublish it instead.' : 'This permanently deletes the room and its stored images.'}</ConfirmDialog>
  </div>;
}
