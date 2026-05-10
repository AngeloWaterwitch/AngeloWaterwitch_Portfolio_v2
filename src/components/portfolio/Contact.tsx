'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Contact({ contact }: any) {
  const [form, setForm] = useState({ name: '', email: '', message: '', honeypot: '' });
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.honeypot) return;

    const newErrors: any = {};
    if (!form.name || form.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!form.email || !form.email.includes('@')) newErrors.email = 'Please enter a valid email';
    if (!form.message || form.message.length < 10) newErrors.message = 'Message must be at least 10 characters';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setErrors({});
    setStatus('sending');

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus('success');
      setForm({ name: '', email: '', message: '', honeypot: '' });
    } else {
      setStatus('error');
    }
  };

  const contactItems = [
    { label: 'Email', value: contact?.email, href: 'mailto:' + contact?.email },
    { label: 'Phone', value: contact?.phone, href: 'tel:' + contact?.phone },
    { label: 'Location', value: contact?.location, href: null },
  ];

  const socials = [
    { label: 'Facebook', url: contact?.facebook },
    { label: 'LinkedIn', url: contact?.linkedin },
    { label: 'Instagram', url: contact?.instagram },
    { label: 'GitHub', url: contact?.github },
  ];

  return (
    <section id="contact" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)', background: '#111111' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 'clamp(2rem, 5vw, 5rem)', alignItems: 'start' }}>
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'hsl(348,100%,55%)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Say Hello
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.05, marginBottom: '1rem', color: '#f0ede8' }}>
            Get In <span style={{ color: 'hsl(348,100%,55%)' }}>Touch</span>
          </motion.h2>
          <motion.div initial={{ opacity: 0, scaleX: 0 }} whileInView={{ opacity: 1, scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
            style={{ width: '3rem', height: '2px', background: 'hsl(348,100%,40%)', marginBottom: '2.5rem', transformOrigin: 'left' }} />
          {contactItems.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }} style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{item.label}</div>
              {item.href ? (
                <a href={item.href} style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)', color: 'hsl(348,100%,55%)', textDecoration: 'underline', textDecorationColor: 'hsl(348,60%,25%)', wordBreak: 'break-all' }}>{item.value}</a>
              ) : (
                <p style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)', color: '#f0ede8' }}>{item.value}</p>
              )}
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '2rem' }}>
            {socials.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.65rem, 1.5vw, 0.72rem)', border: '1px solid #333', padding: '0.4rem 0.8rem', borderRadius: '1px', color: '#888', transition: 'all 0.2s', letterSpacing: '0.08em', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(348,100%,55%)'; e.currentTarget.style.color = 'hsl(348,100%,55%)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888'; }}
              >
                {s.label}
              </a>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}
          style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '2px', padding: 'clamp(1.2rem, 4vw, 2rem)' }}>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'none' }}>
              <input type="text" name="honeypot" value={form.honeypot} onChange={e => setForm({ ...form, honeypot: e.target.value })} tabIndex={-1} autoComplete="off" />
            </div>
            {[
              { label: 'Name', name: 'name', type: 'text', placeholder: 'Your name', error: errors.name },
              { label: 'Email', name: 'email', type: 'email', placeholder: 'your@email.com', error: errors.email },
            ].map(field => (
              <div key={field.name} style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: field.error ? 'hsl(348,100%,55%)' : '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{field.label}</label>
                <input type={field.type} placeholder={field.placeholder} value={(form as any)[field.name]} onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid ' + (field.error ? 'hsl(348,60%,25%)' : '#222'), color: '#f0ede8', padding: '0.8rem 1rem', fontFamily: 'var(--font-display)', fontSize: 'clamp(0.85rem, 2vw, 0.9rem)', borderRadius: '1px', outline: 'none', boxSizing: 'border-box' }} />
                {field.error && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'hsl(348,100%,55%)', marginTop: '0.3rem' }}>{field.error}</div>}
              </div>
            ))}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: errors.message ? 'hsl(348,100%,55%)' : '#666', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Message</label>
              <textarea placeholder="Tell me about your project..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5}
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid ' + (errors.message ? 'hsl(348,60%,25%)' : '#222'), color: '#f0ede8', padding: '0.8rem 1rem', fontFamily: 'var(--font-display)', fontSize: 'clamp(0.85rem, 2vw, 0.9rem)', borderRadius: '1px', outline: 'none', resize: 'vertical', minHeight: '120px', boxSizing: 'border-box' }} />
              {errors.message && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'hsl(348,100%,55%)', marginTop: '0.3rem' }}>{errors.message}</div>}
            </div>
            <button type="submit" disabled={status === 'sending'}
              style={{ width: '100%', padding: '1rem', background: status === 'sending' ? '#333' : 'hsl(348,100%,40%)', color: '#fff', border: 'none', fontFamily: 'var(--font-display)', fontSize: 'clamp(0.8rem, 2vw, 0.85rem)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: '1px', cursor: status === 'sending' ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>
            {status === 'success' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#4caf50', marginTop: '1rem', textAlign: 'center' }}>✓ Message sent! I'll be in touch soon.</p>}
            {status === 'error' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'hsl(348,100%,55%)', marginTop: '1rem', textAlign: 'center' }}>✕ Something went wrong. Please try again.</p>}
          </form>
        </motion.div>
      </div>
    </section>
  );
}