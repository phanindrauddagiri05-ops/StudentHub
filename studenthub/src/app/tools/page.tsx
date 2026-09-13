'use client';

import { useState, useMemo } from 'react';
import SearchBar from '@/components/ui/SearchBar';
import ToolCard from '@/components/tools/ToolCard';
import { TOOLS, TOOL_CATEGORIES, getToolsByCategory } from '@/lib/tools';
import { ToolCategory } from '@/types';
import { AdSlot } from '@/components/ads/AdSlot';
import styles from './page.module.css';

export default function ToolsPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory =
        activeCategory === 'all' ||
        tool.category === activeCategory ||
        (tool.categories && tool.categories.includes(activeCategory as ToolCategory));
      const matchesSearch =
        !search ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const CATEGORY_SECTIONS = [
    { id: 'career', title: 'Career', desc: 'Build job-ready profiles, resumes, and portfolios' },
    { id: 'documents', title: 'Documents', desc: 'Manage, edit, convert, and optimize PDFs and resumes' },
    { id: 'study', title: 'Study', desc: 'Accelerate textbook reading, note taking, and revision' },
    { id: 'academic', title: 'Academic', desc: 'Track marks, grades, cutoffs, and lecture attendance' },
    { id: 'planning', title: 'Planning', desc: 'Schedules, class routines, and study timelines' },
  ];

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className="container">
          <h1 className={styles.title}>Student Tools</h1>
          <p className={styles.subtitle}>
            Everything you need for studying, organizing, and preparing for your career.
          </p>

          {/* Search */}
          <div className={styles.searchRow}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search tools (e.g. resume, pdf, percentage)..."
              id="tools-search"
            />
          </div>

          {/* Category filters */}
          <div className={styles.filters} role="tablist" aria-label="Tool categories">
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={[
                  styles.filterBtn,
                  activeCategory === cat.id ? styles.filterBtnActive : '',
                ].join(' ')}
                onClick={() => setActiveCategory(cat.id)}
                id={`filter-${cat.id}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Body */}
      <div className={styles.body}>
        <div className="container">
          {filtered.length === 0 ? (
            <div className={styles.noResults}>
              <span className={styles.noResultsIcon}>🔍</span>
              <p>No tools found for &ldquo;{search}&rdquo;</p>
              <button
                className={styles.clearSearch}
                onClick={() => {
                  setSearch('');
                  setActiveCategory('all');
                }}
              >
                Clear search
              </button>
            </div>
          ) : activeCategory === 'all' && !search ? (
            /* Grouped View by Category */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {CATEGORY_SECTIONS.map((sec) => {
                const secTools = getToolsByCategory(sec.id);
                if (secTools.length === 0) return null;
                return (
                  <section key={sec.id} id={sec.id}>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                        {sec.title}
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                        {sec.desc}
                      </p>
                    </div>
                    <div className={styles.grid}>
                      {secTools.map((tool) => (
                        <ToolCard key={`${sec.id}-${tool.id}`} tool={tool} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            /* Filtered Flat Grid */
            <>
              <p className={styles.resultCount}>
                {filtered.length} tool{filtered.length !== 1 ? 's' : ''}
                {activeCategory !== 'all'
                  ? ` in ${TOOL_CATEGORIES.find((c) => c.id === activeCategory)?.label}`
                  : ''}
              </p>
              <div className={styles.grid}>
                {filtered.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </>
          )}

          {/* Ad slot placed outside critical interaction areas */}
          <div style={{ marginTop: '4rem' }}>
            <AdSlot slotId="tools-directory-bottom" format="horizontal" />
          </div>
        </div>
      </div>
    </div>
  );
}
