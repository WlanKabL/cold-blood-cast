# Theme Background Image Prompts (DALL-E / ChatGPT Image Generation)

> Generate each image at **1920×1080** (landscape). These are used as subtle, low-opacity background textures for public keeper profiles. They should be **atmospheric, abstract–photographic, and muted** — content overlays on top at 12–15% opacity.

All images must feel cohesive as a set: same perspective style (top-down or slight angle), no text, no UI elements, no people.

---

## Default (Reptile / Nature) — `bg5.png` (already exists)

> Existing background — earthy reptile terrarium aesthetic.

---

## Ocean — `bg-ocean.png`

```
A moody, atmospheric underwater scene. Deep ocean blue tones with subtle caustic light patterns filtering through crystal-clear water. Soft coral silhouettes and sea kelp in the background, out of focus. Bioluminescent particles scattered throughout. No fish, no animals. Photographic style, cinematic color grading, shallow depth of field. Dark edges fading to black. 1920x1080, landscape.
```

---

## Forest — `bg-forest.png`

```
A dense, misty tropical rainforest floor seen from a low angle. Rich emerald green tones with warm golden light filtering through the canopy above. Moss-covered roots, ferns, and fallen leaves in soft focus. Volumetric fog creating depth layers. Humid atmosphere, morning light. No animals, no people. Photographic style, cinematic, shallow depth of field. 1920x1080, landscape.
```

---

## Sunset — `bg-sunset.png`

```
A dramatic desert sunset landscape. Warm orange, amber, and deep coral tones blending into a dark sky. Silhouetted rock formations or mesas on the horizon. Heat haze distortion near the ground. Scattered high-altitude cirrus clouds catching the last light. No animals, no people, no cacti in focus. Photographic style, wide angle, cinematic color grading. 1920x1080, landscape.
```

---

## Midnight — `bg-midnight.png`

```
A dark, mystical nighttime scene. Deep purple and indigo tones with scattered points of soft violet light, like fireflies or magical particles. A silhouetted treeline or mountain ridge against a star-filled sky. Subtle nebula-like clouds in deep purple and blue. Ethereal, dreamy atmosphere. No moon, no animals, no people. Photographic style, long exposure feel, cinematic. 1920x1080, landscape.
```

---

## Desert — `bg-desert.png`

```
An endless desert landscape with warm amber and golden sand dunes. Soft ripple patterns in the sand, wind-sculpted. Warm hazy atmosphere with dust particles catching golden light. A distant horizon line with heat shimmer. Muted warm palette — amber, ochre, soft gold. No animals, no people, no vegetation. Photographic style, wide angle, cinematic, shallow depth of field on foreground sand texture. 1920x1080, landscape.
```

---

## Arctic — `bg-arctic.png`

```
A pristine arctic landscape with soft blue-white ice formations. Pale blue and silver tones with subtle cyan highlights. Smooth ice surface reflecting a cloudy sky. Gentle snowfall or ice crystals floating in the air. Soft, diffused light suggesting overcast polar conditions. No animals, no people, no structures. Photographic style, wide angle, ethereal atmosphere, cinematic color grading. 1920x1080, landscape.
```

---

## Notes

- Images are placed in `apps/frontend/public/` (e.g. `public/bg-ocean.png`)
- Used at 12–15% opacity as CSS `background-image` in `::before` pseudo-element
- Dark mode uses slightly lower opacity (12% vs 15%)
- Compress to <300KB each (TinyPNG or similar) to keep page load fast
- WebP format also works — just update the CSS `url()` references
