import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BedDouble, Check, ChevronLeft, ChevronRight, Clock3, Maximize2, ShieldCheck, Users, Wifi, Tv, Snowflake, Coffee, Sofa, Sparkles, RotateCw } from 'lucide-react';
import DateField from '../components/common/DateField.jsx';
import GuestStepper from '../components/common/GuestStepper.jsx';
import Img from '../components/Img.jsx';
import RoomCard from '../components/RoomCard.jsx';
import { getRoomById, getRooms, getAvailableRoomIds, formatINR } from '../services/roomService.js';
import { getBookedRanges } from '../services/bookingService.js';
import { isRoomBookable } from '../lib/roomUtils.js';
import { localDateString, nextDate } from '../components/common/dateOnly.js';
import './RoomDetailsPage.css';

const amenityIcons = [[/wifi|wi-fi/i,Wifi],[/tv|television/i,Tv],[/air|condition|ac/i,Snowflake],[/coffee|mini.?bar/i,Coffee],[/sofa|seating/i,Sofa],[/spa|pool|view/i,Sparkles],[/bed/i,BedDouble]];
const iconFor = (name) => amenityIcons.find(([pattern]) => pattern.test(name))?.[1] || Check;
const today=localDateString();
export default function RoomDetailsPage(){
  const {id}=useParams();const [searchParams]=useSearchParams();
  const [room,setRoom]=useState(null),[similar,setSimilar]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [activeImage,setActiveImage]=useState(0),[lightbox,setLightbox]=useState(-1),[touchX,setTouchX]=useState(null),[bookedRanges,setBookedRanges]=useState([]),[availabilityError,setAvailabilityError]=useState(''),[availableSimilarIds,setAvailableSimilarIds]=useState(null);
  const [stay,setStay]=useState(()=>({checkIn:searchParams.get('checkIn')||'',checkOut:searchParams.get('checkOut')||'',adults:Math.max(1,Math.min(6,Number(searchParams.get('adults'))||1)),children:Math.max(0,Math.min(4,Number(searchParams.get('children'))||0))}));
  const load=useCallback(async()=>{setLoading(true);setError('');try{const [found,all]=await Promise.all([getRoomById(id),getRooms()]);setRoom(found);setSimilar(found?all.filter(item=>String(item.id)!==String(id)&&item.room_type===found.room_type).slice(0,3):[]);setActiveImage(0);}catch(e){console.error('[room details] load failed',e);setError(e?.message||'Room details could not load. Please try again.');}finally{setLoading(false);}},[id]);
  useEffect(()=>{load();window.scrollTo({top:0,left:0,behavior:'instant'});},[load]);
  useEffect(()=>{if(!room?.id)return;let active=true;const refresh=()=>{setAvailabilityError('');getBookedRanges(room.id).then(data=>active&&setBookedRanges(data)).catch(error=>active&&setAvailabilityError(error?.message||'Availability could not be checked.'));if(stay.checkIn&&stay.checkOut>stay.checkIn)getAvailableRoomIds(stay.checkIn,stay.checkOut).then(ids=>active&&setAvailableSimilarIds(ids)).catch(()=>active&&setAvailableSimilarIds(null));else setAvailableSimilarIds(null);};refresh();window.addEventListener('focus',refresh);return()=>{active=false;window.removeEventListener('focus',refresh);};},[room?.id,stay.checkIn,stay.checkOut]);
  const gallery=useMemo(()=>room?.image_urls?.filter(Boolean)||[],[room]);
  const moveImage=useCallback((direction)=>{const count=gallery.length;if(count>1)setLightbox(index=>(index+direction+count)%count);},[gallery.length]);
  useEffect(()=>{if(lightbox<0)return;const onKey=(e)=>{if(e.key==='Escape')setLightbox(-1);if(e.key==='ArrowRight')moveImage(1);if(e.key==='ArrowLeft')moveImage(-1);};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[lightbox,moveImage]);
  if(loading)return <main className="room-detail-loading" aria-label="Loading room details"><div className="detail-skeleton detail-gallery-skeleton"/><div className="detail-skeleton detail-info-skeleton"/></main>;
  if(error)return <main className="room-detail-state"><h1>Room details load na thaya</h1><p>{error}</p><button className="btn gold" onClick={load}><RotateCw size={16}/> Retry</button></main>;
  if(!room)return <main className="room-detail-state"><h1>Room not found</h1><p>This room may have been removed or is no longer available.</p><Link className="btn gold" to="/rooms"><ArrowLeft size={16}/> Back to Rooms</Link></main>;
  const numericName=/^\d+$/.test(String(room.room_name||''));const typeName=room.room_type||'Room';const roomTitle=numericName?(/\broom\b/i.test(typeName)?typeName:`${typeName} Room`):room.room_name;
  const nights=stay.checkIn&&stay.checkOut&&stay.checkOut>stay.checkIn?Math.round((new Date(`${stay.checkOut}T12:00:00`)-new Date(`${stay.checkIn}T12:00:00`))/86400000):0;
  const subtotal=(room.price||0)*nights;const tax=Math.round(subtotal*.12*100)/100;const total=subtotal+tax;
  const bookingParams=new URLSearchParams({roomId:String(room.id)});Object.entries(stay).forEach(([key,value])=>{if(value!==''&&value!=null)bookingParams.set(key,String(value));});
  const bookingUrl=`/booking?${bookingParams.toString()}`;const roomsParams=new URLSearchParams(searchParams);const backUrl=`/rooms${roomsParams.size?`?${roomsParams}`:''}`;
  const unavailable=!isRoomBookable(room);
  const overlapsStay=Boolean(stay.checkIn&&stay.checkOut&&bookedRanges.some(range=>range.check_in<stay.checkOut&&range.check_out>stay.checkIn));
  const unavailableForDates=unavailable||overlapsStay;
  const checkInBlocked=date=>bookedRanges.some(range=>range.check_in<=date&&range.check_out>date);
  const checkOutBlocked=date=>!stay.checkIn||date<=stay.checkIn||bookedRanges.some(range=>stay.checkIn<range.check_out&&date>range.check_in&&date<=range.check_out);
  return <main className="room-details-page-v2">
    <div className="room-detail-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to={backUrl}>Rooms</Link><span>/</span><b>{roomTitle}</b></div>
    <div className="room-detail-head"><Link className="room-detail-back" to={backUrl}><ArrowLeft size={16}/> Back to Rooms</Link><div><span className="room-detail-type">{room.room_type}</span><h1>{roomTitle}</h1>{numericName&&<small>Room {room.room_name}</small>}{room.rating!=null&&<span className="room-detail-rating">★ {room.rating} <small>Guest rating</small></span>}</div></div>
    <div className="room-detail-layout-v2">
      <div className="room-detail-main-column">
        <section className="room-detail-gallery" aria-label="Room photo gallery">
          <button type="button" className="room-gallery-main" onClick={()=>gallery.length&&setLightbox(activeImage)} aria-label="Open room image in fullscreen" onTouchStart={(e)=>setTouchX(e.touches[0].clientX)} onTouchEnd={(e)=>{if(touchX!==null&&Math.abs(e.changedTouches[0].clientX-touchX)>45)setActiveImage(i=>(i+(e.changedTouches[0].clientX<touchX?1:-1)+gallery.length)%gallery.length);setTouchX(null);}}>
            <Img src={gallery[activeImage]} alt={`${roomTitle} room photo ${activeImage+1}`} />{gallery.length>1&&<span className="room-gallery-expand"><Maximize2 size={17}/></span>}
          </button>
          {gallery.length>1&&<><button type="button" className="room-gallery-arrow left" aria-label="Previous photo" onClick={()=>setActiveImage(i=>(i-1+gallery.length)%gallery.length)}><ChevronLeft/></button><button type="button" className="room-gallery-arrow right" aria-label="Next photo" onClick={()=>setActiveImage(i=>(i+1)%gallery.length)}><ChevronRight/></button><div className="room-gallery-thumbs">{gallery.map((src,i)=><button key={`${src}-${i}`} type="button" className={i===activeImage?'active':''} onClick={()=>setActiveImage(i)} aria-label={`Show photo ${i+1}`}><Img src={src} alt={`${roomTitle} thumbnail ${i+1}`}/></button>)}</div></>}
        </section>
        <section className="room-detail-panel"><span className="room-detail-eyebrow">YOUR STAY</span><h2>Overview</h2><p className="room-detail-description">{room.description||'Enjoy a comfortable stay with thoughtful amenities and warm Atithi hospitality.'}</p><div className="room-detail-specs"><div><Maximize2/><small>Room size</small><b>{room.size_sqft?`${room.size_sqft} sq ft`:'Not listed'}</b></div><div><Users/><small>Max guests</small><b>Up to {room.capacity||room.guests||'—'}</b></div><div><BedDouble/><small>Bed type</small><b>{room.bed_info||'King Bed'}</b></div><div><Sparkles/><small>Room view</small><b>{room.view||room.floor||'Hotel view'}</b></div></div></section>
        <section className="room-detail-panel"><span className="room-detail-eyebrow">EVERY COMFORT</span><h2>Amenities</h2>{room.amenities?.length?<ul className="room-detail-amenities">{room.amenities.map((amenity,i)=>{const Icon=iconFor(String(amenity));return <li key={`${amenity}-${i}`}><Icon/><span>{String(amenity).replaceAll('_',' ')}</span></li>;})}</ul>:<p className="room-detail-muted">Room amenities will be updated soon.</p>}</section>
        <section className="room-detail-panel"><span className="room-detail-eyebrow">GOOD TO KNOW</span><h2>Policies & Information</h2><div className="room-detail-policies"><div><Clock3/><span><b>Check-in</b><small>{room.check_in_time||'From 12:00 PM'}</small></span></div><div><Clock3/><span><b>Check-out</b><small>{room.check_out_time||'Until 11:00 AM'}</small></span></div><div><ShieldCheck/><span><b>Cancellation</b><small>{room.cancellation_policy||'Free cancellation up to 48 hours before check-in.'}</small></span></div><div><BedDouble/><span><b>Extra bed</b><small>{room.extra_bed_info||'Please contact us to request an extra bed.'}</small></span></div></div></section>
      </div>
      <aside className="room-detail-booking">
        <span className="room-detail-eyebrow">YOUR ATITHI STAY</span><h2>Make it yours</h2><p className="room-detail-price">{formatINR(room.price)} <small>/ night</small></p><small className="room-detail-tax-note">Taxes included in the estimate below (12% GST).</small>
        <DateField id="detail-checkin" label="Check-in" variant="page" min={today} value={stay.checkIn} isDateDisabled={checkInBlocked} onChange={checkIn=>setStay(old=>({...old,checkIn,checkOut:old.checkOut&&old.checkOut<=checkIn?'':old.checkOut}))}/>
        <DateField id="detail-checkout" label="Check-out" variant="page" min={stay.checkIn?nextDate(stay.checkIn):nextDate(today)} value={stay.checkOut} isDateDisabled={checkOutBlocked} onChange={checkOut=>setStay(old=>({...old,checkOut}))}/>
        <div className="room-detail-guests"><GuestStepper label="Adults" value={stay.adults} min={1} max={Math.min(6,room.capacity||6)} variant="page" onChange={adults=>setStay(old=>({...old,adults,children:Math.min(old.children,Math.max(0,(room.capacity||6)-adults))}))}/><GuestStepper label="Children" value={stay.children} min={0} max={Math.min(4,Math.max(0,(room.capacity||6)-stay.adults))} variant="page" onChange={children=>setStay(old=>({...old,children}))}/></div>
        {unavailableForDates&&<p className="room-dates-unavailable" role="alert">Aa dates par room available nathi.</p>}{availabilityError&&<p className="room-dates-unavailable" role="alert">{availabilityError}</p>}
        <div className="room-detail-live-total"><span>{nights?`${nights} night${nights===1?'':'s'} × ${formatINR(room.price)}`:'Select dates to see total'}</span>{nights>0&&<b>{formatINR(subtotal)}</b>}{nights>0&&<><span>GST (12%)</span><b>{formatINR(tax)}</b><strong>Total</strong><strong>{formatINR(total)}</strong></>}</div>
        {unavailableForDates?<button className="btn gold room-detail-book-cta" disabled>Currently unavailable</button>:<Link className="btn gold room-detail-book-cta" to={bookingUrl}>Book Now <ArrowRight size={17}/></Link>}
      </aside>
    </div>
    {similar.length>0&&<section className="room-detail-similar"><div className="section-head"><span className="room-detail-eyebrow">MORE TO DISCOVER</span><h2>Similar <i>rooms</i></h2></div><div className="room-grid">{similar.filter(item=>!availableSimilarIds||availableSimilarIds.includes(String(item.id))).map(item=><RoomCard key={item.id} room={item} bookingQuery={stay}/>)}</div></section>}
    {lightbox>=0&&gallery.length>0&&<div className="room-lightbox" role="dialog" aria-modal="true" aria-label="Room photo fullscreen" onClick={()=>setLightbox(-1)}><button type="button" className="room-lightbox-close" aria-label="Close fullscreen photo" onClick={()=>setLightbox(-1)}>×</button>{gallery.length>1&&<button type="button" className="room-lightbox-arrow left" aria-label="Previous photo" onClick={e=>{e.stopPropagation();moveImage(-1)}}><ChevronLeft/></button>}<div className="room-lightbox-image" onClick={event=>event.stopPropagation()}><Img src={gallery[lightbox]} alt={`${roomTitle} photo ${lightbox+1} of ${gallery.length}`}/></div>{gallery.length>1&&<button type="button" className="room-lightbox-arrow right" aria-label="Next photo" onClick={e=>{e.stopPropagation();moveImage(1)}}><ChevronRight/></button>}</div>}
    <div className="room-detail-mobile-book"><strong>{formatINR(room.price)} <small>/ night</small></strong>{unavailableForDates?<button type="button" disabled>Currently unavailable</button>:<Link to={bookingUrl} aria-label={`Book ${roomTitle}`}>Book Now <ArrowRight size={16}/></Link>}</div>
  </main>;
}
