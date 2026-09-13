'use client';

import { useState, useMemo } from 'react';
import SearchBar from '@/components/ui/SearchBar';
import ToolCard from '@/components/tools/ToolCard';
import { TOOLS, TOOL_CATEGORIES } from '@/lib/tools';
import styles from './page.module.css';

export default function ToolsPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      const matchesSearch =
        !search ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className="container">
          <h1 className={styles.title}>Student Tools</h1>
          <p className={styles.subtitle}>
            Everything you need for studying, organizing and preparing for your future.
          </p>

          {/* Search */}
          <div className={styles.searchRow}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search tools..."
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

      {/* Grid */}
      <div className={styles.body}>
        <div className="container">
          {filtered.length === 0 ? (
            <div className={styles.noResults}>
              <span className={styles.noResultsIcon}>🔍</span>
              <p>No tools found for &ldquo;{search}&rdquo;</p>
              <button className={styles.clearSearch} onClick={() => { setSearch(''); setActiveCategory('all'); }}>
                Clear search
              </button>
            </div>
          ) : (
            <>
              <p className={styles.resultCount}>
                {filtered.length} tool{filtered.length !== 1 ? 's' : ''}
                {activeCategory !== 'all' ? ` in ${TOOL_CATEGORIES.find(c => c.id === activeCategory)?.label}` : ''}
              </p>
              <div className={styles.grid}>
                {filtered.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
