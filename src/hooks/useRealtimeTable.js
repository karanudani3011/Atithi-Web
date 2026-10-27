import { useEffect, useRef, useState } from 'react';
import { adminSupabase } from '../lib/adminSupabase.js';

const newChannelId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Owns one Supabase Realtime channel for this effect lifetime. */
export default function useRealtimeTable({ table, onChange, enabled = true, event = '*' }) {
  const onChangeRef = useRef(onChange);
  const [liveAvailable, setLiveAvailable] = useState(null);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled || !table) {
      setLiveAvailable(null);
      return undefined;
    }

    let active = true;
    let channel;
    setLiveAvailable(null);
    try {
      channel = adminSupabase
        .channel(`admin-${table}-${newChannelId()}`)
        .on('postgres_changes', { event, schema: 'public', table }, payload => {
          if (active) onChangeRef.current?.(payload);
        })
        .subscribe((status, error) => {
          if (!active) return;
          if (status === 'SUBSCRIBED') setLiveAvailable(true);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setLiveAvailable(false);
            console.warn(`[admin realtime] ${table} live updates unavailable`, error || status);
          }
        });
    } catch (error) {
      setLiveAvailable(false);
      console.warn(`[admin realtime] ${table} subscription could not start`, error);
    }

    return () => {
      active = false;
      if (channel) {
        adminSupabase.removeChannel(channel).catch(error => {
          console.warn(`[admin realtime] ${table} channel cleanup failed`, error);
        });
      }
    };
  }, [enabled, table, event]);

  return { liveAvailable };
}
