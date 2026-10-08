'use client';
 
import { motion } from 'framer-motion';
import { useState } from 'react';
import { DEFAULT_HEADINGS } from '@/lib/siteSettings';
 
export default function Testimonials({ testimonials, heading }: any) {
  const h = heading ?? DEFAULT_HEADINGS.testimonials;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ author: '', role: '', quote: '' });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<any>({});
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (!form.author || form.author.length < 2) newErrors.author = 'Name must be at least 2 characters';
    if (!form.quote || form.quote.length < 10) newErrors.quote = 'Testimonial must be at least 10 characters';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    await fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitted(true);
  };
 
  return (
    <section id="testimonials" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)', background: 'var(--cr-bg)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cr-light)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          {h.eyebrow}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.05, color: 'var(--cr-text)' }}>
            {h.lead} <span style={{ color: 'var(--cr-light)' }}>{h.highlight}</span>
          </h2>
          <button
            onClick={() => setShowForm(true)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.8rem, 2vw, 1.2rem)', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '1px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cr-light)'; e.currentTarget.style.color = 'var(--cr-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888'; }}
          >
            + Leave a Testimonial
          </button>
        </motion.div>
        <motion.div initial={{ opacity: 0, scaleX: 0 }} whileInView={{ opacity: 1, scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
          style={{ width: '3rem', height: '2px', background: 'var(--cr-primary)', marginBottom: '3rem', transformOrigin: 'left' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
          {testimonials?.map((t: any, i: number) => (
            <TestimonialCard key={t.id} testimonial={t} index={i} />
          ))}
        </div>
      </div>
 
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
          <div style={{ background: 'var(--cr-bg2)', border: '1px solid var(--cr-bg4)', borderRadius: '2px', padding: '2.5rem', width: '100%', maxWidth: '520px', position: 'relative' }}>
            <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--cr-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--cr-text)' }}>Thank you!</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--cr-muted)', marginBottom: '1.5rem' }}>Your testimonial has been submitted for review.</p>
                <button onClick={() => setShowForm(false)} style={{ padding: '0.7rem 1.5rem', background: 'var(--cr-primary)', color: '#fff', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', borderRadius: '1px', cursor: 'pointer' }}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cr-light)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Share Your Experience</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--cr-text)' }}>Leave a <span style={{ color: 'var(--cr-light)' }}>Testimonial</span></h3>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cr-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>Your testimonial will be reviewed before appearing on the site.</p>
                {[
                  { label: 'Your Name *', name: 'author', placeholder: 'Jane Smith', error: errors.author },
                  { label: 'Your Role / Company', name: 'role', placeholder: 'CEO, Acme Corp', error: null },
                ].map(field => (
                  <div key={field.name} style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cr-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{field.label}</label>
                    <input type="text" placeholder={field.placeholder} value={(form as any)[field.name]} onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                      style={{ width: '100%', background: 'var(--cr-bg)', border: '1px solid ' + (field.error ? 'var(--cr-dim)' : 'var(--cr-bg4)'), color: 'var(--cr-text)', padding: '0.8rem 1rem', fontFamily: 'var(--font-display)', fontSize: '0.9rem', borderRadius: '1px', outline: 'none', boxSizing: 'border-box' }} />
                    {field.error && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--cr-light)', marginTop: '0.3rem' }}>{field.error}</div>}
                  </div>
                ))}
                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cr-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Your Testimonial *</label>
                  <textarea placeholder="Tell others about your experience..." value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} rows={4}
                    style={{ width: '100%', background: 'var(--cr-bg)', border: '1px solid ' + (errors.quote ? 'var(--cr-dim)' : 'var(--cr-bg4)'), color: 'var(--cr-text)', padding: '0.8rem 1rem', fontFamily: 'var(--font-display)', fontSize: '0.9rem', borderRadius: '1px', outline: 'none', resize: 'vertical', minHeight: '100px', boxSizing: 'border-box' }} />
                  {errors.quote && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--cr-light)', marginTop: '0.3rem' }}>{errors.quote}</div>}
                </div>
                <button type="submit" style={{ width: '100%', padding: '1rem', background: 'var(--cr-primary)', color: '#fff', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: '1px', cursor: 'pointer' }}>
                  Submit Testimonial
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
 
function TestimonialCard({ testimonial, index }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: 'var(--cr-bg3)', border: '1px solid ' + (hovered ? 'var(--cr-dim)' : 'var(--cr-bg4)'), borderRadius: '2px', padding: 'clamp(1.2rem, 3vw, 2rem)', position: 'relative', transition: 'all 0.2s', transform: hovered ? 'translateY(-4px)' : 'translateY(0)' }}
    >
      <div style={{ position: 'absolute', top: '0.5rem', right: '1.5rem', fontFamily: 'Georgia, serif', fontSize: 'clamp(3rem, 8vw, 5rem)', lineHeight: 1, color: hovered ? 'var(--cr-dim)' : 'rgba(255,255,255,0.04)', transition: 'color 0.3s', userSelect: 'none', pointerEvents: 'none' }}>"</div>
      <p style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: '#aaa', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>{testimonial.quote}</p>
      <div style={{ width: '2rem', height: '1px', background: 'var(--cr-dim)', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--cr-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--cr-light)', flexShrink: 0 }}>
          {testimonial.author?.split(' ').map((n: string) => n[0]).join('')}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: 'var(--cr-text)' }}>{testimonial.author}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.62rem, 1.5vw, 0.7rem)', color: 'var(--cr-muted)', marginTop: '0.2rem', letterSpacing: '0.05em' }}>{testimonial.role}</div>
        </div>
      </div>
    </motion.div>
  );
}