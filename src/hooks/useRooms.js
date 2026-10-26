import { useCallback, useEffect, useState } from 'react';
import { getRooms, subscribeToRoomChanges } from '../services/roomService.js';

export default function useRooms({ limit, ratingFirst = false } = {}) {
  const [rooms, setRooms] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const refresh = useCallback(async () => { setLoading(true); setError(''); try { setRooms(await getRooms({ limit, ratingFirst })); } catch (failure) { console.error('[rooms] load failed', failure); setError(failure?.message || 'Could not load rooms.'); } finally { setLoading(false); } }, [limit, ratingFirst]);
  useEffect(() => { refresh();const unsubscribe=subscribeToRoomChanges(()=>refresh());return unsubscribe; }, [refresh]);
  return { rooms, loading, error, retry: refresh };
}
