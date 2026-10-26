import { Link } from 'react-router-dom';
import { ArrowRight, Wifi, Tv, Snowflake, ConciergeBell, Baby, BriefcaseBusiness, Coffee, Check } from 'lucide-react';
import Img from './Img.jsx';
import './RoomCard.css';
import { getRoomAmenities, getRoomCover, isRoomBookable, roomCapacity, roomPrice } from '../lib/roomUtils.js';
import { formatINR } from '../services/roomService.js';

const amenityMap = { wifi:['Wi-Fi',Wifi],tv:['TV',Tv],ac:['AC',Snowflake],air_conditioning:['AC',Snowflake],room_service:['Room Service',ConciergeBell],kids_friendly:['Kids Friendly',Baby],work_desk:['Work Desk',BriefcaseBusiness],mini_bar:['Mini Bar',Coffee],minibar:['Mini Bar',Coffee] };
function amenityDetails(value){const key=String(value).trim().toLowerCase().replace(/[\s-]+/g,'_');const item=amenityMap[key];if(item)return{label:item[0],Icon:item[1]};return{label:String(value).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()),Icon:Check};}
function paramsFor(values={}){const params=new URLSearchParams();for(const key of ['roomId','checkIn','checkOut','adults','children'])if(values[key]!==undefined&&values[key]!==null&&values[key]!=='')params.set(key,String(values[key]));return params;}

export default function RoomCard({room,bookingQuery={}}){
  const unavailable=!isRoomBookable(room);const cover=getRoomCover(room);const amenities=getRoomAmenities(room).slice(0,4).map(amenityDetails);const params=paramsFor(bookingQuery);const suffix=params.size?`?${params}`:'';
  const rawName=String(room.room_name||room.name||'Stay');const numericName=/^\d+$/.test(rawName);const roomType=room.room_type||room.type||'Room';const title=numericName?(/\broom\b/i.test(roomType)?roomType:`${roomType} Room`):rawName;
  const detailsUrl=`/rooms/${room.id}${suffix}`;const bookingParams=paramsFor({roomId:room.id,...bookingQuery});const bookingUrl=`/booking?${bookingParams}`;
  return <article className="room-card room-card-stretch">
    <div className="room-image room-card-image"><Link to={detailsUrl} className="room-image-clickable" aria-label={`View details for ${title}`}><Img src={cover} alt={`${title} at Atithi`} /></Link><span className="room-type">{room.room_type||room.type}</span>{room.rating!=null&&<span className="rating">★ {room.rating}</span>}{unavailable&&<span className="unavailable-ribbon">Not available</span>}</div>
    <div className="room-body room-card-body">
      <div><h3 className="room-title"><Link to={detailsUrl} className="room-title-link">{title}</Link></h3>{numericName&&<span className="room-number-label">Room {rawName}</span>}</div>
      <p className="room-meta"><span>{room.size_sqft||room.sizeSqFt?`${room.size_sqft||room.sizeSqFt} sq ft`:'Size not listed'}</span><span className="meta-dot">·</span><span>Up to {roomCapacity(room)} guests</span>{room.bed_info&&<><span className="meta-dot">·</span><span>{room.bed_info}</span></>}</p>
      <p className="room-desc room-card-desc">{room.description||'A thoughtfully appointed stay with Atithi hospitality.'}</p>
      <div className="amenities room-card-amenities">{amenities.map(({label,Icon},index)=><span key={`${label}-${index}`}><Icon size={13} aria-hidden="true"/>{label}</span>)}</div>
      <div className="room-bottom room-card-bottom"><strong>{room.price==null?'Price on request':formatINR(room.price)}<small> / night</small></strong><div className="room-card-actions"><Link to={detailsUrl} className="room-card-view">View Details</Link>{unavailable?<button type="button" className="room-card-book" disabled aria-label={`${title} is not available`}>Not Available</button>:<Link to={bookingUrl} className="room-card-book">Book Now <ArrowRight size={14}/></Link>}</div></div>
    </div>
  </article>;
}
