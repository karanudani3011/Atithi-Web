import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, Plus, Shield, UserRoundX } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { createTeamMember, listTeamMembers, updateTeamMember } from '../../services/admin/teamManagementService.js';
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
      const message = failure?.message || 'Team list load na thai. Retry karo.';
      setError(message);
      toast.error(message, { id: 'access-list-error' });
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    const invalid = {};
    if (!form.name.trim()) invalid.name = 'Name jaruri che.';
    if (!form.email.trim()) invalid.email = 'Email jaruri che.';
    else if (!emailPattern.test(form.email.trim())) invalid.email = 'Valid email address lakho.';
    if (form.password.length < 8) invalid.password = 'Password minimum 8 characters nu hovu joiye.';
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
      toast.success(`${form.role === 'admin' ? 'Admin' : 'Staff'} access created.`);
      await refresh();
    } catch (failure) {
      toast.error(failure?.message || 'Access create na thayu. Please try again.');
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
      toast.error(failure?.message || 'Team member update na thayu.');
    } finally { setBusyId(null); }
  }

  async function confirmRemove() {
    if (!pendingRemove || pendingRemove.id === currentUser?.id) return;
    setBusyId(pendingRemove.id);
    try {
      await updateTeamMember(pendingRemove.id, { is_active: false });
      toast.success('Team access revoke thai gayu.');
      setPendingRemove(null);
      await refresh();
    } catch (failure) {
      toast.error(failure?.message || 'Access revoke na thayu.');
    } finally { setBusyId(null); }
  }

  return <div className="admin-page">
    <div className="admin-page-heading">
      <div><span className="admin-eyebrow">TEAM PERMISSIONS</span><h1>Access <i>Management</i></h1><p>Admin ane staff access create ane manage karo.</p></div>
    </div>
    <div className="access-layout">
      <section className="admin-panel access-form-panel">
        <span className="access-icon"><Shield/></span><h2>Give Access</h2>
        <p className="admin-muted">Team member ne Atithi team account create thashe.</p>
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
          <button className="admin-btn admin-btn-gold" disabled={saving} aria-busy={saving}>{saving ? <><span className="access-submit-spinner" aria-hidden="true"/>Creating…</> : <><Plus size={17}/>Give Access</>}</button>
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
                <td><div className="access-role-cell"><span className={`access-role-badge ${member.role}`}>{member.role === 'admin' ? 'Admin' : 'Staff'}</span><RoleSelect compact label={`Role for ${member.name || member.email}`} value={member.role} disabled={isSelf || rowBusy} onChange={(role) => changeMember(member.id, { role }, 'Role update thai gayo.')}/>{rowBusy && <LoaderCircle size={14} className="admin-spin" aria-label="Updating role"/>}</div></td>
                <td><button type="button" className={`admin-switch ${member.is_active ? 'on' : ''}`} role="switch" aria-checked={member.is_active} aria-label={`Set ${member.name} ${member.is_active ? 'disabled' : 'active'}`} disabled={isSelf || rowBusy} onClick={() => changeMember(member.id, { is_active: !member.is_active }, member.is_active ? 'Team access disabled.' : 'Team access active thai gayo.')}><i/></button><span className={`admin-state-badge ${member.is_active ? 'green' : 'red'}`}>{member.is_active ? 'Active' : 'Disabled'}</span></td>
                <td>{dateLabel(member.created_at)}</td>
                <td><button className="admin-icon-btn delete" disabled={isSelf || rowBusy || !member.is_active} title={isSelf ? 'You cannot revoke your own access' : 'Revoke team access'} aria-label={`Revoke access for ${member.name}`} onClick={() => setPendingRemove(member)}><UserRoundX size={15}/></button></td>
              </tr>;
            })}</tbody>
          </table></div>
          : <div className="admin-empty small"><p>Koi team member nathi.</p></div>}
      </section>
    </div>
    <ConfirmDialog open={Boolean(pendingRemove)} title="Revoke team access?" confirmText={busyId ? 'Revoking…' : 'Revoke access'} onCancel={() => setPendingRemove(null)} onConfirm={confirmRemove}>
      {pendingRemove ? `${pendingRemove.name} sign in kari nahi shake. Admin pachi access fari active kari shake.` : ''}
    </ConfirmDialog>
  </div>;
}
