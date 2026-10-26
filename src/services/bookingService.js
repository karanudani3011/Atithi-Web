const KEY='atithi_bookings';
export function getAllBookings(){try{const bookings=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(bookings)?bookings:[]}catch{return[]}}
export function saveBooking(booking){const list=getAllBookings();const saved={status:'Confirmed',...booking};list.push(saved);localStorage.setItem(KEY,JSON.stringify(list));return saved;}
export function cancelBooking(bookingId){const updated=getAllBookings().map(item=>item.bookingId===bookingId?{...item,status:'Cancelled'}:item);localStorage.setItem(KEY,JSON.stringify(updated));return updated.find(item=>item.bookingId===bookingId)||null}
export function deleteBooking(bookingId){const updated=getAllBookings().filter(item=>item.bookingId!==bookingId);localStorage.setItem(KEY,JSON.stringify(updated));return updated}
