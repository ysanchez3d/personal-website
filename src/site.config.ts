export const site = {
  name: 'Yandri Sanchez',
  description: 'Software engineer — backend, full-stack, React, and AI engineering.',
  email: 'hello@yandrisanchez.com',
  links: {
    linkedin: 'https://www.linkedin.com/in/yandrisanchez/',
    github: 'https://github.com/ysanchez3d',
    devto: 'https://dev.to/ysanchez3d',
  },
} as const;

export type SiteConfig = typeof site;

export interface FooterLink {
  label: string;
  href: string;
  external: boolean;
}

export function footerLinks(config: SiteConfig): FooterLink[] {
  return [
    { label: 'Email', href: `mailto:${config.email}`, external: false },
    { label: 'LinkedIn', href: config.links.linkedin, external: true },
    { label: 'GitHub', href: config.links.github, external: true },
    { label: 'DEV.to', href: config.links.devto, external: true },
  ];
}
