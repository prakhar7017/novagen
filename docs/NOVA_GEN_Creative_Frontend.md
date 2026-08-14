# NOVA/GEN Creative Frontend

We are building a premium biotechnology landing page.

## Product goal

The website must feel like a real computational biology company,
not a generic SaaS template or frontend portfolio exercise.

The primary visual concept is:

LIFE → EXPLORE → DECODE → INTERPRET → DISCOVER → IMPACT

The entire website should feel like one continuous scientific experience.

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- GSAP + ScrollTrigger
- @gsap/react
- Lenis
- Three.js
- @react-three/fiber
- @react-three/drei
- Zustand

Do not add additional animation frameworks without approval.

## Animation ownership

GSAP:
- page scroll choreography
- pinned sections
- typography reveals
- DOM transitions
- counters
- section transitions

React Three Fiber:
- particles
- scientific network
- organism enhancements
- genetic signals
- WebGL effects

Lenis:
- smooth scrolling only

Zustand:
- shared scroll/scene state

## Visual identity

Colors:

Abyss: #07110F
Deep Tissue: #0E1D17
Bio Green: #A6FF6A
Signal Mint: #C6F5E1
Bone: #F5F7F4
Muted: #8D9B93

Visual style:
- dark microscopic environments
- translucent biological membranes
- green bioluminescence
- mint rim lighting
- subtle scientific metadata
- editorial typography
- controlled negative space
- subtle grain
- premium pharmaceutical/computational biology aesthetic

Avoid:
- generic purple gradients
- glassmorphism everywhere
- DNA helix hero
- excessive glowing borders
- random fade-up animations
- stock SaaS layouts
- excessive card grids
- animation without narrative purpose

## Performance

Use one persistent WebGL Canvas.

Do not create a Canvas for every section.

Support prefers-reduced-motion.

Provide a simplified mobile scene.

Do not render unnecessary Three.js objects when offscreen.

Never sacrifice UX for visual effects.

## Workflow

Before implementing a major section:
1. Read relevant docs.
2. Inspect existing implementation.
3. Produce a plan.
4. Implement only the requested section.
5. Run typecheck.
6. Run build.
7. Test visually.
8. Fix visual differences before moving on.

Do not redesign approved sections unless explicitly asked.
