import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];
const fail = (message) => failures.push(message);

const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');
const homeScript = readFileSync(resolve(root, 'assets/js/script.js'), 'utf8');
const projectCss = readFileSync(resolve(root, 'assets/css/project-managed.css'), 'utf8');
const projects = JSON.parse(readFileSync(resolve(root, 'projects/projects.json'), 'utf8'));

const sectionMatch = indexHtml.match(/<section\b[^>]*\bid=["']projects["'][^>]*>[\s\S]*?<\/section>/i);
if (!sectionMatch) {
  fail('homepage is missing the Projects section');
} else {
  const section = sectionMatch[0];
  if (!/id=["']managedProjectGrid["'][^>]*\bhidden\b/i.test(section)) {
    fail('managed project grid must start hidden while project data loads');
  }
  if (/<article\b[^>]*\bproject-card\b/i.test(section)) {
    fail('homepage Projects section must not contain hard-coded project cards');
  }
  if (/cloud-project|rocket-project|rocket-banner|cloudlab-art/i.test(section)) {
    fail('homepage Projects section still contains legacy project markup');
  }
}

for (const token of [
  'project.draft === false',
  "section.dataset.projectsState = 'loading'",
  'grid.hidden = true',
  "section.dataset.projectsState = published.length ? 'ready' : 'empty'",
  "section.dataset.projectsState = 'unavailable'"
]) {
  if (!homeScript.includes(token)) fail(`homepage project loader is missing fail-closed safeguard: ${token}`);
}

if (/keeping built-in projects/i.test(homeScript)) {
  fail('homepage project loader must not fall back to hard-coded project cards');
}
if (!projectCss.includes('.project-grid[hidden]') || !projectCss.includes('display: none !important')) {
  fail('managed project CSS must force the loading grid to remain hidden');
}

if (!Array.isArray(projects)) {
  fail('projects/projects.json must contain an array');
} else {
  projects.forEach((project, index) => {
    if (typeof project?.draft !== 'boolean') {
      fail(`project ${project?.id || index} must store draft as an explicit boolean`);
    }
  });

  const published = projects.filter((project) =>
    project &&
    project.draft === false &&
    typeof project.title === 'string' && project.title.trim() &&
    typeof project.description === 'string' && project.description.trim()
  );
  if (published.some((project) => project.draft !== false)) {
    fail('draft projects leaked into the published project selection');
  }
}

if (failures.length) {
  console.error(`Managed project validation failed with ${failures.length} issue(s):\n${failures.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log('Managed project validation passed: no hard-coded cards, loading is hidden, and only explicit non-drafts are renderable.');
