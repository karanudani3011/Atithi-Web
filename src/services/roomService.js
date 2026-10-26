import {rooms as seedRooms} from '../data/rooms.js';
const KEY='atithi_rooms',EVENT='atithi:rooms-changed';
function read(){try{const value=JSON.parse(localStorage.getItem(KEY)||'null');return Array.isArray(value)?value:null}catch{return null}}
function seed(){
  const current=read();
  if(!current){
    const copy=seedRooms.map(room=>({...room,status:room.status||'Available'}));
    localStorage.setItem(KEY,JSON.stringify(copy));
    return copy;
  }
  const merged=current.map(item=>{
    const seed=seedRooms.find(s=>String(s.id)===String(item.id));
    if(!seed) return item;
    return {
      ...seed,
      ...item,
      gallery: (item.gallery && item.gallery.length) ? item.gallery : seed.gallery,
      bed: item.bed || seed.bed,
      longDescription: item.longDescription || seed.longDescription,
      amenities: (item.amenities && item.amenities.length > 4) ? item.amenities : seed.amenities
    };
  });
  localStorage.setItem(KEY,JSON.stringify(merged));
  return merged;
}
function write(rooms){localStorage.setItem(KEY,JSON.stringify(rooms));window.dispatchEvent(new CustomEvent(EVENT));return rooms}
export function getRooms(){return seed()}
export function addRoom(room){const list=getRooms(),id=Math.max(0,...list.map(item=>Number(item.id)||0))+1;const created={...room,id,amenities:Array.isArray(room.amenities)?room.amenities:[],gallery:room.gallery||[room.image]};write([...list,created]);return created}
export function updateRoom(id,changes){const list=getRooms().map(room=>String(room.id)===String(id)?{...room,...changes,id:room.id,amenities:Array.isArray(changes.amenities)?changes.amenities:room.amenities}:room);write(list);return list.find(room=>String(room.id)===String(id))}
export function deleteRoom(id){return write(getRooms().filter(room=>String(room.id)!==String(id)))}
export const roomsChangedEvent=EVENT;
