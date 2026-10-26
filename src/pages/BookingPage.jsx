import { Navigate, useLocation } from 'react-router-dom';

// Keep old links working while sending every reservation through the verified RPC flow.
export default function BookingPage() {
  const location = useLocation();
  const legacy = new URLSearchParams(location.search);
  const params = new URLSearchParams();
  const roomId = legacy.get('roomId') || legacy.get('room') || location.state?.roomId;
  const checkIn = legacy.get('checkIn') || legacy.get('checkin') || location.state?.checkin;
  const checkOut = legacy.get('checkOut') || legacy.get('checkout') || location.state?.checkout;
  const adults = legacy.get('adults') || legacy.get('guests') || location.state?.adults || location.state?.guests;
  if (roomId) params.set('roomId', roomId);
  if (checkIn) params.set('checkIn', checkIn);
  if (checkOut) params.set('checkOut', checkOut);
  if (adults) params.set('adults', adults);
  if (legacy.get('children') || location.state?.children) params.set('children', legacy.get('children') || location.state.children);
  return <Navigate replace to={`/booking${params.size ? `?${params}` : ''}`} state={location.state}/>
}
