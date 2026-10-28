'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Award,
  CheckCircle2,
  Code2,
  Crown,
  Download,
  ExternalLink,
  Heart,
  Mail,
  Smartphone,
  Cloud,
  Wrench,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image_url: string;
  project_url: string;
}

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issue_date: string;
  credential_url: string;
  image_url: string;
}

interface Education {
  id: string;
  school: string;
  course: string;
  graduation: string;
  coursework: string;
  organization: string;
  award: string;
}

interface StoredResume {
  summary?: string;
  education?: Education[] | string;
  selectedCertificates?: string[];
  selectedSkills?: string[];
  experiences?: { id: string; role: string; company: string; dates: string; bullets: string }[];
  certificates?: Certificate[];
}

// Updated to portfolio-assets (plural)
const profileImageUrl =
  'https://vcxilrgahparhpifrkkd.supabase.co/storage/v1/object/public/portfolio-assets/862399625_1801307107743166_4011689288237666100_n.jpg';

const skillCategories = [
  {
    title: 'Web & Full-Stack Development',
    icon: Code2,
    items: [
      { label: 'React', value: 75 },
      { label: 'React Router', value: 72 },
      { label: 'JavaScript', value: 65 },
      { label: 'HTML', value: 82 },
      { label: 'CSS', value: 80 },
      { label: 'Tailwind CSS', value: 73 },
      { label: 'Node.js', value: 74 },
      { label: 'Express.js', value: 72 },
      { label: 'REST APIs', value: 74 },
      { label: 'Axios', value: 50 },
    ],
  },
  {
    title: 'Mobile App Development',
    icon: Smartphone,
    items: [
      { label: 'React Native', value: 88 },
      { label: 'Expo', value: 87 },
      { label: 'Expo Router', value: 82 },
      { label: 'TypeScript', value: 83 },
      { label: 'React Navigation', value: 82 },
      { label: 'Expo Notifications', value: 60 },
      { label: 'AsyncStorage', value: 65 },
      { label: 'EAS Build', value: 72 },
    ],
  },
  {
    title: 'Cloud & Backend Services',
    icon: Cloud,
    items: [
      { label: 'Firebase Authentication', value: 84 },
      { label: 'Cloud Firestore', value: 82 },
      { label: 'Firebase Storage', value: 80 },
      { label: 'MongoDB', value: 78 },
      { label: 'Mongoose', value: 77 },
      { label: 'JWT Authentication', value: 80 },
      { label: 'bcrypt/bcryptjs', value: 75 },
      { label: 'Multer', value: 76 },
      { label: 'CSV processing', value: 72 },
    ],
  },
  {
    title: 'Design & Developer Tools',
    icon: Wrench,
    items: [
      { label: 'Radix UI', value: 52 },
      { label: 'Responsive Design', value: 80 },
      { label: 'Accessibility', value: 86 },
      { label: 'Git', value: 84 },
      { label: 'GitHub', value: 84 },
      { label: 'Figma/UI Design', value: 90 },
      { label: 'PDF generation', value: 72 },
      { label: 'File uploads', value: 78 },
    ],
  },
];

const learningSkills = [
  { label: 'Supabase', value: 45 },
  { label: 'PostgreSQL', value: 45 },
  { label: 'Backend-as-a-Service concepts', value: 45 },
  { label: 'Database migration concepts', value: 40 },
];

const projectFilters = ['All Projects', 'Web Apps', 'UI/UX Design', 'Personal'] as const;
type ProjectFilter = (typeof projectFilters)[number];

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/ivy.riorosa', icon: 'f', style: 'bg-[#1877f2] text-white' },
  { label: 'Instagram', href: 'https://www.instagram.com/itz.yviien?Y29heHJqbmZmNGNh', icon: '◎', style: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white' },
  { label: 'Discord', href: 'https://discord.com/users/ivyvitwives_74109', icon: '☁', style: 'bg-[#5865f2] text-white' },
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [educationEntries, setEducationEntries] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [formSending, setFormSending] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [resumeDownloading, setResumeDownloading] = useState(false);
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('All Projects');
  const [projectSearch, setProjectSearch] = useState('');

  async function fetchData() {
    setLoading(true);
    const { data: projData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    const { data: certData } = await supabase.from('certificates').select('*').order('created_at', { ascending: false });

    if (projData) setProjects(projData);
    if (certData) setCertificates(certData);
    setLoading(false);
  }

  async function handleResumeDownload() {
    setResumeDownloading(true);
    try {
      const storedResume = window.localStorage.getItem('ivy-resume-builder');
      const payload = storedResume ? JSON.parse(storedResume) as StoredResume : undefined;
      const response = payload ? await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }) : await fetch('/api/resume');

      if (!response.ok) throw new Error('Unable to generate resume');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Ivy-Resume.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setResumeDownloading(false);
    }
  }

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormSending(true);
    setFormSuccess(false);
    setFormError('');

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      // Replace YOUR_FORMSPREE_ID with your Formspree ID (e.g., https://formspree.io/f/xbjnqpk)
      const response = await fetch('https://formspree.io/f/mvkkpeoj', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        setFormSuccess(true);
        form.reset();
      } else {
        setFormError('Failed to send message. Please check your Formspree endpoint.');
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormSending(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedEducation = JSON.parse(window.localStorage.getItem('ivy-education') ?? '[]') as Education[];
        setEducationEntries(storedEducation);
      } catch {
        setEducationEntries([]);
      }
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function openCuteNoteForm() {
    setContactOpen(false);
    window.setTimeout(() => document.getElementById('cute-note-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  }

  const visibleProjects = projects.filter((project) => {
    const projectText = [project.title, project.description, ...(project.tags ?? [])].join(' ').toLowerCase();
    const isPubmat = (project.tags ?? []).some((tag) => tag.trim().toLowerCase() === 'pubmat');
    const searchableText = projectText;
    const searchMatches = searchableText.includes(projectSearch.trim().toLowerCase());
    const filterMatches = projectFilter === 'All Projects'
      || (projectFilter === 'Web Apps' && /web|app|software|system|development/.test(projectText))
      || (projectFilter === 'UI/UX Design' && /ui|ux|design|figma|wireframe|prototype/.test(projectText))
      || (projectFilter === 'Personal' && /personal|portfolio|blog|hobby/.test(projectText));

    return !isPubmat && searchMatches && filterMatches;
  });

  const pubmatProjects = projects.filter((project) => (project.tags ?? []).some((tag) => tag.trim().toLowerCase() === 'pubmat'));

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#fff0f5_0%,#fffdf9_48%,#f2efff_100%)] text-slate-800 selection:bg-pink-200">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-50 [background-image:radial-gradient(#f9a8d4_1px,transparent_1px)] [background-size:28px_28px]" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-pink-100/80 bg-[#fffdf9]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 md:px-10">
          <a href="#home" className="flex items-center gap-2 text-xl font-bold tracking-wide text-pink-500">
            <Sparkles className="h-5 w-5 fill-pink-300" />
            <span>Ivy<span className="text-sm font-normal text-rose-300">.dev</span></span>
          </a>
          <div className="hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:flex"><span className="h-2 w-2 rounded-full bg-pink-400" /> Available for thoughtful collaborations</div>
          <div className="flex items-center gap-3"><button type="button" onClick={() => setContactOpen(true)} className="hidden text-sm font-medium text-slate-600 transition hover:text-pink-500 sm:block">Contact</button><a href="/admin" aria-label="Manage portfolio data" className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg shadow-pink-200 transition hover:-translate-y-0.5 hover:shadow-pink-300"><Sparkles className="h-4 w-4" /></a></div>
        </div>
      </header>

      {contactOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 px-6 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setContactOpen(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title" className="relative w-full max-w-md rounded-[2rem] border border-pink-200 bg-[#fffdf9] p-7 shadow-2xl shadow-pink-200/60">
            <button type="button" onClick={() => setContactOpen(false)} aria-label="Close contact options" className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition hover:bg-pink-50 hover:text-pink-500">
              <X className="h-5 w-5" />
            </button>
            <div className="text-center">
              <span className="text-3xl">💌</span>
              <h2 id="contact-dialog-title" className="mt-2 font-[Georgia,serif] text-2xl font-bold text-slate-900">Let&apos;s stay connected!</h2>
              <p className="mt-2 text-sm text-slate-600">Choose a place to say hi, or send a cute note directly.</p>
            </div>
            <div className="mt-6 grid gap-3">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-md">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold ${social.style}`}>{social.icon}</span>
                  <span>Visit my {social.label}</span>
                  <ExternalLink className="ml-auto h-4 w-4 text-pink-400" />
                </a>
              ))}
              <button type="button" onClick={openCuteNoteForm} className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-200 transition hover:-translate-y-0.5 hover:from-pink-500 hover:to-purple-500">
                <Send className="h-4 w-4" /> Send a Cute Note
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-[1500px] px-5 pb-20 pt-[73px] md:pl-[220px] md:pr-10">
        <aside className="fixed left-0 top-[73px] z-40 hidden h-[calc(100vh-73px)] w-[180px] border-r border-pink-200/70 bg-[#fff0f5]/90 pt-12 backdrop-blur-sm md:block"><div className="flex h-full flex-col gap-8 px-10"><span className="-rotate-90 origin-left translate-y-24 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.3em] text-pink-400">Ivy Porcado / portfolio 2025</span><nav className="mt-16 flex flex-col gap-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{['Home', 'Projects', 'Pubmats', 'Certificates', 'Education', 'Skills'].map((item, index) => <a key={item} href={`#${item === 'Home' ? 'home' : item.toLowerCase()}`} className="group flex items-center gap-3 transition hover:text-pink-500"><span className="text-[10px] text-pink-300">0{index + 1}</span>{item}</a>)}</nav><div className="mt-8 flex flex-col gap-3 border-t border-pink-200 pt-5 text-xs text-slate-500"><a href="mailto:ivy.porcado@sorsu.edu.ph" className="break-words transition hover:text-pink-500">ivy.porcado@sorsu.edu.ph</a><a href="tel:09278422831" className="transition hover:text-pink-500">0927 842 2831</a></div></div></aside>

        <div className="min-w-0">
          <section id="home" className="grid min-h-[620px] items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
            <div className="max-w-2xl"><div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-pink-500"><Heart className="h-3.5 w-3.5 fill-pink-400 text-pink-400" /> A digital fairy garden for curious minds</div><h1 className="whitespace-nowrap font-[Georgia,serif] text-[clamp(2.35rem,3.8vw,4.15rem)] font-bold leading-[0.92] tracking-[-0.04em] text-slate-900">Hi, I&apos;m <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 bg-clip-text text-transparent">Ivy Porcado</span><Crown className="mb-1 ml-2 inline h-[0.7em] w-[0.7em] text-amber-400" /></h1><div id="about" className="mt-8 grid gap-6 border-t border-pink-200 pt-5 sm:grid-cols-[0.8fr_1.2fr]"><h2 className="text-base font-semibold leading-snug text-pink-500">Aspiring Full-Stack Developer<br />UI/UX Designer<br />Writer</h2><p className="max-w-lg text-sm leading-relaxed text-slate-600 md:text-base">An aspiring developer learning, growing, and building with every project. I build functional web applications, design intuitive user experiences, and enjoy solving complex problems through algorithms and creative thinking. I also love turning ideas into meaningful content.</p></div><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => setContactOpen(true)} className="rounded-full bg-pink-500 px-6 py-2.5 text-xs font-semibold text-white shadow-xl shadow-pink-200 transition hover:-translate-y-0.5 hover:bg-pink-600"><Mail className="mr-2 inline h-4 w-4" /> Get in Touch</button><button type="button" onClick={() => void handleResumeDownload()} disabled={resumeDownloading} className="rounded-full border border-pink-300 bg-white/80 px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-pink-50 disabled:opacity-60"><Download className="mr-2 inline h-4 w-4 text-pink-500" /> {resumeDownloading ? 'Preparing Resume...' : 'Download Resume'}</button></div></div>

            <div className="relative mx-auto w-full max-w-sm lg:rotate-3"><div className="absolute -inset-5 rounded-[3rem] bg-gradient-to-tr from-pink-300 to-purple-300 opacity-40 blur-3xl" /><div className="relative border border-white/80 bg-white/60 p-3 shadow-[0_20px_45px_rgba(236,72,153,0.2)] backdrop-blur-md"><div className="mb-3 flex items-center justify-between border-b border-pink-100 pb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-pink-400"><span>Portrait / 01</span><Crown className="h-3.5 w-3.5 text-amber-400" /></div><div className="aspect-[0.84] overflow-hidden bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-200">{!profileImageFailed ? <img src={profileImageUrl} alt="Ivy" className="h-full w-full object-cover" onError={() => setProfileImageFailed(true)} /> : <div className="flex h-full w-full items-center justify-center text-7xl font-black text-white/80">I</div>}</div><div className="flex items-end justify-between pt-3"><div><p className="font-[Georgia,serif] text-xl font-bold text-slate-900">Ivy Porcado</p><p className="mt-1 text-[11px] text-slate-500">Building with care &amp; a little magic</p></div><span className="rounded-full bg-pink-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-pink-500">Open for work</span></div></div></div>
          </section>

        <section id="projects" className="py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-pink-500">✨ Portfolio Highlights</span>
            <h2 className="mt-3 font-[Georgia,serif] text-4xl font-bold text-slate-900">Featured Projects 💻</h2>
            <p className="mt-4 text-slate-600">A selection of my favourite web applications, software, and creative design experiments.</p>
          </div>
          <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex flex-wrap justify-center gap-2">
              {projectFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={projectFilter === filter}
                  onClick={() => setProjectFilter(filter)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 ${projectFilter === filter ? 'border-pink-500 bg-pink-500 text-white' : 'border-pink-200 bg-white/80 text-slate-600 hover:border-pink-300 hover:text-pink-500'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-pink-400" />
              <input aria-label="Search projects" value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Search projects..." className="w-full rounded-full border border-pink-200 bg-white/80 py-2 pl-10 pr-4 text-sm outline-none ring-pink-300 focus:ring-2" />
            </div>
          </div>
          {loading ? (
            <p className="text-center italic text-pink-400">Loading magic...</p>
          ) : projects.length === 0 ? (
            <p className="text-center italic text-slate-400">No projects added yet! Add one in the admin panel.</p>
          ) : visibleProjects.length === 0 ? (
            <p className="text-center italic text-slate-400">No projects match this filter yet.</p>
          ) : (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {visibleProjects.map((item) => (
                <article key={item.id} className="group overflow-hidden rounded-3xl border border-pink-200 bg-white/70 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100">
                  {item.image_url ? <img src={item.image_url} alt={item.title} className="h-48 w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100" />}
                  <div className="flex min-h-56 flex-col gap-3 p-6">
                    <h3 className="font-[Georgia,serif] text-xl font-bold text-slate-900 group-hover:text-pink-500">{item.title}</h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
                    <div className="mt-auto flex flex-wrap gap-2">{item.tags?.map((tag) => <span key={tag} className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-600">#{tag.trim()}</span>)}</div>
                    {item.project_url && <a href={item.project_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-pink-500 hover:text-pink-700">View Project <ExternalLink className="h-4 w-4" /></a>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="pubmats" className="py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center"><span className="text-sm font-bold uppercase tracking-[0.2em] text-pink-500">🎨 Visual Stories</span><h2 className="mt-3 font-[Georgia,serif] text-4xl font-bold text-slate-900 md:text-5xl">Pubmat Designs ✨</h2><p className="mt-3 text-sm leading-relaxed text-slate-600">Posters, announcements, and social graphics designed to make every message feel memorable.</p></div>
          {loading ? <p className="text-center italic text-pink-400">Loading designs...</p> : pubmatProjects.length === 0 ? <p className="text-center italic text-slate-400">No pubmat designs added yet. Choose “Pubmat” as the project category in the admin panel.</p> : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pubmatProjects.map((item) => <article key={item.id} className="group overflow-hidden rounded-2xl border border-pink-200 bg-white/70 p-3 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-100">{item.image_url ? <img src={item.image_url} alt={item.title} className="aspect-[4/5] w-full rounded-xl object-cover transition duration-500 group-hover:scale-[1.02]" /> : <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 text-pink-400"><Sparkles className="h-8 w-8" /></div>}<div className="flex items-center justify-between gap-3 px-1 pt-3"><h3 className="font-[Georgia,serif] text-lg font-bold text-slate-900 group-hover:text-pink-500">{item.title}</h3>{item.project_url && <a href={item.project_url} target="_blank" rel="noreferrer" aria-label={`View ${item.title}`} className="shrink-0 text-pink-500"><ExternalLink className="h-4 w-4" /></a>}</div><p className="px-1 pt-1 text-xs leading-relaxed text-slate-500">{item.description}</p></article>)}
            </div>
          )}
        </section>

        <section id="certificates" className="py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center"><span className="text-sm font-bold uppercase tracking-[0.2em] text-pink-500">🎓 Learning &amp; Honors</span><h2 className="mt-3 font-[Georgia,serif] text-4xl font-bold text-slate-900 md:text-5xl">Certificates &amp; Credentials 🏅</h2><p className="mt-3 text-sm leading-relaxed text-slate-600">Verified skills and continuous learning achievements throughout my developer journey.</p></div>
          {loading ? <p className="text-center italic text-pink-400">Loading certificates...</p> : certificates.length === 0 ? <p className="text-center italic text-slate-400">No certificates added yet!</p> : (
            <div className="grid gap-6 md:grid-cols-2">
              {certificates.map((cert) => (
                <article key={cert.id} className="overflow-hidden rounded-2xl border border-pink-200 bg-white/70 p-3 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-100">
                  {cert.image_url ? <img src={cert.image_url} alt={cert.title} className="h-32 w-full rounded-xl object-cover" /> : <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-purple-100"><Award className="h-8 w-8 text-pink-400" /></div>}
                  <div className="px-1 pt-3"><div className="flex items-center justify-between gap-3 text-[11px] text-slate-400"><span className="font-medium text-pink-500">🏅 {cert.issuer}</span>{cert.issue_date && <span>{cert.issue_date}</span>}</div><h3 className="mt-2 font-[Georgia,serif] text-lg font-bold text-slate-900">{cert.title}</h3></div>
                  <div className="mt-3 flex items-center justify-between border-t border-pink-100 px-1 pt-3 text-[11px] font-medium"><span className="text-pink-400">Preview Image</span>{cert.credential_url ? <a href={cert.credential_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-600 transition hover:text-pink-500">Link <ExternalLink className="h-3 w-3" /></a> : <span className="text-slate-300">No link</span>}</div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="education" className="py-20"><div className="mx-auto mb-12 max-w-2xl text-center"><span className="text-sm font-bold uppercase tracking-[0.2em] text-pink-500">🎓 Learning journey</span><h2 className="mt-3 font-[Georgia,serif] text-4xl font-bold text-slate-900 md:text-5xl">Education</h2><p className="mt-3 text-sm leading-relaxed text-slate-600">The schools, programs, coursework, and communities that shaped my path.</p></div>{educationEntries.length === 0 ? <p className="text-center italic text-slate-400">Education details will appear here soon.</p> : <div className="grid gap-6 md:grid-cols-2">{educationEntries.map((entry) => <article key={entry.id} className="rounded-2xl border border-pink-200 bg-white/70 p-6 shadow-sm backdrop-blur-md"><div className="flex items-start justify-between gap-4"><div><h3 className="font-[Georgia,serif] text-xl font-bold text-slate-900">{entry.school}</h3><p className="mt-1 text-sm font-semibold text-pink-500">{entry.course}</p></div><span className="shrink-0 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">{entry.graduation}</span></div>{entry.coursework && <div className="mt-5 border-t border-pink-100 pt-4"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-pink-400">Relevant coursework</p><p className="mt-1 text-sm leading-relaxed text-slate-600">{entry.coursework}</p></div>}{(entry.organization || entry.award) && <div className="mt-4 flex flex-wrap gap-2">{entry.organization && <span className="rounded-full bg-pink-50 px-3 py-1.5 text-xs font-medium text-slate-600">{entry.organization}</span>}{entry.award && <span className="rounded-full bg-pink-50 px-3 py-1.5 text-xs font-medium text-slate-600">{entry.award}</span>}</div>}</article>)}</div>}</section>

        <section id="skills" className="py-20"><div className="mx-auto mb-12 max-w-2xl text-center"><span className="text-sm font-bold uppercase tracking-[0.2em] text-pink-500">🎀 Tech Magic</span><h2 className="mt-3 font-[Georgia,serif] text-4xl font-bold text-slate-900 md:text-5xl">Skills &amp; Toolstack 🎀</h2><p className="mt-3 text-sm leading-relaxed text-slate-600">Technologies and creative tools I love working with every single day.</p></div><div className="grid gap-6 md:grid-cols-2">
            {skillCategories.map(({ title, icon: Icon, items }) => (
              <div key={title} className="rounded-2xl border border-pink-200 bg-white/70 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-100"><h3 className="flex items-center gap-2 font-[Georgia,serif] text-lg font-bold text-slate-900"><Icon className="h-4 w-4 text-slate-800" />{title}</h3><div className="mt-5 space-y-3">{items.slice(0, 4).map((skill) => <div key={skill.label}><div className="mb-1 flex justify-between gap-3 text-xs font-medium text-slate-700"><span>{skill.label}</span><span className="shrink-0 text-pink-500">{skill.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-pink-100"><div className="h-full rounded-full bg-pink-400" style={{ width: `${skill.value}%` }} /></div></div>)}</div></div>
            ))}
          </div><div className="mt-8 flex flex-wrap justify-center gap-2">{skillCategories.flatMap(({ items }) => items.slice(4).map((skill) => skill.label)).concat(learningSkills.map((skill) => skill.label)).map((label, index) => <span key={`${label}-${index}`} className="rounded-full border border-pink-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">{['✨', '💖', '🎀', '🦋', '💻'][index % 5]} {label}</span>)}</div>
        </section>

        <section id="contact" className="mx-auto max-w-4xl py-20"><div className="relative overflow-hidden rounded-[2rem] border border-pink-200 bg-white/70 p-8 shadow-xl shadow-pink-100 backdrop-blur-md md:p-10">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pink-200/60 blur-3xl" />
            <div className="relative text-center">
              <span className="block text-sm font-bold uppercase tracking-[0.2em] text-pink-500">💌 Say Hello</span>
              <h2 className="mt-3 font-[Georgia,serif] text-3xl font-bold text-slate-900 md:text-4xl">Let&apos;s Build Something Cute Together! 🌸</h2>
              <p className="mx-auto mt-2 max-w-xl text-slate-600">Have a question, project proposal, or just want to chat? Send me a message!</p>
            </div>

            {formSuccess && (
              <div className="mt-6 p-4 bg-pink-100 text-pink-800 rounded-xl text-sm flex items-center justify-center gap-2 font-medium">
                <CheckCircle2 className="h-5 w-5" /> Message sent successfully! I&apos;ll get back to you soon ✨
              </div>
            )}

            {formError && (
              <div className="mt-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm text-center font-medium">
                {formError}
              </div>
            )}

            <form id="cute-note-form" onSubmit={handleContactSubmit} className="relative mt-7 space-y-5 text-left">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Your Name 🌟
                  <input name="name" type="text" required placeholder="e.g. Princess Peach" className="mt-1.5 w-full rounded-xl border border-pink-200 bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Your Email 💌
                  <input name="email" type="email" required placeholder="hello@example.com" className="mt-1.5 w-full rounded-xl border border-pink-200 bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Subject 💖
                <input name="subject" type="text" required placeholder="Project Collaboration" className="mt-1.5 w-full rounded-xl border border-pink-200 bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Your Message 🦋
                <textarea name="message" required rows={4} placeholder="Tell me about your amazing idea..." className="mt-1.5 w-full resize-y rounded-xl border border-pink-200 bg-white/80 px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
              </label>
              <button disabled={formSending} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-400 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-200 transition hover:-translate-y-0.5 hover:from-pink-500 hover:to-pink-600 disabled:opacity-50">
                <Send className="h-4 w-4" /> {formSending ? 'Sending...' : 'Send Cute Note'}
              </button>
            </form>
          </div>
        </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-pink-100 bg-white/50 py-8 text-center text-sm text-slate-500">
        <p>Made with 💖, pastel pixels, and a little bit of magic.</p>
        <div className="mt-3 flex justify-center gap-2 text-pink-400"><CheckCircle2 className="h-4 w-4" /> Open for creative collaborations</div>
      </footer>
    </div>
  );
}