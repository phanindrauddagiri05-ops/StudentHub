// ============================================================
// StudentHub — Resume Generator Data Model & Types (Phase 3)
// ============================================================

export type ResumeTemplate = 'modern' | 'classic' | 'minimal';

export type ResumeSectionId =
  | 'summary'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'achievements'
  | 'languages'
  | 'interests';

export type ResumeSectionKey = ResumeSectionId;

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade?: string;
  description?: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  jobTitle: string;
  location?: string;
  startDate: string;
  endDate: string;
  currentlyWorking?: boolean;
  bullets: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  technologies: string | string[];
  url?: string;
  projectUrl?: string;
  githubUrl?: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date?: string;
  issueDate?: string;
  url?: string;
  credentialUrl?: string;
}

export interface AchievementEntry {
  id: string;
  title: string;
  description?: string;
  date?: string;
}

export interface LanguageEntry {
  id: string;
  name?: string;
  language?: string;
  proficiency: string; // e.g. "Native", "Fluent", "Intermediate", "Conversational"
}

export interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: string[];
  certifications: CertificationEntry[];
  achievements: AchievementEntry[];
  languages: LanguageEntry[];
  interests: string[];
  sectionOrder: ResumeSectionId[];
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  title: string;
  template: ResumeTemplate;
  resume_data: ResumeData;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_SECTION_ORDER: ResumeSectionId[] = [
  'summary',
  'education',
  'experience',
  'projects',
  'skills',
  'certifications',
  'achievements',
  'languages',
  'interests',
];

export const EMPTY_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
  },
  summary: '',
  education: [],
  experience: [],
  projects: [],
  skills: [],
  certifications: [],
  achievements: [],
  languages: [],
  interests: [],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
};

export const SAMPLE_STUDENT_RESUME: ResumeData = {
  personalInfo: {
    fullName: 'Alex Hunter',
    title: 'Computer Science Student & Full Stack Developer',
    email: 'alex.hunter@university.edu',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    website: 'https://alexhunter.dev',
    linkedin: 'linkedin.com/in/alexhunter',
    github: 'github.com/alexhunter',
  },
  summary:
    'Dedicated Computer Science undergraduate with a passion for web development, distributed systems, and modern UI engineering. Experienced in building responsive full-stack applications with React, Next.js, and TypeScript. Looking for a summer software engineering internship.',
  education: [
    {
      id: 'edu-1',
      institution: 'State University of Technology',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science & Engineering',
      startDate: '2022',
      endDate: '2026',
      grade: '3.85 / 4.0 GPA',
      description: 'Dean’s Honor List (2022–2024). Relevant coursework: Data Structures, Algorithms, Web Architecture, Database Systems.',
    },
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Tech Innovations Lab',
      jobTitle: 'Frontend Engineering Intern',
      location: 'Remote',
      startDate: 'Jun 2024',
      endDate: 'Aug 2024',
      currentlyWorking: false,
      bullets: [
        'Built accessible UI components in TypeScript and React, improving lighthouse accessibility score to 98.',
        'Collaborated with design team to establish design tokens and standardized color hierarchy.',
        'Reduced client-side bundle size by 24% through code-splitting and dynamic imports.',
      ],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'StudentHub Workspace',
      description: 'All-in-one productivity suite for university students with in-browser PDF manipulation and authenticated document vaults.',
      technologies: 'Next.js, TypeScript, pdf-lib, Supabase',
      projectUrl: 'https://studenthub.app',
      githubUrl: 'https://github.com/alexhunter/studenthub',
    },
    {
      id: 'proj-2',
      name: 'Course Planner CLI',
      description: 'Interactive CLI utility assisting undergraduate students in resolving course timetable prerequisites and credit scheduling.',
      technologies: 'Node.js, PostgreSQL, Docker',
      githubUrl: 'https://github.com/alexhunter/course-planner',
    },
  ],
  skills: [
    'React',
    'Next.js',
    'TypeScript',
    'JavaScript',
    'Node.js',
    'PostgreSQL',
    'Tailwind CSS / Vanilla CSS',
    'Git & GitHub',
    'REST APIs',
    'Docker',
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      issueDate: '2024',
      credentialUrl: 'https://aws.amazon.com/verification',
    },
  ],
  achievements: [
    {
      id: 'ach-1',
      title: '1st Place — Annual University Hackathon (2024)',
      description: 'Built a collaborative peer-tutoring web app for over 500 active campus participants.',
      date: '2024',
    },
  ],
  languages: [
    { id: 'lang-1', language: 'English', proficiency: 'Fluent' },
    { id: 'lang-2', language: 'Spanish', proficiency: 'Conversational' },
  ],
  interests: ['Open Source', 'Algorithms', 'Cloud Computing', 'Cybersecurity'],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
};
