from PIL import Image, ImageDraw
import os

os.makedirs("public/screenshots", exist_ok=True)

BG = (250, 245, 255)       # #faf5ff
CARD = (255, 255, 255)     # #ffffff
FG = (30, 27, 75)          # #1e1b4b
MUTED = (120, 110, 160)    # #786ea0
PRIMARY = (124, 58, 237)   # #7c3aed
ACCENT = (190, 242, 100)   # #bef264
BORDER = (221, 214, 254)   # #ddd6fe
GOOD = (22, 163, 74)       # #16a34a
DANGER = (220, 38, 38)     # #dc2626

def draw_header(draw, width, title):
    draw.rectangle([0, 0, width, 70], fill=CARD)
    draw.line([0, 70, width, 70], fill=BORDER, width=1)
    draw.text((24, 20), "SplitLoL", fill=PRIMARY, font_size=24)
    draw.text((140, 26), title, fill=MUTED, font_size=16)

def create_wide_dashboard():
    w, h = 1280, 720
    img = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(img)

    draw_header(draw, w, "Dashboard")

    card_w, card_h, card_y = 380, 110, 100
    xs = [24, 432, 840]
    labels = [("You owe", "₹1,250", DANGER), ("You are owed", "₹3,400", GOOD), ("Net", "+₹2,150", PRIMARY)]
    for i, (lbl, val, col) in enumerate(labels):
        x = xs[i]
        draw.rounded_rectangle([x, card_y, x + card_w, card_y + card_h], radius=16, fill=CARD, outline=BORDER, width=1)
        draw.text((x + 20, card_y + 16), lbl, fill=MUTED, font_size=14)
        draw.text((x + 20, card_y + 45), val, fill=col, font_size=28)

    draw.rounded_rectangle([24, 230, 620, 680], radius=20, fill=CARD, outline=BORDER, width=1)
    draw.text((48, 255), "Groups", fill=FG, font_size=18)

    groups = [("Weekend Goa Trip", "Trip · You're owed ₹2,100"), ("Apartment 402", "Rent · Settled up"), ("Dinner Club", "Dining · You owe ₹450")]
    gy = 300
    for gname, gsub in groups:
        draw.rounded_rectangle([48, gy, 596, gy + 70], radius=12, fill=(245, 243, 255), outline=BORDER, width=1)
        draw.text((68, gy + 14), gname, fill=FG, font_size=16)
        draw.text((68, gy + 38), gsub, fill=MUTED, font_size=13)
        gy += 82

    draw.rounded_rectangle([644, 230, 1256, 680], radius=20, fill=CARD, outline=BORDER, width=1)
    draw.text((668, 255), "Recent expenses", fill=FG, font_size=18)

    expenses = [("Dinner at Spice Kitchen", "Weekend Goa Trip · Yesterday", "₹3,400"), ("Groceries Supermarket", "Apartment 402 · 3 days ago", "₹1,850"), ("Taxi to Airport", "Weekend Goa Trip · 4 days ago", "₹920"), ("Electricity Bill", "Apartment 402 · 5 days ago", "₹2,400")]
    ey = 300
    for title, sub, amt in expenses:
        draw.line([668, ey, 1232, ey], fill=BORDER, width=1)
        draw.text((668, ey + 15), title, fill=FG, font_size=15)
        draw.text((668, ey + 38), sub, fill=MUTED, font_size=12)
        draw.text((1120, ey + 22), amt, fill=FG, font_size=16)
        ey += 85

    img.save("public/screenshots/dashboard-wide.png")

def create_narrow_dashboard():
    w, h = 720, 1280
    img = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(img)

    draw_header(draw, w, "Dashboard")

    card_w, card_h, card_y = 326, 100, 95
    draw.rounded_rectangle([24, card_y, 24 + card_w, card_y + card_h], radius=16, fill=CARD, outline=BORDER, width=1)
    draw.text((40, card_y + 14), "You owe", fill=MUTED, font_size=13)
    draw.text((40, card_y + 38), "₹1,250", fill=DANGER, font_size=24)

    draw.rounded_rectangle([370, card_y, 370 + card_w, card_y + card_h], radius=16, fill=CARD, outline=BORDER, width=1)
    draw.text((386, card_y + 14), "You are owed", fill=MUTED, font_size=13)
    draw.text((386, card_y + 38), "₹3,400", fill=GOOD, font_size=24)

    draw.rounded_rectangle([24, 215, 696, 540], radius=20, fill=CARD, outline=BORDER, width=1)
    draw.text((48, 235), "Your groups", fill=FG, font_size=18)

    groups = [("Weekend Goa Trip", "Trip · You're owed ₹2,100"), ("Apartment 402", "Rent · Settled up"), ("Dinner Club", "Dining · You owe ₹450")]
    gy = 280
    for gname, gsub in groups:
        draw.rounded_rectangle([48, gy, 672, gy + 65], radius=12, fill=(245, 243, 255), outline=BORDER, width=1)
        draw.text((68, gy + 12), gname, fill=FG, font_size=15)
        draw.text((68, gy + 34), gsub, fill=MUTED, font_size=12)
        gy += 75

    draw.rounded_rectangle([24, 560, 696, 1220], radius=20, fill=CARD, outline=BORDER, width=1)
    draw.text((48, 580), "Recent expenses", fill=FG, font_size=18)

    expenses = [("Dinner at Spice Kitchen", "Goa Trip · Yesterday", "₹3,400"), ("Groceries Supermarket", "Apartment 402 · 3 days ago", "₹1,850"), ("Taxi to Airport", "Goa Trip · 4 days ago", "₹920"), ("Electricity Bill", "Apartment 402 · 5 days ago", "₹2,400")]
    ey = 625
    for title, sub, amt in expenses:
        draw.line([48, ey, 672, ey], fill=BORDER, width=1)
        draw.text((48, ey + 15), title, fill=FG, font_size=15)
        draw.text((48, ey + 38), sub, fill=MUTED, font_size=12)
        draw.text((580, ey + 22), amt, fill=FG, font_size=16)
        ey += 95

    img.save("public/screenshots/dashboard-narrow.png")

def create_narrow_analytics():
    w, h = 720, 1280
    img = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(img)

    draw_header(draw, w, "Analytics")

    draw.rounded_rectangle([24, 95, 696, 210], radius=20, fill=CARD, outline=BORDER, width=1)
    draw.text((48, 115), "Total spent (Last 3 months)", fill=MUTED, font_size=14)
    draw.text((48, 142), "₹18,550", fill=FG, font_size=32)

    draw.rounded_rectangle([24, 230, 696, 720], radius=20, fill=CARD, outline=BORDER, width=1)
    draw.text((48, 255), "Spending by category", fill=FG, font_size=18)

    cats = [("Groceries", "₹6,800", "36%", PRIMARY), ("Rent", "₹5,000", "27%", (167, 139, 250)), ("Dining", "₹3,950", "21%", (34, 211, 238)), ("Transport", "₹2,800", "15%", ACCENT)]
    cy = 300
    for cname, camt, cpct, ccol in cats:
        draw.rounded_rectangle([48, cy, 672, cy + 85], radius=12, fill=(245, 243, 255), outline=BORDER, width=1)
        draw.ellipse([68, cy + 22, 84, cy + 38], fill=ccol)
        draw.text((98, cy + 20), cname, fill=FG, font_size=16)
        draw.text((98, cy + 42), f"{cpct} of total", fill=MUTED, font_size=13)
        draw.text((580, cy + 30), camt, fill=FG, font_size=16)
        cy += 98

    draw.rounded_rectangle([24, 740, 696, 1220], radius=20, fill=CARD, outline=BORDER, width=1)
    draw.text((48, 765), "Monthly spending trend", fill=FG, font_size=18)

    months = [("Sep 2026", "₹5,200"), ("Oct 2026", "₹7,100"), ("Nov 2026", "₹6,250")]
    my = 820
    for mname, mamt in months:
        draw.line([48, my, 672, my], fill=BORDER, width=1)
        draw.text((48, my + 18), mname, fill=FG, font_size=15)
        draw.text((570, my + 18), mamt, fill=FG, font_size=16)
        draw.rounded_rectangle([48, my + 50, 600, my + 64], radius=7, fill=(237, 233, 254))
        bar_w = int(552 * (int(mamt.replace("₹", "").replace(",", "")) / 8000))
        draw.rounded_rectangle([48, my + 50, 48 + bar_w, my + 64], radius=7, fill=PRIMARY)
        my += 105

    img.save("public/screenshots/analytics-narrow.png")

if __name__ == "__main__":
    create_wide_dashboard()
    create_narrow_dashboard()
    create_narrow_analytics()
    print("Successfully generated all screenshots!")
