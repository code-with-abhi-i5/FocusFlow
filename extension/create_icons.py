"""
FocusFlow — Icon Generator
Creates proper PNG icons (16x16, 48x48, 128x128) with
a flame symbol on a violet/indigo gradient background.
"""

import math
try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFilter

import os

ICONS_DIR = r"c:\Users\ghosh\OneDrive\Desktop\Chrome Extension\extension\icons"

def lerp(a, b, t):
    return a + (b - a) * t

def lerp_color(c1, c2, t):
    return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))

def create_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # --- Gradient background (violet → indigo) ---
    violet  = (109, 40, 217)   # #6D28D9
    indigo  = (67,  56, 202)   # #4338CA

    for y in range(size):
        t = y / max(size - 1, 1)
        color = lerp_color(violet, indigo, t)
        # rounded-rect via clipping the corners later
        draw.line([(0, y), (size - 1, y)], fill=(*color, 255))

    # --- Rounded corners mask ---
    radius = max(2, size // 6)
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    img.putalpha(mask)

    # --- Draw flame shape (white) ---
    draw = ImageDraw.Draw(img)
    cx = size / 2
    pad = size * 0.15
    top = size * 0.12
    bot = size * 0.88

    # Flame: a custom polygon in normalised coords scaled to size
    def pt(nx, ny):
        return (pad + nx * (size - 2 * pad), top + ny * (bot - top))

    # Main flame body
    flame_points = [
        pt(0.50, 0.00),   # tip top-centre
        pt(0.80, 0.30),   # upper right curve
        pt(0.90, 0.55),   # right bulge
        pt(0.75, 0.70),   # right indent
        pt(0.80, 0.90),   # lower right
        pt(0.65, 1.00),   # base right
        pt(0.50, 0.95),   # base mid
        pt(0.35, 1.00),   # base left
        pt(0.20, 0.90),   # lower left
        pt(0.25, 0.70),   # left indent
        pt(0.10, 0.55),   # left bulge
        pt(0.20, 0.30),   # upper left curve
    ]

    # White fill
    draw.polygon(flame_points, fill=(255, 255, 255, 240))

    # Inner "ember" teardrop — slightly offset up
    ember_scale = 0.32
    em_top = top + (bot - top) * 0.55
    em_bot = top + (bot - top) * 0.95
    em_cx = cx

    def ep(nx, ny):
        w = size * ember_scale
        return (em_cx + (nx - 0.5) * w,
                em_top + ny * (em_bot - em_top))

    ember_points = [
        ep(0.50, 0.00),
        ep(0.85, 0.45),
        ep(0.70, 1.00),
        ep(0.30, 1.00),
        ep(0.15, 0.45),
    ]

    # Indigo inner glow so flame looks 3-D
    draw.polygon(ember_points, fill=(167, 139, 250, 180))  # violet-300

    return img


for size in [16, 48, 128]:
    icon = create_icon(size)
    out = os.path.join(ICONS_DIR, f"icon{size}.png")
    icon.save(out, "PNG")
    print(f"OK  Saved {out}  ({size}x{size})")

print("\nDone! All icons created.")
