# CR-17 — S3 Media Storage + Video Serving Infrastructure

**Type:** Infrastructure / Go-Live Blocker  
**Priority:** P0 (G3 storage durability) + P1 (G2, G4, G5, G6, G7)  
**Raised:** 2026-06-23  
**Depends on:** Owner filling AWS env vars in `backend/.env`  
**Status:** ✅ SHIPPED — 2026-06-24 — see `/app/CR-17_HANDOVER_NEXT_AGENT.md` for full completion notes  
**Handover doc:** `/app/CR-17_HANDOVER_NEXT_AGENT.md` — complete with blocker checks + copy-paste code  

---

## Scope

Fixes all infrastructure gaps identified in CR-16 Part B:

| Gap | Description | Fixed by |
|---|---|---|
| G2 | nginx proxy body size rejects large uploads | Section 4 |
| G3 | Local disk is ephemeral — files lost on redeploy | Section 1 + 2 |
| G4 | No HTTP Range support — video can't seek | Section 3 (S3 handles natively) |
| G5 | Full file read into RAM on every serve request | Section 3 (S3 redirect bypasses FastAPI) |
| G6 | No cache headers | Section 3 (S3 sets Cache-Control) |
| G7 | No CDN | Section 3 + optional CloudFront note |
| G8 | No transcoding | Out of scope — documented below |

---

## Architecture After This CR

```
UPLOAD PATH (current)
  Browser → FastAPI → RAM (full file) → local disk

UPLOAD PATH (after)
  Browser → FastAPI → stream chunks → S3 bucket
  (file never fully in RAM; FastAPI is just a pass-through pipe)

SERVE PATH (current)
  Browser → FastAPI → read_bytes() into RAM → Response

SERVE PATH (after)
  Browser → GET /api/cms/media/{name} → FastAPI → 302 redirect → S3 public URL
  Browser fetches directly from S3 (range requests, caching, CDN — all handled by S3/CloudFront natively)
```

---

## Section 1 — `storage.py` — Implement S3Storage

**File:** `/app/backend/storage.py`  
**boto3 status:** Already in `requirements.txt` (`boto3>=1.34.129`) — no new dependency.

### Current stub (raises NotImplementedError):
```python
class S3Storage:
    def __init__(self, *args, **kwargs):
        raise NotImplementedError("S3 backend not wired yet")
```

### Implementation:

```python
import boto3
from botocore.exceptions import ClientError

class S3Storage:
    def __init__(self):
        self.bucket = os.environ.get("AWS_S3_BUCKET_NAME")
        self.region = os.environ.get("AWS_S3_REGION", "ap-south-1")
        self.client = boto3.client(
            "s3",
            region_name=self.region,
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        )

    def save(self, data: bytes, ext: str) -> str:
        name = f"{uuid.uuid4().hex}.{ext.lower()}"
        ct = MIME.get(ext, "application/octet-stream")
        self.client.put_object(
            Bucket=self.bucket,
            Key=name,
            Body=data,
            ContentType=ct,
            CacheControl="public, max-age=31536000, immutable",
        )
        return f"{PUBLIC_PREFIX}/{name}"    # still returns /api/cms/media/{name}
                                            # serve endpoint does the S3 redirect

    def public_url(self, name: str) -> str:
        return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{name}"

    def read_with_type(self, name: str):
        # Only called for local storage; S3 path uses redirect — not this method
        raise NotImplementedError("S3 backend uses redirect — call public_url()")
```

**Key design decisions:**
- `save()` still returns `/api/cms/media/{name}` — all existing CMS content keys stay valid, no DB migration needed
- `CacheControl="public, max-age=31536000, immutable"` — browsers and CloudFront cache forever (files are UUID-named, content-addressed — never mutate in place)
- Bucket must have **public read** enabled (see S3 bucket policy in Section 5)

---

## Section 2 — `server.py` — Streaming upload to S3

**File:** `/app/backend/server.py`  
**Problem:** `data = await file.read()` loads entire file into RAM before saving.

### Current upload endpoint:
```python
@api_router.post("/cms/media")
async def cms_media_upload(file: UploadFile = File(...), admin: str = Depends(...)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "").lower()
    if ext not in CMS_ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    data = await file.read()                          # ← ENTIRE FILE IN RAM
    if len(data) > CMS_MAX_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")
    url = cms_storage.get_storage().save(data, ext)
    ...
```

### After (streaming path for S3):
```python
import io, os

@api_router.post("/cms/media")
async def cms_media_upload(file: UploadFile = File(...), admin: str = Depends(...)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "").lower()
    if ext not in CMS_ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    backend = os.environ.get("STORAGE_BACKEND", "local").lower()

    if backend == "s3":
        # Stream to S3 without loading full file into RAM
        import uuid as _uuid
        from storage import MIME, PUBLIC_PREFIX, get_storage
        name = f"{_uuid.uuid4().hex}.{ext}"
        ct = MIME.get(ext, "application/octet-stream")
        storage = get_storage()

        # Use S3 multipart upload via upload_fileobj — streams in 8MB chunks
        storage.client.upload_fileobj(
            file.file,                          # UploadFile.file is a SpooledTemporaryFile
            storage.bucket,
            name,
            ExtraArgs={
                "ContentType": ct,
                "CacheControl": "public, max-age=31536000, immutable",
            },
        )
        url = f"{PUBLIC_PREFIX}/{name}"

    else:
        # Local path — keep current behavior
        data = await file.read()
        if len(data) > CMS_MAX_BYTES:
            raise HTTPException(status_code=400, detail="File too large (max 50MB)")
        url = cms_storage.get_storage().save(data, ext)

    await db.cms_media.insert_one({
        "id": str(uuid.uuid4()), "url": url, "filename": file.filename,
        "size": 0,  # size unknown in streaming path; set 0 for S3
        "uploaded_by": admin,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"url": url}
```

**Why `upload_fileobj` works for large files:**
- boto3 `upload_fileobj` internally uses S3 Multipart Upload for files > 8MB — splits into chunks, uploads in parallel, never fully in memory
- FastAPI's `UploadFile.file` is a `SpooledTemporaryFile` — passes directly to boto3 without loading into Python

---

## Section 3 — `server.py` — Serve endpoint → S3 redirect

**File:** `/app/backend/server.py`

### Current serve endpoint:
```python
@api_router.get("/cms/media/{name}")
async def cms_media_serve(name: str):
    try:
        data, ct = cms_storage.get_storage().read_with_type(name)  # FULL FILE IN RAM
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(content=data, media_type=ct)
```

### After:
```python
from fastapi.responses import RedirectResponse
import os

@api_router.get("/cms/media/{name}")
async def cms_media_serve(name: str):
    backend = os.environ.get("STORAGE_BACKEND", "local").lower()

    if backend == "s3":
        storage = cms_storage.get_storage()
        # 302 redirect to S3 public URL
        # Browser fetches directly from S3 — range requests, caching, CDN all work natively
        s3_url = storage.public_url(name)
        return RedirectResponse(url=s3_url, status_code=302)

    else:
        # Local path — keep existing behavior
        try:
            data, ct = cms_storage.get_storage().read_with_type(name)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Not found")
        return Response(content=data, media_type=ct)
```

**What the 302 redirect gives us (for free, via S3):**
- ✅ HTTP Range requests — video seeking works
- ✅ `Cache-Control: public, max-age=31536000` — browser caches forever
- ✅ ETag + Last-Modified — conditional GET support
- ✅ No RAM spike on FastAPI for serving
- ✅ S3 handles concurrent requests natively
- ✅ CloudFront can sit in front of the bucket with zero code change

---

## Section 4 — nginx body size limit (G2)

**Problem:** nginx proxy rejects uploads > ~1MB with HTTP 413 before the request reaches FastAPI.

**Location:** The Kubernetes ingress controller (nginx) — not the local nginx config.  
**Fix:** Add annotation to Kubernetes ingress manifest:

```yaml
annotations:
  nginx.ingress.kubernetes.io/proxy-body-size: "52m"
```

**For this preview/local environment** — the nginx.conf for the app proxy can be patched:

File to check: `/etc/nginx/sites-enabled/default` or platform ingress config.  
Add inside the `server {}` or `location /api` block:
```nginx
client_max_body_size 52m;
proxy_read_timeout 120s;
proxy_send_timeout 120s;
```

**Owner action:** Confirm with hosting provider (EC2 + nginx, or ECS, or other) how the ingress is managed so this line can be added.

---

## Section 5 — AWS S3 Bucket Setup (owner action)

Before implementation runs, the bucket must be configured correctly.

### Bucket policy (public read — for media assets):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::{BUCKET_NAME}/*"
    }
  ]
}
```

### CORS policy (required for browser video streaming):
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://www.mygenie.online", "https://*.mygenie.online"],
    "ExposeHeaders": ["ETag", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 3000
  }
]
```

**Why CORS is required:** The video `<video src="https://bucket.s3.amazonaws.com/...">` makes a cross-origin request from `mygenie.online` → S3. Without CORS, the browser blocks it.

### Optional — CloudFront CDN (G7):
- Create CloudFront distribution with S3 origin
- Set `media.mygenie.online` CNAME → CloudFront distribution
- Update `S3Storage.public_url()` to return `https://media.mygenie.online/{name}` instead of S3 URL
- CloudFront edge nodes in India: Mumbai, Chennai, Hyderabad — faster delivery for Indian users

---

## Section 6 — Migration script (existing local files → S3)

When `STORAGE_BACKEND` is switched to `s3`, all files currently in `/app/backend/uploads/` need to be copied to S3 before the switch. Otherwise existing CMS content will show broken images/videos (the URLs stay the same `/api/cms/media/{name}` but the redirect will look for them in S3, not local disk).

**Migration script** (`/app/backend/migrate_to_s3.py`):

```python
"""
Run once: python migrate_to_s3.py
Copies all files from /app/backend/uploads/ to S3.
Requires AWS env vars to be set.
"""
import os, boto3
from pathlib import Path
from storage import MIME, get_storage

UPLOAD_DIR = Path(__file__).parent / "uploads"

def migrate():
    s3 = boto3.client(
        "s3",
        region_name=os.environ["AWS_S3_REGION"],
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    bucket = os.environ["AWS_S3_BUCKET_NAME"]
    files = list(UPLOAD_DIR.glob("*"))
    print(f"Migrating {len(files)} files to s3://{bucket}/")
    for f in files:
        ext = f.suffix.lstrip(".").lower()
        ct = MIME.get(ext, "application/octet-stream")
        print(f"  uploading {f.name} ({f.stat().st_size // 1024}KB) ...", end=" ")
        s3.upload_file(
            str(f), bucket, f.name,
            ExtraArgs={"ContentType": ct, "CacheControl": "public, max-age=31536000, immutable"}
        )
        print("done")
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
```

**Run order:**
1. Fill AWS env vars
2. Run `python migrate_to_s3.py`
3. Verify files in S3 console
4. Set `STORAGE_BACKEND=s3` in `.env`
5. Restart backend

---

## Section 7 — G8 Transcoding (out of scope)

**Not included in this CR.** Transcoding (converting uploaded video to web-optimized H.264 720p MP4) requires:
- FFmpeg installed on the server, OR
- AWS MediaConvert / Cloudflare Stream (paid services)
- Async processing pipeline (upload → trigger transcoding job → replace original with optimized version)

This is a significant separate build. For now: **document a recommended upload spec** in the CMS admin UI:
- Max resolution: 1280×720
- Format: MP4, H.264, AAC audio
- Bitrate: ≤ 2Mbps
- Max file size: 20MB

---

## Implementation Order

| Step | Action | File(s) | Blocked on |
|---|---|---|---|
| 1 | Owner fills AWS env vars | `backend/.env` | Owner |
| 2 | Owner creates S3 bucket + sets bucket policy + CORS | AWS console | Owner |
| 3 | Implement `S3Storage` in `storage.py` | `storage.py` | Steps 1+2 |
| 4 | Update upload endpoint (streaming) | `server.py` | Step 3 |
| 5 | Update serve endpoint (redirect) | `server.py` | Step 3 |
| 6 | Run migration script | `migrate_to_s3.py` | Steps 1+2+3 |
| 7 | Change `STORAGE_BACKEND=s3` in `.env` | `backend/.env` | Step 6 |
| 8 | Restart backend, smoke test | supervisor | Step 7 |
| 9 | nginx body size fix | ingress / nginx.conf | Hosting infra access |
| 10 | Optional: CloudFront setup | AWS console | Step 2 |

---

## Files to Change (code)

| File | Lines changed | What |
|---|---|---|
| `/app/backend/storage.py` | ~25 lines | Implement `S3Storage.save()`, `public_url()` |
| `/app/backend/server.py` | ~20 lines | Upload streaming + serve redirect |
| `/app/backend/migrate_to_s3.py` | New file (~40 lines) | One-time migration script |
| `/app/backend/.env` | Done | Placeholder env vars added |

**No frontend changes. No DB schema changes.**

---

## Testing Checklist (after implementation)

- Upload a 10MB+ video via CMS → no 413 error, completes successfully
- Uploaded file appears in S3 bucket (AWS console)
- Open `/product/sell-serve` → video URL is `https://{bucket}.s3.amazonaws.com/...` (check Network tab)
- Video seeks correctly (scrub timeline → no full re-download)
- Refresh page → browser serves from cache (304 Not Modified, no re-download)
- Old files (migrated) still display correctly
- Local storage path (`STORAGE_BACKEND=local`) still works unchanged

---

## G8 — Upload Spec Card (to add to CMS UI, no transcoding needed)

For the CMS media upload modal, add a small hint:
```
Recommended video spec: MP4 · H.264 · 1280×720 · max 20MB · ≤2Mbps
Use HandBrake (free) to compress before uploading.
```
