"""Package exactly the deployable site and verify the resulting ZIP."""
from pathlib import Path
import json
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent.parent
NODE = shutil.which("node")
if not NODE:
    raise SystemExit("Node.js is required for the asset manifest check.")
paths = json.loads(subprocess.check_output(
    [NODE, str(ROOT / "scripts/check-assets.mjs"), "--manifest"],
    cwd=ROOT, text=True, encoding="utf-8",
))
paths += [
    "index.html", "README.md", "scripts/preview.mjs",
    "scripts/check-assets.mjs", "scripts/prepare_previews.py",
    "scripts/package_site.py",
    "scripts/check-experiences.mjs",
    "js/vendor/THREE-LICENSE.txt",
]
paths = sorted(set(paths))
output = ROOT / "outputs"
output.mkdir(exist_ok=True)
archive = output / "Abdelrhman-Shaban-GitHub-Pages.zip"
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
    for name in paths:
        bundle.write(ROOT / name, name)
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None, "Corrupted ZIP entry"
    assert set(bundle.namelist()) == set(paths), "Manifest mismatch"
    assert ".nojekyll" in bundle.namelist()
    assert not any(name.startswith((".git/", ".review-original/", "outputs/")) for name in bundle.namelist())
    for name in paths:
        assert bundle.read(name) == (ROOT / name).read_bytes(), name
print(f"PASS: verified {len(paths)} files in {archive.name} ({archive.stat().st_size / 1024 / 1024:.1f} MiB)")
