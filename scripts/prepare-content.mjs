/**
 * prepare-content.mjs
 * Reads all Wild Fief Obsidian markdown files, processes them,
 * and outputs them to src/content/entries/ for Astro to consume.
 * Also copies images to public/images/.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
// Use the bundled content/ folder; fall back to the original Obsidian vault path
const BUNDLED_CONTENT = path.join(PROJECT_ROOT, 'content');
const SOURCE_ROOT = fs.existsSync(BUNDLED_CONTENT)
  ? BUNDLED_CONTENT
  : 'C:/Users/tonyt/Desktop/wild-fief';
const CONTENT_OUT = path.join(PROJECT_ROOT, 'src/content/entries');
const IMAGES_OUT = path.join(PROJECT_ROOT, 'public/images');

// Category folder mapping
const CATEGORY_FOLDERS = {
  factions: 'Factions',
  gods: 'Gods',
  nations: 'Nations',
  locations: 'Locations',
  people: 'People of Interest',
  events: 'Events',
  'ethnic-groupings': 'Ethnic Groupings',
  concepts: 'Concepts',
  institutions: 'Institutions',
  races: 'Races',
  regions: 'Regions',
  'wider-groupings': 'Wider Groupings',
};

// Category display names
const CATEGORY_LABELS = {
  factions: 'Factions',
  gods: 'Gods & Religion',
  nations: 'Nations',
  locations: 'Locations',
  people: 'People of Interest',
  events: 'Events',
  'ethnic-groupings': 'Ethnic Groupings',
  concepts: 'Concepts',
  institutions: 'Institutions',
  races: 'Races',
  regions: 'Regions',
  'wider-groupings': 'Wider Groupings',
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Build a global lookup: title → { category, slug }
const entryLookup = {};

function scanEntries() {
  for (const [cat, folder] of Object.entries(CATEGORY_FOLDERS)) {
    const dir = path.join(SOURCE_ROOT, folder);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.md')) continue;
      const title = f.replace(/\.md$/, '');
      const slug = slugify(title);
      entryLookup[title.toLowerCase()] = { category: cat, slug };
      // Also try without parenthetical like "(God)" "(Person)"
      const stripped = title.replace(/\s*\([^)]+\)\s*/g, '').trim();
      if (stripped && stripped !== title) {
        entryLookup[stripped.toLowerCase()] = { category: cat, slug };
      }
    }
  }
  // Root-level md files → misc category
  for (const f of fs.readdirSync(SOURCE_ROOT)) {
    if (!f.endsWith('.md')) continue;
    const title = f.replace(/\.md$/, '');
    entryLookup[title.toLowerCase()] = { category: 'misc', slug: slugify(title) };
  }
}

function resolveWikiLink(name) {
  const key = name.toLowerCase().trim();
  const entry = entryLookup[key];
  if (entry) return `/${entry.category}/${entry.slug}`;
  // Try partial match
  for (const [k, v] of Object.entries(entryLookup)) {
    if (k.includes(key) || key.includes(k)) return `/${v.category}/${v.slug}`;
  }
  return null;
}

function processObsidianMarkdown(content, category) {
  // Process image embeds: ![[filename.png]] or ![[filename.png|caption]]
  content = content.replace(/!\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, filename, caption) => {
    const encodedPath = `/images/${encodeURIComponent(filename.trim())}`;
    const alt = caption ? caption.trim() : filename.trim();
    return `![${alt}](${encodedPath})`;
  });

  // Process wiki links: [[Page Name|Display Text]] or [[Page Name]]
  content = content.replace(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, name, display) => {
    const text = display ? display.trim() : name.trim();
    const url = resolveWikiLink(name.trim());
    if (url) return `[${text}](${url})`;
    return text; // fallback: just show the text
  });

  return content;
}

function parseFrontmatter(raw) {
  const fm = {};
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (fmMatch) {
    const fmStr = fmMatch[1];
    const body = fmMatch[2];
    // Simple YAML key: value parsing
    for (const line of fmStr.split('\n')) {
      const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
      if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return { frontmatter: fm, body };
  }
  return { frontmatter: {}, body: raw };
}

function extractDescription(body) {
  // Find first non-empty, non-heading paragraph (skip images, quotes, list items)
  const lines = body.split('\n');
  let para = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('!')) continue;  // images
    if (trimmed.startsWith('>')) continue;  // blockquotes
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) continue;  // lists
    if (/^\d+\./.test(trimmed)) continue;   // numbered lists
    if (/^\[.*\]\(.*\)$/.test(trimmed)) continue; // bare links
    para = trimmed;
    break;
  }
  // Strip markdown from description
  para = para
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
  return para.substring(0, 200);
}

function extractImages(body) {
  const imgs = [];
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    imgs.push(m[2]);
  }
  return imgs;
}

// Valid content categories (not images)
const VALID_CATEGORIES = new Set([
  'factions', 'gods', 'nations', 'locations', 'people', 'events',
  'ethnic-groupings', 'concepts', 'institutions', 'races', 'regions', 'wider-groupings'
]);

function findReferences(body) {
  // Find all [text](/category/slug) links we generated — skip image links
  const refs = [];
  const re = /\[([^\]]+)\]\(\/([^/]+)\/([^)]+)\)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const category = m[2];
    if (!VALID_CATEGORIES.has(category)) continue; // skip /images/ etc.
    const slug = decodeURIComponent(m[3]);
    refs.push({ text: m[1], category, slug });
  }
  return refs;
}

// Copy all images to public/images/
function copyImages() {
  const imageDirs = [
    SOURCE_ROOT,
    path.join(SOURCE_ROOT, 'Images'),
  ];
  let copied = 0;
  for (const dir of imageDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f)) continue;
      const src = path.join(dir, f);
      const dest = path.join(IMAGES_OUT, f);
      try {
        fs.copyFileSync(src, dest);
        copied++;
      } catch (e) {
        // skip
      }
    }
  }
  console.log(`  Copied ${copied} images to public/images/`);
}

function processCategory(category, folder) {
  const dir = path.join(SOURCE_ROOT, folder);
  if (!fs.existsSync(dir)) {
    console.log(`  Skipping ${folder} (not found)`);
    return [];
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const entries = [];

  for (const file of files) {
    const title = file.replace(/\.md$/, '');
    const slug = slugify(title);
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { frontmatter, body: rawBody } = parseFrontmatter(raw);

    let body = processObsidianMarkdown(rawBody, category);
    const description = frontmatter.description || extractDescription(body);
    const images = extractImages(body);
    const references = findReferences(body);

    // Build output frontmatter
    const outFm = {
      title: frontmatter.title || title,
      description: description || `An entry about ${title}.`,
      category,
      categoryLabel: CATEGORY_LABELS[category] || category,
      entrySlug: slug,
      tags: frontmatter.tags || [],
      image: images[0] || '',
      references: JSON.stringify(references.slice(0, 10)),
    };

    const fmStr = Object.entries(outFm)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join('\n');

    const outputContent = `---\n${fmStr}\n---\n\n${body}`;
    const outputPath = path.join(CONTENT_OUT, `${category}--${slug}.md`);
    fs.writeFileSync(outputPath, outputContent, 'utf-8');
    entries.push({ title: outFm.title, description: outFm.description, category, slug, image: outFm.image });
    console.log(`    ${title} → ${category}/${slug}`);
  }

  return entries;
}

async function main() {
  console.log('Wild Fief — Content Preparation Script');
  console.log('=======================================');

  // Clean output
  if (fs.existsSync(CONTENT_OUT)) {
    for (const f of fs.readdirSync(CONTENT_OUT)) {
      if (f.endsWith('.md') || f.endsWith('.json')) {
        fs.unlinkSync(path.join(CONTENT_OUT, f));
      }
    }
  }
  fs.mkdirSync(CONTENT_OUT, { recursive: true });
  fs.mkdirSync(IMAGES_OUT, { recursive: true });

  // Step 1: scan all entries to build lookup table for wiki link resolution
  console.log('\n[1/4] Scanning entries for wiki link resolution...');
  scanEntries();
  console.log(`  Found ${Object.keys(entryLookup).length} entries`);

  // Step 2: copy images
  console.log('\n[2/4] Copying images...');
  copyImages();

  // Step 3: process all categories
  console.log('\n[3/4] Processing markdown files...');
  const allEntries = [];
  for (const [cat, folder] of Object.entries(CATEGORY_FOLDERS)) {
    console.log(`  ${CATEGORY_LABELS[cat]}:`);
    const entries = processCategory(cat, folder);
    allEntries.push(...entries);
  }

  // Step 4: write search index
  console.log('\n[4/4] Writing search index...');
  const searchIndex = allEntries.map(e => ({
    title: e.title,
    description: e.description,
    category: e.category,
    slug: e.slug,
    url: `/${e.category}/${e.slug}`,
    image: e.image,
  }));
  fs.writeFileSync(
    path.join(PROJECT_ROOT, 'public/search-index.json'),
    JSON.stringify(searchIndex, null, 2),
    'utf-8'
  );

  // Step 5: write category index JSON (for relationship graph)
  const categoryData = {};
  for (const entry of allEntries) {
    if (!categoryData[entry.category]) categoryData[entry.category] = [];
    categoryData[entry.category].push({ title: entry.title, slug: entry.slug, description: entry.description });
  }
  fs.writeFileSync(
    path.join(PROJECT_ROOT, 'public/categories.json'),
    JSON.stringify(categoryData, null, 2),
    'utf-8'
  );

  console.log(`\nDone! Processed ${allEntries.length} entries.`);
}

main().catch(console.error);
