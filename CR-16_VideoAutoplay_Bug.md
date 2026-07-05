# CR-16 — Video Autoplay + Heavy Video Handling

**Type:** Bug + Infrastructure Gap  
**Priority:** P0 (autoplay) + P0 (storage durability — blocks go-live)  
**Raised:** 2026-06-23  
**Status:** IMPLEMENTED ✅  
**Implemented:** 2026-06-23  

---

## Problem Statement

Videos on product pages and the pricing plan showcase autoplay silently the moment the page/section loads. User expectation: **poster image + play button overlay shown by default; video plays only after explicit click.**

> User quote: "click to play — we opened the page, not the video"

---

## Root Cause

Two separate code paths both have hardcoded `autoPlay`:

### Path A — `FeatureVideo.jsx` (product/AI/FAQ pages)
```jsx
<video autoPlay muted loop playsInline ... />
```
Fires immediately on component mount.

### Path B — `Editable.jsx` → `EditableImage` (introduced in CR-15 fix, Jun 22)
```jsx
isVideo(src)
  ? <video src={src} autoPlay loop muted playsInline className={...} />
  : <img .../>
```
Fires when component renders (plan tab click OR modal open).

---

## Impact Analysis

| Surface | File | Trigger | Autoplay fires at | Affected? |
|---|---|---|---|---|
| 6 Product pages (`sell-serve`, `run-property`, `customers`, `protect-profit`, `see-everything`, `central-inventory`) | `ProductPage.jsx` → `FeatureVideo` | Page load | Immediately | ✅ YES |
| AI page feature sections | `AiPage.jsx` → `FeatureVideo` | Page load / scroll | Immediately | ✅ YES |
| FAQ items with video media | `FaqItem.jsx` → `FeatureVideo` | FAQ accordion expand | On expand | ✅ YES |
| Pricing page plan showcase (inline, not modal) | `PlanShowcase.jsx` → `EditableImage` | Plan tab click | On tab switch | ✅ YES |
| Pricing "Quick Overview" modal | `FeatureDemoModal.jsx` → `EditableImage` | Modal open | On modal open | ✅ YES |

**Total affected surfaces: 5**  
**Total affected files: 4** (`FeatureVideo.jsx`, `Editable.jsx`, `PlanShowcase.jsx`, `FeatureDemoModal.jsx`)

Currently only `sell-serve`, `plan.starter`, `plan.growth` have real videos uploaded. The other surfaces show "coming soon" today but will hit the same bug as soon as videos are uploaded.

---

## Implementation Plan

### Fix 1 — `FeatureVideo.jsx` (Path A)

**File:** `/app/frontend/src/components/site/FeatureVideo.jsx`  
**Before:** `<video autoPlay muted loop playsInline>` on mount  
**After:** Poster + play button → click → video with controls

**State:** `const [playing, setPlaying] = useState(false)`  
**Import change:** add `Play` to lucide-react imports

```jsx
// Not playing — show poster + overlay
<div className="absolute inset-0 cursor-pointer flex items-center justify-center"
     onClick={() => setPlaying(true)}>
  {poster && <img src={poster} className="absolute inset-0 w-full h-full object-cover" />}
  <div className="absolute inset-0 bg-black/30" />
  <div className="relative w-16 h-16 rounded-full bg-white/90 flex items-center justify-center
                  shadow-xl hover:scale-110 transition-transform">
    <Play className="w-7 h-7 text-brand-green fill-brand-green ml-1" />
  </div>
</div>

// Playing — autoPlay is fine here (user triggered it)
<video className="w-full h-full object-cover"
       src={src} poster={poster||undefined}
       autoPlay controls playsInline
       onEnded={() => setPlaying(false)} />
```

**Fallback with no poster:** `bg-brand-deep` shows behind the play button (same as "coming soon" look).  
**Affects:** ProductPage (6 pages), AiPage, FaqItem — ~20 lines changed.

---

### Fix 2 — `Editable.jsx` → `EditableImage` (Path B)

**File:** `/app/frontend/src/components/cms/Editable.jsx`  
**Before:** `<video autoPlay loop muted playsInline>` on render  
**After:** First frame thumbnail (via `preload="metadata"`) + play overlay → click → controls

**Key technique — `preload="metadata"`:** Browser downloads only the video header + first frame (~few KB). First frame renders as a natural thumbnail with zero extra assets. No separate poster image needed.

**State:** `const [vidPlaying, setVidPlaying] = useState(false)` inside `EditableImage`

```jsx
isVideo(src) && !vidPlaying → (
  <div className="relative cursor-pointer group" onClick={() => setVidPlaying(true)}>
    <video src={src} preload="metadata" muted className={...} />
    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center
                      shadow-lg group-hover:scale-110 transition-transform">
        <Play className="w-5 h-5 text-brand-green fill-brand-green ml-0.5" />
      </div>
    </div>
  </div>
)

isVideo(src) && vidPlaying → (
  <video src={src} autoPlay controls playsInline
         onEnded={() => setVidPlaying(false)} className={...} />
)

!isVideo(src) → <img .../>   // unchanged
```

**CMS edit mode (pencil button):** Unaffected — wraps around the entire media element as before.  
**Affects:** PlanShowcase (inline pricing), FeatureDemoModal — ~25 lines changed.

---

## Files to Change

| File | Change |
|---|---|
| `/app/frontend/src/components/site/FeatureVideo.jsx` | Remove autoPlay loop, add click-to-play state |
| `/app/frontend/src/components/cms/Editable.jsx` | Remove autoPlay from EditableImage video, add click-to-play with preload="metadata" |

**No backend changes. No DB changes. No .env changes. Total: ~45 lines.**

---

## What Does NOT Change

- "Coming soon" placeholder for pages with no video uploaded — stays exactly as is
- YouTube/Vimeo embed path in `FeatureVideo` — `<iframe>` unchanged
- CMS edit mode (pencil buttons, upload flow) — unchanged
- All image (non-video) uses of `EditableImage` (Logo, Hero) — unchanged

---

## Part B — Heavy Video Handling Gaps

### Current architecture (4 layers)

---

#### Layer 1 — Upload (client → backend)

```python
data = await file.read()        # entire file read into RAM at once
if len(data) > CMS_MAX_BYTES:   # CMS_MAX_BYTES = 50MB ceiling in code
    raise 400
cms_storage.save(data, ext)     # write_bytes() — full file written to disk
```

**Gaps:**
- Full file loaded into Python RAM before disk write — no chunked/streaming upload
- 50MB ceiling is in app code, but **nginx/Kubernetes ingress has its own body limit (typically 1–8MB by default)**. A 30MB upload hits a 413 from nginx — never reaches FastAPI. Upload hangs silently or fails without a clean error message.
- No upload progress indicator in the CMS UI

---

#### Layer 2 — Storage

```python
# storage.py
(self.base / name).write_bytes(data)   # /app/backend/uploads/
```

**Gaps:**
- Files live on **local container disk** (`/app/backend/uploads/`)
- **Kubernetes pod disk is ephemeral** — pod restart, redeploy, or node reschedule wipes all uploaded files
- No backup, no redundancy
- S3 backend is stubbed in `storage.py` (`class S3Storage: raise NotImplementedError`) but not implemented
- **This is a go-live blocker** — all videos and CMS images uploaded now will be lost on first production deploy

---

#### Layer 3 — Serve (backend → browser)

```python
data, ct = storage.read_with_type(name)   # path.read_bytes() — full file into RAM
return Response(content=data, media_type=ct)
```

**Gaps:**
- **No HTTP Range request support** — browsers require `Accept-Ranges: bytes` + `HTTP 206 Partial Content` for video seeking and progressive playback. Without it, the browser must download the entire file before the user can scrub the timeline.
- Full file read into Python RAM on every single request — a 8MB video served to 10 concurrent users = 80MB RAM spike
- No `Cache-Control`, `ETag`, or `Last-Modified` headers — browser re-downloads on every page load
- No CDN — every byte transits through the FastAPI process

---

#### Layer 4 — Frontend

```html
<video src="/api/cms/media/38e16642...mp4" autoPlay muted loop>
```

**Gaps (beyond autoplay):**
- Plain `src` attribute — no lazy loading, no preload hint
- No poster-based placeholder while buffering (poster prop exists in `FeatureVideo` but not wired to `<video poster=...>` for the serve path)
- No adaptive bitrate (HLS/DASH) — single file at whatever resolution was uploaded
- No transcoding — file size and quality entirely dependent on what was uploaded

---

### Gap Summary Table

| # | Gap | Layer | Impact | Go-live blocker? |
|---|---|---|---|---|
| G1 | Autoplay on page load | Frontend | Bad UX, unexpected data usage | No |
| G2 | Full file in RAM on upload | Upload | Upload fails for large files at nginx level | Partial |
| G3 | **Ephemeral local disk** | Storage | All uploaded files lost on redeploy | **YES** |
| G4 | No HTTP Range support | Serve | No seeking, no progressive play | No |
| G5 | Full file in RAM on serve | Serve | RAM spike under traffic | No |
| G6 | No cache headers | Serve | Re-downloads on every visit | No |
| G7 | No CDN | Serve | Slow load, high origin traffic | No |
| G8 | No transcoding | Frontend/Upload | Large file sizes, slow load | No |

---

### Fix Plan

#### Fix for G1 (Autoplay) — 2 frontend files, ~35 lines
See Part A above.

#### Fix for G3 (Storage durability — go-live blocker) — S3 integration
Replace `LocalStorage` with `S3Storage` in `storage.py`. The interface (`save()`, `read_with_type()`) already exists — just needs boto3 implementation. Files are served via signed URLs or public S3/CDN URLs directly, bypassing the FastAPI serve endpoint entirely. **Resolves G3, G4, G5, G6, G7 in one shot.**

Details needed from owner — see Part C below.

#### Fix for G2 (nginx body size limit) — 1 config line
Set `client_max_body_size` in nginx/ingress config to match the 50MB app limit. Without this, uploads > ~1MB are rejected before reaching FastAPI.

#### Fix for G4 (Range requests) — only needed if staying on local storage
If S3 is implemented, this is moot — S3 natively supports range requests. Only implement if local storage is kept.

---

## Part C — S3 Integration Requirements

**Details needed from owner before implementation can begin:**

### Option A — AWS S3 (standard)
Required:
- AWS Access Key ID
- AWS Secret Access Key
- S3 Bucket name (e.g. `mygenie-cms-media`)
- AWS Region (e.g. `ap-south-1` for Mumbai)
- Bucket access: **public read** (files served directly from S3 URL) OR **private + signed URLs** (more secure)
- CloudFront CDN in front of bucket? (recommended — faster video delivery in India)

### Option B — Cloudflare R2 (recommended if already on Cloudflare)
R2 is S3-compatible with zero egress fees — ideal for video. Since the site already uses Cloudflare for DNS/CDN:
- R2 Account ID
- R2 Access Key ID + Secret (generated in Cloudflare dashboard → R2 → Manage R2 API tokens)
- Bucket name
- Custom domain for bucket? (e.g. `media.mygenie.online`) — enables CDN delivery via Cloudflare

### Option C — DigitalOcean Spaces / Backblaze B2
S3-compatible. Provide equivalent credentials + endpoint URL.

---

**Recommendation:** Cloudflare R2 — zero egress, already on Cloudflare, S3-compatible (works with existing `S3Storage` stub interface), fastest for Indian traffic via Cloudflare's edge network.

---

## Implementation Artifact — CR-16 (Autoplay Fix)

**Date:** 2026-06-23 | **Files:** 2 | **Lines:** ~50 | **Backend/DB:** None

### File 1 — `FeatureVideo.jsx`
- Added `useState(playing)` + `Play` import
- `playing=false` → poster img + dark overlay + white circle Play button (click sets `playing=true`)
- `playing=true` → `<video autoPlay controls playsInline onEnded={() => setPlaying(false)}>`
- Coming-soon placeholder and iframe embed path: **unchanged**
- testids: `feature-video-play`, `feature-video-player`

### File 2 — `Editable.jsx` → `EditableImage`
- Added `useState(vidPlaying)` + `Play` import
- `isVideo && !vidPlaying` → `<video preload="metadata" muted>` (first frame thumbnail, ~few KB) + overlay + Play button
- `isVideo && vidPlaying` → `<video autoPlay controls playsInline onEnded={() => setVidPlaying(false)}>`
- `!isVideo` → `<img>` **unchanged**
- CMS pencil/edit wrapper: **unchanged**, wraps `mediaEl` instead of `img`
- testids: `editable-video-play`, `editable-video-player`

### Behaviour matrix

| State | Product pages (`FeatureVideo`) | Pricing showcase/modal (`EditableImage`) |
|---|---|---|
| No video | "Coming soon" placeholder | Fallback image |
| Page loads with video | Poster + Play button — **no autoplay** | First frame + Play button — **no autoplay** |
| User clicks Play | Native video controls, plays | Native video controls, plays |
| Video ends | Returns to poster + Play button | Returns to first frame + Play button |
