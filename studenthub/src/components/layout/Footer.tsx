import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import styles from './Footer.module.css';
import { APP_COPYRIGHT } from '@/lib/constants';

const FOOTER_LINKS: Record<
  string,
  { label: string; href: string; disabled?: boolean; tag?: string }[]
> = {
  StudentHub: [
    { label: 'About', href: '/#about' },
    { label: 'Features', href: '/#features' },
    { label: 'Tools', href: '/tools' },
    { label: 'Contact', href: '#' },
  ],
  Tools: [
    { label: 'Mind Maps', href: '/tools/mind-maps' },
    { label: 'Question Preparation', href: '/tools/questions' },
    { label: 'Document Converters', href: '/tools/document-converters' },
    { label: 'Image Converters', href: '/tools/image-converters' },
    { label: 'PDF Tools', href: '/tools/pdf' },
    { label: 'PDF Summary', href: '#', disabled: true, tag: 'Soon' },
    { label: 'Resume Generator', href: '#', disabled: true, tag: 'Soon' },
    { label: 'Notes Summary', href: '#', disabled: true, tag: 'Soon' },
    { label: 'Attendance', href: '#', disabled: true, tag: 'Soon' },
  ],
  Resources: [
    { label: 'Help', href: '/#faq' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>
              <BookOpen size={18} strokeWidth={2.5} />
            </span>
            <span className={styles.logoText}>StudentHub</span>
          </Link>
          <p className={styles.tagline}>
            Everything you need for student life, in one place.
          </p>
          <div className={styles.social}>
            <a href="#" className={styles.socialLink} aria-label="Twitter">𝕏</a>
            <a href="#" className={styles.socialLink} aria-label="LinkedIn">in</a>
            <a href="#" className={styles.socialLink} aria-label="Instagram">ig</a>
          </div>
        </div>

        {/* Links */}
        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
          <div key={section} className={styles.column}>
            <h3 className={styles.columnTitle}>{section}</h3>
            <ul className={styles.linkList}>
              {links.map((link) => (
                <li key={link.label}>
                  {link.disabled ? (
                    <span className={styles.linkDisabled}>
                      {link.label}
                      {link.tag && <span className={styles.soonBadge}>{link.tag}</span>}
                    </span>
                  ) : (
                    <Link href={link.href} className={styles.link}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className="container">
          <p className={styles.copyright}>{APP_COPYRIGHT}</p>
        </div>
      </div>
    </footer>
  );
}
