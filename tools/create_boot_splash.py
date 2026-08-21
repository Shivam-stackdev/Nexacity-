from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


WIDTH, HEIGHT = 1080, 1920
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "nexacity_boot_splash.png"


def load_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size)
    raise RuntimeError("No compatible system font was found")


def letter_spaced_text(draw: ImageDraw.ImageDraw, text: str, center_x: int, y: int, font: ImageFont.FreeTypeFont, spacing: int, fill: tuple[int, int, int, int]) -> None:
    widths = [draw.textlength(character, font=font) for character in text]
    total_width = sum(widths) + spacing * (len(text) - 1)
    cursor = center_x - total_width / 2
    for character, width in zip(text, widths):
        draw.text((cursor, y), character, font=font, fill=fill)
        cursor += width + spacing


def main() -> None:
    image = Image.new("RGBA", (WIDTH, HEIGHT), (3, 8, 17, 255))
    haze = Image.new("RGBA", image.size, (0, 0, 0, 0))
    haze_draw = ImageDraw.Draw(haze)
    haze_draw.ellipse((120, 610, 960, 1310), fill=(28, 158, 224, 28))
    haze = haze.filter(ImageFilter.GaussianBlur(110))
    image.alpha_composite(haze)

    particles = Image.new("RGBA", image.size, (0, 0, 0, 0))
    particle_draw = ImageDraw.Draw(particles)
    for x, y, radius, alpha in [
        (184, 480, 2, 38), (286, 740, 3, 28), (848, 610, 2, 46), (924, 1030, 2, 30),
        (140, 1190, 2, 26), (760, 1380, 3, 32), (390, 1420, 2, 30), (612, 430, 2, 24),
    ]:
        particle_draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(108, 211, 255, alpha))
    particles = particles.filter(ImageFilter.GaussianBlur(1.4))
    image.alpha_composite(particles)

    font = load_font(112)
    text_layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    text_draw = ImageDraw.Draw(text_layer)
    text_y = 865
    letter_spaced_text(text_draw, "NEXACITY", WIDTH // 2, text_y, font, 8, (112, 215, 255, 255))
    glow = text_layer.filter(ImageFilter.GaussianBlur(26))
    image.alpha_composite(glow)
    image.alpha_composite(text_layer)

    status = ImageDraw.Draw(image)
    status_font = load_font(20)
    status_text = "INITIALIZING"
    status_width = status.textlength(status_text, font=status_font)
    status.text(((WIDTH - status_width) / 2, 1010), status_text, font=status_font, fill=(150, 220, 248, 190))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(OUTPUT, quality=94, optimize=True)
    print(OUTPUT)


if __name__ == "__main__":
    main()
