import { STATUS_COLORS } from '../constants.js';
export default function StatusBadge({ status }) { const value = String(status || 'pending').toLowerCase(); return <span className={`admin-state-badge ${STATUS_COLORS[value] || 'amber'}`}>{value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>; }
