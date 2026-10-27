export const BOOKING_SOURCES = [
  { value: 'website', label: 'Website', color: 'navy' },
  { value: 'walk-in', label: 'Walk-in', color: 'gold' },
  { value: 'agoda', label: 'Agoda', color: 'purple' },
  { value: 'booking.com', label: 'Booking.com', color: 'blue' },
  { value: 'makemytrip', label: 'MakeMyTrip', color: 'red' },
  { value: 'goibibo', label: 'Goibibo', color: 'orange' },
  { value: 'airbnb', label: 'Airbnb', color: 'pink' },
  { value: 'expedia', label: 'Expedia', color: 'yellow' },
  { value: 'phone', label: 'Phone Call', color: 'teal' },
  { value: 'other', label: 'Other', color: 'grey' },
];

export const OTA_BOOKING_SOURCES = new Set([
  'agoda', 'booking.com', 'makemytrip', 'goibibo', 'airbnb', 'expedia',
]);

export function getBookingSource(value) {
  return BOOKING_SOURCES.find(source => source.value === value) || BOOKING_SOURCES[0];
}
