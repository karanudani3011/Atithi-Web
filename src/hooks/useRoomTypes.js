import { useEffect, useState } from 'react';
import { getRoomTypes, subscribeToRoomTypes } from '../services/roomTypes.js';

export default function useRoomTypes({ activeOnly = false } = {}) {
  const [allTypes, setAllTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToRoomTypes(types => { if (active) setAllTypes(types); });
    getRoomTypes().then(types => { if (active) { setAllTypes(types); setError(''); } })
      .catch(failure => { if (active) setError(failure?.message || 'Could not load room types.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; unsubscribe(); };
  }, []);
  return {
    types: activeOnly ? allTypes.filter(type => type.is_active) : allTypes,
    loading,
    error,
  };
}
