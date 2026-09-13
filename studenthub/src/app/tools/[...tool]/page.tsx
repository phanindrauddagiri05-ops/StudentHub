import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { TOOLS } from '@/lib/tools';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export function generateMetadata({ params }: { params: { tool: string[] } }): Metadata {
  const slug = params.tool?.[0] ?? '';
  const tool = TOOLS.find((t) => t.slug === slug);
  return {
    title: tool ? `${tool.name} — Coming Soon` : 'Coming Soon',
    description: tool?.description ?? 'This tool is coming soon to StudentHub.',
  };
}

export default function ComingSoonPage({ params }: { params: { tool: string[] } }) {
  const slug = params.tool?.[0] ?? '';
  const tool = TOOLS.find((t) => t.slug === slug || t.path.endsWith(slug));

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.card}>
          <div className={styles.icon}>{tool?.icon ?? '🚧'}</div>
          <div className={styles.badge}>
            <Clock size={13} />
            Coming Soon
          </div>
          <h1 className={styles.title}>
            {tool?.name ?? 'This Tool'} is Being Built
          </h1>
          <p className={styles.desc}>
            {tool?.description ??
              "We're working on bringing this tool to StudentHub. Check back soon!"}
          </p>
          <p className={styles.note}>
            This tool is part of the StudentHub academic toolkit and will be available in a future update.
          </p>
          <div className={styles.actions}>
            <Button variant="primary" href="/tools" id="back-to-tools">
              <ArrowLeft size={16} /> Explore Available Tools
            </Button>
            <Button variant="ghost" href="/" id="back-to-home">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
