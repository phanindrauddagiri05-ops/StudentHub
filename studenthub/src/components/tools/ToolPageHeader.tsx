import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './ToolPageHeader.module.css';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ToolPageHeaderProps {
  breadcrumbs: Breadcrumb[];
  title: string;
  description?: string;
  icon?: string;
}

export default function ToolPageHeader({
  breadcrumbs,
  title,
  description,
  icon,
}: ToolPageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className={styles.crumbWrapper}>
              {i > 0 && <ChevronRight size={14} className={styles.crumbSep} />}
              {crumb.href ? (
                <Link href={crumb.href} className={styles.crumbLink}>
                  {crumb.label}
                </Link>
              ) : (
                <span className={styles.crumbCurrent} aria-current="page">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        {/* Title */}
        <div className={styles.titleRow}>
          {icon && <span className={styles.titleIcon}>{icon}</span>}
          <div>
            <h1 className={styles.title}>{title}</h1>
            {description && <p className={styles.description}>{description}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
