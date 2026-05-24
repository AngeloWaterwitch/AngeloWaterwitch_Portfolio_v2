'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ResumeRequestModal from './ResumeRequestModal';

const sectionStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)',
  paddingTop: 'clamp(5rem, 10vw, 8rem)',
  position: 'relative',
  overflow: 'hidden',
};

const gridBgStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `linear-gradient(color-mix(in srgb, var(--cr-primary) 4%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--cr-primary) 4%, transparent) 1px, transparent 1px)`,
  backgroundSize: '60px 60px',
};

const radialBgStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(ellipse 60% 80% at 80% 50%, var(--cr-dim) 0%, transparent 70%)',
};

export default function Hero({ hero, resume }: any) {
  const [showModal, setShowModal] = useState(false);

  return (
    <section id="home" style={sectionStyle}>
      <div style={gridBgStyle} />
      <div style={radialBgStyle} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', width: '100%' }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.65rem, 2vw, 0.8rem)',
            color: 'var(--cr-light)',
            letterSpacing: '0.2em',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
          }}
        >
          <span style={{ display: 'inline-block', width: '2rem', height: '1px', background: 'var(--cr-light)', flexShrink: 0 }} />
          {hero?.role}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 10vw, 7rem)',
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
          }}
        >
          {hero?.name?.split(' ').map((word: string, i: number) => (
            <span key={i} style={{ display: 'block', color: i === 1 ? 'var(--cr-light)' : 'var(--cr-text)' }}>
              {word}
            </span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
            color: '#888',
            maxWidth: '500px',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          {hero?.sub}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}
        >
          {hero?.resumeEnabled && resume?.enabled && (
            <>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: 'clamp(0.7rem, 2vw, 0.85rem) clamp(1.2rem, 3vw, 2rem)',
                  background: 'var(--cr-primary)',
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  borderRadius: '2px',
                  border: '1px solid var(--cr-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--cr-light)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'var(--cr-primary)';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                {hero?.resumeLabel || 'Download CV'}
              </button>

              {showModal && (
                <ResumeRequestModal
                  resumeLabel={hero?.resumeLabel}
                  onClose={() => setShowModal(false)}
                />
              )}
            </>
          )}

          <a
            href="#contact"
            style={{
              padding: 'clamp(0.7rem, 2vw, 0.85rem) clamp(1.2rem, 3vw, 2rem)',
              background: 'transparent',
              color: 'var(--cr-text)',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              borderRadius: '2px',
              border: '1px solid #444',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.borderColor = 'var(--cr-light)';
              e.currentTarget.style.color = 'var(--cr-light)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.borderColor = '#444';
              e.currentTarget.style.color = 'var(--cr-text)';
            }}
          >
            Get In Touch
          </a>
        </motion.div>
      </div>

      <div style={{
        position: 'absolute', bottom: '2rem', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
      }}>
        <div style={{
          width: '1px', height: '60px',
          background: 'linear-gradient(to bottom, var(--cr-primary), transparent)',
          animation: 'scrollPulse 2s ease-in-out infinite',
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#555', letterSpacing: '0.15em' }}>
          SCROLL
        </span>
      </div>
    </section>
  );
}