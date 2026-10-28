import { PDFDocument, rgb, StandardFonts, type PDFPage } from 'pdf-lib';

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issue_date: string | null;
}

interface Experience {
  role: string;
  company: string;
  dates: string;
  bullets: string;
}

interface Education {
  school: string;
  course: string;
  graduation: string;
  coursework: string;
  organization: string;
  award: string;
}

interface ResumePayload {
  summary?: string;
  education?: Education[] | string;
  experiences?: Experience[];
  selectedSkills?: string[];
  selectedCertificates?: string[];
  certificates?: Certificate[];
}

const defaultSkills = ['React', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Node.js', 'Express.js', 'REST APIs', 'React Native', 'Expo', 'TypeScript', 'MongoDB', 'Firebase', 'Git', 'GitHub', 'Figma/UI Design', 'Responsive Design', 'Accessibility'];
const defaultSummary = 'I build functional web applications, design intuitive user experiences, and enjoy solving complex problems through algorithms and creative thinking. I also love turning ideas into meaningful content.';

function wrapText(text: string, maxCharacters: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else line = nextLine;
  }
  if (line) lines.push(line);
  return lines;
}

async function createResumePdf(payload: ResumePayload = {}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0.08, 0.08, 0.08);
  const gray = rgb(0.25, 0.25, 0.25);
  let page: PDFPage = pdf.addPage([595, 842]);
  let y = 790;

  function ensureSpace(amount = 30) {
    if (y < amount + 55) {
      page = pdf.addPage([595, 842]);
      y = 790;
    }
  }

  function heading(title: string) {
    ensureSpace(32);
    page.drawText(title.toUpperCase(), { x: 42, y, size: 11, font: bold, color: black });
    y -= 5;
    page.drawLine({ start: { x: 42, y }, end: { x: 553, y }, thickness: 0.6, color: black });
    y -= 16;
  }

  function paragraph(text: string, size = 10, lineHeight = 15) {
    for (const line of wrapText(text, 92)) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: 42, y, size, font: regular, color: gray });
      y -= lineHeight;
    }
    y -= 8;
  }

  function bulletParagraph(text: string, trailingGap = 8) {
    for (const line of wrapText(text, 84)) {
      ensureSpace(13);
      page.drawCircle({ x: 48, y: y + 3, size: 1.7, color: gray });
      page.drawText(line, { x: 60, y, size: 9, font: regular, color: gray });
      y -= 13;
    }
    y -= trailingGap;
  }

  page.drawText('Ivy Porcado', { x: 42, y, size: 21, font: bold, color: black });
  y -= 24;
  page.drawText('Full-Stack Developer | UI/UX Designer | Writer', { x: 42, y, size: 10, font: regular, color: black });
  y -= 15;
  page.drawText('ivy.porcado@sorsu.edu.ph | 0927 842 2831', { x: 42, y, size: 9, font: regular, color: black });
  y -= 18;
  page.drawLine({ start: { x: 42, y }, end: { x: 553, y }, thickness: 1, color: black });
  y -= 24;

  heading('Professional Summary');
  paragraph(payload.summary?.trim() || defaultSummary);

  const experiences = payload.experiences?.filter((experience) => experience.role.trim() || experience.company.trim()) ?? [];
  if (experiences.length) {
    heading('Experience');
    for (const experience of experiences) {
      ensureSpace(35);
      page.drawText([experience.role, experience.company].filter(Boolean).join(' - '), { x: 42, y, size: 10, font: bold, color: black });
      if (experience.dates.trim()) page.drawText(experience.dates, { x: 430, y, size: 9, font: regular, color: gray });
      y -= 15;
      for (const bullet of experience.bullets.split('\n').map((item) => item.trim()).filter(Boolean)) bulletParagraph(bullet);
    }
  }

  const educationEntries = Array.isArray(payload.education) ? payload.education : [];
  if (educationEntries.length) {
    heading('Education');
    for (const entry of educationEntries) {
      ensureSpace(35);
      const title = [entry.course.trim(), entry.school.trim()].filter(Boolean).join(' | ');
      if (title) page.drawText(title, { x: 42, y, size: 10, font: bold, color: black });
      if (entry.graduation.trim()) page.drawText(entry.graduation, { x: 430, y, size: 9, font: regular, color: gray });
      y -= 14;
      if (entry.coursework.trim()) bulletParagraph(`Relevant Courses: ${entry.coursework.trim()}`, 2);
      if (entry.award.trim()) bulletParagraph(entry.award.trim(), 2);
      if (entry.organization.trim()) bulletParagraph(`Extracurricular: ${entry.organization.trim()}`, 2);
      y -= 6;
    }
  } else if (typeof payload.education === 'string' && payload.education.trim()) {
    heading('Education');
    paragraph(payload.education.trim());
  }

  const skills = payload.selectedSkills?.length ? payload.selectedSkills : defaultSkills;
  heading('Skills & Interests');
  paragraph(skills.join(', '), 9, 13);

  const selectedIds = new Set(payload.selectedCertificates ?? []);
  const certificates = (payload.certificates ?? []).filter((certificate) => selectedIds.size === 0 || selectedIds.has(certificate.id));
  if (certificates.length) {
    heading('Certificates');
    for (const certificate of certificates) paragraph([certificate.title, certificate.issuer, certificate.issue_date].filter(Boolean).join(' - '), 9, 13);
  }

  const bytes = await pdf.save();
  return new Response(bytes as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Ivy-Resume.pdf"',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET() {
  return createResumePdf();
}

export async function POST(request: Request) {
  const payload = await request.json() as ResumePayload;
  return createResumePdf(payload);
}
