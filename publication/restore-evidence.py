"""Restore the immutable 0.2 evidence; never overwrite different local bytes."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import tempfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
URL = "https://github.com/adievibecoder-sudo/PELAGIC/releases/download/v0.2.0/pelagic-0.2-complete.zip"
SHA256 = "d75e7b45be765849af10fb303226c1d77aa66c3bf40ca9791d72b384280e35f8"


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def checked_path(name):
    relative = PurePosixPath(name)
    if relative.is_absolute() or ".." in relative.parts or "\\" in name or ":" in name:
        raise ValueError(f"Unsafe manifest path: {name}")
    target = (ROOT / name).resolve()
    if not target.is_relative_to(ROOT):
        raise ValueError(f"Path outside project: {name}")
    return target


def verify(files):
    errors = []
    for item in files:
        target = checked_path(item["path"])
        if not target.is_file():
            errors.append(f"Missing: {item['path']}")
        elif target.stat().st_size != item["bytes"] or digest(target) != item["sha256"]:
            errors.append(f"Changed: {item['path']}")
    if errors:
        raise SystemExit("\n".join(errors))
    print(f"PASS: all {len(files)} original 0.2 manifest files match; publication additions permitted.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify", action="store_true", help="Verify without downloading.")
    parser.add_argument("--archive", type=Path, help="Use an already downloaded complete ZIP.")
    args = parser.parse_args()
    files = json.loads((ROOT / "RELEASE-MANIFEST.json").read_text(encoding="utf-8"))["files"]
    if args.verify:
        verify(files)
        return
    with tempfile.TemporaryDirectory(prefix="pelagic-0.2-") as directory:
        archive = args.archive or Path(directory) / "pelagic-0.2-complete.zip"
        if not args.archive:
            print(f"Downloading {URL}", flush=True)
            with urllib.request.urlopen(URL, timeout=120) as response, archive.open("wb") as output:
                while block := response.read(4 * 1024 * 1024):
                    output.write(block)
        if digest(archive) != SHA256:
            raise SystemExit("Archive SHA-256 mismatch; nothing restored.")
        # Validate every member before writing anything.
        with zipfile.ZipFile(archive) as bundle:
            pending = []
            for item in files:
                target = checked_path(item["path"])
                if not item["path"].startswith("evidence/"):
                    continue
                data = bundle.read("pelagic-0.2/" + item["path"])
                if len(data) != item["bytes"] or hashlib.sha256(data).hexdigest() != item["sha256"]:
                    raise SystemExit(f"Invalid archive member: {item['path']}")
                if target.exists():
                    if not target.is_file() or digest(target) != item["sha256"]:
                        raise SystemExit(f"Refusing to overwrite changed file: {item['path']}")
                else:
                    pending.append((item, target))
            for item, target in pending:
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open("xb") as output:
                    output.write(bundle.read("pelagic-0.2/" + item["path"]))
        print(f"Restored {len(pending)} evidence files.")
    verify(files)


if __name__ == "__main__":
    main()
