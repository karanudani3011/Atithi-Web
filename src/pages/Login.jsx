import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check } from 'lucide-react';
import { authenticateGuest } from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ADMIN_EMAIL_TO_BLOCK } from '../config/adminConfig.js';
import toast from 'react-hot-toast';
import Logo from '../components/Logo.jsx';

function isEmailRateLimitError(failure) {
  return failure?.code === 'over_email_send_rate_limit'
    || /over_email_send_rate_limit|email rate limit exceeded/i.test(failure?.message || '');
}

function getPostAuthPath(location) {
  const stateFrom = location.state?.from;
  const statePath = typeof stateFrom === 'string' ? stateFrom : stateFrom?.pathname
    ? `${stateFrom.pathname}${stateFrom.search || ''}${stateFrom.hash || ''}` : '';
  const queryPath = new URLSearchParams(location.search).get('redirect') || '';
  const savedPath = sessionStorage.getItem('atithi-auth-redirect') || '';
  const candidate = statePath || queryPath || savedPath || '/';
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '/';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [tab, setTab] = useState('Login');
  const [show, setShow] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [registerCooldown, setRegisterCooldown] = useState(0);
  const submitLock = useRef(false);

  useEffect(() => {
    if (!registerCooldown) return undefined;
    const timer = window.setTimeout(() => setRegisterCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [registerCooldown]);

  async function submit(event) {
    event.preventDefault();
    const isRegister = tab === 'Register';
    if (isRegister && registerCooldown > 0) return;
    if (submitLock.current) return;
    submitLock.current = true;
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const postAuthPath = getPostAuthPath(location);
      const email = String(form.get('email') || '').trim().toLowerCase();
      if (isRegister && email === ADMIN_EMAIL_TO_BLOCK) {
        setError('This email cannot be used to create an account.');
        return;
      }
      if (!isRegister) {
        const result = await login(email, form.get('password'));
        if (!result.success) { setError(result.message); return; }
        sessionStorage.removeItem('atithi-auth-redirect');
        toast.success('Welcome back');
        navigate(result.role === 'admin' ? '/admin' : postAuthPath, { replace: true });
        return;
      }
      const result = await authenticateGuest({
        name: form.get('name'),
        email,
        password: form.get('password'),
        register: true,
      });
      if (!result.session) {
        sessionStorage.setItem('atithi-auth-redirect', postAuthPath);
        setSuccess(true);
        toast.success('Account created');
      } else {
        await login(email, form.get('password'));
        sessionStorage.removeItem('atithi-auth-redirect');
        toast.success('Account created');
        navigate(postAuthPath, { replace: true });
      }
    } catch (failure) {
      if (isRegister && isEmailRateLimitError(failure)) {
        setError('Too many attempts. Please wait a few minutes and try again.');
        setRegisterCooldown(60);
      } else {
        setError(failure.message);
      }
      if (!isRegister) toast.error(failure.message);
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }

  const registerDisabled = busy || (tab === 'Register' && registerCooldown > 0);

  return <section className="login-page"><div className="login-blob blob-one"/><div className="login-blob blob-two"/><div className="login-shell"><div className="login-welcome"><Logo light full/><div className="login-welcome-copy"><span>YOUR PLACE TO BELONG</span><h1>Welcome to<br/>the Atithi family</h1><p>A warmer stay begins with a warmer welcome.</p><strong>अतिथि देवो भव</strong></div><div className="login-bottom">BETTER STAYS. HAPPIER GUESTS.</div></div><div className="login-form-side">{success?<div className="login-success"><div className="success-check"><Check/></div><h2>You're welcome here.</h2><p>Your Atithi account is ready. We look forward to seeing you.</p><button className="btn gold" onClick={()=>setSuccess(false)}>Continue</button></div>:<><div className="login-tabs"><button type="button" className={tab==='Login'?'selected':''} onClick={()=>{setTab('Login');setError('')}}>Login</button><button type="button" className={tab==='Register'?'selected':''} onClick={()=>{setTab('Register');setError('')}}>Register</button></div><div className="eyebrow">{tab==='Login'?'WELCOME BACK':'A LOVELY PLACE TO START'}</div><h2>{tab==='Login'?'Sign in':'Create your account'}</h2><p className="login-intro">{tab==='Login'?'Your next lovely stay is just around the corner.':'Join us for thoughtful stays and little luxuries.'}</p><form className="login-form" onSubmit={submit}>{tab==='Register'&&<label>Your name<input name="name" required placeholder="Full name"/></label>}<label>Email address<input name="email" type="email" required placeholder="you@example.com"/></label><label>Password<div className="password-wrap"><input name="password" type={show?'text':'password'} required minLength="6" placeholder="At least 6 characters"/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>{tab==='Login'&&<a className="forgot" href="#forgot" onClick={event=>event.preventDefault()}>Forgot password?</a>}{error&&<p role="alert" className="login-error">{error}</p>}<button disabled={registerDisabled} className="btn gold">{busy?'Please wait…':tab==='Register'&&registerCooldown>0?`Try again in ${registerCooldown}s`:tab==='Login'?'Login':'Create account'}</button></form><div className="demo-note">Your account is securely managed through Atithi.</div></>}</div></div></section>;
}

