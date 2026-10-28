'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Mail, Phone, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Certificate { id: string; title: string; issuer: string; issue_date: string | null; }
interface Experience { id: string; role: string; company: string; dates: string; bullets: string; }
interface Education { id: string; school: string; course: string; graduation: string; coursework: string; organization: string; award: string; }
interface StoredResume { summary?: string; selectedEducation?: string[]; education?: Education[]; selectedCertificates?: string[]; selectedSkills?: string[]; experiences?: Experience[]; }

const skillGroups = [
  { title: 'Web & Full-Stack Development', skills: ['React', 'React Router', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Node.js', 'Express.js', 'REST APIs', 'Axios'] },
  { title: 'Mobile App Development', skills: ['React Native', 'Expo', 'Expo Router', 'TypeScript', 'React Navigation', 'Expo Notifications', 'AsyncStorage', 'EAS Build'] },
  { title: 'Cloud & Backend Services', skills: ['Firebase Authentication', 'Cloud Firestore', 'Firebase Storage', 'MongoDB', 'Mongoose', 'JWT Authentication', 'bcrypt/bcryptjs', 'Multer', 'CSV processing'] },
  { title: 'Design & Developer Tools', skills: ['Radix UI', 'Responsive Design', 'Accessibility', 'Git', 'GitHub', 'Figma/UI Design', 'PDF generation', 'File uploads'] },
];
const allSkills = skillGroups.flatMap((group) => group.skills);
const defaultSummary = 'I build functional web applications, design intuitive user experiences, and enjoy solving complex problems through algorithms and creative thinking. I also love turning ideas into meaningful content.';

function readStoredResume(): StoredResume {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(window.localStorage.getItem('ivy-resume-builder') ?? '{}') as StoredResume; } catch { return {}; }
}

function readEducationEntries(): Education[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem('ivy-education') ?? '[]') as Education[];
  } catch {
    return [];
  }
}

function formatEducation(entry: Education) {
  return [entry.school, entry.course, entry.graduation, entry.coursework, entry.organization, entry.award].filter(Boolean).join(' - ');
}

export default function ResumePage() {
  const router = useRouter();
  const [loadingSession, setLoadingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [summary, setSummary] = useState(() => readStoredResume().summary ?? defaultSummary);
  const [educationEntries] = useState<Education[]>(readEducationEntries);
  const [selectedEducation, setSelectedEducation] = useState<string[]>(() => {
    const storedResume = readStoredResume();
    return storedResume.selectedEducation ?? readEducationEntries().map((entry) => entry.id);
  });
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>(() => readStoredResume().selectedCertificates ?? []);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(() => readStoredResume().selectedSkills ?? allSkills);
  const [experiences, setExperiences] = useState<Experience[]>(() => readStoredResume().experiences ?? []);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setLoadingSession(false);
      setAuthenticated(Boolean(session));
      if (!session) router.replace('/admin');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/admin');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (loadingSession || !authenticated) return;

    void supabase.from('certificates').select('id, title, issuer, issue_date').order('created_at', { ascending: false }).then(({ data }) => {
      const loadedCertificates = data ?? [];
      setCertificates(loadedCertificates);
      setSelectedCertificates((current) => current.length ? current : loadedCertificates.map((certificate) => certificate.id));
    });
  }, [authenticated, loadingSession]);

  function toggleSkill(skill: string) { setSelectedSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]); }
  function toggleEducation(id: string) { setSelectedEducation((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function toggleCertificate(id: string) { setSelectedCertificates((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function addExperience() { setExperiences((current) => [...current, { id: crypto.randomUUID(), role: '', company: '', dates: '', bullets: '' }]); }
  function updateExperience(id: string, field: 'role' | 'company' | 'dates', value: string) { setExperiences((current) => current.map((experience) => experience.id === id ? { ...experience, [field]: value } : experience)); }
  function updateBullet(id: string, index: number, value: string) { setExperiences((current) => current.map((experience) => { if (experience.id !== id) return experience; const bullets = experience.bullets.split('\n'); bullets[index] = value; return { ...experience, bullets: bullets.join('\n') }; })); }
  function addBullet(id: string) { setExperiences((current) => current.map((experience) => experience.id === id ? { ...experience, bullets: experience.bullets ? `${experience.bullets}\n` : '' } : experience)); }
  function removeBullet(id: string, index: number) { setExperiences((current) => current.map((experience) => { if (experience.id !== id) return experience; const bullets = experience.bullets.split('\n'); bullets.splice(index, 1); return { ...experience, bullets: bullets.join('\n') }; })); }
  function removeExperience(id: string) { setExperiences((current) => current.filter((experience) => experience.id !== id)); }

  if (loadingSession || !authenticated) {
    return <main className="flex min-h-screen items-center justify-center bg-pink-50 text-sm text-pink-500">Checking authentication...</main>;
  }

  async function downloadResume() {
    setSaving(true); setSavedMessage('');
    const education = educationEntries.filter((entry) => selectedEducation.includes(entry.id));
    const payload = { summary, education, selectedEducation, experiences, selectedSkills, selectedCertificates, certificates };
    window.localStorage.setItem('ivy-resume-builder', JSON.stringify(payload));
    const response = await fetch('/api/resume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) { setSavedMessage('Unable to generate the resume PDF.'); setSaving(false); return; }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = 'Ivy-Resume.pdf'; link.click(); URL.revokeObjectURL(url);
    setSavedMessage('ATS resume downloaded.'); setSaving(false);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff6fa_0%,#fffdf9_55%,#f5f1ff_100%)] px-4 py-6 text-slate-700 sm:px-6"><div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-col gap-4 rounded-2xl border border-pink-100 bg-white/85 p-5 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-500"><Sparkles className="h-5 w-5" /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pink-500">Admin / Resume</p><h1 className="font-[Georgia,serif] text-2xl font-bold text-slate-900">Build ATS resume</h1></div></div><div className="flex flex-wrap items-center gap-4 text-xs font-semibold"><Link href="/admin" className="inline-flex items-center gap-1 text-pink-600"><ArrowLeft className="h-3.5 w-3.5" /> Back to Manager</Link><Link href="/" className="text-slate-500">Back to Portfolio</Link><button type="button" onClick={() => void downloadResume()} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-pink-500 px-3 py-2 text-white disabled:opacity-60"><Download className="h-3.5 w-3.5" /> {saving ? 'Preparing...' : 'Download ATS PDF'}</button></div></header>
      {savedMessage && <p className="rounded-xl border border-pink-200 bg-pink-50 p-3 text-sm text-pink-700">{savedMessage}</p>}
      <section className="rounded-2xl border border-pink-200 bg-white/80 p-6 shadow-sm"><h2 className="font-[Georgia,serif] text-xl font-bold text-slate-900">Summary</h2><textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} className="mt-4 w-full rounded-xl border border-pink-200 px-3 py-2.5 text-sm" /></section>
      <section className="rounded-2xl border border-pink-200 bg-white/80 p-6 shadow-sm"><div className="flex items-center justify-between gap-4"><div><h2 className="font-[Georgia,serif] text-xl font-bold text-slate-900">Experience</h2><p className="mt-1 text-xs text-slate-500">Add as many roles and bullets as you need.</p></div><button type="button" onClick={addExperience} className="inline-flex items-center gap-1 rounded-lg bg-pink-500 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Add experience</button></div><div className="mt-5 space-y-4">{experiences.length === 0 ? <p className="rounded-xl border border-dashed border-pink-200 p-4 text-sm text-slate-500">No experience added yet.</p> : experiences.map((experience) => <article key={experience.id} className="rounded-xl border border-pink-100 bg-pink-50/40 p-4"><div className="grid gap-3 sm:grid-cols-3"><input value={experience.role} onChange={(event) => updateExperience(experience.id, 'role', event.target.value)} placeholder="Role, e.g. Content Writer" className="rounded-lg border border-pink-200 px-3 py-2 text-sm" /><input value={experience.company} onChange={(event) => updateExperience(experience.id, 'company', event.target.value)} placeholder="Company or organization" className="rounded-lg border border-pink-200 px-3 py-2 text-sm" /><input value={experience.dates} onChange={(event) => updateExperience(experience.id, 'dates', event.target.value)} placeholder="Dates, e.g. 2024 - Present" className="rounded-lg border border-pink-200 px-3 py-2 text-sm" /></div><div className="mt-4 space-y-2">{experience.bullets.split('\n').map((bullet, index) => <div key={`${experience.id}-bullet-${index}`} className="flex items-center gap-2"><span className="text-pink-500">•</span><input value={bullet} onChange={(event) => updateBullet(experience.id, index, event.target.value)} placeholder="Achievement or responsibility" className="w-full rounded-lg border border-pink-200 px-3 py-2 text-sm" />{experience.bullets.split('\n').length > 1 && <button type="button" onClick={() => removeBullet(experience.id, index)} aria-label="Remove bullet" className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>}</div>)}</div><div className="mt-3 flex items-center justify-between"><button type="button" onClick={() => addBullet(experience.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-pink-600"><Plus className="h-3.5 w-3.5" /> Add bullet</button><button type="button" onClick={() => removeExperience(experience.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-500"><Trash2 className="h-3.5 w-3.5" /> Remove experience</button></div></article>)}</div></section>
      <section className="rounded-2xl border border-pink-200 bg-white/80 p-6 shadow-sm"><h2 className="font-[Georgia,serif] text-xl font-bold text-slate-900">Education</h2><p className="mt-1 text-xs text-slate-500">Choose which education entries from the portfolio appear in the ATS PDF.</p><div className="mt-4 space-y-2">{educationEntries.length === 0 ? <p className="text-sm text-slate-500">No education has been added in the portfolio manager yet.</p> : educationEntries.map((entry) => <label key={entry.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-pink-100 bg-pink-50/40 p-3 text-sm"><input type="checkbox" checked={selectedEducation.includes(entry.id)} onChange={() => toggleEducation(entry.id)} className="mt-0.5 accent-pink-500" /><span>{formatEducation(entry)}</span></label>)}</div></section>
      <section className="rounded-2xl border border-pink-200 bg-white/80 p-6 shadow-sm"><h2 className="font-[Georgia,serif] text-xl font-bold text-slate-900">Certificates</h2><p className="mt-1 text-xs text-slate-500">Choose which certificates appear in the ATS PDF.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{certificates.length === 0 ? <p className="text-sm text-slate-500">No certificates have been added yet.</p> : certificates.map((certificate) => <label key={certificate.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-pink-100 bg-pink-50/40 p-3 text-sm"><input type="checkbox" checked={selectedCertificates.includes(certificate.id)} onChange={() => toggleCertificate(certificate.id)} className="mt-0.5 accent-pink-500" /><span><strong className="font-semibold text-slate-800">{certificate.title}</strong><span className="block text-xs text-slate-500">{certificate.issuer}{certificate.issue_date ? ` - ${certificate.issue_date}` : ''}</span></span></label>)}</div></section>
      <section className="rounded-2xl border border-pink-200 bg-white/80 p-6 shadow-sm"><h2 className="font-[Georgia,serif] text-xl font-bold text-slate-900">Skills &amp; Interests</h2><p className="mt-1 text-xs text-slate-500">Select the skills you want the ATS resume to include.</p><div className="mt-5 grid gap-5 md:grid-cols-2">{skillGroups.map((group) => <fieldset key={group.title}><legend className="text-sm font-semibold text-slate-800">{group.title}</legend><div className="mt-2 space-y-2">{group.skills.map((skill) => <label key={skill} className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={selectedSkills.includes(skill)} onChange={() => toggleSkill(skill)} className="accent-pink-500" />{skill}</label>)}</div></fieldset>)}</div></section>
      <div className="flex items-center justify-between gap-4 pb-6 text-sm text-slate-500"><span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-pink-400" /> ivy.porcado@sorsu.edu.ph</span><span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-pink-400" /> 0927 842 2831</span></div>
    </div></main>
  );
}
