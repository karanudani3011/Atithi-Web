import { useRef, useState } from 'react';
import { Pencil, Trash2, Shield, Users, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { createAdminUser, deleteAdminUser, getAdminUsers, updateAdminUser } from '../../services/adminAuthService.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import useModalA11y from '../useModalA11y.js';

export default function AccessPanel() {
  const [users, setUsers] = useState(getAdminUsers);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', password: '' });
  const [deleting, setDeleting] = useState(null);
  const editDialogRef = useRef(null);
  useModalA11y(Boolean(editing), () => setEditing(null), editDialogRef);

  function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) { setError('Please complete all three fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.email.trim().toLowerCase() === 'admin') { setError('The email “admin” is reserved.'); return; }
    try {
      createAdminUser(form);
      setUsers(getAdminUsers());
      setForm({ name: '', email: '', password: '' });
      toast.success('Admin access granted');
    } catch (failure) { setError(failure.message); toast.error(failure.message); }
  }

  function openEdit(user) { setEditing(user); setEditForm({ name: user.name, password: '' }); }
  function saveEdit(event) {
    event.preventDefault();
    if (!editForm.name.trim()) { toast.error('Name is required'); return; }
    if (editForm.password && editForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      updateAdminUser(editing.id, editForm);
      setUsers(getAdminUsers());
      setEditing(null);
      toast.success('Admin details updated');
    } catch (failure) { toast.error(failure.message); }
  }
  function revoke() {
    deleteAdminUser(deleting.id);
    setUsers(getAdminUsers());
    toast.success('Admin access revoked');
    setDeleting(null);
  }

  return <div className="admin-page">
    <div className="admin-page-heading">
      <div><span className="admin-eyebrow">PEOPLE YOU TRUST</span><h1>Access <i>Panel</i></h1><p>Invite teammates to help care for your Atithi guests.</p></div>
      <div className="admin-count-pill"><Users size={16} />{users.length} sub-admins</div>
    </div>
    <div className="access-layout">
      <section className="admin-panel access-form-panel">
        <div className="admin-panel-title"><div><span className="admin-eyebrow">NEW TEAM MEMBER</span><h2>Give access</h2></div><div className="access-icon"><Shield /></div></div>
        <p className="admin-muted">They can manage rooms and bookings using their email and password.</p>
        <form className="access-form" onSubmit={submit}>
          <label>Name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} autoComplete="name" required /></label>
          <label>Email<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></label>
          <label>Password<input type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} minLength="6" autoComplete="new-password" required /></label>
          {error && <p role="alert" className="access-error">{error}</p>}
          <button className="admin-btn admin-btn-gold"><KeyRound size={17} />Give Access</button>
        </form>
      </section>
      <section className="admin-panel access-users-panel">
        <div className="admin-panel-title"><div><span className="admin-eyebrow">YOUR TEAM</span><h2>Sub-admins</h2></div></div>
        {users.length ? <div className="admin-table-wrap"><table className="admin-table access-table"><thead><tr><th>Name</th><th>Email</th><th>Created date</th><th>Actions</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><div className="access-name-cell"><span className="access-user-avatar">{user.name.slice(0, 1).toUpperCase()}</span><strong>{user.name}</strong></div></td><td>{user.email}</td><td>{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(user.createdAt))}</td><td><div className="admin-table-actions"><button className="admin-icon-btn" aria-label={`Edit ${user.name}`} onClick={() => openEdit(user)}><Pencil size={16} /></button><button className="admin-icon-btn delete" aria-label={`Revoke ${user.name}`} onClick={() => setDeleting(user)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div> : <div className="admin-empty small"><Users /><h3>No sub-admins yet</h3><p>Give access to a trusted team member.</p></div>}
      </section>
    </div>
    {editing && <div className="admin-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setEditing(null)}><section ref={editDialogRef} className="admin-dialog access-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-admin-title"><div className="admin-dialog-head"><div><span className="admin-eyebrow">TEAM DETAILS</span><h2 id="edit-admin-title">Edit sub-admin</h2></div></div><form className="access-form" onSubmit={saveEdit}><label>Name<input value={editForm.name} onChange={event => setEditForm({ ...editForm, name: event.target.value })} autoFocus required /></label><label>New password <small>(leave blank to keep current)</small><input type="password" value={editForm.password} onChange={event => setEditForm({ ...editForm, password: event.target.value })} minLength="6" autoComplete="new-password" /></label><div className="admin-dialog-actions"><button type="button" className="admin-btn admin-btn-light" onClick={() => setEditing(null)}>Cancel</button><button className="admin-btn admin-btn-gold">Save changes</button></div></form></section></div>}
    <ConfirmDialog open={Boolean(deleting)} title="Revoke this admin’s access?" confirmText="Revoke access" onCancel={() => setDeleting(null)} onConfirm={revoke}>Access for {deleting?.name} will be removed immediately. They will no longer be able to sign in.</ConfirmDialog>
  </div>;
}
