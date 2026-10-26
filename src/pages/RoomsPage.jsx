import { useState } from 'react';
import Banner from '../components/Banner.jsx';
import Reveal from '../components/Reveal.jsx';
import RoomCard from '../components/RoomCard.jsx';
import useRooms from '../hooks/useRooms.js';

const filters = ['All', 'Deluxe', 'Suite', 'Family', 'Villa'];

export default function RoomsPage() {
  const [filter, setFilter] = useState('All');
  const rooms = useRooms();

  const list = filter === 'All' ? rooms : rooms.filter((x) => x.type === filter);

  return (
    <>
      <Banner
        eyebrow="REST WELL, FEEL AT HOME"
        title={
          <>
            Rooms & <i>Suites</i>
          </>
        }
        subtitle="Spaces made for unhurried mornings and memorable nights."
      />

      <section className="section rooms-page">
        <div className="filter-row" role="tablist" aria-label="Room categories">
          {filters.map((category) => (
            <button
              key={category}
              role="tab"
              aria-selected={filter === category}
              className={filter === category ? 'filter active' : 'filter'}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="room-grid">
          {list.map((room, i) => (
            <Reveal key={room.id} delay={i * 0.06}>
              <RoomCard room={room} />
            </Reveal>
          ))}
        </div>

        {list.length === 0 && (
          <div className="rooms-empty">
            <h3>No rooms found in this category</h3>
            <p>Please check our other categories for current availability.</p>
            <button
              className="btn gold"
              onClick={() => setFilter('All')}
              style={{ marginTop: '16px' }}
            >
              View All Rooms
            </button>
          </div>
        )}
      </section>
    </>
  );
}
