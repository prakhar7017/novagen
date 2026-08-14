# NOVA/GEN — Asset Manifest

## 1. Purpose

This file defines:
- which assets already exist
- which assets still need to be created
- which visuals should be generated as images
- which visuals should be created in code
- how every asset should be used

Claude must read this document before adding or replacing visual assets.

**Do not invent new visual directions without explicit approval.**

---

## 2. Asset Philosophy

The website uses three types of visual assets.

### A. Generated Image Assets

Used when photorealistic biological detail is difficult or inefficient to recreate procedurally.

**Examples:**
- organism
- cell cluster
- nucleus
- microscopy photography
- human-impact imagery
- molecular candidate if required

### B. Procedural Assets

Built in Three.js / SVG / Canvas / CSS.

**Examples:**
- particles
- research network
- genetic signals
- scanning UI
- HUD
- reticles
- graphs
- grid
- glows
- cursor effects

### C. Hybrid Assets

Generated visual + coded interaction.

**Example:**
- Generated organism image
- \+ Three.js particles
- \+ mouse parallax
- \+ GSAP scroll transform
- \+ shader dissolve

This should be preferred when photorealism and interaction are both required.

---

## 3. Story Assets

Store inside: `/public/assets/story/`

### Asset 01 — Organism

**Filename:** `01-organism.webp`

**Status:** APPROVED / REQUIRED

**Purpose:** Primary Hero and first biological-journey state.

**Style:**
- translucent cellular membrane
- dark black-green material
- internal bio-green filaments
- mint rim lighting
- wet microscopic texture
- premium pharmaceutical CGI
- dark environment
- sparse particles

**Composition:**
- Desktop version should favor the right side.
- Left side should remain relatively quiet when used as Hero.

**Do not bake into future replacements:**
- text
- logo
- CTA
- UI
- labels

### Asset 02 — Cell Cluster

**Filename:** `02-cell-cluster.webp`

**Status:** APPROVED / REQUIRED

**Purpose:** Second biological journey state.

Style must visually match Asset 01.

**Requirements:**
- cluster of translucent cells
- same green/mint biological palette
- same lighting family
- dark environment
- cells should feel derived from the organism

**Avoid:**
- random unrelated spheres
- cartoon cells
- bright clinical-white background

### Asset 03 — Nucleus

**Filename:** `03-nucleus.webp`

**Status:** NEEDS CREATION

**Purpose:** Create the illusion that the camera traveled inside one cell.

**Required characteristics:**
- macro/microscopic view
- one dominant nucleus
- translucent membrane layers
- deep black-green environment
- internal green signal structures
- subtle chromatin/fibrous complexity
- mint edge highlights

**Composition:**
Center-right or centered. Must visually connect to Asset 02.

**Do not include:**
- DNA helix as dominant object
- text
- HUD
- borders
- UI
- humans

### Asset 04 — Particle Field

**Filename:** NONE

**Status:** BUILD IN CODE

**Technology:** Three.js / React Three Fiber

**Purpose:** Organism/nucleus decomposes into biological information.

**Particle characteristics:**
- mostly bio-green
- occasional signal mint
- varied size
- subtle depth
- organic irregular distribution

Do not use a generated raster image for the primary effect.

### Asset 05 — Genetic Signal

**Filename:** NONE

**Status:** BUILD IN CODE

**Technology:** Three.js, SVG, Canvas, CSS

**Possible forms:**
- sequencing bars
- waveform
- signal peaks
- vertical data structures

Do not use generic finance-style charts.

### Asset 06 — Research Network

**Filename:** NONE

**Status:** BUILD IN CODE

**Technology:** Three.js

**Visual language:**
- irregular nodes
- biological connections
- branching pathways
- clustered signals

**Avoid:**
- generic perfect sphere network
- cryptocurrency/network aesthetic
- dense unreadable sci-fi interface

### Asset 07 — Molecular Candidate

**Filename:** `07-molecular-candidate.webp`

**Status:** OPTIONAL GENERATED ASSET

**Alternative:** Build procedurally from line/sphere geometry. Use generated asset only if it improves quality.

**Visual requirements:**
- minimal molecule/protein target
- same green/mint language
- dark background
- scientific rather than fantasy
- visually simple enough to become the resolved final state

---

## 4. Microscopy Assets

Store: `/public/assets/microscopy/`

**Required:**
- `microscopy-01.webp`
- `microscopy-02.webp`
- `microscopy-03.webp`

**Optional:**
- `microscopy-04.webp`

Each image should represent a different biological scale.

**Suggested subjects:**

| # | Subject |
|---|---|
| 01 | cellular colony |
| 02 | tissue network |
| 03 | fluorescent cellular imaging |
| 04 | protein / molecular structure |

**Shared treatment:**
- green/cyan fluorescence
- dark background
- high micro contrast
- restrained saturation
- subtle grain
- scientific realism

Do not mix unrelated stock photography styles.

---

## 5. Human Impact Asset

Store: `/public/assets/impact/`

**Filename:** `human-impact.webp`

**Status:** NEEDS CREATION / SELECTION

**Purpose:** Bring the scientific story back to human outcomes.

**Preferred content:**
- researcher working naturally
- subtle patient/family human moment
- laboratory interaction

**Avoid:**
- scientist smiling directly into camera
- obvious stock-photo composition
- corporate handshake
- generic hospital imagery

Color grade should harmonize with NOVA/GEN.

---

## 6. Background Assets

Primary backgrounds should mostly be created with:
- CSS
- gradients
- noise
- Canvas
- WebGL

Do not depend on large raster backgrounds unless necessary.

### Hero Background

**Base:** `#07110F`

**Characteristics:**
- deep black-green
- subtle radial green glow
- sparse particles
- slight biological haze

### Research Background

**Base:** `#06100F`

**Characteristics:**
- darker
- more technical
- faint grid
- subtle network traces
- little organic glow

Must **NOT** look identical to Hero.

### Impact Background

**Possible direction:** `#F5F7F4` or `#A6FF6A`

**Purpose:** Create a strong visual rhythm change.

**Should feel:**
- more open
- human
- optimistic
- less microscopic

---

## 7. Noise / Grain

Store: `/public/assets/textures/`

**Required:**
- `fine-grain.webp`

**Optional:**
- `microscopic-noise.webp`
- `membrane-noise.webp`

Use very subtly.

**Recommended opacity:** 2% – 8%

Never make grain visibly distracting.

---

## 8. Particle Sprites

Prefer shader-generated circles where possible.

If sprites are necessary:
- `particle-soft.png`
- `particle-glow.png`
- `particle-ring.png`

**Requirements:**
- transparent background
- square
- optimized
- no visible edge
- grayscale or bio-green

---

## 9. Masks

Do **NOT** generate organic masks with an image model unless absolutely necessary.

**Prefer:**
- SVG
- CSS clip-path
- shader noise

Store: `/public/assets/masks/`

**Possible:**
- `organic-mask-01.svg`
- `organic-mask-02.svg`
- `organic-mask-03.svg`

**Production SVG:**
- white filled shape
- transparent outside
- clean path
- no raster artifacts

Also create preview files only if needed for inspection.

---

## 10. HUD Elements

Do not generate HUD elements as raster images.

**Build as:**
- SVG
- HTML
- CSS

**Components include:**
- Reticle
- Target marker
- Coordinate marker
- Signal waveform
- Scale marker
- Scan ring
- Status indicator
- Confidence meter

**Example metadata:**
```
CELL_014
LOCUS / A08
SIGNAL ACTIVE
TARGET IDENTIFIED
98.7% CONFIDENCE
```

HUD must remain subtle.

---

## 11. Icons

Prefer custom SVG line icons.

Store: `/public/assets/icons/`

**Required categories:**
- `spatial-biology.svg`
- `protein-engineering.svg`
- `ai-discovery.svg`
- `genomic-intelligence.svg`

**Optional:**
- `predictive-modeling.svg`
- `molecular-design.svg`

**Icon style:**
- monoline
- approximately 1–1.5px perceived stroke
- simple geometric construction
- scientific visual language
- no generic emoji/illustration style

---

## 12. Fonts

Do not commit licensed font files unless licensing permits.

**Preferred typography direction:**

| Role | Font |
|---|---|
| Display | Neue Montreal |
| Fallback/open alternative | Geist, Manrope, Inter |
| Scientific metadata | IBM Plex Mono |

Fonts should be loaded via approved source or package.

---

## 13. Logo

Store: `/public/assets/brand/`

**Required:**
- `novagen-wordmark.svg`
- `novagen-mark.svg`

**Logo text:** NOVA/GEN

Logo should remain HTML/SVG. Do not use generated raster typography.

---

## 14. Asset Optimization

**Raster production targets:**

| Type | Format | Size |
|---|---|---|
| Hero | WebP or AVIF | approximately 1600–2400px wide |
| Section images | — | approximately 1200–1800px wide |
| Thumbnails | — | approximately 600–900px wide |

Avoid shipping raw PNG unless alpha transparency is required.

**Use where appropriate:**
- WebP
- AVIF
- SVG

---

## 15. Loading Strategy

**Priority load:**
- Hero organism
- logo
- critical fonts

**Lazy-load:**
- microscopy
- research assets
- impact imagery
- below-the-fold images

Do not preload every story asset unless testing proves it improves UX.

---

## 16. Current Minimum Asset Requirement

The website can begin implementation once these exist:

| Asset | Status |
|---|---|
| `01-organism.webp` | READY |
| `02-cell-cluster.webp` | READY |
| `03-nucleus.webp` | REQUIRED |
| `microscopy-01.webp` | REQUIRED |
| `microscopy-02.webp` | REQUIRED |
| `microscopy-03.webp` | REQUIRED |
| `human-impact.webp` | REQUIRED / OPTIONAL FOR FIRST BUILD |
| `fine-grain.webp` | EASY TO GENERATE IN CODE/ASSET PIPELINE |

Everything else can initially be procedural.

---

## 17. Asset Rule for Claude

Before adding a new raster visual, Claude must ask:

> Can this visual be created more efficiently with:
> - SVG
> - CSS
> - Canvas
> - Three.js
> - shader
> - existing asset
>
> ?

Only introduce a new generated image when it provides meaningful visual value.

Never crop a visual identity board and treat the crops as production assets.