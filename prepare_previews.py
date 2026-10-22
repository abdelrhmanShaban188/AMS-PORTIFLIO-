"""Create small card images; keep every original untouched for the galleries."""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
sources = {
    1: "6F.png",
    2: "SPEED PARK/msp01.png",
    3: "HOAS PROJECT/hoas.png",
    4: "02.png",
    5: "03.png",
    6: "H09/image.jpg",
    7: "AHAUD ROFIDA HOTEL/Screenshot 2026-04-05 223829.png",
    8: "ELMAWAHAEB SCHOOL/Screenshot 2026-04-05 232938.png",
    9: "AMALAA/Screenshot 2026-04-05 235853.png",
    13: "SEDRA/7.png",
    10: "ADDIN/1.png", 11: "ADDIN/2.png", 12: "ADDIN/3.png",
    14: "ADDIN/4.png", 15: "ADDIN/5.png",
}
out = ROOT / "assets/previews"
out.mkdir(parents=True, exist_ok=True)
for key, source in sources.items():
    with Image.open(ROOT / "assets/images" / source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((1100, 750), Image.Resampling.LANCZOS)
        image.save(out / f"project-{key}.webp", quality=83, method=6)
automation_source = ROOT / "assets/images/cover.png"
if not automation_source.exists():
    automation_source = out / "automation.webp"
with Image.open(automation_source) as image:
    image = ImageOps.exif_transpose(image).convert("RGB")
    image.thumbnail((1100, 750), Image.Resampling.LANCZOS)
    image.save(out / "automation.webp", quality=85, method=6)
print(f"Prepared {len(sources) + 1} previews.")
