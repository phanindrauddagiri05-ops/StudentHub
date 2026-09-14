import React from 'react';
import type { Metadata } from 'next';
import { ImageConverter } from '@/components/tools/image-converter/ImageConverter';

export const metadata: Metadata = {
  title: 'Image Converters | StudentHub',
  description: 'Convert your images to popular formats (JPG, PNG, WebP, HEIC, GIF, BMP, TIFF, SVG) quickly and securely.',
};

export default function ImageConvertersPage() {
  return <ImageConverter />;
}
