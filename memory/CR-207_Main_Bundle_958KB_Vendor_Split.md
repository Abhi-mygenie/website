# CR-207 — Main Bundle 958 KB — Vendor Chunk Too Large → 2.0s JS Execution

**Type:** Performance / Bundle Optimization
**Date Raised:** 2026-09-04
**Status:** OPEN — Requires bundle analysis first
**Priority:** P1
**Batch:** AD — Lighthouse Code-Level Gaps
**Source:** Lighthouse preview audit — "Reduce JavaScript execution time — 2.0s", "Minimize main-thread work — 3.8s"
**Effort:** Medium (requires bundle analysis + craco webpack config)

---

## Problem

The main JS bundle (`main.b6403ff7.js`) is **958 KB**. This is the file that must fully download and parse before the app can render. On a Moto G Power with Slow 4G (Lighthouse mobile simulation), parsing 958 KB of JS takes ~1.5s of CPU time.

```
Build output:
main.b6403ff7.js      958 KB  ← downloaded on every page, every visit
238.2e926f3f.chunk    276 KB  ↗ large vendor chunks
516.9beb9b75.chunk    202 KB  ↗
965.6644702d.chunk    160 KB  ↗
717.24c1159d.chunk    126 KB  ↗
513.39a56389.chunk    118 KB  ↗
```

A well-optimised React SPA with CRACO should have a main bundle under 200–300 KB. The 958 KB means vendor libraries (Radix UI, shadcn components, lucide-react, framer-motion, etc.) are being bundled into the main chunk instead of being split into separate cacheable vendor chunks.

**Root cause to confirm:** CRA/CRACO's default webpack config does not split vendor libraries into separate chunks. All `node_modules` code ends up in the main bundle alongside the app code.

---

## Pre-requisite: Bundle Analyser Run

Before implementing, run `source-map-explorer` to identify exactly which libraries are in the 958 KB main bundle:

```bash
cd /app/frontend
npx source-map-explorer build/static/js/main.*.js --html /tmp/bundle-report.html
# Open /tmp/bundle-report.html to see exact breakdown
```

Or use webpack-bundle-analyzer via craco:
```bash
GENERATE_SOURCEMAP=true yarn build
npx webpack-bundle-analyzer build/static/js/*.js.map
```

---

## Expected Fix

Add a custom webpack `splitChunks` config to `craco.config.js`:

```js
// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // React + ReactDOM into their own chunk (rarely changes)
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
            name: 'vendor-react',
            priority: 40,
            chunks: 'all',
          },
          // Radix UI + shadcn components (large, stable)
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'vendor-radix',
            priority: 30,
            chunks: 'all',
          },
          // All other node_modules
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor-misc',
            priority: 20,
            chunks: 'all',
            minSize: 30000,
          },
        },
      };
      return webpackConfig;
    },
  },
};
```

**Note:** Do NOT implement blindly — wait for bundle analyser results to confirm what's actually in the 958 KB chunk before deciding split strategy.

---

## Expected Impact (after analysis + implementation)

| Metric | Before | After (estimated) |
|---|---|---|
| Main bundle size | 958 KB | ~250–350 KB |
| JS execution time | 2.0s | ~1.2s |
| TBT | 852ms | ~550ms |
| TTI | 5.0s | ~4.1s |
| Performance score (preview) | 76 | ~84–86 |

---

## Implementation Steps

1. Run bundle analyser (see above) — identify top 5 libraries by size in main bundle
2. Update `craco.config.js` with targeted splitChunks config
3. `yarn build` and verify:
   - main bundle < 400 KB
   - New vendor chunks appear (vendor-react, vendor-radix, etc.)
   - All 63 routes still prerender correctly
4. Measure Lighthouse before/after on preview URL

---

## Validation

```bash
# After rebuild
ls -lh /app/frontend/build/static/js/main.*.js
# Expected: main bundle < 400 KB

ls -lh /app/frontend/build/static/js/vendor-*.js
# Expected: new vendor chunks present

find /app/frontend/build -name "index.html" | wc -l
# Expected: 63 (prerender unchanged)
```

---

## Risk

**Low-medium.** `splitChunks` is a webpack config change — it does not change any source code. The risk is a chunk loading order issue (vendor chunk not loaded before it's needed). This is solved by the `chunks: 'all'` setting which ensures proper dependency ordering.

*CR-207 registered 2026-09-04. Source: Lighthouse mobile audit, bundle size analysis.*
