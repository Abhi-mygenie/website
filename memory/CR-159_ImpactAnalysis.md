# CR-159 — Impact Analysis
# /customers: Sticky Demo CTA + Mid-Page Card

**Date:** 2026-08-26

---

## 1. Code Investigation

### Current /customers conversion paths
`SuccessStories.jsx` L97–111:
```jsx
{/* CTA — bottom of page only */}
<section className="pb-24" data-testid="stories-cta">
  ...
  <a href="/#demo" ...>Book a Free Demo</a>
  <Link to="/roi" ...>Calculate Your Savings</Link>
</section>
```

Only ONE conversion touchpoint — at the absolute bottom of the page, after all stories have been scrolled through.

### Story grid structure
`SuccessStories.jsx` L70–91:
```jsx
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {shown.map((t, i) => (
    <Reveal key={t.client} delay={(i % 3) * 0.06}>
      <div ...>{/* story card */}</div>
    </Reveal>
  ))}
</div>
```

- Stories are filtered by sector (`filter` state)
- Grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Number of stories: `shown.length` — depends on STORIES data + active filter

### StickyMobileCta already exists
`StickyMobileCta.jsx` is already used on homepage and sector pages via `<StickyMobileCta onDemo={...} />`. It detects the hero leaving viewport and shows a sticky bar. It already handles consent banner overlap and formActive state.

**Key:** `StickyMobileCta` looks for `data-testid="stories-hero"` — checking:
```js
document.querySelector('[data-testid="hero"]') ||
document.querySelector('[data-testid="vsp-hero"]') ||
document.querySelector('[data-testid="sector-hero"]') ||
document.querySelector('[data-testid="product-hero"]');
```
`data-testid="stories-hero"` is NOT in this list — `StickyMobileCta` won't auto-trigger on `/customers` because it can't find the hero sentinel. **Fix needed in StickyMobileCta OR a manual scroll listener in SuccessStories.jsx.**

---

## 2. Fix A — Use existing StickyMobileCta (mobile, after hero exits)

**Option 1:** Add `"stories-hero"` to the sentinel list in `StickyMobileCta.jsx`:
```js
document.querySelector('[data-testid="stories-hero"]') || ...
```

Then add `<StickyMobileCta />` to `SuccessStories.jsx`.

**Option 2:** Pass a custom `onDemo` to StickyMobileCta in SuccessStories:
```jsx
<StickyMobileCta onDemo={() => { window.location.href = "/#demo"; }} />
```
But the sentinel still needs to be found.

**Recommended:** Option 1 — add `"stories-hero"` to the sentinel array in StickyMobileCta.jsx (1 line), then use the component on SuccessStories.

---

## 3. Fix B — Mid-Page CTA Card in Story Grid

Insert a CTA card every 6 stories in the grid. The card occupies one grid slot.

```jsx
{shown.map((t, i) => (
  <React.Fragment key={t.client}>
    <Reveal delay={(i % 3) * 0.06}>
      {/* existing story card */}
    </Reveal>
    {/* CTA card after every 6th story, on desktop (3-col grid = after 2 rows) */}
    {(i + 1) % 6 === 0 && i < shown.length - 1 && (
      <div className="rounded-3xl bg-brand-green text-white p-8 flex flex-col justify-between
                      sm:col-span-2 lg:col-span-1">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-white/70 mb-3">
            Join them
          </p>
          <h3 className="font-display text-2xl font-bold">Your story could be next.</h3>
          <p className="text-white/80 mt-2 leading-relaxed text-sm">
            Book a free walkthrough — tailored to your outlet type.
          </p>
        </div>
        <a href="/#demo" data-testid="stories-mid-cta"
           className="mt-6 inline-flex items-center gap-2 bg-white text-brand-green 
                      rounded-full px-5 py-3 font-semibold text-sm hover:bg-brand-sand transition-all">
          Book a Free Demo <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    )}
  </React.Fragment>
))}
```

**Consideration on filtered views:** When a filter is active (e.g. "QSR"), `shown` may have fewer than 6 stories — the mid-page card wouldn't appear. This is acceptable — filtered views are shorter and the bottom CTA is still reachable.

---

## 4. Risk Assessment

| Risk | Likelihood | Notes |
|---|---|---|
| CTA card breaks grid layout | Low | `sm:col-span-2 lg:col-span-1` handles 2-col and 3-col grids |
| StickyMobileCta sentinel not found | None if Option 1 applied | 1-line fix in StickyMobileCta |
| Mid-page CTA looks out of place visually | Low | Green card in white grid is distinct, not jarring — matches brand palette |
| Mobile: mid-page card breaks 1-col layout | None | No col-span on mobile — card takes full width, natural in flow |

---

## 5. Files Changed

| File | Change | Lines |
|---|---|---|
| `SuccessStories.jsx` | Add `<StickyMobileCta />` at bottom | +1 import, +2 JSX |
| `SuccessStories.jsx` | Insert mid-page CTA card in `.map()` loop | +15 lines |
| `StickyMobileCta.jsx` | Add `'[data-testid="stories-hero"]'` to sentinel array | L35: +1 entry |

---

## 6. Cross-Impact

- **CR-160 (Reveal):** Story cards are wrapped in `<Reveal>` — after CR-160 fix, they start visible. The mid-page CTA card should NOT be wrapped in Reveal (it needs to be visible immediately).
- **CR-161 (submit text):** No DemoForm on this page — CR-161 doesn't affect /customers.

*Impact analysis written 2026-08-26.*
