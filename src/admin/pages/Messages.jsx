import { useCallback, useEffect, useState } from 'react';
import { Search, Mail, Trash2, ChevronLeft, ChevronRight, Inbox, Eye, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteMessage, listMessages } from '../../services/admin/adminMessageService.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import MessageModal from '../components/MessageModal.jsx';
import useRealtimeTable from '../../hooks/useRealtimeTable.js';

const date = value => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function Messages() {
  const [rows, setRows] = useState([]), [count, setCount] = useState(0), [query, setQuery] = useState(''), [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [view, setView] = useState(null), [pending, setPending] = useState(null), [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await listMessages({ search: query, page }); setRows(result.data); setCount(result.count); }
    catch (failure) { setError(failure.message); toast.error(failure.message); }
    finally { setLoading(false); }
  }, [query, page]);
  useEffect(() => { refresh(); }, [refresh]);
  const { liveAvailable } = useRealtimeTable({ table: 'contact_messages', event: 'INSERT', onChange: () => { void refresh(); } });

  async function remove() {
    if (!pending || busy) return;
    setBusy(true);
    try { await deleteMessage(pending.id); toast.success('Message deleted'); setPending(null); await refresh(); }
    catch (failure) { toast.error(failure.message); }
    finally { setBusy(false); }
  }

  return <div className="admin-page">
    <div className="admin-page-heading"><div><span className="admin-eyebrow">GUEST CORRESPONDENCE</span><h1>Contact <i>Messages</i></h1><p>Messages submitted through your website.</p></div><span className="admin-count-pill">{count} messages</span></div>
    {liveAvailable === false && <p className="admin-live-unavailable" role="status">Live updates unavailable. Messages still load normally.</p>}
    <label className="admin-search admin-service-search"><Search/><input value={query} onChange={event => { setPage(0); setQuery(event.target.value); }} placeholder="Search name, email, phone or message"/></label>
    {error ? <div className="admin-empty"><p>{error}</p><button className="admin-btn admin-btn-light" onClick={refresh}>Retry</button></div>
      : loading ? <div className="admin-room-grid">{[1, 2, 3].map(item => <div className="admin-panel admin-skeleton-card" key={item}><span/><span/></div>)}</div>
        : rows.length ? <>
          <div className="admin-message-list">{rows.map(message => <article className="admin-panel admin-message-card" key={message.id}><div className="admin-message-avatar">{message.name?.slice(0, 1).toUpperCase()}</div><div className="admin-message-main"><header><div><h2>{message.name}</h2><span>{message.email} {message.phone && `· ${message.phone}`}</span></div><time>{date(message.created_at)}</time></header><p>{message.message}</p><footer><button className="admin-btn admin-btn-light" onClick={() => setView(message)}><Eye size={15}/>View message</button><a className="admin-icon-btn" href={`mailto:${message.email}`} aria-label="Email guest"><Mail size={16}/></a>{message.phone && <a className="admin-icon-btn" href={`tel:${message.phone}`} aria-label="Call guest"><Phone size={16}/></a>}<button className="admin-icon-btn delete" aria-label="Delete message" onClick={() => setPending(message)}><Trash2 size={16}/></button></footer></div></article>)}</div>
          <div className="admin-pagination"><span>{count} messages · Page {page + 1} of {Math.max(1, Math.ceil(count / 20))}</span><button className="admin-icon-btn" aria-label="Previous page" disabled={!page} onClick={() => setPage(value => value - 1)}><ChevronLeft/></button><button className="admin-icon-btn" aria-label="Next page" disabled={(page + 1) * 20 >= count} onClick={() => setPage(value => value + 1)}><ChevronRight/></button></div>
        </> : <div className="admin-empty"><Inbox/><h2>No messages yet</h2><p>Contact form submissions will appear here.</p></div>}
    <MessageModal message={view} onClose={() => setView(null)}/>
    <ConfirmDialog open={Boolean(pending)} title="Delete this message?" confirmText={busy ? 'Deleting…' : 'Delete message'} onCancel={() => !busy && setPending(null)} onConfirm={remove}>This permanently removes the contact message.</ConfirmDialog>
  </div>;
}
