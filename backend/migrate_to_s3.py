"""
One-time migration: copy all files from /app/backend/uploads/ to S3.
Run BEFORE setting STORAGE_BACKEND=s3.

Usage:
  cd /app/backend
  python migrate_to_s3.py
"""
import os
import boto3
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

UPLOAD_DIR = Path(__file__).parent / "uploads"
MIME = {
    "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
    "webp": "image/webp", "gif": "image/gif", "svg": "image/svg+xml",
    "mp4": "video/mp4", "webm": "video/webm", "mov": "video/quicktime",
    "pdf": "application/pdf",
}


def migrate():
    s3 = boto3.client(
        "s3",
        region_name=os.environ["AWS_S3_REGION"],
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    bucket = os.environ["AWS_S3_BUCKET_NAME"]
    files = [f for f in UPLOAD_DIR.glob("*") if f.is_file()]
    print(f"Migrating {len(files)} files → s3://{bucket}/")
    ok, fail = 0, 0
    for f in files:
        ext = f.suffix.lstrip(".").lower()
        ct = MIME.get(ext, "application/octet-stream")
        size_kb = f.stat().st_size // 1024
        print(f"  {f.name} ({size_kb}KB) ...", end=" ", flush=True)
        try:
            s3.upload_file(
                str(f), bucket, f.name,
                ExtraArgs={"ContentType": ct, "CacheControl": "public, max-age=31536000, immutable"},
            )
            print("OK")
            ok += 1
        except Exception as e:
            print(f"FAILED: {e}")
            fail += 1
    print(f"\nDone: {ok} uploaded, {fail} failed.")
    if fail == 0:
        print("Safe to set STORAGE_BACKEND=s3 and restart backend.")
    else:
        print("Fix failed files before switching to S3.")


if __name__ == "__main__":
    migrate()
