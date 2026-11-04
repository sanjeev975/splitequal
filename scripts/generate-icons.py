# Pure-Python (no dependencies) icon generator from the Splitequal logo. Run: python3 scripts/generate-icons.py
import struct, zlib
NAVY = (44, 114, 228); CORAL = (255, 255, 255); LAV = (207, 227, 255); IVORY = (255, 255, 255)  # brand blue square, white bars
def rr(px, py, x, y, w, h, r):
    if px < x or px > x + w or py < y or py > y + h: return False
    cx = min(max(px, x + r), x + w - r); cy = min(max(py, y + r), y + h - r)
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r
def color(u, v, opaque):
    if not opaque and not rr(u, v, 0, 0, 32, 32, 9): return (0, 0, 0, 0)
    if rr(u, v, 6, 9, 20, 5, 2.5): return CORAL + (255,)
    if rr(u, v, 6, 18, 20, 5, 2.5): return LAV + (255,)
    if 6 <= u <= 26 and 15.2 <= v <= 16.8: return IVORY + (255,)
    return NAVY + (255,)
def make(path, size, scale, opaque):
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            acc = [0, 0, 0, 0]
            for sy in (0.25, 0.75):
                for sx in (0.25, 0.75):
                    u = ((px + sx) / size - 0.5) / scale * 32 + 16; v = ((py + sy) / size - 0.5) / scale * 32 + 16
                    c = color(u, v, opaque)
                    for i in range(4): acc[i] += c[i]
            row += bytes(a // 4 for a in acc)
        rows.append(bytes(row))
    def chunk(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(b"".join(rows), 9)) + chunk(b"IEND", b"")
    open(path, "wb").write(png)
make("public/icons/icon-192.png", 192, 1.0, False)
make("public/icons/icon-512.png", 512, 1.0, False)
make("public/icons/maskable-512.png", 512, 0.62, True)   # content inside the 80% safe zone, full-bleed background
make("public/icons/apple-touch-icon.png", 180, 0.8, True) # iOS applies its own rounded corners
