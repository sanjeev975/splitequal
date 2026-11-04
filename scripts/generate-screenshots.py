# Illustrative store screenshots for the PWA install UI. Replace with real screenshots of your app when you can (same sizes).
from PIL import Image, ImageDraw, ImageFont, ImageFilter
IVORY=(251,246,234); PAPER=(241,232,210); NAVY=(20,33,61); CORAL=(240,115,74); EMER=(15,157,107); LAV=(184,169,240); INK=(36,38,43); INSET=(232,223,198); EDGE=(217,204,170)
D="/usr/share/fonts/truetype/dejavu/"
def f(n, s): return ImageFont.truetype(D + n, s)
SERIF, SANS, MONO = "DejaVuSerif-Bold.ttf", "DejaVuSans.ttf", "DejaVuSansMono-Bold.ttf"
def card(img, box, fill=PAPER, r=24, inset=False):
    if not inset:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); x0, y0, x1, y1 = box
        ImageDraw.Draw(sh).rounded_rectangle((x0, y0 + 10, x1, y1 + 10), r, fill=(20, 33, 61, 80)); img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    ImageDraw.Draw(img).rounded_rectangle(box, r, fill=INSET if inset else fill, outline=EDGE, width=2)
def logo(d, x, y, s):
    k = s / 32; d.rounded_rectangle((x, y, x + s, y + s), 9 * k, fill=NAVY)
    d.rounded_rectangle((x + 6 * k, y + 9 * k, x + 26 * k, y + 14 * k), 2.5 * k, fill=CORAL); d.rounded_rectangle((x + 6 * k, y + 18 * k, x + 26 * k, y + 23 * k), 2.5 * k, fill=LAV)
    d.rectangle((x + 6 * k, y + 14 * k, x + 26 * k, y + 15.6 * k), fill=IVORY)
def stat(img, d, x, y, w, h, label, val, col):
    card(img, (x, y, x + w, y + h), inset=True, r=18); d.text((x + 20, y + 14), label, font=f(SANS, 18), fill=INK); d.text((x + 20, y + h - 52), val, font=f(MONO, 32), fill=col)
def make(path, W, H, narrow):
    img = Image.new("RGBA", (W, H), IVORY); d = ImageDraw.Draw(img); m = 40 if narrow else 80
    d.rectangle((0, 0, W, 72), fill=PAPER); d.line((0, 72, W, 72), fill=EDGE, width=2); logo(d, m, 18, 36); d.text((m + 50, 20), "Splitequal", font=f(SERIF, 28), fill=NAVY)
    if not narrow: d.text((W - 420, 26), "Dashboard     Groups     Profile", font=f(SANS, 20), fill=INK)
    d.text((m, 100), "Dashboard", font=f(SERIF, 44), fill=INK)
    stats = [("You owe (INR)", "₹1,250.00", CORAL), ("You are owed (INR)", "₹3,400.00", EMER), ("Net (INR)", "₹2,150.00", INK)]
    if narrow:
        for i, (l, v, c) in enumerate(stats): stat(img, d, m, 180 + i * 130, W - 2 * m, 110, l, v, c)
        gy = 580; gb = (m, gy, W - m, gy + 270); rb = (m, gy + 310, W - m, gy + 650)
    else:
        w = (W - 2 * m - 48) // 3
        for i, (l, v, c) in enumerate(stats): stat(img, d, m + i * (w + 24), 180, w, 110, l, v, c)
        gb = (m, 330, 600, 650); rb = (640, 330, W - m, 650)
    card(img, gb); gx, gy0 = gb[0] + 28, gb[1] + 24
    d.text((gx, gy0), "Goa Trip", font=f(SERIF, 32), fill=INK); d.text((gx, gy0 + 48), "Travel · INR · Asha, Ravi, Meera", font=f(SANS, 18), fill=INK)
    for i, (t, c) in enumerate([("Ravi owes ₹1,000.00", CORAL), ("Meera owes ₹1,000.00", CORAL), ("Asha is owed ₹2,000.00", EMER)]): d.text((gx, gy0 + 100 + i * 40), t, font=f(SANS, 22), fill=c)
    card(img, rb); rx, ry = rb[0] + 28, rb[1] + 24
    d.text((rx, ry), "Dinner at the beach shack", font=f(MONO, 24), fill=INK); d.text((rx, ry + 44), "₹3,000.00", font=f(MONO, 36), fill=NAVY)
    d.text((rx, ry + 100), "17 Oct · Restaurants · equal split", font=f(SANS, 18), fill=INK); d.text((rx, ry + 150), "Paid: Asha ₹3,000.00", font=f(MONO, 20), fill=INK)
    d.text((rx, ry + 186), "Owes: Ravi ₹1,000.00 · Meera ₹1,000.00", font=f(MONO, 18 if not narrow else 16), fill=INK)
    d.text((W - m - 230, H - 36), "Illustrative sample data", font=f(SANS, 14), fill=(120, 120, 120))
    img.convert("RGB").save(path)
make("public/screenshots/dashboard-wide.png", 1280, 720, False)
make("public/screenshots/dashboard-narrow.png", 720, 1280, True)
