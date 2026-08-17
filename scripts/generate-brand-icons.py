from pathlib import Path

import cairosvg
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "client" / "public"
SOURCE = PUBLIC / "verisettle-mark.svg"


def render_png(size: int, filename: str) -> Image.Image:
    destination = PUBLIC / filename
    cairosvg.svg2png(
        url=str(SOURCE),
        write_to=str(destination),
        output_width=size,
        output_height=size,
    )
    return Image.open(destination).convert("RGBA")


def main() -> None:
    images = {
        16: render_png(16, "favicon-16x16.png"),
        32: render_png(32, "favicon-32x32.png"),
        48: render_png(48, "favicon-48x48.png"),
        180: render_png(180, "apple-touch-icon.png"),
        192: render_png(192, "android-chrome-192x192.png"),
        512: render_png(512, "android-chrome-512x512.png"),
    }
    images[512].save(
        PUBLIC / "android-adaptive-maskable-512x512.png",
        format="PNG",
        optimize=True,
    )
    images[32].save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )


if __name__ == "__main__":
    main()
