import type { MetadataSite } from '../lib/metadata';

export const site: MetadataSite & { navigation: { label: string; href: string }[] } = {
  title: 'My Site',
  description: 'A static Astro site built with Baseline.',
  language: 'en',
  navigation: [{ label: 'Home', href: '/' }, { label: 'Posts', href: '/posts/' }],
};
