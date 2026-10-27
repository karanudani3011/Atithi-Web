import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, LoaderCircle, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useRoomTypes from '../../hooks/useRoomTypes.js';
import { createWalkInBooking, listWalkInAvailableRooms } from '../../services/admin/walkInBookingService.js';
import { BOOKING_SOURCES, OTA_BOOKING_SOURCES } from '../../config/bookingSources.js';

const ID_TYPES = ['Aadhaar', 'Driving License', 'Passport', 'Voter ID'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Card'];
const todayInIndia = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const nextDate = (value, days = 1) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const nightCount = (start, end) => Math.max(0, Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000));
const numeric = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function validate(form, room) {
  const errors = {};
  if (!form.guest_name.trim()) errors.guest_name = 'Enter the guest’s full name.';
  if (!/^\d{10}$/.test(form.guest_phone)) errors.guest_phone = 'Enter a valid 10-digit phone number.';
  if (form.guest_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guest_email)) errors.guest_email = 'Enter a valid email address.';
  if (!form.id_type) errors.id_type = 'Choose an ID proof type.';
  if (!form.id_number.trim()) errors.id_number = 'Enter the ID proof number.';
  if (!form.room_type_id) errors.room_type_id = 'Choose a room type.';
  if (!form.room_id || !room) errors.room_id = 'Choose an available room.';
  if (!form.check_in) errors.check_in = 'Choose a check-in date.';
  if (!form.check_out || form.check_out <= form.check_in) errors.check_out = 'Check-out must be after check-in.';
  if (Number(form.adults) < 1 || !Number.isInteger(Number(form.adults))) errors.adults = 'At least one adult is required.';
  if (Number(form.children) < 0 || !Number.isInteger(Number(form.children))) errors.children = 'Enter a valid number of children.';
  if (room?.capacity && Number(form.adults) + Number(form.children) > Number(room.capacity)) errors.guests = `This room allows up to ${room.capacity} guests.`;
  for (const field of ['room_price', 'discount_amount', 'advance_paid']) {
    if (form[field] === '' || !Number.isFinite(Number(form[field])) || Number(form[field]) < 0) errors[field] = 'Enter an amount of zero or more.';
  }
  if (form.taxes_amount !== '' && (!Number.isFinite(Number(form.taxes_amount)) || Number(form.taxes_amount) < 0)) errors.taxes_amount = 'Enter a tax amount of zero or more.';
  const subtotal = numeric(form.room_price) * nightCount(form.check_in, form.check_out);
  if (numeric(form.discount_amount) > subtotal + numeric(form.taxes_amount)) errors.discount_amount = 'Discount cannot exceed the subtotal plus tax.';
  if (numeric(form.advance_paid) > Math.max(0, subtotal + numeric(form.taxes_amount) - numeric(form.discount_amount))) errors.advance_paid = 'Advance cannot exceed the total.';
  if (!form.payment_method) errors.payment_method = 'Choose a payment method.';
  if (!form.source) errors.source = 'Choose a booking source.';
  return errors;
}

const initialForm = () => {
  const checkIn = todayInIndia();
  return {
    guest_name: '', guest_phone: '', guest_email: '', guest_address: '', guest_city: '',
    id_type: '', id_number: '', room_type_id: '', room_id: '', check_in: checkIn,
    check_out: nextDate(checkIn), adults: '1', children: '0', special_requests: '',
    room_price: '', taxes_amount: '0', discount_amount: '0', advance_paid: '0',
    payment_method: 'Cash', check_in_now: false,
    source: 'walk-in', external_ref: '',
  };
};

export default function NewWalkInBooking() {
  const navigate = useNavigate();
  const { types, loading: typesLoading, error: typesError } = useRoomTypes({ activeOnly: true });
  const [form, setForm] = useState(initialForm);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const savingLock = useRef(false);
  const [attempted, setAttempted] = useState(false);
  const nights = nightCount(form.check_in, form.check_out);
  const selectedRoom = rooms.find(room => room.id === form.room_id) || null;
  const selectedType = types.find(type => type.id === form.room_type_id);
  const subtotal = useMemo(() => numeric(form.room_price) * nights, [form.room_price, nights]);
  const tax = numeric(form.taxes_amount);
  const discount = numeric(form.discount_amount);
  const total = Math.max(0, subtotal + tax - discount);
  const advance = numeric(form.advance_paid);
  const paymentStatus = advance >= total && total > 0 ? 'paid' : advance > 0 ? 'partial' : 'pending';
  const balance = Math.max(0, total - advance);

  useEffect(() => {
    let active = true;
    setRooms([]);
    setAvailabilityError('');
    setForm(current => current.room_id ? { ...current, room_id: '', room_price: '' } : current);
    if (!selectedType || !form.check_in || !form.check_out || form.check_out <= form.check_in) {
      setRoomsLoading(false);
      return undefined;
    }
    setRoomsLoading(true);
    listWalkInAvailableRooms({ roomTypeId: selectedType.id, roomTypeName: selectedType.name, checkIn: form.check_in, checkOut: form.check_out })
      .then(nextRooms => { if (active) setRooms(nextRooms); })
      .catch(error => { if (active) setAvailabilityError(error?.message || 'Could not check availability.'); })
      .finally(() => { if (active) setRoomsLoading(false); });
    return () => { active = false; };
  }, [selectedType, form.check_in, form.check_out]);

  const update = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (attempted) setErrors(validate(next, rooms.find(room => room.id === next.room_id) || null));
  };
  const updateRoomType = value => {
    const type = types.find(item => item.id === value);
    setForm(current => ({ ...current, room_type_id: value, room_id: '', room_price: '' }));
    if (attempted) setErrors(current => ({ ...current, room_type_id: type ? '' : 'Choose a room type.', room_id: 'Choose an available room.' }));
  };
  const chooseRoom = id => {
    const room = rooms.find(item => item.id === id);
    setForm(current => ({ ...current, room_id: id, room_price: room ? String(room.price_per_night ?? 0) : '' }));
    if (attempted) setErrors(current => ({ ...current, room_id: room ? '' : 'Choose an available room.' }));
  };

  async function submit(event) {
    event.preventDefault();
    if (savingLock.current || saving) return;
    setAttempted(true);
    const validationErrors = validate(form, selectedRoom);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;
    savingLock.current = true;
    setSaving(true);
    try {
      const created = await createWalkInBooking({
        room_id: selectedRoom.id,
        property_id: selectedRoom.property_id || null,
        check_in: form.check_in,
        check_out: form.check_out,
        nights,
        // The online booking flow stores the full-stay subtotal in room_price.
        room_price: subtotal,
        taxes_amount: tax,
        total_amount: total,
        advance_paid: advance,
        payment_method: form.payment_method.toLowerCase(),
        payment_status: paymentStatus,
        booking_status: form.check_in_now ? 'checked_in' : 'confirmed',
        source: form.source,
        external_ref: form.external_ref.trim() || null,
        user_id: null,
        guest_name: form.guest_name.trim(),
        guest_phone: form.guest_phone,
        guest_email: form.guest_email.trim().toLowerCase() || null,
        id_type: form.id_type,
        id_number: form.id_number.trim(),
        adults: Number(form.adults),
        children: Number(form.children),
        special_requests: [
          form.guest_address.trim() && `Address: ${form.guest_address.trim()}`,
          form.guest_city.trim() && `City: ${form.guest_city.trim()}`,
          form.special_requests.trim() && `Requests: ${form.special_requests.trim()}`,
        ].filter(Boolean).join('\n') || null,
      });
      toast.success('Booking created');
      navigate('/admin/bookings', { replace: true, state: { walkInCreatedId: created.id } });
    } catch (error) {
      setErrors(current => ({ ...current, submit: error?.message || 'Could not create the booking.' }));
    } finally {
      savingLock.current = false;
      setSaving(false);
    }
  }

  return <div className="admin-page walkin-page">
    <div className="admin-page-heading">
      <div><span className="admin-eyebrow">RECEPTION · DIRECT BOOKING</span><h1>New <i>walk-in booking</i></h1><p>Record a guest stay and payment at the front desk.</p></div>
      <Link className="admin-btn admin-btn-light" to="/admin/bookings"><ArrowLeft size={16}/>Back to bookings</Link>
    </div>

    {typesError && <p className="walkin-error-banner" role="alert">{typesError}</p>}
    <form className="walkin-form" onSubmit={submit} noValidate>
      <section className="admin-panel walkin-section">
        <div className="walkin-section-title"><span>01</span><div><h2>Guest details</h2><p>Enter the guest’s contact and identification details.</p></div></div>
        <div className="walkin-fields">
          <label>Full name *<input autoComplete="name" value={form.guest_name} onChange={event => update('guest_name', event.target.value)} onBlur={() => attempted && setErrors(validate(form, selectedRoom))} placeholder="Guest full name"/>{errors.guest_name && <small>{errors.guest_name}</small>}</label>
          <label>Phone *<input type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" value={form.guest_phone} onChange={event => update('guest_phone', event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number"/>{errors.guest_phone && <small>{errors.guest_phone}</small>}</label>
          <label>Email<input type="email" autoComplete="email" value={form.guest_email} onChange={event => update('guest_email', event.target.value)} placeholder="guest@example.com"/>{errors.guest_email && <small>{errors.guest_email}</small>}</label>
          <label>ID proof type *<select value={form.id_type} onChange={event => update('id_type', event.target.value)}><option value="">Choose ID proof</option>{ID_TYPES.map(type => <option key={type}>{type}</option>)}</select>{errors.id_type && <small>{errors.id_type}</small>}</label>
          <label>ID number *<input value={form.id_number} onChange={event => update('id_number', event.target.value)} placeholder="ID document number"/>{errors.id_number && <small>{errors.id_number}</small>}</label>
          <label>Address<input value={form.guest_address} onChange={event => update('guest_address', event.target.value)} placeholder="Street address (optional)"/></label>
          <label>City<input value={form.guest_city} onChange={event => update('guest_city', event.target.value)} placeholder="City (optional)"/></label>
        </div>
      </section>

      <section className="admin-panel walkin-section">
        <div className="walkin-section-title"><span>02</span><div><h2>Stay details</h2><p>Select room type and dates to see available rooms.</p></div></div>
        <div className="walkin-fields">
          <label>Room type *<select value={form.room_type_id} onChange={event => updateRoomType(event.target.value)} disabled={typesLoading}><option value="">{typesLoading ? 'Loading room types…' : 'Choose room type'}</option>{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select>{errors.room_type_id && <small>{errors.room_type_id}</small>}</label>
          <label>Room number *<select value={form.room_id} onChange={event => chooseRoom(event.target.value)} disabled={!form.room_type_id || !form.check_in || !form.check_out || roomsLoading}><option value="">{roomsLoading ? 'Checking dates…' : 'Choose available room'}</option>{rooms.map(room => <option key={room.id} value={room.id}>{room.room_name} · ₹{Number(room.price_per_night || 0).toLocaleString('en-IN')}/night</option>)}</select>{errors.room_id && <small>{errors.room_id}</small>}{availabilityError && <small>{availabilityError}</small>}{form.room_type_id && !roomsLoading && !availabilityError && rooms.length === 0 && <small>No available rooms for these dates.</small>}</label>
          <label>Check-in *<span className="walkin-date-input"><CalendarDays size={16}/><input type="date" min={todayInIndia()} value={form.check_in} onChange={event => update('check_in', event.target.value)}/></span>{errors.check_in && <small>{errors.check_in}</small>}</label>
          <label>Check-out *<span className="walkin-date-input"><CalendarDays size={16}/><input type="date" min={nextDate(form.check_in || todayInIndia())} value={form.check_out} onChange={event => update('check_out', event.target.value)}/></span>{errors.check_out && <small>{errors.check_out}</small>}</label>
          <label>Adults<input type="number" min="1" step="1" value={form.adults} onChange={event => update('adults', event.target.value)}/>{errors.adults && <small>{errors.adults}</small>}</label>
          <label>Children<input type="number" min="0" step="1" value={form.children} onChange={event => update('children', event.target.value)}/>{errors.children && <small>{errors.children}</small>}</label>
          {errors.guests && <small className="walkin-wide-error">{errors.guests}</small>}
          <label className="walkin-wide">Special requests<textarea rows="3" value={form.special_requests} onChange={event => update('special_requests', event.target.value)} placeholder="Anything the reception team should know?"/></label>
        </div>
      </section>

      <section className="admin-panel walkin-section">
        <div className="walkin-section-title"><span>03</span><div><h2>Payment</h2><p>Review charges and record the amount collected.</p></div></div>
        <div className="walkin-fields">
          <label>Price per night *<input type="number" min="0" step="0.01" value={form.room_price} onChange={event => update('room_price', event.target.value)} placeholder="Auto-filled from room"/>{errors.room_price && <small>{errors.room_price}</small>}</label>
          <label>Nights<input value={nights} readOnly/></label>
          <label>Subtotal<input value={subtotal.toFixed(2)} readOnly/></label>
          <label>Tax<input type="number" min="0" step="0.01" value={form.taxes_amount} onChange={event => update('taxes_amount', event.target.value)}/>{errors.taxes_amount && <small>{errors.taxes_amount}</small>}</label>
          <label>Discount<input type="number" min="0" step="0.01" value={form.discount_amount} onChange={event => update('discount_amount', event.target.value)}/>{errors.discount_amount && <small>{errors.discount_amount}</small>}</label>
          <label>Total<input className="walkin-total-input" value={total.toFixed(2)} readOnly/></label>
          <label>Advance paid<input type="number" min="0" step="0.01" value={form.advance_paid} onChange={event => update('advance_paid', event.target.value)}/>{errors.advance_paid && <small>{errors.advance_paid}</small>}</label>
          <label>Balance due<input value={balance.toFixed(2)} readOnly/></label>
          <label>Payment method *<select value={form.payment_method} onChange={event => update('payment_method', event.target.value)}>{PAYMENT_METHODS.map(method => <option key={method}>{method}</option>)}</select>{errors.payment_method && <small>{errors.payment_method}</small>}</label>
          <label>Payment status<select value={paymentStatus} disabled><option value="paid">Paid</option><option value="partial">Partial</option><option value="pending">Pending</option></select><small>Calculated from advance paid and total.</small></label>
        </div>
      </section>

      <section className="admin-panel walkin-section walkin-confirm-section">
        <div><span className="admin-eyebrow">BOOKING STATUS</span><h2>Confirm this stay</h2><p>New walk-in bookings are confirmed by default.</p></div>
        <div className="walkin-source-fields">
          <label>Booking Source *<select required value={form.source} onChange={event => update('source', event.target.value)}>{BOOKING_SOURCES.map(source => <option key={source.value} value={source.value}>{source.label}</option>)}</select>{errors.source && <small>{errors.source}</small>}</label>
          {OTA_BOOKING_SOURCES.has(form.source) && <label>OTA Booking / Reference ID<input value={form.external_ref} onChange={event => update('external_ref', event.target.value)} placeholder="Optional booking reference"/></label>}
        </div>
        <label className="walkin-checkin-toggle"><input type="checkbox" checked={form.check_in_now} disabled={form.check_in !== todayInIndia()} onChange={event => update('check_in_now', event.target.checked)}/><span><b>Check in now</b><small>Mark today’s guest as checked in immediately.</small></span></label>
        {errors.submit && <p className="walkin-error-banner" role="alert">{errors.submit}</p>}
        <div className="walkin-submit-row"><Link className="admin-btn admin-btn-light" to="/admin/bookings">Cancel</Link><button className="admin-btn admin-btn-gold" type="submit" disabled={saving || roomsLoading || typesLoading}>{saving ? <><LoaderCircle className="walkin-spinner" size={17}/>Saving booking…</> : <><Save size={17}/>Create booking · ₹{total.toLocaleString('en-IN')}</>}</button></div>
      </section>
    </form>
  </div>;
}
