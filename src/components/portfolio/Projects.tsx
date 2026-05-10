'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Projects({ projects }: any) {
  const [selected, setSelected] = useState<any>(null);

  return (
    <section id="projects" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)', background: '#111111' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'hsl(348,100%,55%)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          My Work
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.05, marginBottom: '1rem', color: '#f0ede8' }}>
          Featured <span style={{ color: 'hsl(348,100%,55%)' }}>Projects</span>
        </motion.h2>
        <motion.div initial={{ opacity: 0, scaleX: 0 }} whileInView={{ opacity: 1, scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
          style={{ width: '3rem', height: '2px', background: 'hsl(348,100%,40%)', marginBottom: '3rem', transformOrigin: 'left' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 460px), 1fr))', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
          {projects?.map((project: any, i: number) => (
            <ProjectCard key={project.id} project={project} index={i} onClick={() => setSelected(project)} />
          ))}
        </div>
      </div>
      <AnimatePresence>
        {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </section>
  );
}

const accentColors = ['hsl(348,60%,18%)', 'hsl(220,60%,18%)', 'hsl(160,60%,18%)', 'hsl(280,60%,18%)'];

function ProjectCard({ project, index, onClick }: any) {
  const [hovered, setHovered] = useState(false);
  const image = project.media?.[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: '#1a1a1a', border: '1px solid ' + (hovered ? 'hsl(348,60%,25%)' : '#222'),
        borderRadius: '2px', overflow: 'hidden', transition: 'all 0.25s',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)', cursor: 'pointer',
      }}
    >
      <div style={{ height: 'clamp(160px, 25vw, 220px)', background: accentColors[index % accentColors.length], position: 'relative', overflow: 'hidden' }}>
        {image ? (
          <img src={image} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', transform: hovered ? 'scale(1.05)' : 'scale(1)' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 800, color: 'rgba(255,255,255,0.06)' }}>
            {project.title?.charAt(0)}
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: hovered ? 1 : 0, transition: 'opacity 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.4)', padding: '0.5rem 1rem', borderRadius: '1px' }}>
            View Details
          </span>
        </div>
      </div>
      <div style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 700, marginBottom: '0.5rem', color: '#f0ede8' }}>{project.title}</h3>
        <p style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: '#777', lineHeight: 1.6, marginBottom: '1rem' }}>{project.desc}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {project.tags?.map((tag: string, i: number) => (
            <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.6rem, 1.5vw, 0.65rem)', color: 'hsl(348,100%,55%)', border: '1px solid hsl(348,60%,25%)', padding: '0.2rem 0.5rem', borderRadius: '1px' }}>{tag}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ProjectModal({ project, onClose }: any) {
  const image = project.media?.[0]?.url;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }} transition={{ duration: 0.3 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#111', border: '1px solid #222', borderRadius: '2px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
      >
        <div style={{ height: 'clamp(180px, 30vw, 280px)', background: 'hsl(348,60%,18%)', overflow: 'hidden' }}>
          {image ? (
            <img src={image} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', fontWeight: 800, color: 'rgba(255,255,255,0.06)', fontFamily: 'var(--font-display)' }}>
              {project.title?.charAt(0)}
            </div>
          )}
        </div>
        <div style={{ padding: 'clamp(1.5rem, 4vw, 2rem)' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, marginBottom: '1rem', color: '#f0ede8' }}>{project.title}</h2>
          <p style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: '#aaa', lineHeight: 1.7, marginBottom: '1.5rem' }}>{project.desc}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '2rem' }}>
            {project.tags?.map((tag: string, i: number) => (
              <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'hsl(348,100%,55%)', border: '1px solid hsl(348,60%,25%)', padding: '0.3rem 0.7rem', borderRadius: '1px' }}>{tag}</span>
            ))}
          </div>
          {project.link && project.link !== '#' && (
            <a href={project.link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '0.8rem 1.8rem', background: 'hsl(348,100%,40%)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '2px', textDecoration: 'none' }}>
              View Live Project →
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}