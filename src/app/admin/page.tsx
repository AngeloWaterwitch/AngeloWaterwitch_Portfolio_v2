'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { AdminLabel } from './components/AdminLabel';
import { AdminField } from './components/AdminField';
import { AdminGrid } from './components/AdminGrid';
import { SaveButton } from './components/SaveButton';
import { FileUpload } from './components/FileUpload';
import { SectionsTab } from './components/SectionsTab';
import { HeaderFooterTab } from './components/HeaderFooterTab';
import { ClientsTab } from './components/ClientsTab';
import { AdminCallListener, type AdminSummary } from './components/AdminCallListener';

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hero');
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatSummary, setChatSummary] = useState<AdminSummary | null>(null);

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
    { id: 'clients', label: chatSummary && chatSummary.totalUnread > 0 ? `Clients (${chatSummary.totalUnread} new)` : 'Clients' },
    { id: 'messages', label: unreadCount > 0 ? `Messages (${unreadCount})` : 'Messages' },
    { id: 'sections', label: 'Sections & Nav' },
    { id: 'headerfooter', label: 'Header & Footer' },
    { id: 'seo', label: 'SEO' },
    { id: 'branding', label: 'Branding' },
    { id: 'theme', label: 'Theme' },
    { id: 'resume', label: 'Resume' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <AdminCallListener onSummary={setChatSummary} />

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
            onMouseEnter={e => { e.currentTarget.style.color = 'hsl(348,100%,55%)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; }}
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
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(348,100%,55%)'; e.currentTarget.style.color = 'hsl(348,100%,55%)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#ccc'; }}
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
          {activeTab === 'clients' && <ClientsTab summary={chatSummary} />}
          {activeTab === 'messages' && <MessagesTab onRefetch={fetchData} />}
          {activeTab === 'sections' && <SectionsTab data={data} onRefetch={fetchData} />}
          {activeTab === 'headerfooter' && <HeaderFooterTab data={data} onRefetch={fetchData} />}
          {activeTab === 'seo' && <SEOTab data={data} onRefetch={fetchData} />}
          {activeTab === 'branding' && <BrandingTab data={data} onRefetch={fetchData} />}
          {activeTab === 'theme' && <ThemeTab data={data} onRefetch={fetchData} />}
          {activeTab === 'resume' && <ResumeTab data={data} onRefetch={fetchData} />}
        </div>
      </div>
    </div>
  );
}

// ─── HERO TAB ───────────────────────────────────────────────
function HeroTab({ data, onRefetch }: any) {
 const [form, setForm] = useState(data.hero || {});

useEffect(() => {
  setForm(data.hero || {});
}, [data.hero]);

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
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Square PNG recommended — 32x32 or 64x64px
        </div>
        {form.faviconUrl && (
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={form.faviconUrl} alt="Favicon" style={{ height: '32px', width: '32px', objectFit: 'contain', background: '#1a1a1a', padding: '4px', borderRadius: '2px' }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#666' }}>
              Current favicon
            </span>
            <button
              onClick={() => setForm({ ...form, faviconUrl: '' })}
              style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid #333', color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', borderRadius: '1px', cursor: 'pointer' }}
            >
              Remove
            </button>
          </div>
        )}
        <FileUpload
          folder="favicon"
          accept="image/*,.ico"
          label="Upload Favicon / Tab Icon"
          onUpload={async url => {
            setForm((prev: any) => ({ ...prev, faviconUrl: url }));
          }}
        />
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#555', marginTop: '0.5rem' }}>
          Click Save below to apply the favicon site-wide.
        </div>
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
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch('/api/resume/request');
      const data = await res.json();
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAction = async (token: string, action: 'approve' | 'deny') => {
    setActionLoading(token + action);
    try {
      await fetch(`/api/resume/request/${action}?token=${token}`);
      await fetchRequests();
    } finally {
      setActionLoading(null);
    }
  };

  const toggleEnabled = async () => {
    if (!resume?.id) return;
    await fetch(`/api/resume/${resume.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !resume.enabled }),
    });
    setResume({ ...resume, enabled: !resume.enabled });
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  const pendingRequests = requests.filter((r: any) => r.status === 'PENDING');
  const pastRequests = requests.filter((r: any) => r.status !== 'PENDING');

  const statusColor: Record<string, string> = {
    PENDING: '#f59e0b',
    APPROVED: '#22c55e',
    DENIED: '#ef4444',
  };

  return (
    <div>
      <AdminLabel>Resume / CV</AdminLabel>

      {/* ── File & Toggle ── */}
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
              {!resume?.id
                ? 'No resume uploaded yet'
                : resume.enabled
                ? 'Visible to visitors'
                : 'Hidden from visitors'}
            </div>
          </div>
          <button
            onClick={toggleEnabled}
            disabled={!resume?.id}
            style={{
              padding: '0.5rem 1.2rem',
              background: !resume?.id ? '#222' : resume.enabled ? 'hsl(348,100%,40%)' : '#333',
              color: !resume?.id ? '#555' : '#fff',
              border: 'none',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              borderRadius: '1px',
              cursor: !resume?.id ? 'not-allowed' : 'pointer',
            }}
          >
            {!resume?.id ? 'No Resume Uploaded' : resume.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {resume?.url && (
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

      {/* ── Pending Requests ── */}
      <AdminLabel>Pending Requests</AdminLabel>
      <div style={{
        background: '#111',
        border: '1px solid #1a1a1a',
        borderRadius: '2px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        {loadingRequests ? (
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#555' }}>
            Loading...
          </div>
        ) : pendingRequests.length === 0 ? (
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#555' }}>
            No pending requests.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingRequests.map((r: any) => (
              <div key={r.id} style={{
                background: '#0a0a0a',
                border: '1px solid #222',
                borderRadius: '2px',
                padding: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#f0ede8', marginBottom: '0.3rem' }}>
                      {r.email}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#888', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                      {r.reason}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#555' }}>
                      {new Date(r.createdAt).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      onClick={() => handleAction(r.token, 'approve')}
                      disabled={actionLoading === r.token + 'approve'}
                      style={{
                        padding: '0.45rem 1rem',
                        background: '#22c55e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '1px',
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '0.68rem',
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        opacity: actionLoading === r.token + 'approve' ? 0.6 : 1,
                      }}
                    >
                      {actionLoading === r.token + 'approve' ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(r.token, 'deny')}
                      disabled={actionLoading === r.token + 'deny'}
                      style={{
                        padding: '0.45rem 1rem',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '1px',
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '0.68rem',
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        opacity: actionLoading === r.token + 'deny' ? 0.6 : 1,
                      }}
                    >
                      {actionLoading === r.token + 'deny' ? 'Denying...' : 'Deny'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Past Requests ── */}
      {pastRequests.length > 0 && (
        <>
          <AdminLabel>Past Requests</AdminLabel>
          <div style={{
            background: '#111',
            border: '1px solid #1a1a1a',
            borderRadius: '2px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pastRequests.map((r: any) => (
                <div key={r.id} style={{
                  background: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '2px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.82rem', color: '#f0ede8', marginBottom: '0.2rem' }}>
                      {r.email}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#555' }}>
                      {new Date(r.createdAt).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                    color: statusColor[r.status] ?? '#888',
                    textTransform: 'uppercase',
                  }}>
                    {r.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── THEME TAB ──────────────────────────────────────────────
function ThemeTab({ data, onRefetch }: any) {
  const [theme, setTheme] = useState(data.theme || {
    primaryColor: 'hsl(348, 100%, 40%)',
    primaryLight: 'hsl(348, 100%, 55%)',
    primaryDim: 'hsl(348, 60%, 25%)',
    bgDark: '#0a0a0a',
    bgDark2: '#111111',
    bgDark3: '#1a1a1a',
    bgDark4: '#222222',
    textLight: '#f0ede8',
  });

  const save = async () => {
    await fetch('/api/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theme),
    });
    await fetch('/api/revalidate', { method: 'POST' });
    onRefetch();
  };

  const presets = [
    {
      name: 'Crimson (Default)',
      primaryColor: 'hsl(348, 100%, 40%)',
      primaryLight: 'hsl(348, 100%, 55%)',
      primaryDim: 'hsl(348, 60%, 25%)',
      bgDark: '#0a0a0a',
      bgDark2: '#111111',
      bgDark3: '#1a1a1a',
      bgDark4: '#222222',
      textLight: '#f0ede8',
    },
    {
      name: 'Ocean Blue',
      primaryColor: 'hsl(210, 100%, 40%)',
      primaryLight: 'hsl(210, 100%, 55%)',
      primaryDim: 'hsl(210, 60%, 25%)',
      bgDark: '#030810',
      bgDark2: '#060f1a',
      bgDark3: '#0a1828',
      bgDark4: '#0f2035',
      textLight: '#e8f0f0',
    },
    {
      name: 'Emerald',
      primaryColor: 'hsl(150, 80%, 35%)',
      primaryLight: 'hsl(150, 80%, 50%)',
      primaryDim: 'hsl(150, 50%, 20%)',
      bgDark: '#030a06',
      bgDark2: '#060f0a',
      bgDark3: '#0a1a0f',
      bgDark4: '#0f2218',
      textLight: '#e8f0eb',
    },
    {
      name: 'Purple',
      primaryColor: 'hsl(270, 80%, 45%)',
      primaryLight: 'hsl(270, 80%, 60%)',
      primaryDim: 'hsl(270, 50%, 25%)',
      bgDark: '#07030a',
      bgDark2: '#0e060f',
      bgDark3: '#180a1a',
      bgDark4: '#200f22',
      textLight: '#f0e8f0',
    },
    {
      name: 'Amber',
      primaryColor: 'hsl(38, 100%, 45%)',
      primaryLight: 'hsl(38, 100%, 60%)',
      primaryDim: 'hsl(38, 60%, 25%)',
      bgDark: '#0a0800',
      bgDark2: '#110f00',
      bgDark3: '#1a1600',
      bgDark4: '#221e00',
      textLight: '#f0ede8',
    },
    {
      name: 'Pure Dark',
      primaryColor: 'hsl(0, 0%, 70%)',
      primaryLight: 'hsl(0, 0%, 90%)',
      primaryDim: 'hsl(0, 0%, 30%)',
      bgDark: '#000000',
      bgDark2: '#0a0a0a',
      bgDark3: '#141414',
      bgDark4: '#1e1e1e',
      textLight: '#ffffff',
    },
  ];

  const colorFields = [
    { key: 'primaryColor', label: 'Primary Color' },
    { key: 'primaryLight', label: 'Primary Light' },
    { key: 'primaryDim', label: 'Primary Dim' },
    { key: 'bgDark', label: 'Background Dark' },
    { key: 'bgDark2', label: 'Background Dark 2' },
    { key: 'bgDark3', label: 'Background Dark 3' },
    { key: 'bgDark4', label: 'Background Dark 4' },
    { key: 'textLight', label: 'Text Color' },
  ];

  return (
    <div>
      <AdminLabel>Theme Presets</AdminLabel>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#666', marginBottom: '1rem' }}>
        Click a preset to apply it instantly — then save.
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '0.8rem',
        marginBottom: '2rem',
      }}>
        {presets.map(preset => (
          <div
            key={preset.name}
            onClick={() => setTheme({ ...theme, ...preset })}
            style={{
              background: preset.bgDark2,
              border: '2px solid ' + (theme.primaryColor === preset.primaryColor ? preset.primaryLight : preset.bgDark4),
              borderRadius: '4px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: preset.primaryColor }} />
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: preset.primaryLight }} />
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: preset.bgDark3 }} />
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: preset.textLight, letterSpacing: '0.05em' }}>
              {preset.name}
            </div>
          </div>
        ))}
      </div>

      <AdminLabel>Custom Colors</AdminLabel>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#666', marginBottom: '1rem' }}>
        Click the colour swatch to pick any colour. Supports hex, hsl, rgb.
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {colorFields.map(field => (
          <div key={field.key} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '2px', padding: '1rem' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              {field.label}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input
                type="color"
                value={cssToHex((theme as any)[field.key] || '#000000')}
                onChange={e => setTheme({ ...theme, [field.key]: e.target.value })}
                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
              />
              <input
                type="text"
                value={(theme as any)[field.key] || ''}
                onChange={e => setTheme({ ...theme, [field.key]: e.target.value })}
                style={{ flex: 1, background: '#0a0a0a', border: '1px solid #222', color: '#f0ede8', padding: '0.4rem 0.6rem', fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', borderRadius: '1px', outline: 'none' }}
              />
            </div>
          </div>
        ))}
      </div>

      <AdminLabel>Preview</AdminLabel>
      <div style={{
        background: (theme as any).bgDark || '#0a0a0a',
        border: '1px solid #333',
        borderRadius: '4px',
        padding: '2rem',
        marginBottom: '2rem',
      }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: (theme as any).primaryLight, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
          Software & Design Engineer
        </div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: (theme as any).textLight, lineHeight: 1, marginBottom: '0.5rem' }}>
          Angelo
        </div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: (theme as any).primaryLight, lineHeight: 1, marginBottom: '1rem' }}>
          Waterwitch
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ padding: '0.6rem 1.5rem', background: (theme as any).primaryColor, color: '#fff', borderRadius: '2px', fontFamily: "'Syne', sans-serif", fontSize: '0.8rem', fontWeight: 700 }}>
            Download CV
          </div>
          <div style={{ padding: '0.6rem 1.5rem', border: '1px solid #444', color: (theme as any).textLight, borderRadius: '2px', fontFamily: "'Syne', sans-serif", fontSize: '0.8rem' }}>
            Get In Touch
          </div>
        </div>
      </div>

      <SaveButton onSave={save} label="Apply Theme to Site" />
    </div>
  );
}

// ─── HELPERS ────────────────────────────────────────────────
function cssToHex(color: string): string {
  if (color.startsWith('#')) return color;
  try {
    const d = document.createElement('div');
    d.style.color = color;
    document.body.appendChild(d);
    const rgb = window.getComputedStyle(d).color;
    document.body.removeChild(d);
    const match = rgb.match(/\d+/g);
    if (!match) return '#000000';
    const [r, g, b] = match.map(Number);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  } catch {
    return '#000000';
  }
}