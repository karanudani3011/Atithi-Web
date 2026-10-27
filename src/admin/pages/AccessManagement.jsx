import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, Plus, Shield, UserRoundX } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { createTeamMember, listTeamMembers, removeTeamMember, updateTeamMember } from '../../services/admin/teamManagementService.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import RoleSelect from '../components/RoleSelect.jsx';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AccessManagement() {
  const { user: currentUser } = useAdminAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setMembers(await listTeamMembers()); }
    catch (failure) {
      const message = failure?.message || 'Something went wrong. Please check your connection and try again.';
      setError(message);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    const invalid = {};
    if (!form.name.trim()) invalid.name = 'Please enter a name.';
    if (!emailPattern.test(form.email.trim())) invalid.email = 'Please enter a valid email address.';
    if (form.password.length < 8) invalid.password = 'Password must be at least 8 characters long.';
    setFormErrors(invalid);
    if (Object.keys(invalid).length) return;

    setSaving(true);
    try {
      await createTeamMember({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });
      setForm({ name: '', email: '', password: '', role: 'staff' });
      setFormErrors({});
      setShowPassword(false);
      toast.success('Access given successfully.');
      await refresh();
    } catch (failure) {
      toast.error(failure?.message || 'Something went wrong. Please check your connection and try again.');
    } finally { setSaving(false); }
  }

  async function changeMember(id, changes, successMessage) {
    if (id === currentUser?.id) return;
    setBusyId(id);
    try {
      await updateTeamMember(id, changes);
      toast.success(successMessage);
      await refresh();
    } catch (failure) {
      toast.error(failure?.message || 'Something went wrong. Please check your connection and try again.');
    } finally { setBusyId(null); }
  }

  async function confirmRemove() {
    if (!pendingRemove || pendingRemove.id === currentUser?.id) return;
    setBusyId(pendingRemove.id);
    try {
      await removeTeamMember(pendingRemove.id);
      toast.success('Access removed successfully.');
      setPendingRemove(null);
      await refresh();
    } catch (failure) {
      toast.error(failure?.message || 'Something went wrong. Please check your connection and try again.');
    } finally { setBusyId(null); }
  }

  return <div className="admin-page">
    <div className="admin-page-heading">
      <div><span className="admin-eyebrow">TEAM PERMISSIONS</span><h1>Access <i>Management</i></h1><p>Create and manage admin and staff access.</p></div>
    </div>
    <div className="access-layout">
      <section className="admin-panel access-form-panel">
        <span className="access-icon"><Shield/></span><h2>Give Access</h2>
        <p className="admin-muted">This team member will get an Atithi team account.</p>
        <form className="access-form" onSubmit={submit} noValidate>
          <label>Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" autoComplete="name"/>
            {formErrors.name && <small className="admin-field-error">{formErrors.name}</small>}
          </label>
          <label>Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="teammate@example.com" autoComplete="email"/>
            {formErrors.email && <small className="admin-field-error">{formErrors.email}</small>}
          </label>
          <label>Password
            <div className="admin-password-control">
              <input type={showPassword ? 'text' : 'password'} minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" autoComplete="new-password"/>
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
            </div>
            {formErrors.password && <small className="admin-field-error">{formErrors.password}</small>}
          </label>
          <label>Role
            <RoleSelect id="new-team-role" value={form.role} onChange={(role) => setForm((current) => ({ ...current, role }))}/>
          </label>
          <button className="admin-btn admin-btn-gold" disabled={saving} aria-busy={saving}>{saving ? <><span className="access-submit-spinner" aria-hidden="true"/>Giving access...</> : <><Plus size={17}/>Give Access</>}</button>
        </form>
      </section>

      <section className="admin-panel access-users-panel">
        <div className="admin-panel-title"><div><span className="admin-eyebrow">TEAM</span><h2>Access holders</h2></div><span className="admin-count-pill">{members.length}</span></div>
        {error ? <div className="admin-empty"><p>{error}</p><button className="admin-btn admin-btn-light" onClick={refresh}>Retry</button></div>
          : loading ? <div className="admin-skeleton-card"><span/><span/><span/></div>
          : members.length ? <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr>{['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>{members.map((member) => {
              const isSelf = member.id === currentUser?.id;
              const rowBusy = busyId === member.id;
              return <tr key={member.id}>
                <td><strong>{member.name || '—'}</strong>{isSelf && <small className="admin-role">You</small>}</td>
                <td>{member.email}</td>
                <td><div className="access-role-cell"><span className={`access-role-badge ${member.role}`}>{member.role === 'admin' ? 'Admin' : 'Staff'}</span><RoleSelect compact label={`Role for ${member.name || member.email}`} value={member.role} disabled={isSelf || rowBusy} onChange={(role) => changeMember(member.id, { role }, 'Role updated successfully.')}/>{rowBusy && <LoaderCircle size={14} className="admin-spin" aria-label="Updating role"/>}</div></td>
                <td><button type="button" className={`admin-switch ${member.is_active ? 'on' : ''}`} role="switch" aria-checked={member.is_active} aria-label={`Set ${member.name} ${member.is_active ? 'inactive' : 'active'}`} disabled={isSelf || rowBusy} onClick={() => changeMember(member.id, { is_active: !member.is_active }, member.is_active ? 'Access disabled.' : 'Access enabled.')}><i/></button><span className={`admin-state-badge ${member.is_active ? 'green' : 'red'}`}>{member.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>{dateLabel(member.created_at)}</td>
                <td><button className="admin-icon-btn delete" disabled={isSelf || rowBusy} title={isSelf ? 'You cannot remove your own access' : 'Remove access'} aria-label={`Remove access for ${member.name}`} onClick={() => setPendingRemove(member)}><UserRoundX size={15}/></button></td>
              </tr>;
            })}</tbody>
          </table></div>
          : <div className="admin-empty small"><p>No team members yet.</p></div>}
      </section>
    </div>
    <ConfirmDialog open={Boolean(pendingRemove)} title="Remove access?" confirmText={busyId ? 'Removing…' : 'Remove access'} onCancel={() => setPendingRemove(null)} onConfirm={confirmRemove}>
      {pendingRemove ? `${pendingRemove.name} will no longer be able to sign in.` : ''}
    </ConfirmDialog>
  </div>;
}
