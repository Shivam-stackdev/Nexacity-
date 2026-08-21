from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "images"
SOURCE_ASSETS = SOURCE / "jade-harbor"
OUTPUT_ASSETS = SOURCE / "jade-harbor-mobile"
OUTPUT_ASSETS.mkdir(parents=True, exist_ok=True)

ASSETS = ["facade", "bridge", "lantern", "market", "ornament"]


def make_game_texture(name: str) -> None:
    with Image.open(SOURCE_ASSETS / f"{name}.png") as image:
        image = image.convert("RGB")
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        image.save(OUTPUT_ASSETS / f"{name}.jpg", "JPEG", quality=82, optimize=True, progressive=True)


def make_icon_copy(destination: str) -> None:
    with Image.open(SOURCE / "icon.png") as image:
        image = image.convert("RGBA")
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        image.save(SOURCE / destination, "PNG", optimize=True)


for asset in ASSETS:
    make_game_texture(asset)

make_icon_copy("icon-optimized.png")
for icon_name in ["splash-icon-optimized.png", "favicon-optimized.png", "android-icon-foreground-optimized.png"]:
    make_icon_copy(icon_name)

print("Optimized Jade Harbor gameplay textures and app icons.")
