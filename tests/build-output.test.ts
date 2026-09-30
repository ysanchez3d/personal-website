import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSite, type BuiltSite } from './helpers/build-site';

// Builds the real site with its real content and checks what visitors get.
let site: BuiltSite;

beforeAll(() => {
  site = buildSite();
}, 120_000);

afterAll(() => site?.cleanup());

describe('built site', () => {
  it('builds the home, 404, and blog pages', () => {
    for (const path of ['index.html', '404.html', 'blog/index.html']) {
      expect(site.pages.has(path), path).toBe(true);
    }
  });

  it('links to Home and Blog in the header of every page', () => {
    for (const [path, root] of site.pages) {
      const nav = root.querySelectorAll('header nav a').map((a) => [a.text.trim(), a.getAttribute('href')]);
      expect(nav, path).toEqual([
        ['Home', '/'],
        ['Blog', '/blog/'],
      ]);
    }
  });

  it('shows email, LinkedIn, GitHub, and DEV.to in the footer of every page', () => {
    for (const [path, root] of site.pages) {
      const hrefs = root.querySelectorAll('footer a').map((a) => a.getAttribute('href'));
      expect(hrefs, path).toEqual([
        'mailto:hello@yandrisanchez.com',
        'https://www.linkedin.com/in/yandrisanchez/',
        'https://github.com/ysanchez3d',
        'https://dev.to/ysanchez3d',
      ]);
    }
  });

  it('opens external footer links in a new tab without leaking the opener', () => {
    for (const [path, root] of site.pages) {
      const external = root
        .querySelectorAll('footer a')
        .filter((a) => a.getAttribute('href')?.startsWith('https://'));
      expect(external.length, path).toBe(3);
      for (const a of external) {
        expect(a.getAttribute('target'), path).toBe('_blank');
        expect(a.getAttribute('rel'), path).toBe('noopener noreferrer');
      }
    }
  });

  it('gives every page a title and a meta description', () => {
    expect(site.page('index.html').querySelector('title')?.text).toBe('Yandri Sanchez');
    expect(site.page('404.html').querySelector('title')?.text).toBe('Page not found | Yandri Sanchez');
    for (const [path, root] of site.pages) {
      const description = root.querySelector('meta[name="description"]')?.getAttribute('content');
      expect(description, path).toBeTruthy();
    }
  });

  it('shows a 404 page that links back home', () => {
    const notFound = site.page('404.html');
    expect(notFound.querySelector('h1')?.text).toBe('Page not found');
    expect(notFound.querySelectorAll('main a').map((a) => a.getAttribute('href'))).toContain('/');
  });
});
