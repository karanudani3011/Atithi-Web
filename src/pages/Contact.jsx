import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Check, LoaderCircle } from 'lucide-react';
import { siteConfig } from '../data/siteConfig.js';
import Reveal from '../components/Reveal.jsx';
import { ensureSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import './Contact.css';

const info = [
  ['Address', MapPin, siteConfig.address],
  ['Phone', Phone, siteConfig.phone],
  ['Email', Mail, siteConfig.email],
  ['Reception', Clock, 'Here for you, 24 hours a day'],
];
const emptyForm = { name: '', phone: '', email: '', message: '', website: '' };

export default function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function update(key, value) {
    setForm(current => ({ ...current, [key]: value }));
    if (error) setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const message = form.message.trim();
    if (form.website) return;
    if (!name || name.length > 100) return setError('Please enter your name (up to 100 characters).');
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email address (up to 254 characters).');
    if (!message || message.length > 3000) return setError('Please enter a message (up to 3000 characters).');

    setBusy(true); setError('');
    try {
      ensureSupabaseConfigured();
      const { error: insertError } = await supabase.from('contact_messages').insert({
        name, email, phone: phone || null, message,
      });
      if (insertError) {
        console.error('[contact] message insert failed', insertError);
        console.error('[contact] Supabase details', {
          message: insertError.message, details: insertError.details,
          hint: insertError.hint, code: insertError.code,
        });
        throw insertError;
      }
      setForm(emptyForm);
      setSent(true);
    } catch (failure) {
      console.error('[contact] submission error', failure);
      setError(failure?.message || 'Your message could not be sent. Please try again.');
    } finally { setBusy(false); }
  }

  return <>
    <section className="contact-banner"><div className="banner-copy"><div className="eyebrow">WE'RE ALWAYS HAPPY TO HELP</div><h1>Say <i>hello</i></h1><p>Planning a stay, have a question, or simply want to know more?</p></div></section>
    <div className="contact-info">{info.map(([title, Icon, detail], index) => <Reveal key={title} delay={index * .06}><article><div><Icon/></div><span>{title}</span>{title === 'Phone' ? <a href={`tel:${detail.replaceAll(' ', '')}`}>{detail}</a> : title === 'Email' ? <a href={`mailto:${detail}`}>{detail}</a> : <p>{detail}</p>}</article></Reveal>)}</div>
    <section className="section contact-layout">
      <Reveal><div className="form-card"><div className="eyebrow">SEND US A NOTE</div><h2>How can we help?</h2><p>Our team will be in touch as soon as possible.</p>
        {sent ? <div className="sent-state" role="status"><div className="success-check"><Check/></div><h3>Thank you! We'll get back to you soon.</h3><button type="button" className="btn gold" onClick={() => setSent(false)}>Send another message</button></div> : <form className="field-grid" onSubmit={submit} noValidate>
          <label>Name<input required maxLength={100} autoComplete="name" value={form.name} onChange={event => update('name', event.target.value)} placeholder="Your name"/></label>
          <label>Phone <small>(optional)</small><input type="tel" autoComplete="tel" value={form.phone} onChange={event => update('phone', event.target.value)} placeholder="Your number"/></label>
          <label className="span-two">Email<input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={event => update('email', event.target.value)} placeholder="you@example.com"/></label>
          <label className="span-two">Message<textarea rows="4" required maxLength={3000} value={form.message} onChange={event => update('message', event.target.value)} placeholder="Tell us how we can help"/></label>
          <label className="contact-honeypot" aria-hidden="true" tabIndex={-1}>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={event => update('website', event.target.value)}/></label>
          {error && <p className="contact-form-error span-two" role="alert">{error}</p>}
          <button className="btn gold span-two" type="submit" disabled={busy}>{busy ? <>Sending… <LoaderCircle className="contact-send-spinner" size={17}/></> : <>Send Message <Check size={17}/></>}</button>
        </form>}
      </div></Reveal>
      <Reveal delay={.1}><div className="map-wrap"><iframe title="Map showing Atithi Hotel in Ahmedabad" src={siteConfig.map} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><div className="map-caption"><MapPin size={18}/><span>Visit us in Ahmedabad</span></div></div></Reveal>
    </section>
  </>;
}
