import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';

const repoRoot = resolve(import.meta.dirname, '../..');
const projectFiles = ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json'];

export interface SiteContent {
  /** Blog post files keyed by filename. Replaces the real posts when given. */
  blog?: Record<string, string>;
}

export interface BuiltSite {
  /** Built HTML pages keyed by output path, e.g. `blog/my-post/index.html`. */
  pages: Map<string, HTMLElement>;
  page(path: string): HTMLElement;
  file(path: string): string;
  cleanup(): void;
}

/** Builds the real site (optionally with different content) into a temp folder. */
export function buildSite(content: SiteContent = {}): BuiltSite {
  // realpath: on macOS tmpdir() is behind a symlink, which confuses Astro's build.
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'site-build-'));
  for (const name of projectFiles) {
    if (existsSync(join(repoRoot, name))) cpSync(join(repoRoot, name), join(root, name), { recursive: true });
  }
  symlinkSync(join(repoRoot, 'node_modules'), join(root, 'node_modules'), 'dir');

  if (content.blog) {
    const blogDir = join(root, 'src/content/blog');
    rmSync(blogDir, { recursive: true, force: true });
    mkdirSync(blogDir, { recursive: true });
    for (const [filename, body] of Object.entries(content.blog)) {
      writeFileSync(join(blogDir, filename), body);
    }
  }

  execFileSync(join(repoRoot, 'node_modules/.bin/astro'), ['build', '--root', root], { stdio: 'pipe' });

  const outDir = join(root, 'dist');
  const pages = new Map<string, HTMLElement>();
  for (const entry of readdirSync(outDir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name.endsWith('.html')) {
      const file = join(entry.parentPath, entry.name);
      pages.set(relative(outDir, file), parse(readFileSync(file, 'utf8')));
    }
  }

  return {
    pages,
    page(path) {
      const found = pages.get(path);
      if (!found) throw new Error(`${path} was not built. Built: ${[...pages.keys()].join(', ')}`);
      return found;
    },
    file(path) {
      return readFileSync(join(outDir, path), 'utf8');
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

export function post(frontmatter: Record<string, unknown>, body = 'Post body.'): string {
  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
  return `---\n${yaml}\n---\n\n${body}\n`;
}

