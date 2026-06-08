"""Media storage abstraction.

Local disk now; S3 later — switch with env `STORAGE_BACKEND=local|s3` (no app code change).
`save()` returns a public URL path served by the backend (`/api/cms/media/<name>`).
"""
import os
import uuid
from pathlib import Path

MIME = {
    "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp",
    "gif": "image/gif", "svg": "image/svg+xml", "mp4": "video/mp4", "webm": "video/webm",
    "mov": "video/quicktime",
}
PUBLIC_PREFIX = "/api/cms/media"


class LocalStorage:
    def __init__(self, base_dir: str):
        self.base = Path(base_dir)
        self.base.mkdir(parents=True, exist_ok=True)

    def save(self, data: bytes, ext: str) -> str:
        name = f"{uuid.uuid4().hex}.{ext.lower()}"
        (self.base / name).write_bytes(data)
        return f"{PUBLIC_PREFIX}/{name}"

    def read_with_type(self, name: str):
        path = self.base / name
        if not path.exists():
            raise FileNotFoundError(name)
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
        return path.read_bytes(), MIME.get(ext, "application/octet-stream")


class S3Storage:  # pragma: no cover - wired before production
    """Placeholder with the same interface. Implement with boto3 when STORAGE_BACKEND=s3."""
    def __init__(self, *args, **kwargs):
        raise NotImplementedError("S3 backend not wired yet — set STORAGE_BACKEND=local for now.")


_storage = None


def get_storage():
    global _storage
    if _storage is not None:
        return _storage
    backend = os.environ.get("STORAGE_BACKEND", "local").lower()
    if backend == "s3":
        _storage = S3Storage()
    else:
        _storage = LocalStorage(os.environ.get("CMS_UPLOAD_DIR", str(Path(__file__).parent / "uploads")))
    return _storage
