import sys
try:
    from PIL import Image, ImageOps
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageOps

import os

icons_dir = r"c:\Users\ghosh\OneDrive\Desktop\Chrome Extension\extension\icons"
for size in [16, 48, 128]:
    path = os.path.join(icons_dir, f"icon{size}.png")
    if os.path.exists(path):
        img = Image.open(path).convert("RGBA")
        
        # Extract alpha
        r, g, b, a = img.split()
        
        # The user said the logo is black, so to make it white we can just create a white image
        # and apply the original alpha mask to it.
        white_img = Image.new("RGBA", img.size, (255, 255, 255, 255))
        white_img.putalpha(a)
        
        white_img.save(path)
        print(f"Processed {path}")
