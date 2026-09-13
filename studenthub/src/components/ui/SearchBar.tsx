'use client';

import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Search...', id = 'search' }: SearchBarProps) {
  return (
    <div className={styles.wrapper}>
      <Search className={styles.icon} size={18} />
      <input
        id={id}
        type="search"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        aria-label={placeholder}
      />
    </div>
  );
}
