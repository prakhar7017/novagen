# NOVA/GEN — Acceptance Criteria

## 1. Purpose

This document defines when a section or feature is considered complete.

Claude must not stop merely because:
- the page renders

or
- the animation technically works

A task is complete only when the relevant acceptance criteria pass.

---

## 2. Global Definition of Done

Every major implementation must pass:

- DESIGN
- RESPONSIVENESS
- ANIMATION
- ACCESSIBILITY
- PERFORMANCE
- CODE QUALITY
- BROWSER VERIFICATION
- PRODUCTION BUILD

---

## 3. Required Verification Loop

After implementing a major section:

1. Run development server
2. Open browser
3. Test desktop
4. Take screenshot
5. Compare against approved reference/specification
6. Identify largest differences
7. Fix differences
8. Re-check browser
9. Test tablet
10. Test mobile
11. Check console
12. Run typecheck
13. Run lint
14. Run tests if applicable
15. Run production build

Do not stop after the first visually functional implementation.

---

## 4. Standard Viewports

Always verify:

| Device | Viewport |
|---|---|
| Desktop | 1440 × 900 |
| Laptop | 1280 × 800 |
| Tablet | 768 × 1024 |
| Mobile | 390 × 844 |
| Optional small mobile | 360 × 800 |

---

## 5. Global Visual Criteria

The site must feel:
- scientific
- premium
- experimental
- restrained
- precise
- contemporary
- coherent

It must **NOT** feel:
- generic SaaS
- gaming website
- crypto website
- generic AI startup
- Dribbble clone
- template
- excessive sci-fi dashboard

---

## 6. Color Criteria

**Approved colors:**

| Name | Hex |
|---|---|
| Abyss | `#07110F` |
| Deep Tissue | `#0E1D17` |
| Bio Green | `#A6FF6A` |
| Signal Mint | `#C6F5E1` |
| Bone | `#F5F7F4` |
| Muted | `#8D9B93` |

Do not introduce unrelated purple/blue/pink gradients without approval.

---

## 7. Typography Criteria

**Headings must:**
- have strong editorial scale
- maintain readable line length
- avoid excessive gradient fills
- remain visually dominant

**Body text:**
- desktop approximately 17–20px
- mobile approximately 16–18px

**Scientific metadata:**
- approximately 10–13px
- monospace
- uppercase when appropriate
- higher letter spacing

No essential text may be rendered only inside Canvas.

---

## 8. Hero Acceptance Criteria

Hero passes when:

### Desktop
- fills at least 100svh
- no horizontal overflow
- organism occupies approximately right 50–57%
- headline occupies left area
- left text remains fully readable
- organism does not visually collide with CTA
- header remains visible
- headline has strong hierarchy
- CTA is immediately identifiable
- background remains dark and restrained

### Visual

The hero must communicate biotechnology without requiring text.

**Avoid:**
- DNA helix
- random abstract sphere
- generic gradient orb
- glass card dashboard
- unrelated molecule floating in space

### Motion
- load animation feels smooth
- organism movement is subtle
- no visible looping jump
- cursor interaction remains under approximately 8–12px translation
- reduced-motion mode removes continuous movement

### Performance
- no major frame drops
- image correctly optimized
- WebGL does not block first meaningful content

---

## 9. Journey Acceptance Criteria

The biological journey is the highest-priority experience.

It passes only when:

```
Organism
   →
Cell Cluster
   →
Nucleus
   →
Particle Field
   →
Genetic Signal
   →
Network
   →
Candidate
```

feels like one continuous transformation.

### Transition Criteria

Transitions must **NOT** primarily rely on:
- opacity crossfade

Use transformations such as:
- noise dissolve
- particle breakup
- scale transition
- shader threshold
- network reorganization
- signal compression

Crossfade is allowed only as reduced-motion fallback.

### Scroll Criteria
- scroll progress maps predictably to animation
- scrolling backward correctly reverses transformations
- no major state jumps
- no stuck pinned section
- no sudden layout shifts
- state remains stable when user pauses scrolling

---

## 10. Innovation Acceptance Criteria

### Desktop
- editorial copy clearly dominant
- right-side scientific visual supports text
- content does not resemble generic feature section
- negative space remains intentional

### Animation
- one primary reveal
- no repeated fade-up pattern
- visual movement supports the scientific story

### Mobile
- copy appears before non-essential visual
- section readable without animation

---

## 11. Technology Acceptance Criteria

Pipeline must clearly communicate:

```
SAMPLE → MAP → INTERPRET → PREDICT → VALIDATE
```

- User should understand the sequence without needing animation.
- Active stage must be visually distinguishable.
- Desktop and mobile layouts may differ.
- No horizontal overflow on mobile.

---

## 12. Capability Card Acceptance Criteria

Every card must include:
- title
- concise description
- custom scientific visual
- accessible interaction

- Each capability should have a distinct micro-interaction.
- Do not use generic scale-up hover as the primary interaction.
- Hover must not make text difficult to read.
- Touch devices must not depend on hover.

---

## 13. Research Acceptance Criteria

Research section should feel editorial.

**Requirements:**
- high-quality microscopy imagery
- coherent image grading
- strong typography
- no repetitive generic blog cards
- enough whitespace to contrast cinematic sections

Images must have meaningful alt text when informational. Decorative images should use empty alt or appropriate semantics.

---

## 14. Impact Acceptance Criteria

Numbers must have visible contextual meaning.

**Example:**
> 14.8M — biological interactions analyzed

- The number must not appear without explanation.
- If numbers are fictional portfolio data, they should not be presented in a misleading real-world context.
- Animation should connect statistics to scientific visuals.

---

## 15. Final CTA Acceptance Criteria

Final CTA must feel visually different from the middle of the site. It should resolve complexity.

**Requirements:**
- one strong headline
- one dominant CTA
- visual breathing room
- clear brand lockup
- no excessive interface decoration

**Target emotional feeling:**
- clarity
- optimism
- human possibility

---

## 16. Responsive Acceptance Criteria

At every supported viewport:
- no horizontal scrollbar
- no clipped body text
- no inaccessible CTA
- no oversized fixed canvas blocking content
- no overlapping headings
- no content hidden behind navigation
- images preserve meaningful focal point

Mobile should simplify rather than merely shrink.

---

## 17. Accessibility Acceptance Criteria

**Required:**
- correct heading hierarchy
- semantic buttons and links
- keyboard navigability
- visible focus states
- sufficient color contrast
- reduced-motion support
- meaningful image alt text
- decorative WebGL ignored by assistive technology

Essential information must remain available when:
- JavaScript animation is disabled, **or**
- `prefers-reduced-motion` is enabled

---

## 18. Reduced Motion Acceptance Criteria

When `prefers-reduced-motion: reduce` is active:

**Disable or greatly reduce:**
- continuous organism breathing
- cursor parallax
- large scroll-linked camera movement
- particle explosions
- long pinned sequences

**Replace major story transitions with:**
- short crossfades
- static states
- normal scrolling

Content must remain complete.

---

## 19. WebGL Acceptance Criteria

Use one persistent Canvas where practical.

**Canvas must:**
- not intercept text interaction
- resize correctly
- handle tab visibility changes
- avoid excessive DPR
- release resources appropriately
- avoid allocations every frame
- avoid loading unnecessary geometries

**Recommended DPR:**
- desktop max approximately 1.5–2
- mobile approximately 1–1.5

Exact value may be adaptive.

---

## 20. Performance Acceptance Criteria

**Goals:**

| Platform | Goal |
|---|---|
| Desktop | smooth motion around 60 FPS where practical |
| Mobile | stable and responsive rather than visually maximal |

**Requirements:**
- optimized WebP/AVIF
- lazy-load below fold media
- no huge uncompressed PNGs
- no unnecessary video backgrounds
- no multiple simultaneous WebGL canvases
- no excessive React state updates during animation

Avoid forcing React re-renders on every animation frame.

---

## 21. Console Acceptance Criteria

Browser console must have: **0 uncaught errors**

Avoid unresolved warnings. Known harmless third-party warnings must be documented if they cannot be removed.

---

## 22. TypeScript Acceptance Criteria

Run:
```
pnpm typecheck
```

Required result: **0 errors**

Do not use widespread `any` to silence typing problems.

---

## 23. Lint Acceptance Criteria

Run:
```
pnpm lint
```

Required: **0 errors**

Warnings should also be resolved unless intentionally documented.

---

## 24. Build Acceptance Criteria

Run:
```
pnpm build
```

Required: **successful production build**

A feature is not complete if it works only in dev mode.

---

## 25. Testing Acceptance Criteria

Use automated tests where they provide meaningful value.

**Examples:**
- navigation behavior
- mobile menu
- reduced-motion behavior
- CTA actions
- content rendering
- responsive state logic
- animation helper utilities

Do not write meaningless snapshot tests simply to increase test count.

---

## 26. Visual Review Checklist

After every major section, inspect:

| Category | Question |
|---|---|
| COMPOSITION | Does visual weight match the intended layout? |
| TYPOGRAPHY | Is heading scale correct? |
| NEGATIVE SPACE | Is the section too crowded? |
| COLOR | Is green being overused? |
| MOTION | Does animation explain something? |
| DENSITY | Are there too many visual elements? |
| SCIENCE | Does this feel biological rather than generic sci-fi? |
| POLISH | Are borders, spacing, easing and alignment consistent? |

---

## 27. Automatic Failure Conditions

A section should be considered **NOT approved** if any of these occur:

- purple generic gradient introduced
- DNA helix used as main hero
- multiple unrelated animation styles
- excessive glassmorphism
- repeated fadeInUp for most elements
- major text inside Canvas
- horizontal overflow
- poor mobile adaptation
- animation ignores reduced-motion
- console errors
- TypeScript errors
- production build failure
- WebGL dramatically hurts usability

---

## 28. Claude Completion Behavior

Claude must not say **"Done."** immediately after implementation.

Before completion it should report:

**IMPLEMENTED**
- What changed.

**VISUAL VERIFICATION**
- Which viewports were inspected.

**TECHNICAL VERIFICATION**
- typecheck
- lint
- tests
- build

**KNOWN DIFFERENCES**
- Anything that still differs from the specification.

**PERFORMANCE NOTES**
- Any intentional fallbacks or simplifications.

If an acceptance criterion is still failing, Claude should continue iterating unless:
- required information is missing
- a required external asset does not exist
- fixing it requires changing an approved design decision
- the operation presents significant risk

---

## 29. Final Project Acceptance

The project is complete when a reviewer can:

- open the homepage
- understand NOVA/GEN immediately
- recognize a distinct visual identity
- experience one coherent biological transformation
- understand the technology
- navigate comfortably on desktop and mobile
- use the page with reduced motion
- experience smooth performance
- see no obvious template patterns
- remember the website after closing it

**The intended memory should be:**

> "The biotech site where the living organism turns into biological data and discovery."