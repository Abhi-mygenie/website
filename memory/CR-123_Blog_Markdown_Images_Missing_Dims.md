# CR-123 — Blog Post Markdown Images Missing width/height (Social Share Icons)

**Type:** Performance Fix / CLS Defence
**Date Raised:** 2026-08-23
**Raised By:** Post-rollout prerendered page audit
**Status:** OPEN
**Priority:** LOW
**Effort:** ~15 min
**Improves:** Lighthouse "Image elements do not have explicit width and height" audit on blog post pages
**Scope:** `src/data/blogPosts.json` — body content of all 21 blog posts
**Related:** CR-82 (img width/height for JSX components), CR-120 (EditableImage width/height)

---

## 1. Problem Statement

All 21 prerendered blog post pages contain 3 img tags without explicit `width` and `height` attributes:

```html
<img class="rounded-2xl my-6 w-full" loading="lazy" alt="" src="https://www.mygenie.online/asset/images/in1.svg">
<img class="rounded-2xl my-6 w-full" loading="lazy" alt="" src="https://www.mygenie.online/asset/images/facebook1.svg">
<img class="rounded-2xl my-6 w-full" loading="lazy" alt="" src="https://www.mygenie.online/asset/images/instagram1.svg">
```

These are social share icons rendered from the Markdown body of each blog post via `react-markdown`. They appear at the end of every article in the section "Share with:" and link to social platforms.

**Why CR-82/120 didn't catch these:** Those CRs fixed JSX component `<img>` tags. These images come from raw Markdown strings in `blogPosts.json` — rendered by `react-markdown` → HTML `<img>` with no width/height attributes.

---

## 2. Impact

- **CLS risk:** Low. These images appear at the bottom of blog posts (user has scrolled past the fold). However, SVGs from an external domain (`www.mygenie.online`) could cause layout shift if they load slowly.
- **Lighthouse audit:** "Image elements do not have explicit width and height" will fire on every blog post page until fixed.
- **Actual images:** 3 SVG social icons (LinkedIn, Facebook, Instagram) from the production domain. Each is small (~1-3 KB).

---

## 3. Fix

The images come from the Markdown body in `blogPosts.json`. Each post ends with:
```markdown
Share with:

[![](https://www.mygenie.online/asset/images/in1.svg)](#)
[![](https://www.mygenie.online/asset/images/facebook1.svg)](#)
[![](https://www.mygenie.online/asset/images/instagram1.svg)](#)
```

**Option A — Remove social share icons from blog content (simplest)**

The social share icons are low-value and the external domain (`www.mygenie.online`) means they won't be served in the preview environment anyway. Remove them from all 21 blog post body strings in `blogPosts.json`.

**Option B — Configure react-markdown to add width/height**

Pass a custom `img` renderer to `react-markdown` in `Markdown.jsx` that adds `width` and `height` attributes. This handles all Markdown images globally, not just these social icons.

**Recommended: Option B** — more future-proof. One change to `Markdown.jsx`:

```jsx
// Markdown.jsx — add img component override
img: ({ node, ...p }) => <img {...p} width={p.width || 400} height={p.height || 300} />,
```

This adds fallback dimensions for any Markdown-rendered image without explicit dimensions, clearing the Lighthouse audit for all blog posts.

---

## 4. Files Changed

### Option A
| File | Change |
|------|--------|
| `src/data/blogPosts.json` | Remove social share icon markdown from end of all 21 posts |

### Option B (recommended)
| File | Change |
|------|--------|
| `src/components/site/Markdown.jsx` | Add `img` renderer with fallback width/height |

---

## 5. Definition of Done

- [ ] `yarn build` + prerender
- [ ] All 21 blog post prerendered pages have 0 img tags without width/height
- [ ] Lighthouse "Image elements do not have explicit width and height" passes on blog posts
- [ ] No visual regression on blog post pages
- [ ] Testing agent confirms

---

*CR-123 registered 2026-08-23. Source: post-rollout audit of prerendered blog post pages.*
