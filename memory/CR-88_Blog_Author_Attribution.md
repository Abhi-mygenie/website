# CR-88 — Add Named Authors to All 21 Blog Posts

**Type:** Content Quality / E-E-A-T  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** HIGH  
**Plan ID:** H10  
**Effort:** 2 hrs  
**Improves:** E-E-A-T · SEO · Blog Authority  
**Scope:** `frontend/src/data/blogPosts.json`, `frontend/src/pages/BlogPost.jsx`, `frontend/src/pages/Blog.jsx`  
**Related:** CR-90 (testimonial author names)

---

## 1. Problem Statement

All 21 blog posts in `blogPosts.json` have no `author` field. The `blogPosts.json` schema only contains `slug, title, heading, description, date, image, body`. All posts are authorless.

Google’s E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) guidelines penalise authorless content — particularly in YMYL-adjacent categories like business software. The existing `BlogPosting` JSON-LD schema also has no `author` object, reducing structured data quality.

The blog has also had no new posts since May 2025 (15-month gap) — adding author attribution to existing posts at least signals human curation.

---

## 2. Exact Changes Required

### Change 1 — `frontend/src/data/blogPosts.json`
Add `author` field to all 21 post objects:
```json
{
  "slug": "...",
  "title": "...",
  "author": "MyGenie Editorial Team",
  "authorTitle": "Hospitality Tech Editors",
  ...
}
```
Alternatively, attribute specific posts to real team members if names are available. Use "MyGenie Editorial Team" as the default if individual names are not provided by the owner.

### Change 2 — `frontend/src/pages/BlogPost.jsx`
Render author byline below post title:
```jsx
{post.author && (
  <div className="flex items-center gap-2 mt-3 text-sm text-brand-muted">
    <span className="font-semibold text-brand-ink">{post.author}</span>
    {post.authorTitle && <span>· {post.authorTitle}</span>}
    {post.date && <span>· {fmtDate(post.date)}</span>}
  </div>
)}
```

### Change 3 — Update BlogPosting JSON-LD in `BlogPost.jsx`
Add `author` object to the schema:
```js
const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.heading || post.title,
  datePublished: post.date,
  author: {
    "@type": "Person",   // or "Organization" if using team name
    name: post.author || "MyGenie Editorial Team",
  },
  publisher: {
    "@type": "Organization",
    name: "MyGenie POS",
  },
  // ... existing fields
};
```

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/data/blogPosts.json` | Add `author` + `authorTitle` to all 21 posts |
| `frontend/src/pages/BlogPost.jsx` | Render author byline; update BlogPosting JSON-LD |

---

## 4. Definition of Done

- [ ] All 21 blog posts have `author` field in blogPosts.json
- [ ] Author byline renders below post title in BlogPost.jsx
- [ ] BlogPosting JSON-LD includes `author` object
- [ ] Google Rich Results Test: valid BlogPosting schema with author
- [ ] No visual regression on /blog listing page

---

*CR-88 registered 2026-08-20. Source: SEO & QS Audit · Plan ID H10.*
