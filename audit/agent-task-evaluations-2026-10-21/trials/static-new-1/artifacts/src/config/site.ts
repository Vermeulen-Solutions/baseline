import type { MetadataSite } from '../lib/metadata';
export const site: MetadataSite & { email: string; action: string; navigation: { label: string; href: string }[] } = {
  title: 'Northline Planning',
  description: 'Northline Planning helps independent businesses understand their options before committing to a new space.',
  language: 'en',
  email: 'hello@northline.example.test',
  action: 'Discuss your project',
  navigation: [{ label: 'Home', href: '/' }, { label: 'Services', href: '/services/' }, { label: 'About', href: '/about/' }, { label: 'Contact', href: '/contact/' }],
};
