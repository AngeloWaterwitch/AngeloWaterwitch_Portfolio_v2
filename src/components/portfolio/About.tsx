'use client';

import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.15 },
  }),
};

export default function About({ about }: any) {
  return (
    <section id="about" style={{
      padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)',
      background: '#111111',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
        gap: 'clamp(2rem, 5vw, 5rem)',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          style={{ position: 'relative' }}
        >
          <div style={{ position: 'absolute', top: '-1rem', right: '-1rem', width: '5rem', height: '5rem', border: '2px solid hsl(348,100%,40%)', borderRadius: '2px', opacity: 0.4, zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: '-1rem', left: '-1rem', width: '3rem', height: '3rem', background: 'hsl(348,100%,40%)', borderRadius: '2px', opacity: 0.3, zIndex: 0 }} />
          <div style={{
            position: 'relative', width: '100%', aspectRatio: '3 / 4',
            background: '#1a1a1a', border: '1px solid #222',
            borderRadius: '2px', overflow: 'hidden', zIndex: 1, maxHeight: '500px',
          }}>
            {about?.photoUrl ? (
              <img src={about.photoUrl} alt="Angelo Waterwitch" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem' }}>👤</div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, hsl(348,60%,25%) 0%, transparent 50%)', zIndex: 2 }} />
          </div>
        </motion.div>

        <div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'hsl(348,100%,55%)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Who I Am
          </motion.div>

          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.05, marginBottom: '1rem', color: '#f0ede8' }}>
            About <span style={{ color: 'hsl(348,100%,55%)' }}>Me</span>
          </motion.h2>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
            style={{ width: '3rem', height: '2px', background: 'hsl(348,100%,40%)', marginBottom: '2rem' }} />

          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3}
            style={{ color: '#999', lineHeight: 1.8, marginBottom: '1.2rem', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
            {about?.bio1}
          </motion.p>

          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={4}
            style={{ color: '#999', lineHeight: 1.8, marginBottom: '2rem', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
            {about?.bio2}
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={5}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { value: about?.years, label: 'Years Experience' },
              { value: about?.projects, label: 'Projects Completed' },
              { value: about?.clients, label: 'Happy Clients' },
              { value: about?.standing, label: 'Academic Standing' },
            ].map((stat, i) => (
              <div key={i} style={{ background: '#1a1a1a', border: '1px solid #222', padding: 'clamp(0.8rem, 2vw, 1.2rem)', borderRadius: '2px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: 'hsl(348,100%,55%)' }}>{stat.value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', color: '#666', letterSpacing: '0.1em', marginTop: '0.2rem' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}