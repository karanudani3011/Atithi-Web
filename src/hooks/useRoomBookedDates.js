import { useCallback, useEffect, useState } from 'react';
import { getBookedRanges } from '../services/bookingService.js';
import { expandBookedRanges } from '../booking/availabilityDates.js';
import { localDateString, nextDate } from '../components/common/dateOnly.js';

function addDays(date, amount) {
  let value = date;
  for (let index = 0; index < amount; index += 1) value = nextDate(value);
  return value;
}

export default function useRoomBookedDates(roomId) {
  const [state, setState] = useState({ bookedDates: [], loading: false, error: null, loadedRoomId: '' });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!roomId) {
      setState({ bookedDates: [], loading: false, error: null, loadedRoomId: '' });
      return undefined;
    }
    let active = true;
    const id = String(roomId);
    const from = localDateString();
    const to = addDays(from, 366);
    setState({ bookedDates: [], loading: true, error: null, loadedRoomId: '' });
    getBookedRanges(id, from, to)
      .then(ranges => {
        if (active) setState({ bookedDates: expandBookedRanges(ranges), loading: false, error: null, loadedRoomId: id });
      })
      .catch(error => {
        console.error('[room availability] booked dates could not be loaded', { roomId: id, message: error.message, code: error.code, details: error.details, hint: error.hint, error });
        // Fail open so the calendar remains usable; the booking RPC remains authoritative.
        if (active) setState({ bookedDates: [], loading: false, error, loadedRoomId: id });
      });
    return () => { active = false; };
  }, [roomId, revision]);

  return { ...state, refresh };
}
