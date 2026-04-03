/**
 * build-posts.js
 * Scans news/posts/*.md, parses front matter, outputs posts-index.json.
 * Run: node scripts/build-posts.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const matter = require('gray-matter');

const POSTS_DIR  = path.join(__dirname, '..', 'news', 'posts');
const OUTPUT_FILE = path.join(__dirname, '..', 'posts-index.json');

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

const posts = files.map(file => {
  const slug    = file.replace(/\.md$/, '');
  const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
  const { data } = matter(content);

  // Format display date e.g. "11 October 2025"
  // Decap CMS may save dates as "2026-04-03T00:00:00.000Z" or plain "2026-04-03"
  let dateDisplay = '';
  let dateISO = '';
  if (data.date) {
    dateISO = String(data.date).slice(0, 10); // always get YYYY-MM-DD part
    const d = new Date(dateISO + 'T12:00:00Z');
    dateDisplay = d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  const category = data.category || 'News';

  return {
    slug,
    title:       data.title       || slug,
    date:        dateISO,
    dateDisplay,
    category,
    eyebrow:     `${category} · ${dateDisplay.replace(/\d+\s/, '').replace(/\s\d{4}$/, m => m)}`,
    excerpt:     data.excerpt     || '',
    readTime:    data.readTime    || '2 min read',
    heroSubtitle: data.heroSubtitle || '',
    image:       data.image       || null,
    ctaTitle:    data.ctaTitle    || 'Book an Appointment',
    ctaBody:     data.ctaBody     || 'Book a consultation with our Caterham team — we\'d love to see you.',
  };
}).sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2) + '\n');
console.log(`posts-index.json written — ${posts.length} post(s).`);
