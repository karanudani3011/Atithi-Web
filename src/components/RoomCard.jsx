import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Img from './Img.jsx';
import { getRoomAmenities, getRoomCover, isRoomBookable, roomCapacity, roomPrice } from '../lib/roomUtils.js';

export default function RoomCard({ room }) {
  const unavailable = !isRoomBookable(room);
  const cover = getRoomCover(room);
  const amenities = getRoomAmenities(room);
  return (
    <article className="room-card">
      <div className="room-image">
        <Link to={`/room/${room.id}`} className="room-image-clickable" aria-label={`View details for ${room.room_name}`}>
          <Img src={cover} alt={`${room.room_name} at Atithi`} />
        </Link>
        <span className="room-type">{room.room_type}</span>
        {room.rating != null && <span className="rating">★ {room.rating}</span>}
        {unavailable && <span className="unavailable-ribbon">Not available</span>}
      </div>
      <div className="room-body">
        <h3 className="room-title"><Link to={`/room/${room.id}`} className="room-title-link">{room.room_name}</Link></h3>
        <p className="room-meta">
          <span>{room.size_sqft ? `${room.size_sqft} sq ft` : 'Size not listed'}</span>
          <span className="meta-dot">·</span>
          <span>Up to {roomCapacity(room)} guests</span>
          {room.bed_info && <><span className="meta-dot">·</span><span>{room.bed_info}</span></>}
        </p>
        <p className="room-desc">{room.description}</p>
        <div className="amenities">{amenities.slice(0, 4).map((amenity) => <span key={amenity}>{amenity}</span>)}</div>
        <div className="room-bottom">
          <strong>₹{roomPrice(room).toLocaleString('en-IN')} <small>/ night</small></strong>
          {unavailable
            ? <button type="button" className="btn mini-gold" disabled>Not Available</button>
            : <Link to={`/booking/${room.id}`} className="btn mini-gold">Book Now <ArrowRight size={15} /></Link>}
        </div>
      </div>
    </article>
  );
}
