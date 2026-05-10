'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Services({ services }: any) {
  return (
    <section id="services" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)', background: '#0a0a0a' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'hsl(348,100%,55%)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          What I Offer
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.05, marginBottom: '1rem', color: '#f0ede8' }}>
          My <span style={{ color: 'hsl(348,100%,55%)' }}>Services</span>
        </motion.h2>
        <motion.div initial={{ opacity: 0, scaleX: 0 }} whileInView={{ opacity: 1, scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
          style={{ width: '3rem', height: '2px', background: 'hsl(348,100%,40%)', marginBottom: '3rem', transformOrigin: 'left' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', border: '1px solid #222' }}>
          {services?.map((service: any, i: number) => (
            <ServiceItem key={service.id} service={service} index={i} total={services.length} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceItem({ service, index, total }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.15 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        background: hovered ? '#1a1a1a' : '#111',
        borderRight: index === total - 1 ? 'none' : '1px solid #222',
        borderBottom: '1px solid #222',
        transition: 'background 0.2s', position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'hsl(348,100%,40%)', transform: hovered ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.3s ease' }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'hsl(348,100%,40%)', letterSpacing: '0.1em', marginBottom: '1.2rem' }}>{service.num}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 700, color: hovered ? 'hsl(348,100%,55%)' : '#f0ede8', marginBottom: '1rem', transition: 'color 0.2s' }}>{service.title}</h3>
      <p style={{ fontSize: 'clamp(0.85rem, 2vw, 0.9rem)', color: '#777', lineHeight: 1.7 }}>{service.desc}</p>
    </motion.div>
  );
}