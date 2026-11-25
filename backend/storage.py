"""Media storage abstraction.

Backends: emergent (default, works in preview + production) | s3 (production AWS).
Switch via env `STORAGE_BACKEND=emergent|s3`.
`save()` returns a public URL path served by the backend (`/api/cms/media/<name>`).
"""
import os
import uuid

import requests as _requests

MIME = {
    "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp",
    "gif": "image/gif", "svg": "image/svg+xml", "mp4": "video/mp4", "webm": "video/webm",
    "mov": "video/quicktime", "pdf": "application/pdf",
}
PUBLIC_PREFIX = "/api/cms/media"

_STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
_STORAGE_URL = _STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
_APP_NAME = "mygenie"
_storage_key: str | None = None


def _init_storage_key(force: bool = False) -> str:
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    key = os.environ.get("EMERGENT_LLM_KEY", "")
    resp = _requests.post(f"{_STORAGE_URL}/init", json={"emergent_key": key}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


class EmergentStorage:
    """Cloud object storage via Emergent integration proxy — works in preview and production."""

    def save(self, data: bytes, ext: str) -> str:
        name = f"{uuid.uuid4().hex}.{ext.lower()}"
        path = f"{_APP_NAME}/cms/{name}"
        sk = _init_storage_key()
        ct = MIME.get(ext.lower(), "application/octet-stream")
        resp = _requests.put(
            f"{_STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": sk, "Content-Type": ct},
            data=data, timeout=120,
        )
        if resp.status_code == 404:
            sk = _init_storage_key(force=True)
            resp = _requests.put(
                f"{_STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": sk, "Content-Type": ct},
                data=data, timeout=120,
            )
        resp.raise_for_status()
        return f"{PUBLIC_PREFIX}/{name}"

    def read_with_type(self, name: str):
        path = f"{_APP_NAME}/cms/{name}"
        sk = _init_storage_key()
        resp = _requests.get(f"{_STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": sk}, timeout=60)
        if resp.status_code == 404 and "storage_key" in resp.text:
            sk = _init_storage_key(force=True)
            resp = _requests.get(f"{_STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": sk}, timeout=60)
        if resp.status_code == 404:
            raise FileNotFoundError(name)
        resp.raise_for_status()
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
        ct = resp.headers.get("Content-Type") or MIME.get(ext, "application/octet-stream")
        return resp.content, ct


class S3Storage:
    def __init__(self):
        import boto3 as _boto3
        self.bucket = os.environ["AWS_S3_BUCKET_NAME"]
        self.region = os.environ.get("AWS_S3_REGION", "ap-south-1")
        self.client = _boto3.client(
            "s3",
            region_name=self.region,
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
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
        return f"{PUBLIC_PREFIX}/{name}"

    def public_url(self, name: str) -> str:
        return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{name}"

    def read_with_type(self, name: str):
        raise NotImplementedError("S3 path uses redirect — call public_url() instead.")


_storage = None


def get_storage():
    global _storage
    if _storage is not None:
        return _storage
    backend = os.environ.get("STORAGE_BACKEND", "local").lower()
    if backend == "s3":
        _storage = S3Storage()
    else:
        # "local" and any unrecognised value → EmergentStorage (works in preview + production)
        _storage = EmergentStorage()
    return _storage
