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
  // Chapter metadata — editorial photographic panels shown before the three
  // primary service categories. Kept here (rather than admin-data.json) so
  // the admin surface stays focused on prices; aesthetic copy is owned by
  // the design. Any service category not in this map renders as a plain
  // heading + price list (e.g. "Treatments & Extensions").
  const CHAPTER_META = {
    cutting: {
      numeral: 'I',
      side: 'left',
      img: 'Images/services/cutting-hero.jpg',
      alt: 'Precision haircut at Touché Hairdressing Caterham',
      title: 'Cutting <em>&amp; Styling</em>',
      lead: 'Precision cuts, signature blow-dries &amp; classic gents&rsquo; grooming — tailored to your hair, your face, your life.'
    },
    colouring: {
      numeral: 'II',
      side: 'right',
      img: 'Images/services/colour-hero.jpg',
      alt: 'Hair colour application at Touché Hairdressing Caterham',
      title: 'Colour <em>&amp; Light</em>',
      lead: 'From subtle regrowth to hand-painted balayage — expert colour work that enhances, never compromises.'
    },
    smoothing: {
      numeral: 'III',
      side: 'left',
      img: 'Images/services/smoothing-hero.jpg',
      alt: 'Smoothing &amp; keratin treatment at Touché Hairdressing Caterham',
      title: 'Smooth <em>&amp; Finished</em>',
      lead: 'The Crown Professional keratin system — up to six months of sleek, frizz-free hair.'
    }
  };

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

      const chapter = CHAPTER_META[cat.id];
      if (chapter) {
        // Category with editorial chapter panel — chapter provides the heading,
        // so the pricing block omits its h2.
        return `
          <figure class="service-chapter service-chapter--${chapter.side}" id="${cat.id}">
            <img class="service-chapter__img" src="${chapter.img}" alt="${chapter.alt}" loading="lazy">
            <div class="service-chapter__scrim" aria-hidden="true"></div>
            <figcaption class="service-chapter__caption">
              <span class="service-chapter__numeral" aria-hidden="true">${chapter.numeral}</span>
              <span class="service-chapter__rule" aria-hidden="true"></span>
              <h2 class="service-chapter__title">${chapter.title}</h2>
              <p class="service-chapter__lead">${chapter.lead}</p>
            </figcaption>
          </figure>
          <div class="pricing-wrap">
            <div class="pricing-category">
              ${items}
            </div>
          </div>`;
      }

      // Category without a chapter (e.g. Treatments & Extensions).
      return `
        <div class="pricing-wrap">
          <div class="pricing-category" id="${cat.id}">
            <h2 class="pricing-category__title">${cat.title}</h2>
            ${items}
          </div>
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
