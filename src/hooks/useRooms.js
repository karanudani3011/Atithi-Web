import {useCallback,useEffect,useState} from 'react';
import {getRooms,roomsChangedEvent} from '../services/roomService.js';
export default function useRooms(){const [rooms,setRooms]=useState(()=>getRooms());const refresh=useCallback(()=>setRooms(getRooms()),[]);useEffect(()=>{window.addEventListener(roomsChangedEvent,refresh);return()=>window.removeEventListener(roomsChangedEvent,refresh)},[refresh]);return rooms}
