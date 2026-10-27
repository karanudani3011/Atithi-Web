export const getRoomCover = (room) => Array.isArray(room?.image_urls) ? room.image_urls.find(Boolean) || '' : '';
export const getRoomAmenities = (room) => Array.isArray(room?.amenities) ? room.amenities.filter(Boolean) : [];
export const isRoomBookable = (room) => room?.status === 'available';
export const roomPrice = (room) => Number(room?.price_per_night || 0);
export const roomCapacity = (room) => Number(room?.capacity || 0);
