import type { Metadata } from 'next';
import Link from 'next/link';
import { GitMerge, Scissors, Image, FileImage, Shuffle, Minimize2 } from 'lucide-react';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'PDF Tools',
  description: 'Merge, split, convert, reorder and compress your PDF files — all in your browser.',
};

const PDF_TOOLS = [
  {
    id: 'merge',
    href: '/tools/pdf/merge',
    icon: <GitMerge size={26} />,
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one document.',
    color: '#2563eb',
  },
  {
    id: 'split',
    href: '/tools/pdf/split',
    icon: <Scissors size={26} />,
    title: 'Split PDF',
    description: 'Extract selected pages from a PDF file.',
    color: '#7c3aed',
  },
  {
    id: 'pdf-to-images',
    href: '/tools/pdf/pdf-to-images',
    icon: <FileImage size={26} />,
    title: 'PDF → Images',
    description: 'Convert PDF pages into PNG images.',
    color: '#059669',
  },
  {
    id: 'images-to-pdf',
    href: '/tools/pdf/images-to-pdf',
    icon: <Image size={26} />,
    title: 'Images → PDF',
    description: 'Create a PDF from multiple images.',
    color: '#d97706',
  },
  {
    id: 'reorder',
    href: '/tools/pdf/reorder',
    icon: <Shuffle size={26} />,
    title: 'Reorder PDF',
    description: 'Drag and drop to reorder pages in a PDF.',
    color: '#dc2626',
  },
  {
    id: 'compress',
    href: '/tools/pdf/compress',
    icon: <Minimize2 size={26} />,
    title: 'Compress PDF',
    description: 'Reduce PDF file size and optimize it.',
    color: '#0891b2',
  },
];

export default function PdfToolsPage() {
  return (
    <>
      <ToolPageHeader
        breadcrumbs={[{ label: 'Tools', href: '/tools' }, { label: 'PDF Tools' }]}
        title="PDF Tools"
        description="Simple tools to manage your PDF files — all processed in your browser."
        icon="📋"
      />

      <div className={styles.body}>
        <div className="container">
          <div className={styles.grid}>
            {PDF_TOOLS.map((tool) => (
              <Link key={tool.id} href={tool.href} className={styles.toolLink} id={`pdf-tool-${tool.id}`}>
                <div className={styles.toolCard}>
                  <div
                    className={styles.toolIcon}
                    style={{ background: `color-mix(in srgb, ${tool.color} 12%, white)`, color: tool.color }}
                  >
                    {tool.icon}
                  </div>
                  <h2 className={styles.toolTitle}>{tool.title}</h2>
                  <p className={styles.toolDesc}>{tool.description}</p>
                  <span className={styles.toolArrow}>Open Tool →</span>
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.note}>
            <span>🔒</span>
            <span>All PDF processing happens entirely in your browser. Your files are never uploaded to a server.</span>
          </div>
        </div>
      </div>
    </>
  );
}
