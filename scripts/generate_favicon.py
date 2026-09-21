import numpy as np
from PIL import Image, ImageDraw

def create_bubble_image(size=512):
    # Coordinate grid
    y, x = np.ogrid[:size, :size]
    center = (size - 1) / 2.0
    radius = size * 0.44  # Leaves clean margin for outer glow
    
    # Normalized coords relative to center
    nx = (x - center) / radius
    ny = (y - center) / radius
    dist_sq = nx * nx + ny * ny
    dist = np.sqrt(dist_sq)
    angle = np.arctan2(ny, nx)
    
    # Output channel buffers
    r_arr = np.zeros((size, size), dtype=np.float32)
    g_arr = np.zeros((size, size), dtype=np.float32)
    b_arr = np.zeros((size, size), dtype=np.float32)
    a_arr = np.zeros((size, size), dtype=np.float32)
    
    # 1. Soft Outer Ambient Glow (cyan-blue aura)
    aura_mask = (dist >= 0.85) & (dist <= 1.15)
    aura_factor = np.clip((1.15 - dist) / 0.30, 0.0, 1.0)
    aura_factor = np.sin(aura_factor * (np.pi / 2.0)) # smooth ease
    r_arr += aura_mask * (10.0 * aura_factor)
    g_arr += aura_mask * (180.0 * aura_factor)
    b_arr += aura_mask * (255.0 * aura_factor)
    a_arr += aura_mask * (0.35 * aura_factor)

    # 2. Inside the bubble (dist <= 1.0)
    inside = dist <= 1.0
    z = np.sqrt(np.maximum(0.0, 1.0 - np.minimum(1.0, dist_sq)))
    
    # Fresnel factor (0 at center, 1 at edge)
    fresnel = np.power(1.0 - z, 2.0)
    
    # Chromatic soap bubble iridescence:
    # Smooth variation along the bubble perimeter
    # Vibrant neon cyan (0, 245, 255) to magenta-pink (245, 45, 145) to royal violet (130, 60, 255)
    hue_t = (np.sin(angle + 0.8) * 0.5 + 0.5)
    rim_r = 0.0 * (1.0 - hue_t) + 245.0 * hue_t
    rim_g = 240.0 * (1.0 - hue_t) + 45.0 * hue_t
    rim_b = 255.0 * (1.0 - hue_t) + 160.0 * hue_t
    
    # Translucent aqua core
    core_r, core_g, core_b = 15.0, 165.0, 245.0
    
    # Smooth blend between core and iridescent rim
    body_r = core_r * (1.0 - fresnel) + rim_r * fresnel
    body_g = core_g * (1.0 - fresnel) + rim_g * fresnel
    body_b = core_b * (1.0 - fresnel) + rim_b * fresnel
    
    # Alpha: core is transparent glassy (0.22), rim is vibrant and dense (0.92)
    body_alpha = 0.22 + 0.70 * np.power(fresnel, 1.2)
    
    # 3. Inner refraction ring (~0.85 radius) giving membrane thickness
    inner_ring_dist = np.abs(dist - 0.86)
    inner_ring = np.exp(-np.power(inner_ring_dist / 0.035, 2.0)) * 0.45
    body_r = np.clip(body_r + inner_ring * 180.0, 0, 255)
    body_g = np.clip(body_g + inner_ring * 240.0, 0, 255)
    body_b = np.clip(body_b + inner_ring * 255.0, 0, 255)
    body_alpha = np.clip(body_alpha + inner_ring * 0.35, 0, 1)

    # 4. Light source from top-left (-0.35, -0.35)
    lx, ly, lz = -0.35, -0.35, 0.87
    l_norm = np.sqrt(lx*lx + ly*ly + lz*lz)
    lx, ly, lz = lx/l_norm, ly/l_norm, lz/l_norm
    
    # Half-angle with eye (0, 0, 1)
    hx, hy, hz = lx, ly, lz + 1.0
    h_norm = np.sqrt(hx*hx + hy*hy + hz*hz)
    hx, hy, hz = hx/h_norm, hy/h_norm, hz/h_norm
    dot_nh = np.maximum(0.0, nx * hx + ny * hy + z * hz)
    
    # Specular hotspot
    spec_broad = np.power(dot_nh, 14.0) * 0.60
    spec_sharp = np.power(dot_nh, 55.0) * 0.95
    specular = np.clip(spec_broad + spec_sharp, 0.0, 1.0)
    
    # 5. Bottom-right subtle bounce reflection
    bx, by, bz = 0.45, 0.45, 0.5
    b_norm = np.sqrt(bx*bx + by*by + bz*bz)
    bx, by, bz = bx/b_norm, by/b_norm, bz/b_norm
    dot_nb = np.maximum(0.0, nx * bx + ny * by + z * bz)
    bounce = np.power(dot_nb, 10.0) * 0.45
    bounce_r = 240.0 * hue_t
    bounce_g = 80.0 * hue_t + 180.0 * (1 - hue_t)
    bounce_b = 255.0

    # Combine inside colors
    in_r = body_r * (1.0 - specular) + 255.0 * specular + bounce_r * bounce
    in_g = body_g * (1.0 - specular) + 255.0 * specular + bounce_g * bounce
    in_b = body_b * (1.0 - specular) + 255.0 * specular + bounce_b * bounce
    in_a = np.clip(body_alpha + specular * 0.85 + bounce * 0.35, 0.0, 1.0)
    
    # 6. Outer Glass Rim Sheen (0.95 to 1.0)
    rim_sheen = np.clip((dist - 0.92) / 0.06, 0.0, 1.0) * np.clip((1.0 - dist) / 0.02, 0.0, 1.0)
    in_r = np.clip(in_r + rim_sheen * 220.0, 0, 255)
    in_g = np.clip(in_g + rim_sheen * 255.0, 0, 255)
    in_b = np.clip(in_b + rim_sheen * 255.0, 0, 255)
    in_a = np.clip(in_a + rim_sheen * 0.5, 0, 1)

    # Edge anti-aliasing at perimeter (0.985 to 1.0)
    edge_aa = np.clip((1.0 - dist) / 0.02, 0.0, 1.0)
    in_a *= edge_aa
    
    # Write inside to buffers
    r_arr = np.where(inside, in_r, r_arr)
    g_arr = np.where(inside, in_g, g_arr)
    b_arr = np.where(inside, in_b, b_arr)
    a_arr = np.where(inside, in_a, a_arr)
    
    # Create PIL RGBA Image
    rgba = np.dstack([
        np.clip(r_arr, 0, 255).astype(np.uint8),
        np.clip(g_arr, 0, 255).astype(np.uint8),
        np.clip(b_arr, 0, 255).astype(np.uint8),
        np.clip(a_arr * 255.0, 0, 255).astype(np.uint8)
    ])
    img = Image.fromarray(rgba, mode='RGBA')
    
    # 7. Draw crisp high-gloss specular arc and star sparkles
    draw = ImageDraw.Draw(img)
    
    # Top-left curved gloss arc
    # Center of gloss
    gx = center - radius * 0.32
    gy = center - radius * 0.32
    
    # Draw star sparkle at the gloss highlight apex
    def draw_sparkle(cx, cy, r_long, r_short, color=(255, 255, 255, 255)):
        pts = []
        for i in range(8):
            ang = i * np.pi / 4.0
            r = r_long if (i % 2 == 0) else r_short
            pts.append((cx + r * np.cos(ang), cy + r * np.sin(ang)))
        draw.polygon(pts, fill=color)
    
    # Primary brilliant 4-point sparkle
    draw_sparkle(gx, gy, radius * 0.32, radius * 0.06, (255, 255, 255, 255))
    draw_sparkle(gx, gy, radius * 0.16, radius * 0.045, (225, 250, 255, 255))
    draw.ellipse([gx - radius * 0.065, gy - radius * 0.065, gx + radius * 0.065, gy + radius * 0.065], fill=(255, 255, 255, 255))
    
    # Secondary pinpoint sparkle
    sx2 = center - radius * 0.12
    sy2 = center - radius * 0.52
    draw.ellipse([sx2 - radius * 0.06, sy2 - radius * 0.06, sx2 + radius * 0.06, sy2 + radius * 0.06], fill=(255, 255, 255, 230))
    
    # Tertiary small sparkle on bottom-right
    sx3 = center + radius * 0.42
    sy3 = center + radius * 0.35
    draw_sparkle(sx3, sy3, radius * 0.14, radius * 0.035, (255, 255, 255, 210))

    return img

def main():
    import os
    img_512 = create_bubble_image(512)
    img_512.save("favicon-512.png", "PNG")
    print("Saved favicon-512.png (512x512)")
    
    # Standard favicon sizes: 256, 128, 64, 48, 32, 16
    sizes = [256, 128, 64, 48, 32, 16]
    resized_images = [img_512.resize((s, s), Image.Resampling.LANCZOS) for s in sizes]
    
    # Save root favicon.ico
    resized_images[0].save(
        "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=resized_images[1:]
    )
    print("Generated multi-resolution favicon.ico in root")

    # Save to public/
    os.makedirs("public", exist_ok=True)
    resized_images[0].save(
        "public/favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=resized_images[1:]
    )
    
    # Additional web icon assets in public/
    img_512.resize((180, 180), Image.Resampling.LANCZOS).save("public/apple-touch-icon.png", "PNG")
    img_512.resize((192, 192), Image.Resampling.LANCZOS).save("public/android-chrome-192x192.png", "PNG")
    img_512.resize((512, 512), Image.Resampling.LANCZOS).save("public/android-chrome-512x512.png", "PNG")
    img_512.resize((32, 32), Image.Resampling.LANCZOS).save("public/favicon-32x32.png", "PNG")
    img_512.resize((16, 16), Image.Resampling.LANCZOS).save("public/favicon-16x16.png", "PNG")
    print("Saved public/favicon.ico, apple-touch-icon, and chrome PNG icons")

if __name__ == '__main__':
    main()
