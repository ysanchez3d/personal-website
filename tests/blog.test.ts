import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSite, post, type BuiltSite } from './helpers/build-site';

let site: BuiltSite;

beforeAll(() => {
  site = buildSite({
    blog: {
      'draft-file-name.md': post(
        {
          title: 'Building a RAG App',
          slug: 'building-a-rag-app',
          description: 'How I built it.',
          date: '2026-03-01',
          category: 'tech',
          tags: ['ai'],
        },
        'Retrieval comes first.',
      ),
      'oldest.md': post({
        title: 'My First Year as an Engineer',
        slug: 'first-year',
        description: 'Looking back.',
        date: '2025-11-15',
        category: 'personal',
      }),
      'newest.md': post({
        title: 'Typed Content in Astro',
        slug: 'typed-content-in-astro',
        description: 'Schemas for Markdown.',
        date: '2026-05-20',
        category: 'tech',
      }),
    },
  });
}, 120_000);

afterAll(() => site?.cleanup());

describe('blog', () => {
  it('publishes a post at /blog/<slug>/, not at its filename', () => {
    const page = site.page('blog/building-a-rag-app/index.html');
    expect(page.querySelector('h1')?.text).toBe('Building a RAG App');
    expect(page.querySelector('main')?.text).toContain('Retrieval comes first.');
    expect(site.pages.has('blog/draft-file-name/index.html')).toBe(false);
  });

  it('lists posts on the blog index newest first, linking to each post', () => {
    const links = site.page('blog/index.html').querySelectorAll('main li a');
    expect(links.map((a) => [a.text.trim(), a.getAttribute('href')])).toEqual([
      ['Typed Content in Astro', '/blog/typed-content-in-astro/'],
      ['Building a RAG App', '/blog/building-a-rag-app/'],
      ['My First Year as an Engineer', '/blog/first-year/'],
    ]);
  });

  it('filters the blog to tech posts only', () => {
    const titles = site.page('blog/category/tech/index.html').querySelectorAll('main li a').map((a) => a.text.trim());
    expect(titles).toEqual(['Typed Content in Astro', 'Building a RAG App']);
  });

  it('filters the blog to personal posts only', () => {
    const titles = site.page('blog/category/personal/index.html').querySelectorAll('main li a').map((a) => a.text.trim());
    expect(titles).toEqual(['My First Year as an Engineer']);
  });

  it('links the blog index to the All, Tech, and Personal views', () => {
    const filters = site.page('blog/index.html').querySelectorAll('main nav a').map((a) => [a.text.trim(), a.getAttribute('href')]);
    expect(filters).toEqual([
      ['All', '/blog/'],
      ['Tech', '/blog/category/tech/'],
      ['Personal', '/blog/category/personal/'],
    ]);
  });

  it('lists every post in the RSS feed, newest first, with its full URL', () => {
    const items = [...site.file('rss.xml').matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => [
      item.match(/<title>(.*?)<\/title>/)?.[1],
      item.match(/<link>(.*?)<\/link>/)?.[1],
    ]);
    expect(items).toEqual([
      ['Typed Content in Astro', 'https://yandrisanchez.com/blog/typed-content-in-astro/'],
      ['Building a RAG App', 'https://yandrisanchez.com/blog/building-a-rag-app/'],
      ['My First Year as an Engineer', 'https://yandrisanchez.com/blog/first-year/'],
    ]);
  });

  it('ships no JavaScript on blog pages', () => {
    const blogPages = [...site.pages].filter(([path]) => path.startsWith('blog/'));
    expect(blogPages.length).toBe(6);
    for (const [path, page] of blogPages) {
      expect(page.querySelectorAll('script'), path).toHaveLength(0);
    }
  });

  it('points feed readers to the RSS feed from every page', () => {
    for (const [path, page] of site.pages) {
      const feed = page.querySelector('link[rel="alternate"][type="application/rss+xml"]');
      expect(feed?.getAttribute('href'), path).toBe('/rss.xml');
    }
  });
});
