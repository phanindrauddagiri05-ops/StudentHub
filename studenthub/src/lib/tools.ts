// ============================================================
// StudentHub — Tool Registry
// ============================================================

import { Tool } from '@/types';

export const TOOLS: Tool[] = [
  {
    id: 'resume',
    name: 'Resume Generator',
    slug: 'resume',
    description: 'Create a professional resume using simple forms and ready-to-use templates.',
    icon: '📄',
    category: 'career',
    status: 'coming-soon',
    path: '/tools/resume',
    color: '#7c3aed',
  },
  {
    id: 'pdf',
    name: 'PDF Tools',
    slug: 'pdf',
    description: 'Merge, split, convert and manage your PDF files.',
    icon: '📋',
    category: 'documents',
    status: 'available',
    path: '/tools/pdf',
    color: '#2563eb',
  },
  {
    id: 'calculator',
    name: 'Percentage Calculator',
    slug: 'calculator',
    description: 'Calculate marks percentage, percentage changes and academic scores.',
    icon: '🧮',
    category: 'academic',
    status: 'coming-soon',
    path: '/tools/calculator',
    color: '#059669',
  },
  {
    id: 'notes',
    name: 'Notes',
    slug: 'notes',
    description: 'Upload, organize and access all your study notes in one place.',
    icon: '📝',
    category: 'study',
    status: 'coming-soon',
    path: '/tools/notes',
    color: '#d97706',
  },
  {
    id: 'notes-search',
    name: 'Notes Search',
    slug: 'notes-search',
    description: 'Search your uploaded study materials and quickly find what you need.',
    icon: '🔍',
    category: 'study',
    status: 'coming-soon',
    path: '/tools/notes/search',
    color: '#0891b2',
  },
  {
    id: 'summary',
    name: 'PDF Summary',
    slug: 'summary',
    description: 'Turn long PDFs into concise summaries and important study points.',
    icon: '✨',
    category: 'documents',
    status: 'coming-soon',
    path: '/tools/summary',
    color: '#7c3aed',
  },
  {
    id: 'mindmap',
    name: 'Mind Map Generator',
    slug: 'mindmap',
    description: 'Turn topics and study material into visual mind maps.',
    icon: '🧠',
    category: 'study',
    status: 'coming-soon',
    path: '/tools/mindmap',
    color: '#db2777',
  },
  {
    id: 'questions',
    name: 'Question Preparation',
    slug: 'questions',
    description: 'Generate and organize questions for exam preparation.',
    icon: '❓',
    category: 'study',
    status: 'coming-soon',
    path: '/tools/questions',
    color: '#dc2626',
  },
  {
    id: 'attendance',
    name: 'Attendance Calculator',
    slug: 'attendance',
    description: 'Track your attendance and calculate how many classes you need to attend.',
    icon: '📅',
    category: 'planning',
    status: 'coming-soon',
    path: '/tools/attendance',
    color: '#16a34a',
  },
  {
    id: 'search',
    name: 'Study Search',
    slug: 'search',
    description: 'Find useful study resources across the web, YouTube and your notes library.',
    icon: '🌐',
    category: 'study',
    status: 'coming-soon',
    path: '/tools/search',
    color: '#0369a1',
  },
  {
    id: 'timetable',
    name: 'Timetable Generator',
    slug: 'timetable',
    description: 'Create and organize your weekly academic timetable.',
    icon: '🗓️',
    category: 'planning',
    status: 'coming-soon',
    path: '/tools/timetable',
    color: '#7c3aed',
  },
];

export const TOOL_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'study', label: 'Study' },
  { id: 'documents', label: 'Documents' },
  { id: 'academic', label: 'Academic' },
  { id: 'planning', label: 'Planning' },
  { id: 'career', label: 'Career' },
] as const;

export function getToolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: string): Tool[] {
  if (category === 'all') return TOOLS;
  return TOOLS.filter((t) => t.category === category);
}
