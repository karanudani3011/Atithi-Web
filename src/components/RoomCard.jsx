import { Link } from 'react-router-dom';
import Img from './Img.jsx';

export default function RoomCard({ room }) {
  const unavailable = room.status === 'Maintenance' || room.status === 'Booked';

  return (
    <article className="room-card">
      <div className="room-image">
        <Link
          to={`/room/${room.id}`}
          className="room-image-clickable"
          aria-label={`View details for ${room.name}`}
        >
          <Img src={room.image} alt={`${room.name} at Atithi`} />
        </Link>
        <span className="room-type">{room.type}</span>
        <span className="rating">★ {room.rating}</span>
        {unavailable && (
          <span className="unavailable-ribbon">
            {room.status === 'Maintenance' ? 'Not available' : 'Booked'}
          </span>
        )}
      </div>

      <div className="room-body">
        <h3 className="room-title">
          <Link to={`/room/${room.id}`} className="room-title-link">
            {room.name}
          </Link>
        </h3>
        <p className="room-meta">
          <span>{room.size} m²</span>
          <span className="meta-dot">·</span>
          <span>Up to {room.guests} guests</span>
          {room.bed && (
            <>
              <span className="meta-dot">·</span>
              <span>{room.bed}</span>
            </>
          )}
        </p>

        <p className="room-desc">{room.description}</p>

        <div className="amenities">
          {(room.amenities || []).slice(0, 4).map((amenity) => (
            <span key={amenity}>{amenity}</span>
          ))}
        </div>

        <div className="room-bottom">
          <div className="room-price-wrap">
            <strong className="room-price">
              ₹{Number(room.price).toLocaleString('en-IN')}{' '}
              <small>/ night</small>
            </strong>
          </div>

          <div className="room-card-actions">
            <Link
              to={`/room/${room.id}`}
              className="btn-card btn-card-outline"
            >
              View Details
            </Link>
            {unavailable ? (
              <span className="unavailable-text">
                {room.status === 'Maintenance' ? 'Not available' : 'Booked'}
              </span>
            ) : (
              <Link
                to={`/booking?room=${room.id}`}
                className="btn-card btn-card-gold"
              >
                Book Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
