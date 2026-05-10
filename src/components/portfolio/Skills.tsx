'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Skills({ skills }: any) {
  return (
    <section id="skills" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)', background: '#0a0a0a' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'hsl(348,100%,55%)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          What I Use
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.05, marginBottom: '1rem', color: '#f0ede8' }}>
          My <span style={{ color: 'hsl(348,100%,55%)' }}>Skills</span>
        </motion.h2>
        <motion.div initial={{ opacity: 0, scaleX: 0 }} whileInView={{ opacity: 1, scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
          style={{ width: '3rem', height: '2px', background: 'hsl(348,100%,40%)', marginBottom: '3rem', transformOrigin: 'left' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(80px, 15vw, 120px), 1fr))', gap: 'clamp(0.6rem, 2vw, 1rem)' }}>
          {skills?.map((skill: any, i: number) => (
            <SkillCard key={skill.id} skill={skill} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SkillCard({ skill, index }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.05 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: '#1a1a1a', border: '1px solid ' + (hovered ? 'hsl(348,60%,25%)' : '#222'),
        padding: 'clamp(1rem, 3vw, 1.5rem) clamp(0.5rem, 2vw, 1rem)',
        borderRadius: '2px', textAlign: 'center', transition: 'all 0.2s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)', cursor: 'default',
      }}
    >
      {skill.icon?.startsWith('http') ? (
        <img src={skill.icon} alt={skill.name} style={{ width: 'clamp(1.5rem, 4vw, 2rem)', height: 'clamp(1.5rem, 4vw, 2rem)', objectFit: 'contain', display: 'block', margin: '0 auto 0.6rem' }} />
      ) : (
        <span style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', display: 'block', marginBottom: '0.6rem' }}>{skill.icon}</span>
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', color: hovered ? 'hsl(348,100%,55%)' : '#888', letterSpacing: '0.1em', transition: 'color 0.2s' }}>
        {skill.name}
      </div>
    </motion.div>
  );
}