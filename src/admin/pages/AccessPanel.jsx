import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Shield, Plus, Edit3, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { createAccessHolder, listAccessHolders, revokeAccess, updateAccessHolder } from '../../services/admin/adminUserService.js';
import useModalA11y from '../useModalA11y.js';
import ConfirmDialog from '../ConfirmDialog.jsx';

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const date = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const labelRole = (role) => role === 'staff' ? 'Staff' : 'Admin';

export default function AccessPanel() {
  const { user: currentUser } = useAdminAuth();
  const [holders, setHolders] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [busy, setBusy] = useState(false), [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' }), [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(null), [pending, setPending] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await listAccessHolders(); setHolders(response.data || []); }
    catch (failure) { const message = failure?.message || 'Could not load access holders.'; setError(message); toast.error(message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  async function submit(event) {
    event.preventDefault();
    const invalid = {};
    if (!form.name.trim()) invalid.name = 'Name is required.';
    if (!emailRx.test(form.email.trim())) invalid.email = 'Enter a valid email address.';
    if (form.password.length < 8) invalid.password = 'Password must be at least 8 characters.';
    setErrors(invalid); if (Object.keys(invalid).length) return;
    setBusy(true);
    try {
      await createAccessHolder({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() });
      setForm({ name: '', email: '', password: '', role: 'admin' }); toast.success(`${labelRole(form.role)} access created`); await refresh();
    } catch (failure) { toast.error(failure?.message || 'Could not create access.'); }
    finally { setBusy(false); }
  }

  async function saveEdit(event, editForm) {
    event.preventDefault();
    if (editForm.password && editForm.password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setBusy(true);
    try {
      const payload = { role: editForm.role, is_active: editForm.is_active };
      if (editForm.password) payload.password = editForm.password;
      await updateAccessHolder(editForm.id, payload);
      toast.success('Access holder updated'); setEditing(null); await refresh();
    } catch (failure) { toast.error(failure?.message || 'Could not update access holder.'); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    try { await revokeAccess(pending.id); toast.success('Access revoked'); setPending(null); await refresh(); }
    catch (failure) { toast.error(failure?.message || 'Could not revoke access.'); }
    finally { setBusy(false); }
  }

  return <div className="admin-page">
    <div className="admin-page-heading"><div><span className="admin-eyebrow">TEAM PERMISSIONS</span><h1>Access <i>Management</i></h1><p>Create and manage admin and staff accounts.</p></div></div>
    <div className="access-layout">
      <section className="admin-panel access-form-panel"><span className="access-icon"><Shield/></span><h2>Give access</h2><p className="admin-muted">New team members can sign in at /login. Their role controls admin access.</p>
        <form className="access-form" onSubmit={submit} noValidate>
          <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" autoComplete="name"/>{errors.name && <small className="admin-field-error">{errors.name}</small>}</label>
          <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="teammate@example.com" autoComplete="email"/>{errors.email && <small className="admin-field-error">{errors.email}</small>}</label>
          <label>Password<div className="admin-password-control"><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" autoComplete="new-password"/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{errors.password && <small className="admin-field-error">{errors.password}</small>}</label>
          <label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="admin">Admin</option><option value="staff">Staff</option></select></label>
          <button className="admin-btn admin-btn-gold" disabled={busy}><Plus size={17}/>{busy ? 'Creating…' : 'Give Access'}</button>
        </form>
      </section>
      <section className="admin-panel access-users-panel"><div className="admin-panel-title"><div><span className="admin-eyebrow">TEAM</span><h2>Access holders</h2></div><span className="admin-count-pill">{holders.length}</span></div>
        {error ? <div className="admin-empty"><p>{error}</p><button className="admin-btn admin-btn-light" onClick={refresh}>Retry</button></div>
          : loading ? <div className="admin-skeleton-card"><span/><span/><span/></div>
          : holders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{['Name', 'Email', 'Role', 'Status', 'Created at', 'Actions'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{holders.map((holder) => <tr key={holder.id}><td>{holder.name}</td><td>{holder.email}</td><td><span className={`admin-state-badge ${holder.role === 'staff' ? 'blue' : 'amber'}`}>{labelRole(holder.role)}</span></td><td><span className={`admin-state-badge ${holder.is_active ? 'green' : 'red'}`}>{holder.is_active ? 'Active' : 'Blocked'}</span></td><td>{date(holder.created_at)}</td><td><div className="admin-table-actions"><button className="admin-icon-btn" disabled={holder.id === currentUser?.id} title="Change role, status or reset password" aria-label={`Manage ${holder.name}`} onClick={() => setEditing({ ...holder, password: '' })}><Edit3 size={15}/></button><button className="admin-icon-btn delete" disabled={holder.id === currentUser?.id} aria-label={`Revoke ${holder.name}`} onClick={() => setPending(holder)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>
          : <div className="admin-empty small"><p>No access holders yet.</p></div>}
      </section>
    </div>
    <EditAccessModal user={editing} busy={busy} onClose={() => setEditing(null)} onSave={saveEdit}/>
    <ConfirmDialog open={!!pending} title="Revoke this access?" confirmText={busy ? 'Revoking…' : 'Revoke access'} onCancel={() => setPending(null)} onConfirm={remove}>The user will lose admin access and will no longer be able to sign in.</ConfirmDialog>
  </div>;
}

function EditAccessModal({ user, busy, onClose, onSave }) {
  const ref = useRef(null);
  const [form, setForm] = useState({ role: 'admin', is_active: true, password: '' });
  useEffect(() => { if (user) setForm({ id: user.id, role: user.role === 'staff' ? 'staff' : 'admin', is_active: user.is_active, password: '' }); }, [user]);
  useModalA11y(Boolean(user), onClose, ref);
  return <AnimatePresence>{user && <motion.div className="admin-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.section ref={ref} className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-access-title" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}><div className="admin-dialog-head"><h2 id="edit-access-title">Manage {user.name}</h2><button className="admin-icon-btn" aria-label="Close" onClick={onClose}><X/></button></div><form className="access-form" onSubmit={(event) => onSave(event, form)}><label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="admin">Admin</option><option value="staff">Staff</option></select></label><label>Status<select value={form.is_active ? 'active' : 'blocked'} onChange={(event) => setForm({ ...form, is_active: event.target.value === 'active' })}><option value="active">Active</option><option value="blocked">Blocked</option></select></label><label>Reset password<input type="password" minLength="8" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Leave empty to keep current"/></label><div className="admin-dialog-actions"><button type="button" className="admin-btn admin-btn-light" onClick={onClose}>Cancel</button><button className="admin-btn admin-btn-gold" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div></form></motion.section></motion.div>}</AnimatePresence>;
}


