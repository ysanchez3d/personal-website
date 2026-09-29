import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Builds the real site once and checks what visitors actually get.
let outDir: string;
const pages = new Map<string, HTMLElement>();

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => join(entry.parentPath, entry.name));
}

beforeAll(() => {
  outDir = mkdtempSync(join(tmpdir(), 'site-build-'));
  execFileSync('npx', ['astro', 'build', '--outDir', outDir], { stdio: 'pipe' });
  for (const file of htmlFiles(outDir)) {
    pages.set(relative(outDir, file), parse(readFileSync(file, 'utf8')));
  }
}, 120_000);

afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

function page(path: string): HTMLElement {
  const root = pages.get(path);
  if (!root) throw new Error(`${path} was not built`);
  return root;
}

describe('built site', () => {
  it('builds a home page and a 404 page', () => {
    expect([...pages.keys()].sort()).toEqual(['404.html', 'index.html']);
  });

  it('shows email, LinkedIn, GitHub, and DEV.to in the footer of every page', () => {
    for (const [path, root] of pages) {
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
    for (const [path, root] of pages) {
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
    expect(page('index.html').querySelector('title')?.text).toBe('Yandri Sanchez');
    expect(page('404.html').querySelector('title')?.text).toBe('Page not found | Yandri Sanchez');
    for (const [path, root] of pages) {
      const description = root.querySelector('meta[name="description"]')?.getAttribute('content');
      expect(description, path).toBeTruthy();
    }
  });

  it('shows a 404 page that links back home', () => {
    const notFound = page('404.html');
    expect(notFound.querySelector('h1')?.text).toBe('Page not found');
    expect(notFound.querySelectorAll('main a').map((a) => a.getAttribute('href'))).toContain('/');
  });
});
