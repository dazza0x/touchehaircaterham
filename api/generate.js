'use strict';

// ── RSS feed sources ──────────────────────────────────────────────────────────
const FEEDS = {
  hji:          { name: 'Hairdressers Journal',  url: 'https://www.hji.co.uk/feed/' },
  creativeHead: { name: 'Creative HEAD',         url: 'https://www.creativeheadmag.com/feed/' },
  modernSalon:  { name: 'Modern Salon',          url: 'https://www.modernsalon.com/rss' },
  salonToday:   { name: 'Salon Today',           url: 'https://www.salontoday.com/rss' },
  estetica:     { name: 'Estetica',              url: 'https://www.estetica.it/en/feed/' },
};

// ── Brand voice context ───────────────────────────────────────────────────────
const BRAND_CONTEXT = `You write blog posts for Touché Hairdressing — a trusted independent salon in Caterham, Surrey, established in 1985.

Voice: "Helen" — senior stylist, 52, 25+ years experience. Warm, assured, precise. Never gushing.
- British English spelling (colour, emphasise, recognise)
- Em dashes (—) for parenthetical phrases
- Confident but never salesy. Expertise shows through clarity, not hype.
- Never says: "passionate about your journey", "revolutionary", "OMG", or uses excessive exclamation marks.
- Short punchy sentences mixed with longer explanatory ones.
- Subheadings with ## that are descriptive, not clickbait.

Product policy — STRICT:
- The salon uses and recommends ONLY these brands by name:
  • Organethic Pure Care (OPC) — care / colour-safe haircare
  • Oligo Professionnel — colour and bond / scalp care
  • The Crown — hair smoothing system
- NEVER name, recommend, or compare against any other professional or retail brand. This includes (non-exhaustive): Wella, Schwarzkopf, L'Oréal Professionnel, Redken, Kérastase, Olaplex, K18, Davines, Aveda, Goldwell, Matrix, Pureology, Moroccanoil, Tigi, Paul Mitchell, Joico, Shu Uemura, Pantene, Garnier, Herbal Essences.
- Reason for the ban: animal testing and brand-alignment. Do not explain the ban in the post — just omit those brands silently.
- If the topic or an RSS headline references a banned brand, write around it: discuss the underlying technique, ingredient, or trend in general terms, or pivot to how we'd approach it using OPC / Oligo / The Crown.
- Generic terms ("bond builder", "smoothing treatment", "colour-safe shampoo", "scalp serum") are fine and preferred when no in-house brand fits the context.`;

// ── Tone dial presets ─────────────────────────────────────────────────────────
const TONE_GUIDES = {
  informative: 'Informative and educational. Warmth 3/5, Authority 4/5.',
  warm:        'Warm and community-focused. Warmth 4/5, Authority 3/5.',
  product:     'Product introduction — informed enthusiasm, not hype. Authority 4/5.',
  seasonal:    'Seasonal/trend-led — expert insight on what\'s happening now. Authority 4/5.',
};

// ── Simple RSS parser (no dependencies needed) ────────────────────────────────
function parseRSS(xml) {
  const items = [];
  const regex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = regex.exec(xml)) !== null && items.length < 4) {
    const chunk = m[1];
    const titleM = chunk.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const title  = titleM ? titleM[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : '';
    if (title && title.length > 5) items.push(title);
  }
  return items;
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Allow requests from the Touché site and any localhost (for testing)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { topic, tone, extra, selectedFeeds } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'topic is required' });

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'CLAUDE_API_KEY not set in environment variables' });

  // ── Fetch RSS headlines in parallel ────────────────────────────────────────
  const feedKeys  = Array.isArray(selectedFeeds) && selectedFeeds.length
    ? selectedFeeds
    : Object.keys(FEEDS);

  const headlines = [];

  await Promise.allSettled(
    feedKeys.map(async key => {
      const feed = FEEDS[key];
      if (!feed) return;
      try {
        const r = await fetch(feed.url, {
          headers: { 'User-Agent': 'ToucheCMS/1.0' },
          signal:  AbortSignal.timeout(5000),
        });
        if (!r.ok) return;
        const xml   = await r.text();
        const items = parseRSS(xml);
        items.forEach(title => headlines.push({ source: feed.name, title }));
      } catch {
        // Feed unreachable — skip silently
      }
    })
  );

  // ── Build prompt ────────────────────────────────────────────────────────────
  const headlineBlock = headlines.length
    ? `\n\nReal industry news this week:\n${
        headlines.slice(0, 8).map((h, i) => `${i + 1}. [${h.source}] ${h.title}`).join('\n')
      }\n\nDraw genuine inspiration from these where relevant — reference specific trends or context they surface.`
    : '';

  const userPrompt = `Write a blog post for the Touché Hairdressing website.

Topic: ${topic}
Tone: ${TONE_GUIDES[tone] || TONE_GUIDES.informative}${extra ? `\nExtra context: ${extra}` : ''}${headlineBlock}

Output ONLY this structure — no extra commentary:
EXCERPT: [1–2 sentence summary, ~160 characters, no quotes]
BODY:
[Full article in Markdown — opening paragraph then ## subheadings, 300–500 words]`;

  // ── Call Claude ─────────────────────────────────────────────────────────────
  let claudeRes;
  try {
    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1400,
        system:     BRAND_CONTEXT,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach Claude API: ' + e.message });
  }

  if (!claudeRes.ok) {
    const err = await claudeRes.json().catch(() => ({}));
    return res.status(502).json({ error: err.error?.message || 'Claude API error ' + claudeRes.status });
  }

  const data       = await claudeRes.json();
  const text       = data.content?.[0]?.text || '';
  const excerptM   = text.match(/EXCERPT:\s*(.+?)(?:\n|$)/);
  const bodyM      = text.match(/BODY:\s*\n([\s\S]+)/);

  return res.json({
    excerpt:   excerptM ? excerptM[1].trim() : '',
    body:      bodyM    ? bodyM[1].trim()    : text,
    headlines: headlines.slice(0, 8),
  });
};
