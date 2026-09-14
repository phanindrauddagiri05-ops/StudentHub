import React from 'react';
import type { Metadata } from 'next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DocumentConverter } from '@/components/tools/document-converter/DocumentConverter';

export const metadata: Metadata = {
  title: 'Document Converters | StudentHub',
  description: 'Convert documents between popular file formats quickly and securely.',
};

export default function DocumentConvertersPage() {
  return (
    <DashboardLayout>
      <DocumentConverter />
    </DashboardLayout>
  );
}
