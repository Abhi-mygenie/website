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
        _storage = LocalStorage(os.environ.get("CMS_UPLOAD_DIR", str(Path(__file__).parent / "uploads")))
    return _storage
