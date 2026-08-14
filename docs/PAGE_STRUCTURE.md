# NOVA/GEN — Page Structure

## 1. Project Goal

NOVA/GEN is a premium fictional computational-biology company website.

The site must feel like a real biotechnology company, **not**:

- a generic SaaS landing page
- a frontend portfolio
- a template
- a collection of unrelated animation experiments

The central visual narrative is:

**LIFE → EXPLORE → DECODE → INTERPRET → DISCOVER → IMPACT**

The website should feel like one continuous scientific experience.

---

## 2. Global Page Flow

```
01 HERO

02 BIOLOGICAL JOURNEY
   01 Organism
   02 Cell Cluster
   03 Nucleus
   04 Particle Field
   05 Genetic Signal
   06 Research Network
   07 Molecular Candidate

03 INNOVATION
04 TECHNOLOGY / PLATFORM
05 CAPABILITIES
06 RESEARCH
07 IMPACT
08 FINAL CTA
```

---

## 3. Global Layout Rules

### Desktop

- Target design viewport: **1440 × 900**
- Recommended maximum content width: **1440px**
- Page horizontal padding: **48px – 72px**
- Use large amounts of intentional negative space.
- Do not constrain scientific visuals to the normal content container when they benefit from full-screen composition.

### Tablet

- Target viewport: **768 × 1024**
- Page padding: **32px**

Reduce:
- heading scale
- WebGL particle count
- excessive empty space
- horizontal visual travel

Preserve the same story.

### Mobile

- Target viewport: **390 × 844**
- Page padding: **20px**

Mobile is not simply the desktop site stacked vertically.

Requirements:
- copy should remain readable without animations
- WebGL complexity should be reduced
- no horizontal scroll
- scientific story becomes more vertical
- navigation becomes compact
- touch interactions replace cursor-specific effects

---

## 4. Header

### Purpose

Minimal navigation that does not compete with the hero.

### Content

**Logo:** NOVA/GEN

**Navigation:**
- Platform
- Research
- Capabilities
- Impact

**Primary action:** Explore

### Design

Header is:
- transparent initially
- visually minimal
- approximately 72–88px tall
- aligned with page gutters
- white/bone typography
- scientific metadata may use mono typography

Do not use:
- large pill navigation
- glassmorphism container
- large shadows
- oversized CTA

---

## 5. Section 01 — Hero

### Height

100svh (minimum: 720px)

### Purpose

Immediately establish:
- biotechnology
- computational science
- premium visual quality
- the living-system concept

The user should understand the visual identity within approximately 5 seconds.

### Content

**Eyebrow:** COMPUTATIONAL BIOLOGY

**Headline:**
> Biology,
> made programmable.

**Supporting copy:**
> We decode living systems to reveal new possibilities for human health.

**Primary CTA:** Explore our platform

**Optional secondary:** View research

### Composition

**Desktop:**

| Side | Width | Content |
|---|---|---|
| LEFT | ~43–48% | Typography / CTA / metadata |
| RIGHT | ~52–57% | Hero biological organism |

The organism must not sit directly behind important text. Left side should remain visually quiet.

### Hero Visual

**Primary asset:** `01-organism`

Visual characteristics:
- translucent membrane
- black-green biological material
- bio-green internal filaments
- mint rim lighting
- microscopic wet surface
- cinematic depth
- sparse particles
- dark environment

### Hero Motion

**Load sequence:**

| Timing | Event |
|---|---|
| 0–600ms | background settles |
| 200–1000ms | organism: opacity 0 → 1, scale 1.04 → 1, blur 8–10px → 0 |
| 300–1100ms | headline reveals line-by-line |
| 700–1200ms | supporting text appears |
| 850–1300ms | CTA appears |

**Continuous:**
- organism breathing maximum ±1%
- slight cursor parallax
- particles drifting
- no obvious looping pattern

**Reduced motion:**
- no breathing
- no cursor parallax
- immediate/static visual

---

## 6. Section 02 — Biological Journey

### Purpose

This is the signature experience of the website.

The user moves through:

```
ORGANISM
   ↓
CELL CLUSTER
   ↓
NUCLEUS
   ↓
PARTICLE FIELD
   ↓
GENETIC SIGNAL
   ↓
RESEARCH NETWORK
   ↓
MOLECULAR CANDIDATE
```

This must feel like a transformation of one system rather than seven unrelated animations.

### Desktop Structure

Approximate scroll length: **400–500vh**

The visual environment can remain pinned while the scroll drives transformation.

### Global Journey Progress

| Progress | Stage |
|---|---|
| 0.00 | Organism |
| 0.15 | Organism destabilization |
| 0.27 | Cell cluster |
| 0.40 | Nucleus |
| 0.53 | Particle field |
| 0.66 | Genetic signal |
| 0.80 | Research network |
| 0.93 | Molecular candidate |
| 1.00 | Candidate resolved |

### 02.1 Organism

**Label:** 01 / ORIGIN

**Copy concept:**
> Life begins as complexity. Our platform begins by observing it.

**Visual:** `01-organism.webp`

### 02.2 Cell Cluster

**Label:** 02 / EXPLORE

**Copy concept:**
> We move from whole systems to individual cellular behavior.

**Visual:** `02-cell-cluster.webp`

**Transition:**
Do not use a plain opacity crossfade. Preferred:
- procedural noise dissolve
- membrane breakup
- irregular particle displacement

### 02.3 Nucleus

**Label:** 03 / DECODE

**Copy concept:**
> Inside each cell, biology becomes signal.

**Visual:** `03-nucleus.webp`

**Transition:**
The camera should appear to push into one cell. Use:
- scale
- translation
- depth blur
- shader distortion

Physical 3D camera accuracy is not required. The perception of depth is more important.

### 02.4 Particle Field

**Label:** 04 / SIGNAL

Visual becomes procedural. Do not rely on generated imagery here. Three.js particles represent biological information breaking into individual signals.

- Desktop target: **5000–8000 particles**
- Mobile: **1000–2000 particles**

### 02.5 Genetic Signal

**Label:** 05 / DECODE

Particles reorganize into:
- sequencing bars
- waveform
- vertical signal structures
- small clusters

Scientific metadata may appear:
- GENE EXPRESSION
- LOCUS / A08
- SIGNAL_048
- CONFIDENCE 98.7%

Keep metadata subtle.

### 02.6 Research Network

**Label:** 06 / INTERPRET

The same particles become:
- nodes
- connections
- pathways
- clustered structures

Avoid generic neural-network visuals. The network should remain biological and irregular.

### 02.7 Molecular Candidate

**Label:** 07 / DISCOVER

The network collapses toward selected nodes.

**Final state:**
- TARGET IDENTIFIED
- CANDIDATE / NVG-042
- CONFIDENCE 98.7%

Keep UI minimal.

---

## 7. Section 03 — Innovation

### Purpose

Transition from cinematic storytelling into understandable company positioning.

Approximate height: **100–130vh**

**Eyebrow:** OUR APPROACH

**Headline direction:**
> Biology isn't static. Neither is our platform.

Content should explain:
- biological complexity
- multimodal understanding
- computational interpretation
- faster research insight

### Layout

| Side | Content |
|---|---|
| LEFT | Editorial copy |
| RIGHT | Scientific visual / microscopy |

### Animation

- typography mask reveal
- subtle biological image reveal
- no generic fade-up cards

---

## 8. Section 04 — Technology / Platform

### Purpose

Explain the scientific workflow.

**Headline direction:**
> From sample to discovery.

### Pipeline

```
SAMPLE
   ↓
MAP
   ↓
INTERPRET
   ↓
PREDICT
   ↓
VALIDATE
```

Desktop can use a horizontal or spatial progression. Mobile uses vertical progression. Each stage must visibly affect the science visualization.

---

## 9. Section 05 — Capabilities

### Purpose

Show what the platform enables.

**Capabilities:**
1. Spatial Biology
2. Protein Engineering
3. AI Discovery
4. Genomic Intelligence

**Optional additional capabilities:**
- Predictive Modeling
- Molecular Design

Use 4 primary capability cards maximum on the first view.

### Card Interactions

| Capability | Interaction |
|---|---|
| Spatial Biology | Cursor reveals or illuminates nearby cells |
| Protein Engineering | Protein structure subtly unfolds or rotates |
| AI Discovery | Connections form between nearby nodes |
| Genomic Intelligence | Sequencing signals reorganize |

Do not use `hover: scale(1.05)` as the primary interaction.

---

## 10. Section 06 — Research

### Purpose

Make NOVA/GEN feel like a real scientific organization. Layout should feel editorial rather than SaaS.

**Possible blocks:**
- Latest research
- Platform insight
- Microscopy study
- Selected publication
- Research collaboration

Use 2–4 high-quality microscopy assets. Do not create large generic blog-card grids.

---

## 11. Section 07 — Impact

### Purpose

Communicate scale and results.

**Example numbers:**

| Stat | Description |
|---|---|
| 14.8M | biological interactions analyzed |
| 72× | faster candidate screening |
| 91% | validation confidence |

These numbers are fictional portfolio content unless otherwise documented. Do not present them as real-world claims.

### Motion

Numbers should affect the surrounding scientific visualization. Examples:
- **14.8M** → network population increases
- **72×** → candidate set compresses
- **91%** → network stabilizes

Avoid generic counting animation as the only visual effect.

---

## 12. Section 08 — Final CTA

### Height

Approximately **100svh**

### Purpose

Resolve complexity into clarity.

**Visual narrative:**
```
network
   ↓
selected signals
   ↓
single clean biological form
```

**Headline:**
> From biological complexity to human possibility.

**CTA:** Explore the science

**Secondary brand line:**
> NOVA/GEN
> Biology, made programmable.

---

## 13. Page Motion Rhythm

The page should follow:

```
WOW
 ↓
WOW
 ↓
WOW
 ↓
QUIET
 ↓
INFORMATION
 ↓
INTERACTION
 ↓
QUIET
 ↓
WOW
```

Not every section should be visually intense.

---

## 14. Persistent WebGL Architecture

Use one persistent canvas.

```jsx
<App>

  <ExperienceCanvas />

  <Website>
    <Header />
    <Hero />
    <Journey />
    <Innovation />
    <Technology />
    <Capabilities />
    <Research />
    <Impact />
    <FinalCTA />
  </Website>

</App>
```

Do not create:
- `HeroCanvas`
- `ResearchCanvas`
- `CapabilityCanvas`
- `StatsCanvas`

...unless a technical requirement proves it necessary.

---

## 15. Animation Ownership

| Library | Responsible for |
|---|---|
| **GSAP** | ScrollTrigger, pinned sections, DOM transitions, text reveals, counters, section timing, journey progress |
| **React Three Fiber** | particles, networks, WebGL scene, shaders, signal visualizations, depth effects |
| **Lenis** | smooth scrolling only |
| **Zustand** | journey progress, current biological state, viewport/device state if required |

---

## 16. Accessibility

Every section must remain understandable without animation.

Support: `@media (prefers-reduced-motion: reduce)`

**Requirements:**
- semantic heading hierarchy
- real HTML buttons/links
- keyboard accessibility
- sufficient contrast
- decorative WebGL hidden from screen readers
- important text must never exist only inside Canvas

---

## 17. Performance

Desktop target: **60 FPS** where practical

**Requirements:**
- one WebGL canvas
- DPR capped
- lazy-load heavy content
- compressed WebP/AVIF assets
- avoid allocations inside `useFrame`
- reduce particles on mobile
- reduce shader complexity on low-power devices
- do not preload every large image unnecessarily