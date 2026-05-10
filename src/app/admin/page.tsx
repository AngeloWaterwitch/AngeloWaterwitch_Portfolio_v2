'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { AdminLabel } from './components/AdminLabel';
import { AdminField } from './components/AdminField';
import { AdminGrid } from './components/AdminGrid';
import { SaveButton } from './components/SaveButton';
import { FileUpload } from './components/FileUpload';

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hero');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/site');
      const json = await res.json();
      setData(json);
      const msgRes = await fetch('/api/contact');
      const msgs = await msgRes.json();
      setUnreadCount(msgs.filter((m: any) => !m.read).length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Mono', monospace",
      fontSize: '0.8rem',
      color: '#666',
    }}>
      Loading dashboard...
    </div>
  );

  const tabs = [
    { id: 'hero', label: 'Hero' },
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'services', label: 'Services' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'contact', label: 'Contact' },
    { id: 'messages', label: unreadCount > 0 ? `Messages (${unreadCount})` : 'Messages' },
    { id: 'seo', label: 'SEO' },
    { id: 'branding', label: 'Branding' },
    { id: 'resume', label: 'Resume' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.2rem 2rem',
        borderBottom: '1px solid #1a1a1a',
        background: '#111',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: '1.1rem',
          color: '#f0ede8',
        }}>
          ⚙ Admin <span style={{ color: 'hsl(348,100%,55%)' }}>Dashboard</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a
        href="/"
            target="_blank"
            rel="noreferrer noopener"
            onMouseEnter={e => {
              e.currentTarget.style.color = 'hsl(348,100%,55%)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#aaa';
            }}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.7rem',
              color: '#aaa',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
          >
            View Site →
          </a>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'hsl(348,100%,55%)';
              e.currentTarget.style.color = 'hsl(348,100%,55%)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#555';
              e.currentTarget.style.color = '#ccc';
            }}
            style={{
              padding: '0.4rem 1rem',
              background: 'transparent',
              border: '1px solid #555',
              color: '#ccc',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderRadius: '1px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>

        {/* Sidebar */}
        <div style={{
          width: '200px',
          borderRight: '1px solid #1a1a1a',
          background: '#0d0d0d',
          padding: '1.5rem 0',
          flexShrink: 0,
          position: 'sticky',
          top: '60px',
          height: 'calc(100vh - 60px)',
          overflowY: 'auto',
        }}>
{tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onMouseEnter={e => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#f0ede8';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }
                }}
                onMouseLeave={e => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#bbb';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.7rem 1.5rem',
                  background: activeTab === tab.id ? 'rgba(220,30,60,0.15)' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === tab.id ? '3px solid hsl(348,100%,55%)' : '3px solid transparent',
                  color: activeTab === tab.id ? 'hsl(348,100%,55%)' : '#bbb',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.72rem',
                  letterSpacing: '0.08em',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textTransform: 'uppercase',
                }}
              >
                {tab.label}
              </button>
            ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {activeTab === 'hero' && <HeroTab data={data} onRefetch={fetchData} />}
          {activeTab === 'about' && <AboutTab data={data} onRefetch={fetchData} />}
          {activeTab === 'skills' && <SkillsTab data={data} onRefetch={fetchData} />}
          {activeTab === 'projects' && <ProjectsTab data={data} onRefetch={fetchData} />}
          {activeTab === 'services' && <ServicesTab data={data} onRefetch={fetchData} />}
          {activeTab === 'timeline' && <TimelineTab data={data} onRefetch={fetchData} />}
          {activeTab === 'testimonials' && <TestimonialsTab data={data} onRefetch={fetchData} />}
          {activeTab === 'contact' && <ContactTab data={data} onRefetch={fetchData} />}
          {activeTab === 'messages' && <MessagesTab onRefetch={fetchData} />}
          {activeTab === 'seo' && <SEOTab data={data} onRefetch={fetchData} />}
          {activeTab === 'branding' && <BrandingTab data={data} onRefetch={fetchData} />}
          {activeTab === 'resume' && <ResumeTab data={data} onRefetch={fetchData} />}
        </div>
      </div>
    </div>
  );
}

// ─── HERO TAB ───────────────────────────────────────────────
function HeroTab({ data, onRefetch }: any) {
  const [form, setForm] = useState(data.hero || {});

  const save = async () => {
    await fetch('/api/hero', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  return (
    <div>
      <AdminLabel>Hero Content</AdminLabel>
      <AdminGrid>
        <AdminField label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <AdminField label="Role" value={form.role} onChange={v => setForm({ ...form, role: v })} />
        <AdminField label="Subtitle" value={form.sub} onChange={v => setForm({ ...form, sub: v })} textarea fullWidth />
        <AdminField label="Resume URL" value={form.resumeUrl} onChange={v => setForm({ ...form, resumeUrl: v })} />
        <AdminField label="Resume Button Label" value={form.resumeLabel} onChange={v => setForm({ ...form, resumeLabel: v })} />
      </AdminGrid>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#666' }}>
          Resume Download Enabled
        </label>
        <input
          type="checkbox"
          checked={form.resumeEnabled}
          onChange={e => setForm({ ...form, resumeEnabled: e.target.checked })}
        />
      </div>
      <SaveButton onSave={save} />
    </div>
  );
}

// ─── ABOUT TAB ──────────────────────────────────────────────
function AboutTab({ data, onRefetch }: any) {
  const [form, setForm] = useState(data.about || {});

  const save = async () => {
    await fetch('/api/about', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  return (
    <div>
      <AdminLabel>About Me</AdminLabel>
      <AdminGrid>
        <AdminField label="Bio 1" value={form.bio1} onChange={v => setForm({ ...form, bio1: v })} textarea fullWidth />
        <AdminField label="Bio 2" value={form.bio2} onChange={v => setForm({ ...form, bio2: v })} textarea fullWidth />
        <AdminField label="Years Experience" value={form.years} onChange={v => setForm({ ...form, years: v })} />
        <AdminField label="Projects Completed" value={form.projects} onChange={v => setForm({ ...form, projects: v })} />
        <AdminField label="Happy Clients" value={form.clients} onChange={v => setForm({ ...form, clients: v })} />
        <AdminField label="Academic Standing" value={form.standing} onChange={v => setForm({ ...form, standing: v })} />
      </AdminGrid>
      <AdminLabel>Profile Photo</AdminLabel>
      {form.photoUrl && (
        <img src={form.photoUrl} alt="Profile" style={{ width: '120px', height: '160px', objectFit: 'cover', marginBottom: '1rem', borderRadius: '2px' }} />
      )}
      <FileUpload
        folder="photos"
        accept="image/*"
        label="Upload Profile Photo"
        onUpload={url => setForm({ ...form, photoUrl: url })}
      />
      <div style={{ marginTop: '1.5rem' }}>
        <SaveButton onSave={save} />
      </div>
    </div>
  );
}

// ─── SKILLS TAB ─────────────────────────────────────────────
function SkillsTab({ data, onRefetch }: any) {
  const [skills, setSkills] = useState(data.skills || []);

  const saveAll = async () => {
    await fetch('/api/skills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skills),
    });
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  const addSkill = async () => {
    const res = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ icon: '💡', name: 'New Skill', order: skills.length + 1 }),
    });
    const skill = await res.json();
    setSkills([...skills, skill]);
  };

  const removeSkill = async (id: string) => {
    await fetch(`/api/skills/${id}`, { method: 'DELETE' });
    setSkills((prev: any[]) => prev.filter(s => s.id !== id));
    await fetch('/api/revalidate', { method: 'POST' });
  };

  return (
    <div>
      <AdminLabel>Skills</AdminLabel>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#666', marginBottom: '1rem' }}>
        Edit skills below then click Save All Skills
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
        {skills.map((skill: any, i: number) => (
          <div key={skill.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '2px', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              value={skill.icon || ''}
              onChange={e => {
                const arr = [...skills];
                arr[i] = { ...arr[i], icon: e.target.value };
                setSkills(arr);
              }}
              placeholder="emoji or image URL"
              style={{ width: '140px', background: '#0a0a0a', border: '1px solid #222', color: '#f0ede8', padding: '0.5rem', fontFamily: "'Syne', sans-serif", fontSize: '0.85rem', borderRadius: '1px', outline: 'none' }}
            />
            <input
              value={skill.name || ''}
              onChange={e => {
                const arr = [...skills];
                arr[i] = { ...arr[i], name: e.target.value };
                setSkills(arr);
              }}
              placeholder="Skill name"
              style={{ flex: 1, background: '#0a0a0a', border: '1px solid #222', color: '#f0ede8', padding: '0.5rem', fontFamily: "'Syne', sans-serif", fontSize: '0.85rem', borderRadius: '1px', outline: 'none' }}
            />
            <button
              onClick={() => removeSkill(skill.id)}
              style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', cursor: 'pointer', flexShrink: 0 }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={addSkill}
          style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px dashed #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', borderRadius: '1px', cursor: 'pointer' }}
        >
          + Add Skill
        </button>
        <SaveButton onSave={saveAll} label="Save All Skills" />
      </div>
    </div>
  );
}

// ─── PROJECTS TAB ───────────────────────────────────────────
function ProjectsTab({ data, onRefetch }: any) {
  const [projects, setProjects] = useState(data.projects || []);

  const saveProject = async (project: any) => {
    await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: project.title,
        desc: project.desc,
        tags: Array.isArray(project.tags) ? project.tags : project.tags.split(',').map((t: string) => t.trim()),
        link: project.link,
        order: project.order,
      }),
    });
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  const addProject = async () => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Project',
        desc: 'Project description',
        tags: ['React'],
        link: '#',
        order: projects.length + 1,
      }),
    });
    const project = await res.json();
    setProjects([...projects, project]);
  };

  const removeProject = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects((prev: any[]) => prev.filter(p => p.id !== id));
    await fetch('/api/revalidate', { method: 'POST' });
  };

  const handleImageUpload = async (projectId: string, url: string) => {
    await fetch('/api/projects/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, url, type: 'image' }),
    });
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  return (
    <div>
      <AdminLabel>Projects</AdminLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {projects.map((project: any, i: number) => (
          <div key={project.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '2px', padding: '1.5rem' }}>
            <AdminGrid>
              <AdminField
                label="Title"
                value={project.title || ''}
                onChange={v => { const arr = [...projects]; arr[i] = { ...arr[i], title: v }; setProjects(arr); }}
              />
              <AdminField
                label="Link"
                value={project.link || ''}
                onChange={v => { const arr = [...projects]; arr[i] = { ...arr[i], link: v }; setProjects(arr); }}
              />
              <AdminField
                label="Tags (comma separated)"
                value={Array.isArray(project.tags) ? project.tags.join(', ') : project.tags || ''}
                onChange={v => { const arr = [...projects]; arr[i] = { ...arr[i], tags: v }; setProjects(arr); }}
                fullWidth
              />
              <AdminField
                label="Description"
                value={project.desc || ''}
                onChange={v => { const arr = [...projects]; arr[i] = { ...arr[i], desc: v }; setProjects(arr); }}
                textarea
                fullWidth
              />
            </AdminGrid>

            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Project Images</div>
              {project.media && project.media.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {project.media.map((m: any) => (
                    <img key={m.id} src={m.url} alt="Project" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '2px' }} />
                  ))}
                </div>
              )}
              <FileUpload
                folder="projects"
                accept="image/*"
                label="Upload Project Image"
                onUpload={url => handleImageUpload(project.id, url)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <SaveButton onSave={() => saveProject(projects[i])} label="Save Project" />
              <button
                onClick={() => removeProject(project.id)}
                style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px solid #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={addProject}
          style={{ padding: '0.8rem', width: '100%', background: 'transparent', border: '1px dashed #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', borderRadius: '1px', cursor: 'pointer' }}
        >
          + Add Project
        </button>
      </div>
    </div>
  );
}

// ─── SERVICES TAB ───────────────────────────────────────────
function ServicesTab({ data, onRefetch }: any) {
  const [services, setServices] = useState(data.services || []);

  const save = async (service: any) => {
    await fetch(`/api/services/${service.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    });
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  const add = async () => {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const service = await res.json();
    setServices([...services, service]);
    await fetch('/api/revalidate', { method: 'POST' });
  };

  const remove = async (id: string) => {
    await fetch(`/api/services/${id}`, { method: 'DELETE' });
    setServices(services.filter((s: any) => s.id !== id));
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  return (
    <div>
      <AdminLabel>Services</AdminLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {services.map((service: any, i: number) => (
          <div key={service.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '2px', padding: '1.2rem' }}>
            <AdminGrid>
              <AdminField label="Number" value={service.num} onChange={v => { const arr = [...services]; arr[i] = { ...arr[i], num: v }; setServices(arr); }} />
              <AdminField label="Title" value={service.title} onChange={v => { const arr = [...services]; arr[i] = { ...arr[i], title: v }; setServices(arr); }} />
              <AdminField label="Description" value={service.desc} onChange={v => { const arr = [...services]; arr[i] = { ...arr[i], desc: v }; setServices(arr); }} textarea fullWidth />
            </AdminGrid>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <SaveButton onSave={() => save(services[i])} label="Save Service" />
              <button onClick={() => remove(service.id)} style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px solid #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={add} style={{ padding: '0.8rem', width: '100%', background: 'transparent', border: '1px dashed #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', borderRadius: '1px', cursor: 'pointer' }}>
          + Add Service
        </button>
      </div>
    </div>
  );
}

// ─── TIMELINE TAB ───────────────────────────────────────────
function TimelineTab({ data, onRefetch }: any) {
  const [timeline, setTimeline] = useState(data.timeline || []);

  const saveItem = async (item: any) => {
    await fetch(`/api/timeline/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: item.type,
        title: item.title,
        organisation: item.organisation,
        period: item.period,
        desc: item.desc,
        order: item.order,
      }),
    });
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  const add = async () => {
    const res = await fetch('/api/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'work',
        title: 'New Role',
        organisation: 'Company',
        period: '2024 — Present',
        desc: 'Description',
        order: timeline.length + 1,
      }),
    });
    const item = await res.json();
    setTimeline([...timeline, item]);
  };

  const remove = async (id: string) => {
    await fetch(`/api/timeline/${id}`, { method: 'DELETE' });
    setTimeline((prev: any[]) => prev.filter(t => t.id !== id));
    await fetch('/api/revalidate', { method: 'POST' });
  };

  return (
    <div>
      <AdminLabel>Timeline</AdminLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {timeline.map((item: any, i: number) => (
          <div key={item.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '2px', padding: '1.2rem' }}>
            <AdminGrid>
              <AdminField
                label="Title"
                value={item.title || ''}
                onChange={v => { const arr = [...timeline]; arr[i] = { ...arr[i], title: v }; setTimeline(arr); }}
              />
              <AdminField
                label="Organisation"
                value={item.organisation || ''}
                onChange={v => { const arr = [...timeline]; arr[i] = { ...arr[i], organisation: v }; setTimeline(arr); }}
              />
              <AdminField
                label="Period"
                value={item.period || ''}
                onChange={v => { const arr = [...timeline]; arr[i] = { ...arr[i], period: v }; setTimeline(arr); }}
              />
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Type</div>
                <select
                  value={item.type || 'work'}
                  onChange={e => { const arr = [...timeline]; arr[i] = { ...arr[i], type: e.target.value }; setTimeline(arr); }}
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #222', color: '#f0ede8', padding: '0.6rem', fontFamily: "'Syne', sans-serif", fontSize: '0.85rem', borderRadius: '1px', outline: 'none' }}
                >
                  <option value="work">Work</option>
                  <option value="education">Education</option>
                </select>
              </div>
              <AdminField
                label="Description"
                value={item.desc || ''}
                onChange={v => { const arr = [...timeline]; arr[i] = { ...arr[i], desc: v }; setTimeline(arr); }}
                textarea
                fullWidth
              />
            </AdminGrid>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <SaveButton onSave={() => saveItem(timeline[i])} label="Save" />
              <button
                onClick={() => remove(item.id)}
                style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px solid #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={add}
          style={{ padding: '0.8rem', width: '100%', background: 'transparent', border: '1px dashed #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', borderRadius: '1px', cursor: 'pointer' }}
        >
          + Add Entry
        </button>
      </div>
    </div>
  );
}

// ─── TESTIMONIALS TAB ───────────────────────────────────────
function TestimonialsTab({ data, onRefetch }: any) {
  const [pending, setPending] = useState<any[]>([]);
  const [approved, setApproved] = useState(data.testimonials || []);

  useEffect(() => {
    fetch('/api/testimonials?status=PENDING')
      .then(r => r.json())
      .then(setPending);
  }, []);

  const approve = async (id: string) => {
    await fetch(`/api/testimonials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    await fetch('/api/revalidate', { method: 'POST' });
    const item = pending.find(p => p.id === id);
    if (item) setApproved((prev: any[]) => [...prev, { ...item, status: 'APPROVED' }]);
    setPending((prev: any[]) => prev.filter(p => p.id !== id));
    onRefetch();
  };

  const reject = async (id: string) => {
    await fetch(`/api/testimonials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED' }),
    });
    setPending((prev: any[]) => prev.filter(p => p.id !== id));
  };

  const remove = async (id: string) => {
    await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
    setApproved((prev: any[]) => prev.filter((t: any) => t.id !== id));
    await fetch('/api/revalidate', { method: 'POST' });
  };

  return (
    <div>
      <AdminLabel>Pending Submissions ({pending.length})</AdminLabel>
      {pending.length === 0 ? (
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#555' }}>No pending submissions.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pending.map(t => (
            <div key={t.id} style={{ background: '#111', border: '1px solid hsl(348,40%,20%)', borderRadius: '2px', padding: '1.2rem' }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: 'hsl(348,100%,55%)', marginBottom: '0.6rem' }}>
                NEW — {new Date(t.createdAt).toLocaleDateString()}
              </div>
              <p style={{ fontStyle: 'italic', color: '#aaa', fontSize: '0.9rem', marginBottom: '0.8rem' }}>"{t.quote}"</p>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#888', marginBottom: '1rem' }}>
                — {t.author}{t.role ? ', ' + t.role : ''}
              </div>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button onClick={() => approve(t.id)} style={{ padding: '0.5rem 1rem', background: 'hsl(348,100%,40%)', color: '#fff', border: 'none', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', cursor: 'pointer' }}>✓ Approve</button>
                <button onClick={() => reject(t.id)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', cursor: 'pointer' }}>✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminLabel>Approved Testimonials</AdminLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {approved.map((t: any) => (
          <div key={t.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '2px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <p style={{ fontStyle: 'italic', color: '#aaa', fontSize: '0.88rem', marginBottom: '0.4rem' }}>"{t.quote}"</p>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#666' }}>— {t.author}{t.role ? ', ' + t.role : ''}</div>
            </div>
            <button onClick={() => remove(t.id)} style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', cursor: 'pointer', flexShrink: 0 }}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CONTACT TAB ────────────────────────────────────────────
function ContactTab({ data, onRefetch }: any) {
  const [form, setForm] = useState(data.contact || {});

  const save = async () => {
    await fetch('/api/contact-info', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
     await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  return (
    <div>
      <AdminLabel>Contact Information</AdminLabel>
      <AdminGrid>
        {['email', 'phone', 'location', 'facebook', 'linkedin', 'instagram', 'github'].map(key => (
          <AdminField
            key={key}
            label={key}
            value={(form as any)[key] || ''}
            onChange={v => setForm({ ...form, [key]: v })}
          />
        ))}
      </AdminGrid>
      <SaveButton onSave={save} />
    </div>
  );
}

// ─── MESSAGES TAB ───────────────────────────────────────────
function MessagesTab({ onRefetch }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    const res = await fetch('/api/contact');
    const data = await res.json();
    setMessages(data);
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/contact/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    });
    setMessages((prev: any[]) => prev.map(m => m.id === id ? { ...m, read: true } : m));
    onRefetch();
  };

  const deleteMsg = async (id: string) => {
    await fetch(`/api/contact/${id}`, { method: 'DELETE' });
    setMessages((prev: any[]) => prev.filter(m => m.id !== id));
    onRefetch();
  };

  if (loading) return <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#555' }}>Loading messages...</p>;

  return (
    <div>
      <AdminLabel>Messages Inbox ({messages.filter(m => !m.read).length} unread)</AdminLabel>
      {messages.length === 0 ? (
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#555' }}>No messages yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              background: msg.read ? '#111' : '#0f0f0f',
              border: '1px solid ' + (msg.read ? '#1a1a1a' : 'hsl(348,40%,20%)'),
              borderRadius: '2px', padding: '1.2rem', position: 'relative',
            }}>
              {!msg.read && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(348,100%,55%)' }} />
              )}
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: '#555', marginBottom: '0.5rem' }}>
                {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString()}
                {msg.read && <span style={{ marginLeft: '0.8rem', color: '#4caf50' }}>✓ Read</span>}
              </div>
              <div style={{ fontWeight: 700, marginBottom: '0.2rem', color: '#f0ede8' }}>{msg.name}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: 'hsl(348,100%,55%)', marginBottom: '0.8rem' }}>{msg.email}</div>
              <p style={{ fontSize: '0.88rem', color: '#aaa', lineHeight: 1.6, marginBottom: '1rem' }}>{msg.message}</p>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                {!msg.read && (
                  <button onClick={() => markRead(msg.id)} style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid hsl(348,40%,30%)', color: 'hsl(348,100%,55%)', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', cursor: 'pointer' }}>
                    ✓ Mark Read
                  </button>
                )}
                <a
                  href={`mailto:${msg.email}?subject=Re: Your message&body=Hi ${msg.name},%0D%0A%0D%0AThank you for reaching out.%0D%0A%0D%0A----%0D%0AOriginal message:%0D%0A${encodeURIComponent(msg.message)}`}
                  style={{ padding: '0.4rem 0.8rem', background: 'hsl(348,100%,40%)', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', textDecoration: 'none', display: 'inline-block' }}
                >
                  Reply via Email
                </a>
                <button onClick={() => deleteMsg(msg.id)} style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SEO TAB ────────────────────────────────────────────────
function SEOTab({ data, onRefetch }: any) {
  const [form, setForm] = useState(data.seo || {});

  const save = async () => {
    await fetch('/api/seo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
     await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  return (
    <div>
      <AdminLabel>SEO & Meta Tags</AdminLabel>
      <AdminGrid>
        <AdminField label="Page Title" value={form.title} onChange={v => setForm({ ...form, title: v })} fullWidth />
        <AdminField label="Meta Description" value={form.description} onChange={v => setForm({ ...form, description: v })} textarea fullWidth />
        <AdminField label="Keywords" value={form.keywords} onChange={v => setForm({ ...form, keywords: v })} fullWidth />
        <AdminField label="OG Image URL" value={form.ogImage} onChange={v => setForm({ ...form, ogImage: v })} />
        <AdminField label="Twitter Handle" value={form.twitterHandle} onChange={v => setForm({ ...form, twitterHandle: v })} />
      </AdminGrid>
      <SaveButton onSave={save} />
    </div>
  );
}

// ─── BRANDING TAB ───────────────────────────────────────────
function BrandingTab({ data, onRefetch }: any) {
  const [form, setForm] = useState(data.branding || {});

  const fonts = ['Syne', 'Inter', 'Playfair Display', 'Raleway', 'Oswald'];
  const monoFonts = ['Space Mono', 'Fira Code', 'JetBrains Mono'];

  const save = async () => {
    await fetch('/api/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  return (
  <div>
   <AdminLabel>Logo</AdminLabel>
      <AdminGrid>
        <AdminField label="Logo Text (shown if no image)" value={form.logoText} onChange={v => setForm({ ...form, logoText: v })} />
      </AdminGrid>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
          Logo Image (drag & drop any image format)
        </div>
        {form.logoUrl && (
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={form.logoUrl} alt="Logo" style={{ height: '60px', width: 'auto', objectFit: 'contain', background: '#1a1a1a', padding: '0.5rem', borderRadius: '2px' }} />
            <button
              onClick={() => setForm({ ...form, logoUrl: '' })}
              style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', cursor: 'pointer' }}
            >
              Remove Logo
            </button>
          </div>
        )}
        <FileUpload
          folder="logos"
          accept="image/*,.svg,.ico,.webp,.png,.jpg,.jpeg,.gif"
          label="Drop your logo here — any image format"
          onUpload={url => setForm({ ...form, logoUrl: url })}
        />
      </div>

     <AdminLabel>Browser Tab Icon (Favicon)</AdminLabel>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#666', marginBottom: '1rem', lineHeight: 1.6 }}>
          Upload a square image (PNG recommended, 32x32 or 64x64px). After uploading, copy the URL and add it to your public folder as favicon.ico or update your layout.tsx link tag.
        </p>
        <FileUpload
          folder="favicon"
          accept="image/*,.ico"
          label="Upload Favicon / Tab Icon"
          onUpload={async url => {
            navigator.clipboard?.writeText(url);
            alert('Favicon uploaded! URL copied to clipboard: ' + url + '\n\nAdd this to your layout.tsx <head> as: <link rel="icon" href="' + url + '" />');
          }}
        />
      </div>

      <AdminLabel>Mono Font</AdminLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
        {monoFonts.map(font => (
          <div
            key={font}
            onClick={() => setForm({ ...form, monoFont: font })}
            style={{
              background: form.monoFont === font ? 'rgba(220,30,60,0.15)' : '#111',
              border: '1px solid ' + (form.monoFont === font ? 'hsl(348,100%,55%)' : '#1a1a1a'),
              borderRadius: '2px',
              padding: '0.8rem 1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontFamily: `'${font}', monospace`, fontSize: '1rem', marginBottom: '0.3rem' }}>Aa Bb Cc</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#666' }}>{font}</div>
          </div>
        ))}
      </div>

      <SaveButton onSave={save} />
    </div>

  );
}

// ─── RESUME TAB ─────────────────────────────────────────────
function ResumeTab({ data, onRefetch }: any) {
  const [resume, setResume] = useState(data.resume || {});
  const [uploading, setUploading] = useState(false);

  const toggleEnabled = async () => {
    await fetch(`/api/resume/${resume.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !resume.enabled }),
    });
    setResume({ ...resume, enabled: !resume.enabled });
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  return (
    <div>
      <AdminLabel>Resume / CV</AdminLabel>
      <div style={{
        background: '#111',
        border: '1px solid #1a1a1a',
        borderRadius: '2px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '0.3rem', color: 'hsl(348,100%,40%)' }}>
              Resume Download
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#666' }}>
              {resume.enabled ? 'Visible to visitors' : 'Hidden from visitors'}
            </div>
          </div>
          <button
            onClick={toggleEnabled}
            style={{
              padding: '0.5rem 1.2rem',
              background: resume.enabled ? 'hsl(348,100%,40%)' : '#333',
              color: '#fff',
              border: 'none',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              borderRadius: '1px',
              cursor: 'pointer',
            }}
          >
            {resume.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {resume.url && (
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#666', marginBottom: '1rem' }}>
            Current: {resume.filename}
          </div>
        )}

        <FileUpload
          folder="resume"
          accept=".pdf"
          label="Upload New Resume PDF"
          onUpload={async url => {
            const res = await fetch('/api/resume', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, filename: url.split('/').pop(), enabled: true }),
            });
            const newResume = await res.json();
            setResume(newResume);
            onRefetch();
          }}
        />
      </div>
    </div>
  );
}