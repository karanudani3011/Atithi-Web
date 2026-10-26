import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Img from './Img.jsx';

export default function RoomCard({ room }) {
  const unavailable = room.status === 'Maintenance' || room.status === 'Booked';
  return <article className="room-card">
    <div className="room-image">
      <Link to={`/room/${room.id}`} className="room-image-clickable" aria-label={`View details for ${room.name}`}><Img src={room.image} alt={`${room.name} at Atithi`} /></Link>
      <span className="room-type">{room.type}</span><span className="rating">★ {room.rating}</span>
      {unavailable && <span className="unavailable-ribbon">{room.status === 'Maintenance' ? 'Not available' : 'Booked'}</span>}
    </div>
    <div className="room-body"><h3 className="room-title"><Link to={`/room/${room.id}`} className="room-title-link">{room.name}</Link></h3>
      <p className="room-meta"><span>{room.size} m²</span><span className="meta-dot">·</span><span>Up to {room.guests ?? room.max_guests} guests</span>{(room.bed || room.bed_type) && <><span className="meta-dot">·</span><span>{room.bed || room.bed_type}</span></>}</p>
      <p className="room-desc">{room.description}</p><div className="amenities">{(room.amenities || []).slice(0, 4).map(a => <span key={a}>{a}</span>)}</div>
      <div className="room-bottom"><strong>₹{Number(room.price).toLocaleString('en-IN')} <small>/ night</small></strong>{unavailable ? <button type="button" className="btn mini-gold" disabled>Not Available</button> : <Link to={`/booking/${room.id}`} className="btn mini-gold">Book Now <ArrowRight size={15} /></Link>}</div>
    </div>
  </article>;
}
