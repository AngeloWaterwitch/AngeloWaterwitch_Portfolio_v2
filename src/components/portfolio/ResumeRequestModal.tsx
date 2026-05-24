'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  resumeLabel?: string;
  onClose: () => void;
}

export default function ResumeRequestModal({ resumeLabel, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Load reCAPTCHA script once
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || document.getElementById('recaptcha-script')) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  async function handleSubmit() {
    if (!email || !reason) {
      setErrorMsg('Please fill in both fields.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');

    try {
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
      await new Promise<void>((res) => {
        // @ts-ignore
        if (window.grecaptcha) return res();
        const interval = setInterval(() => {
          // @ts-ignore
          if (window.grecaptcha) { clearInterval(interval); res(); }
        }, 200);
      });

      // @ts-ignore
      const token = await window.grecaptcha.execute(siteKey, { action: 'resume_request' });

      const res = await fetch('/api/resume/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason, recaptchaToken: token }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'var(--cr-bg3)',
    border: '1px solid var(--cr-bg4)',
    borderRadius: '2px',
    color: 'var(--cr-text)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--cr-bg2)',
            border: '1px solid var(--cr-bg4)',
            borderRadius: '4px',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '460px',
          }}
        >
          {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cr-light)', marginBottom: '0.75rem' }}>
                Request Sent
              </h3>
              <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Your request has been received. You'll get an email once Angelo reviews it.
              </p>
              <button
                onClick={onClose}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.65rem 1.5rem',
                  background: 'var(--cr-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--cr-light)',
                marginBottom: '0.5rem',
                letterSpacing: '0.05em',
              }}>
                Request CV Access
              </h3>
              <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
                Fill in your details and Angelo will email you a secure download link.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                />
                <textarea
                  placeholder="Why are you requesting the CV? (recruiter, collaborator, curious...)"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />

                {errorMsg && (
                  <p style={{ color: 'var(--cr-light)', fontSize: '0.8rem' }}>{errorMsg}</p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={onClose}
                    style={{
                      padding: '0.65rem 1.2rem',
                      background: 'transparent',
                      color: '#666',
                      border: '1px solid #333',
                      borderRadius: '2px',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.78rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={status === 'loading'}
                    style={{
                      padding: '0.65rem 1.5rem',
                      background: status === 'loading' ? 'var(--cr-dim)' : 'var(--cr-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '2px',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Request'}
                  </button>
                </div>

                <p style={{ color: '#444', fontSize: '0.72rem', textAlign: 'center' }}>
                  Protected by reCAPTCHA
                </p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}