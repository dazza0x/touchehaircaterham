/**
 * cms.js — Dynamic content renderer for Touché Hairdressing
 * Hours/services/Instagram: loads from admin-data.json
 * Blog posts: loads from posts-index.json (built by GitHub Actions from news/posts/*.md)
 * Fails silently if either JSON is unavailable (static fallback remains).
 */
(function () {
  'use strict';

  const inNews = location.pathname.includes('/news/');

  // Path helpers
  function adminDataPath()  { return inNews ? '../admin-data.json'  : 'admin-data.json';  }
  function postsIndexPath() { return inNews ? '../posts-index.json' : 'posts-index.json'; }

  // ── Hours ─────────────────────────────────────────────────────────────────
  function renderHours(hours, container) {
    if (!container) return;
    const dark = container.dataset.cmsDark === 'true';
    const rows = hours.map(h => {
      const time = h.closed ? 'Closed' : `${h.opens} – ${h.closes}`;
      const dayStyle  = dark ? ' style="color:rgba(255,255,255,0.5)"'  : '';
      const timeStyle = dark ? ` style="color:rgba(255,255,255,${h.closed ? '0.35' : '0.85'})"` : '';
      return `<tr><td${dayStyle}>${h.day}</td><td${timeStyle}>${time}</td></tr>`;
    }).join('');
    container.innerHTML = rows;
  }

  // ── Services ──────────────────────────────────────────────────────────────
  function renderServices(services, container) {
    if (!container) return;
    const html = services.map(cat => {
      const items = cat.items.map(item => `
        <div class="pricing-row">
          <div class="pricing-row__name">
            ${item.name}${item.note ? `<span class="pricing-row__note">${item.note}</span>` : ''}
          </div>
          <div class="pricing-row__price">${item.price}</div>
        </div>`).join('');
      return `
        <div class="pricing-category" id="${cat.id}">
          <h2 class="pricing-category__title">${cat.title}</h2>
          ${items}
        </div>`;
    }).join('');
    container.innerHTML = html;
  }

  // ── News grid ─────────────────────────────────────────────────────────────
  function renderNews(posts, container, limit) {
    if (!container) return;
    const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    const shown  = limit ? sorted.slice(0, limit) : sorted;
    const arrow  = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 7h10M7 2l5 5-5 5"/></svg>`;
    const prefix = inNews ? '' : 'news/';

    const cards = shown.map(p => {
      const href = `${prefix}post.html?slug=${p.slug}`;
      const catSlug = (p.category || 'news').toLowerCase().replace(/\s+/g, '-');
      const imgSrc = p.image
        ? (p.image.startsWith('/') ? p.image : (inNews ? '../' : '') + p.image)
        : null;
      const imgEl = imgSrc
        ? `<div class="blog-card__img"><img src="${imgSrc}" alt="${p.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`
        : `<div class="blog-card__img blog-card__img--${catSlug}" aria-hidden="true"></div>`;
      return `
        <article class="blog-card">
          ${imgEl}
          <div class="blog-card__body">
            <div class="blog-card__meta">${p.dateDisplay} · ${p.readTime}</div>
            <h3>${p.title}</h3>
            <p>${p.excerpt}</p>
            <a href="${href}" class="blog-card__read-more">Read article ${arrow}</a>
          </div>
        </article>`;
    }).join('');
    container.innerHTML = cards;
  }

  // ── Footer articles list ──────────────────────────────────────────────────
  function renderFooterArticles(posts, containers) {
    if (!containers.length) return;
    const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    const prefix = inNews ? '' : 'news/';
    const items = sorted.map(p => {
      const href = `${prefix}post.html?slug=${p.slug}`;
      return `<li><a href="${href}">${p.title.replace(/ —.*$/, '')}</a></li>`;
    }).join('');
    containers.forEach(c => { c.innerHTML = items; });
  }

  // ── Load hours/services from admin-data.json ──────────────────────────────
  fetch(adminDataPath())
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      document.querySelectorAll('[data-cms="hours"]').forEach(el => renderHours(data.hours, el));
      const servicesEl = document.getElementById('cms-services');
      if (servicesEl) renderServices(data.services, servicesEl);
    })
    .catch(() => {});

  // ── Load posts from posts-index.json ─────────────────────────────────────
  fetch(postsIndexPath())
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(posts => {
      const newsGrid = document.getElementById('cms-news-grid');
      if (newsGrid) {
        const limit = newsGrid.dataset.limit ? parseInt(newsGrid.dataset.limit) : null;
        renderNews(posts, newsGrid, limit);
      }
      const footerLists = document.querySelectorAll('[data-cms="footer-articles"] ul');
      renderFooterArticles(posts, [...footerLists]);
    })
    .catch(() => {});
}());
