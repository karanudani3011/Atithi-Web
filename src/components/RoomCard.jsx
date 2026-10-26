import { Link } from 'react-router-dom';
import { ArrowRight, Wifi, Tv, Snowflake, ConciergeBell, Baby, BriefcaseBusiness, Coffee, Check } from 'lucide-react';
import Img from './Img.jsx';
import { getRoomAmenities, getRoomCover, isRoomBookable, roomCapacity, roomPrice } from '../lib/roomUtils.js';

const amenityMap = {
  wifi: ['Wi-Fi', Wifi], tv: ['TV', Tv], ac: ['AC', Snowflake], air_conditioning: ['AC', Snowflake],
  room_service: ['Room Service', ConciergeBell], kids_friendly: ['Kids Friendly', Baby],
  work_desk: ['Work Desk', BriefcaseBusiness], mini_bar: ['Mini Bar', Coffee], minibar: ['Mini Bar', Coffee],
};
function amenityDetails(value) {
  const key = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const mapped = amenityMap[key];
  if (mapped) return { label: mapped[0], Icon: mapped[1] };
  const normalized = String(value).replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  return { label: normalized, Icon: Check };
}

export default function RoomCard({ room, bookingQuery = {} }) {
  const unavailable = !isRoomBookable(room);
  const cover = getRoomCover(room);
  const amenities = getRoomAmenities(room).slice(0, 4).map(amenityDetails);
  const bookingParams = new URLSearchParams();
  if (bookingQuery.checkIn) bookingParams.set('checkIn', bookingQuery.checkIn);
  if (bookingQuery.checkOut) bookingParams.set('checkOut', bookingQuery.checkOut);
  if (bookingQuery.adults) bookingParams.set('adults', bookingQuery.adults);
  if (bookingQuery.children != null) bookingParams.set('children', bookingQuery.children);
  const bookingUrl = `/booking/${room.id}${bookingParams.size ? `?${bookingParams}` : ''}`;
  return <article className="room-card">
    <div className="room-image">
      <Link to={`/room/${room.id}`} className="room-image-clickable" aria-label={`View details for ${room.room_name}`}><Img src={cover} alt={`${room.room_name} at Atithi`} /></Link>
      <span className="room-type">{room.room_type}</span>
      {room.rating != null && <span className="rating">★ {room.rating}</span>}
      {unavailable && <span className="unavailable-ribbon">Not available</span>}
    </div>
    <div className="room-body">
      <h3 className="room-title"><Link to={`/room/${room.id}`} className="room-title-link">{room.room_name}</Link></h3>
      <p className="room-meta"><span>{room.size_sqft ? `${room.size_sqft} sq ft` : 'Size not listed'}</span><span className="meta-dot">·</span><span>Up to {roomCapacity(room)} guests</span>{room.bed_info && <><span className="meta-dot">·</span><span>{room.bed_info}</span></>}</p>
      <p className="room-desc">{room.description}</p>
      <div className="amenities">{amenities.map(({ label, Icon }, index) => <span key={`${label}-${index}`}><Icon size={13} aria-hidden="true"/>{label}</span>)}</div>
      <div className="room-bottom">
        <strong>₹{roomPrice(room).toLocaleString('en-IN')} <small>/ night</small></strong>
        {unavailable ? <button type="button" className="btn mini-gold" disabled>Not Available</button> : <Link to={bookingUrl} className="btn mini-gold">Book Now <ArrowRight size={15} /></Link>}
      </div>
    </div>
  </article>;
}
