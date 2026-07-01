# CR-17 — S3 Media Storage — COMPLETED

**Status:** ✅ SHIPPED — 2026-06-24  
**Implemented by:** Agent session 2026-06-24  

---

## What Was Built

### Architecture (live)
```
UPLOAD PATH (browser → S3 presigned URL — nginx bypassed entirely)
  Browser → POST /api/cms/media/presign  → FastAPI returns presigned PUT URL (15 min)
  Browser → PUT <presigned-url>          → File goes directly to S3 (no FastAPI/nginx involved)
  Browser → POST /api/cms/media/confirm → FastAPI saves URL record to MongoDB

SERVE PATH
  Browser → GET /api/cms/media/{name}   → FastAPI 302 redirect → S3 public URL
  Browser fetches directly from S3 (range requests, caching — all native S3)

LOCAL FALLBACK (STORAGE_BACKEND=local)
  Upload: multipart POST → /api/cms/media → FastAPI → local disk
  Serve:  FastAPI reads file from disk → returns bytes
```

---

## Files Changed

| File | What changed |
|---|---|
| `/app/backend/storage.py` | `S3Storage` stub replaced with full boto3 implementation |
| `/app/backend/server.py` | Added `/cms/media/presign` + `/cms/media/confirm` endpoints; serve endpoint does S3 302 redirect; upload endpoint streams via `upload_fileobj` (fallback for local) |
| `/app/frontend/src/lib/cms/CmsProvider.jsx` | `uploadMedia()` updated — presigned URL flow first, multipart POST fallback for local |
| `/app/frontend/src/components/cms/Editable.jsx` | PencilButton position fixed (top-2 right-2, was -top-2.5 which got clipped by overflow-hidden); upload spec hint added |
| `/app/frontend/src/components/pricing/FeatureDemoModal.jsx` | Button renamed "Quick Overview" → "Overview" |
| `/app/backend/migrate_to_s3.py` | One-time migration script (already run — 16/16 files migrated) |
| `/app/backend/.env` | `STORAGE_BACKEND=local` → `STORAGE_BACKEND=s3` |

---

## S3 Bucket State (mygenie-prod, ap-south-1)

| Setting | Status |
|---|---|
| Public-read bucket policy | ✅ Set |
| Block Public Access | ✅ OFF |
| CORS — AllowedMethods | ✅ GET, HEAD, PUT |
| CORS — AllowedOrigins | ✅ * |
| CORS — ExposeHeaders | ✅ ETag, Content-Range, Accept-Ranges |
| Files migrated | ✅ 16/16 (3 MP4, 5 PNG, 8 PDF) |

---

## API Endpoints (live)

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/cms/media/presign` | admin JWT | Get S3 presigned PUT URL (15 min). Body: `{ext: "mp4"}`. Returns `{presign_url, name, url}` or `{presign_url: null}` for local |
| `POST /api/cms/media/confirm` | admin JWT | Save MongoDB record after direct S3 upload. Body: `{name, filename, size}` |
| `POST /api/cms/media` | admin JWT | Multipart upload (local storage only / fallback) |
| `GET /api/cms/media/{name}` | public | 302 redirect to S3 public URL (S3 mode) or serve bytes (local mode) |

---

## Smoke Test Commands

```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
TOKEN=$(curl -s -X POST "$API_URL/api/cms/login" -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 1. Serve redirect
curl -sv "$API_URL/api/cms/media/37ed9399996e424e8c7c477bb800b8db.mp4" 2>&1 | grep -E "< HTTP|< location"
# Expect: HTTP/2 302, location: https://mygenie-prod.s3.ap-south-1.amazonaws.com/...

# 2. S3 range request (video seeking)
curl -sI -H "Range: bytes=0-1023" "https://mygenie-prod.s3.ap-south-1.amazonaws.com/37ed9399996e424e8c7c477bb800b8db.mp4" \
  | grep -E "HTTP|Accept-Ranges|Content-Range"
# Expect: HTTP/1.1 206 Partial Content, Accept-Ranges: bytes

# 3. Presign endpoint
curl -s -X POST "$API_URL/api/cms/media/presign" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"ext":"mp4"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('presign_url ok:', bool(d.get('presign_url')))"
# Expect: presign_url ok: True
```

---

## What NOT to Do

- Do **not** delete files from `/app/backend/uploads/` — kept as local backup
- Do **not** set `STORAGE_BACKEND=local` unless intentionally reverting to local disk
- Do **not** add CloudFront yet — future optional step. When ready: update `S3Storage.public_url()` to return `https://media.mygenie.online/{name}` instead of S3 URL
- `USER_DOCS_DIR` / `USER_DOCS_S3_PREFIX` env vars are placeholders — do not implement now

---

## CR Registry

| CR | Status |
|---|---|
| CR-14 Anti-Junk Fix | ✅ SHIPPED |
| CR-15 Zapier Offline Conversions | 📋 Planned — blocked on owner pre-requisites |
| CR-16 Video Autoplay Fix | ✅ SHIPPED (2026-06-23) |
| CR-17 S3 Media Storage | ✅ **SHIPPED (2026-06-24)** |
| CR-18 Standard Fields Remap | 🔴 Next task |
| CR-19 Lead Funnel Dashboard | ⏸ Parked — user validation pending |
