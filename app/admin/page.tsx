'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PlusCircle, ArrowLeft, CheckCircle2, Lock, ExternalLink, Pencil, Trash2 } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[] | null;
  project_url: string | null;
  image_url: string | null;
}

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issue_date: string | null;
  credential_url: string | null;
  image_url: string | null;
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

const projectCategories = ['Web Apps', 'UI/UX Design', 'Personal', 'Pubmat'] as const;

export default function AdminPage() {
  const [session, setSession] = useState<unknown>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard Form State
  const [tab, setTab] = useState<'project' | 'pubmat' | 'certificate' | 'education'>('project');
  const [statusMsg, setStatusMsg] = useState('');
  const [contentError, setContentError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [educationEntries, setEducationEntries] = useState<Education[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  // Project Form
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCategory, setPCategory] = useState<(typeof projectCategories)[number]>('Web Apps');
  const [pTags, setPTags] = useState('');
  const [pLink, setPLink] = useState('');
  const [pImageUrl, setPImageUrl] = useState('');
  const [pImg, setPImg] = useState<File | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Certificate Form
  const [cTitle, setCTitle] = useState('');
  const [cIssuer, setCIssuer] = useState('');
  const [cDate, setCDate] = useState('');
  const [cLink, setCLink] = useState('');
  const [cImg, setCImg] = useState<File | null>(null);
  const [editingCertificateId, setEditingCertificateId] = useState<string | null>(null);

  // Education Form
  const [eSchool, setESchool] = useState('');
  const [eCourse, setECourse] = useState('');
  const [eGraduation, setEGraduation] = useState('');
  const [eCoursework, setECoursework] = useState('');
  const [eOrganization, setEOrganization] = useState('');
  const [eAward, setEAward] = useState('');
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Require a fresh login whenever the admin page is opened.
    supabase.auth.signOut().then(() => {
      setSession(null);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      void fetchExistingContent();
    }
  }, [session]);

  async function fetchExistingContent() {
    setLoadingContent(true);
    setContentError('');

    const [
      { data: projectData, error: projectError },
      { data: certificateData, error: certificateError },
      { data: educationData, error: educationError },
    ] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('certificates').select('*').order('created_at', { ascending: false }),
      supabase.from('education').select('*').order('created_at', { ascending: false }),
    ]);

    if (projectError || certificateError || educationError) {
      setContentError(projectError?.message ?? certificateError?.message ?? educationError?.message ?? 'Unable to load existing content.');
    } else {
      setProjects(projectData ?? []);
      setCertificates(certificateData ?? []);
      setEducationEntries(educationData ?? []);
    }

    setLoadingContent(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError('Invalid credentials. Access denied!');
    }
  }

  async function uploadFile(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('portfolio-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('portfolio-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setStatusMsg('');

    try {
      let imageUrl = pImageUrl.trim();
      if (pImg) imageUrl = await uploadFile(pImg);

      const tagsArray = pTags ? pTags.split(',').map((t) => t.trim()) : [];
      if (pCategory && !tagsArray.some((tag) => tag.toLowerCase() === pCategory.toLowerCase())) tagsArray.unshift(pCategory);

      const projectData = {
        title: pTitle,
        description: pDesc,
        tags: tagsArray,
        project_url: pLink ?? '',
        ...(imageUrl ? { image_url: imageUrl } : {}),
      };
      const query = editingProjectId
        ? supabase.from('projects').update(projectData).eq('id', editingProjectId)
        : supabase.from('projects').insert([projectData]);
      const { error } = await query;

      if (error) throw error;

      setStatusMsg(editingProjectId ? 'Project updated successfully! 🎉' : 'Project added successfully! 🎉');
      resetProjectForm();
      await fetchExistingContent();
    } catch (err: unknown) {
      setStatusMsg(`Error: ${err instanceof Error ? err.message : 'Unable to add project.'}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleAddCertificate(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setStatusMsg('');

    try {
      let imageUrl = '';
      if (cImg) imageUrl = await uploadFile(cImg);

      const certificateData = {
        title: cTitle,
        issuer: cIssuer,
        issue_date: cDate || null,
        credential_url: cLink,
        ...(cImg ? { image_url: imageUrl } : {}),
      };
      const query = editingCertificateId
        ? supabase.from('certificates').update(certificateData).eq('id', editingCertificateId)
        : supabase.from('certificates').insert([certificateData]);
      const { error } = await query;

      if (error) throw error;

      setStatusMsg(editingCertificateId ? 'Certificate updated successfully! ✨' : 'Certificate added successfully! ✨');
      resetCertificateForm();
      await fetchExistingContent();
    } catch (err: unknown) {
      setStatusMsg(`Error: ${err instanceof Error ? err.message : 'Unable to add certificate.'}`);
    } finally {
      setUploading(false);
    }
  }

  function resetProjectForm() {
      setPTitle('');
      setPDesc('');
      setPCategory(tab === 'pubmat' ? 'Pubmat' : 'Web Apps');
      setPTags('');
      setPLink('');
      setPImageUrl('');
      setPImg(null);
      setEditingProjectId(null);
    }

  function resetCertificateForm() {
      setCTitle('');
      setCIssuer('');
      setCDate('');
      setCLink('');
      setCImg(null);
      setEditingCertificateId(null);
    }

  function resetEducationForm() {
      setESchool('');
      setECourse('');
      setEGraduation('');
      setECoursework('');
      setEOrganization('');
      setEAward('');
      setEditingEducationId(null);
    }

  async function handleEducationSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setStatusMsg('');

      const educationData = {
        school: eSchool,
        course: eCourse,
        graduation: eGraduation,
        coursework: eCoursework,
        organization: eOrganization,
        award: eAward,
      };
      const query = editingEducationId
        ? supabase.from('education').update(educationData).eq('id', editingEducationId)
        : supabase.from('education').insert([educationData]);
      const { error } = await query;

      if (error) {
        setStatusMsg(`Error: ${error.message}`);
        return;
      }

      setStatusMsg(editingEducationId ? 'Education updated successfully.' : 'Education added successfully.');
      resetEducationForm();
      await fetchExistingContent();
    }

  function editEducation(entry: Education) {
      setTab('education');
      setEditingEducationId(entry.id);
      setESchool(entry.school);
      setECourse(entry.course);
      setEGraduation(entry.graduation);
      setECoursework(entry.coursework);
      setEOrganization(entry.organization);
      setEAward(entry.award);
      setStatusMsg('');
    }

  async function deleteEducation(entry: Education) {
      if (!window.confirm(`Delete education entry from "${entry.school}"?`)) return;

      setStatusMsg('');
      const { error } = await supabase.from('education').delete().eq('id', entry.id);
      if (error) {
        setStatusMsg(`Error: ${error.message}`);
        return;
      }

      if (editingEducationId === entry.id) resetEducationForm();
      setStatusMsg('Education deleted successfully.');
      await fetchExistingContent();
    }

  function editProject(project: Project) {
      const isPubmat = project.tags?.some((tag) => tag.trim().toLowerCase() === 'pubmat') ?? false;
      setTab(isPubmat ? 'pubmat' : 'project');
      setEditingProjectId(project.id);
      setPTitle(project.title);
      setPDesc(project.description);
      const category = project.tags?.find((tag) => projectCategories.some((option) => option.toLowerCase() === tag.toLowerCase()));
      setPCategory((category as (typeof projectCategories)[number]) ?? (isPubmat ? 'Pubmat' : 'Web Apps'));
      setPTags(project.tags?.filter((tag) => tag !== category).join(', ') ?? '');
      setPLink(project.project_url ?? '');
      setPImageUrl(project.image_url ?? '');
      setPImg(null);
      setStatusMsg('');
    }

  function editCertificate(certificate: Certificate) {
      setTab('certificate');
      setEditingCertificateId(certificate.id);
      setCTitle(certificate.title);
      setCIssuer(certificate.issuer);
      setCDate(certificate.issue_date ?? '');
      setCLink(certificate.credential_url ?? '');
      setCImg(null);
      setStatusMsg('');
    }

  async function deleteProject(project: Project) {
      if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;

      setStatusMsg('');
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) {
        setStatusMsg(`Error: ${error.message}`);
        return;
      }

      if (editingProjectId === project.id) resetProjectForm();
      setStatusMsg('Project deleted successfully.');
      await fetchExistingContent();
    }

  async function deleteCertificate(certificate: Certificate) {
      if (!window.confirm(`Delete "${certificate.title}"? This cannot be undone.`)) return;

      setStatusMsg('');
      const { error } = await supabase.from('certificates').delete().eq('id', certificate.id);
      if (error) {
        setStatusMsg(`Error: ${error.message}`);
        return;
      }

      if (editingCertificateId === certificate.id) resetCertificateForm();
      setStatusMsg('Certificate deleted successfully.');
      await fetchExistingContent();
  }

  const visibleProjects = projects.filter((project) => {
    const isPubmat = project.tags?.some((tag) => tag.trim().toLowerCase() === 'pubmat') ?? false;
    return tab === 'pubmat' ? isPubmat : !isPubmat;
  });

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center text-pink-500 font-medium">
        Checking authentication... ✨
      </div>
    );
  }

  // LOGIN SCREEN (shown if not logged in)
  if (!session) {
    return (
      <div className="min-h-screen bg-pink-50/50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-pink-100 p-8 space-y-6">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-pink-600 hover:text-pink-800 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Portfolio
          </Link>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto text-pink-500">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-xs text-gray-500">Only the site owner can sign in here.</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-pink-400 text-sm"
                placeholder="your-email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-pink-400 text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm hover:shadow"
            >
              Log In ✨
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD SCREEN (shown once logged in)
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fff6fa_0%,#fffdf9_55%,#f5f1ff_100%)] p-4 font-sans text-slate-700 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-pink-100 bg-white/85 p-5 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-500"><Lock className="h-5 w-5" /></div>
            <div><h1 className="font-[Georgia,serif] text-xl font-bold text-slate-900">Portfolio Data Manager 🎀</h1><p className="text-[11px] text-slate-500">Live Supabase CRUD - Changes update automatically</p></div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-pink-600 transition hover:text-pink-800">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Portfolio
            </Link>
            <Link href="/admin/resume" className="inline-flex items-center gap-1 text-xs font-semibold text-pink-600 transition hover:text-pink-800">Resume</Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 border-b border-pink-200 px-2">
          <button
            onClick={() => { setTab('project'); setPCategory('Web Apps'); }}
            className={`border-b-2 px-3 py-3 text-sm font-semibold transition-all ${
              tab === 'project' ? 'border-pink-500 text-pink-500' : 'border-transparent text-slate-500 hover:text-pink-500'
            }`}
          >
            📁 Projects ( {projects.filter((project) => !project.tags?.some((tag) => tag.trim().toLowerCase() === 'pubmat')).length} )
          </button>
          <button
            onClick={() => { setTab('pubmat'); setPCategory('Pubmat'); }}
            className={`border-b-2 px-3 py-3 text-sm font-semibold transition-all ${
              tab === 'pubmat' ? 'border-pink-500 text-pink-500' : 'border-transparent text-slate-500 hover:text-pink-500'
            }`}
          >
            🎨 Pubmats ( {projects.filter((project) => project.tags?.some((tag) => tag.trim().toLowerCase() === 'pubmat')).length} )
          </button>
          <button
            onClick={() => setTab('certificate')}
            className={`border-b-2 px-3 py-3 text-sm font-semibold transition-all ${
              tab === 'certificate' ? 'border-pink-500 text-pink-500' : 'border-transparent text-slate-500 hover:text-pink-500'
            }`}
          >
            ♙ Certificates ( {certificates.length} )
          </button>
          <button
            onClick={() => setTab('education')}
            className={`border-b-2 px-3 py-3 text-sm font-semibold transition-all ${
              tab === 'education' ? 'border-pink-500 text-pink-500' : 'border-transparent text-slate-500 hover:text-pink-500'
            }`}
          >
            🎓 Education ( {educationEntries.length} )
          </button>
        </div>

        {statusMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 p-3 text-sm text-pink-800">
            <CheckCircle2 className="w-4 h-4" /> {statusMsg}
          </div>
        )}
        {contentError && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            Unable to load existing content: {contentError}
          </div>
        )}

        {tab === 'project' || tab === 'pubmat' ? (
          <form key={tab === 'pubmat' ? 'pubmat-form' : 'project-form'} onSubmit={handleAddProject} className="grid gap-4 rounded-2xl border border-pink-200 bg-white/75 p-5 shadow-sm md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{tab === 'pubmat' ? 'Pubmat Title' : 'Project Title'}</label>
              <input
                required
                type="text"
                value={pTitle ?? ''}
                onChange={(e) => setPTitle(e.target.value)}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-pink-400 text-sm"
                placeholder={tab === 'pubmat' ? 'My Pubmat Design' : 'My Web App'}
              />
            </div>
            {tab !== 'pubmat' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select value={pCategory ?? 'Web Apps'} onChange={(e) => setPCategory(e.target.value as (typeof projectCategories)[number])} className="w-full rounded-lg border border-pink-200 bg-white px-3 py-2 text-sm focus:outline-pink-400">
                  {projectCategories.filter((category) => category !== 'Pubmat').map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={pDesc ?? ''}
                onChange={(e) => setPDesc(e.target.value)}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-pink-400 text-sm"
                placeholder="Project overview..."
              />
            </div>
            {tab !== 'pubmat' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={pTags ?? ''}
                    onChange={(e) => setPTags(e.target.value)}
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-pink-400 text-sm"
                    placeholder="React, Next.js, Tailwind"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Project URL / GitHub Link</label>
                  <input
                    type="url"
                    value={pLink ?? ''}
                    onChange={(e) => setPLink(e.target.value)}
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-pink-400 text-sm"
                    placeholder="https://..."
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Image URL</label>
              <input
                type="url"
                value={pImageUrl ?? ''}
                onChange={(e) => setPImageUrl(e.target.value)}
                className="w-full rounded-lg border border-pink-200 px-3 py-2 text-sm focus:outline-pink-400"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Thumbnail Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPImg(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200"
              />
            </div>
            <button
              disabled={uploading}
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {editingProjectId ? <Pencil className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />} {uploading ? 'Uploading...' : editingProjectId ? `Update ${tab === 'pubmat' ? 'Pubmat' : 'Project'}` : `Save ${tab === 'pubmat' ? 'Pubmat' : 'Project'}`}
            </button>
            {editingProjectId && (
              <button type="button" onClick={resetProjectForm} className="w-full rounded-lg border border-pink-200 py-2.5 text-sm font-semibold text-pink-600 hover:bg-pink-50">
                Cancel Editing
              </button>
            )}
          </form>
        ) : tab === 'certificate' ? (
          <form key="certificate-form" onSubmit={handleAddCertificate} className="grid gap-4 rounded-2xl border border-pink-200 bg-white/75 p-5 shadow-sm md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Certificate Name</label>
              <input
                required
                type="text"
                value={cTitle ?? ''}
                onChange={(e) => setCTitle(e.target.value)}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-pink-400 text-sm"
                placeholder="Web Development Certificate"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Issuer / Organization</label>
              <input
                required
                type="text"
                value={cIssuer ?? ''}
                onChange={(e) => setCIssuer(e.target.value)}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-pink-400 text-sm"
                placeholder="Coursera / Udemy"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Issue Date</label>
              <input
                type="date"
                value={cDate ?? ''}
                onChange={(e) => setCDate(e.target.value)}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-pink-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Credential URL <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                type="url"
                value={cLink ?? ''}
                onChange={(e) => setCLink(e.target.value)}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-pink-400 text-sm"
                placeholder="Add a verification link if you have one"
              />
              <p className="mt-1 text-[11px] text-slate-400">You can leave this empty and upload the certificate below.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Certificate Image / PDF</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setCImg(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200"
              />
            </div>
            <button
              disabled={uploading}
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {editingCertificateId ? <Pencil className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />} {uploading ? 'Uploading...' : editingCertificateId ? 'Update Certificate' : 'Save Certificate'}
            </button>
            {editingCertificateId && (
              <button type="button" onClick={resetCertificateForm} className="w-full rounded-lg border border-pink-200 py-2.5 text-sm font-semibold text-pink-600 hover:bg-pink-50">
                Cancel Editing
              </button>
            )}
          </form>
        ) : (
          <form key="education-form" onSubmit={handleEducationSubmit} className="grid gap-4 rounded-2xl border border-pink-200 bg-white/75 p-5 shadow-sm md:grid-cols-2">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Name of school</label><input required value={eSchool} onChange={(event) => setESchool(event.target.value)} placeholder="Name of school" className="w-full rounded-lg border border-pink-200 px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Course</label><input required value={eCourse} onChange={(event) => setECourse(event.target.value)} placeholder="Course or program" className="w-full rounded-lg border border-pink-200 px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Year graduated or expected graduation</label><input required value={eGraduation} onChange={(event) => setEGraduation(event.target.value)} placeholder="2024 or Expected 2026" className="w-full rounded-lg border border-pink-200 px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Relevant coursework</label><input value={eCoursework} onChange={(event) => setECoursework(event.target.value)} placeholder="Coursework, comma separated" className="w-full rounded-lg border border-pink-200 px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Organization</label><input value={eOrganization} onChange={(event) => setEOrganization(event.target.value)} placeholder="Organization or club" className="w-full rounded-lg border border-pink-200 px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Award</label><input value={eAward} onChange={(event) => setEAward(event.target.value)} placeholder="Award or recognition" className="w-full rounded-lg border border-pink-200 px-3 py-2 text-sm" /></div>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-500 py-2.5 text-sm font-semibold text-white hover:bg-pink-600"><PlusCircle className="h-4 w-4" /> {editingEducationId ? 'Update Education' : 'Save Education'}</button>
            {editingEducationId && <button type="button" onClick={resetEducationForm} className="w-full rounded-lg border border-pink-200 py-2.5 text-sm font-semibold text-pink-600 hover:bg-pink-50">Cancel Editing</button>}
          </form>
        )}

        {tab === 'project' || tab === 'pubmat' ? (
          <section className="border-t border-pink-100 pt-6" aria-labelledby="existing-projects-heading">
            <h2 id="existing-projects-heading" className="text-lg font-bold text-gray-800">{tab === 'pubmat' ? 'Existing Pubmats' : 'Existing Projects'}</h2>
            {loadingContent ? (
              <p className="mt-3 text-sm text-gray-500">Loading {tab === 'pubmat' ? 'pubmats' : 'projects'}...</p>
            ) : visibleProjects.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No {tab === 'pubmat' ? 'pubmats' : 'projects'} have been added yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {visibleProjects.map((project) => (
                  <article key={project.id} className="flex gap-3 rounded-xl border border-pink-100 bg-pink-50/40 p-3">
                    {project.image_url && <img src={project.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-800">{project.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">{project.description}</p>
                      {project.tags && project.tags.length > 0 && (
                        <p className="mt-2 text-xs text-pink-600">{project.tags.join(' · ')}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-start gap-2">
                      {project.project_url && (
                        <a href={project.project_url} target="_blank" rel="noreferrer" aria-label={`Open ${project.title}`} className="text-pink-500 hover:text-pink-700">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button type="button" onClick={() => editProject(project)} aria-label={`Edit ${project.title}`} className="text-slate-500 hover:text-pink-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => void deleteProject(project)} aria-label={`Delete ${project.title}`} className="text-slate-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : tab === 'certificate' ? (
          <section className="border-t border-pink-100 pt-6" aria-labelledby="existing-certificates-heading">
            <h2 id="existing-certificates-heading" className="text-lg font-bold text-gray-800">Existing Certificates</h2>
            {loadingContent ? (
              <p className="mt-3 text-sm text-gray-500">Loading certificates...</p>
            ) : certificates.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No certificates have been added yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {certificates.map((certificate) => (
                  <article key={certificate.id} className="flex gap-3 rounded-xl border border-pink-100 bg-pink-50/40 p-3">
                    {certificate.image_url && <img src={certificate.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-800">{certificate.title}</h3>
                      <p className="mt-1 text-xs text-pink-600">{certificate.issuer}</p>
                      {certificate.issue_date && <p className="mt-1 text-xs text-gray-500">{certificate.issue_date}</p>}
                    </div>
                    <div className="flex shrink-0 items-start gap-2">
                      {certificate.credential_url && (
                        <a href={certificate.credential_url} target="_blank" rel="noreferrer" aria-label={`Verify ${certificate.title}`} className="text-pink-500 hover:text-pink-700">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button type="button" onClick={() => editCertificate(certificate)} aria-label={`Edit ${certificate.title}`} className="text-slate-500 hover:text-pink-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => void deleteCertificate(certificate)} aria-label={`Delete ${certificate.title}`} className="text-slate-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="border-t border-pink-100 pt-6" aria-labelledby="existing-education-heading">
            <h2 id="existing-education-heading" className="text-lg font-bold text-gray-800">Education</h2>
            {educationEntries.length === 0 ? <p className="mt-3 text-sm text-gray-500">No education entries have been added yet.</p> : <div className="mt-4 space-y-3">{educationEntries.map((entry) => <article key={entry.id} className="rounded-xl border border-pink-100 bg-pink-50/40 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-gray-800">{entry.school}</h3><p className="mt-1 text-xs text-pink-600">{entry.course} · {entry.graduation}</p><p className="mt-2 text-xs text-gray-600">{entry.coursework || 'No coursework added'}{entry.organization ? ` · ${entry.organization}` : ''}{entry.award ? ` · ${entry.award}` : ''}</p></div><div className="flex shrink-0 items-start gap-2"><button type="button" onClick={() => editEducation(entry)} aria-label={`Edit education at ${entry.school}`} className="text-slate-500 hover:text-pink-600"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => deleteEducation(entry)} aria-label={`Delete education at ${entry.school}`} className="text-slate-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></div></article>)}</div>}
          </section>
        )}
      </div>
      
    </div>
  );
}