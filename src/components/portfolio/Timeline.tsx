'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Timeline({ timeline }: any) {
  const education = timeline?.filter((t: any) => t.type === 'education') || [];
  const work = timeline?.filter((t: any) => t.type === 'work') || [];

  return (
    <section id="timeline" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)', background: '#111111' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'hsl(348,100%,55%)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          My Journey
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.05, marginBottom: '1rem', color: '#f0ede8' }}>
          Experience & <span style={{ color: 'hsl(348,100%,55%)' }}>Education</span>
        </motion.h2>
        <motion.div initial={{ opacity: 0, scaleX: 0 }} whileInView={{ opacity: 1, scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
          style={{ width: '3rem', height: '2px', background: 'hsl(348,100%,40%)', marginBottom: '4rem', transformOrigin: 'left' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 'clamp(2rem, 5vw, 4rem)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'hsl(348,100%,55%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ display: 'inline-block', width: '1.5rem', height: '1px', background: 'hsl(348,100%,40%)' }} />
              Work Experience
            </div>
            <TimelineColumn items={work} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'hsl(348,100%,55%)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ display: 'inline-block', width: '1.5rem', height: '1px', background: 'hsl(348,100%,40%)' }} />
              Education
            </div>
            <TimelineColumn items={education} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineColumn({ items }: any) {
  return (
    <div style={{ position: 'relative', paddingLeft: '2rem' }}>
      <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '1px', background: '#222' }} />
      {items.map((item: any, i: number) => (
        <TimelineItem key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}

function TimelineItem({ item, index }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.15 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', marginBottom: '2.5rem' }}
    >
      <div style={{ position: 'absolute', left: '-2rem', top: '4px', width: '14px', height: '14px', borderRadius: '50%', background: hovered ? 'hsl(348,100%,40%)' : '#222', border: '2px solid ' + (hovered ? 'hsl(348,100%,55%)' : 'hsl(348,60%,25%)'), transition: 'all 0.2s', zIndex: 1 }} />
      <div style={{ background: hovered ? '#1a1a1a' : '#111', border: '1px solid ' + (hovered ? 'hsl(348,60%,25%)' : '#222'), borderRadius: '2px', padding: 'clamp(1rem, 3vw, 1.5rem)', transition: 'all 0.2s', transform: hovered ? 'translateX(4px)' : 'translateX(0)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'hsl(348,100%,55%)', letterSpacing: '0.1em', marginBottom: '0.6rem', display: 'inline-block', background: 'hsl(348,60%,25%)', padding: '0.2rem 0.6rem', borderRadius: '1px' }}>{item.period}</div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', fontWeight: 700, color: '#f0ede8', marginBottom: '0.3rem' }}>{item.title}</h3>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.65rem, 1.5vw, 0.72rem)', color: 'hsl(348,100%,55%)', letterSpacing: '0.08em', marginBottom: '0.8rem' }}>{item.organisation}</div>
        <p style={{ fontSize: 'clamp(0.82rem, 2vw, 0.88rem)', color: '#777', lineHeight: 1.7 }}>{item.desc}</p>
      </div>
    </motion.div>
  );
}