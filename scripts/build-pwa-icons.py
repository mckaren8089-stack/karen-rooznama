#!/usr/bin/env python3
"""Generate deterministic PNG and maskable icons from our tracked SVG source."""
from io import BytesIO
from pathlib import Path
import cairosvg
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
source=ROOT/"assets/faravahar.svg"
target=ROOT/"icons"
target.mkdir(exist_ok=True)
svg=source.read_bytes()
BG="#173940"
for size in (192,512):
    data=cairosvg.svg2png(bytestring=svg,output_width=size,output_height=size)
    picture=Image.open(BytesIO(data)).convert("RGBA")
    backdrop=Image.new("RGBA",(size,size),BG)
    backdrop.alpha_composite(picture)
    file=target/f"faravahar-{size}.png"
    backdrop.convert("RGB").save(file,optimize=True)
    verify=Image.open(file)
    assert verify.size==(size,size) and verify.format=="PNG"
    print(file, file.stat().st_size)

# Keep the whole emblem within an adaptive mask's safe center.
image=Image.open(target/"faravahar-512.png").convert("RGB")
backdrop=Image.new("RGB",(512,512),BG)
symbol=image.resize((360,360),Image.Resampling.LANCZOS)
backdrop.paste(symbol,((512-360)//2,(512-360)//2))
file=target/"faravahar-maskable-512.png"
backdrop.save(file,optimize=True)
assert Image.open(file).size==(512,512)
print(file,file.stat().st_size)
