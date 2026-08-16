/**
 * GLSL for the closing biological cell.
 *
 * Two small programs and nothing else. §52 asks this to be the lightest dark
 * scene on the page, and it is: one quad, thirty-four points, no post-processing
 * and no per-frame allocation. Everything the membrane, the filaments and the
 * glow need is solved analytically from one distance and one angle.
 *
 * The membrane program has one hard requirement that is easy to lose sight of:
 * **at uSpan = 0 and uForm = 0 it must draw exactly what Impact's seed draws.**
 * The two falloff constants below (46.0 and the 15/5 pair) are copied from
 * `ImpactSeed`, and `uSpan` divides the distance rather than scaling the mesh,
 * so the inherited point keeps its size on screen while the frame it is drawn
 * in grows around it. That is what makes the handoff one object instead of a
 * cross-fade between two.
 */

export const CELL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const CELL_FRAG = /* glsl */ `
  precision highp float;

  uniform float uSpan;      // how much of the quad the membrane occupies
  uniform float uCoreSpan;  // the same, for the inherited point
  uniform float uForm;      // 0 → 1, membrane formation
  uniform float uInterior;  // 0 → 1, filaments
  uniform float uOpacity;
  uniform float uTime;
  uniform float uRadius;    // membrane radius, in normalized units
  uniform vec3  uCore;
  uniform vec3  uHalo;
  uniform vec3  uMembrane;

  varying vec2 vUv;

  void main() {
    vec2 v = (vUv - 0.5) * 2.0;

    // Two spans, not one. The membrane's frame opens out to fill the quad while
    // the inherited point stays roughly the size Impact left it — §21 wants a
    // small luminous core inside a 360px membrane, and a single span would
    // scale the point along with the boundary and end on a 130px glowing blob
    // with a ring around it. At uForm = 0 the two spans are equal and this is
    // Impact's seed exactly.
    vec2  q  = v / max(uSpan, 0.0001);
    float d  = length(q);
    float dc = length(v) / max(uCoreSpan, 0.0001);

    // A little past the membrane, so the outer falloff is not cut square.
    if (d > 1.35) discard;

    float ang = atan(q.y, q.x);

    // §23 — the boundary is not a circle primitive. Two low harmonics, drifting
    // far too slowly to read as a loop, are the difference between a living
    // membrane and a ring. Amplitude is under 3% of the radius: any more and
    // the closing frame acquires a wobble the eye starts tracking.
    float wob = sin(ang * 3.0 + uTime * 0.09) * 0.017
              + sin(ang * 2.0 - uTime * 0.061) * 0.012;
    float R = uRadius * (1.0 + wob * uForm);

    // Inherited from Impact, unchanged.
    float core = exp(-dc * dc * 46.0);
    float halo = exp(-dc * dc * 15.0) * 0.24 + exp(-dc * dc * 5.0) * 0.05;

    // §22 — a translucent skin, not a drawn ring. The rim is thin (about 4% of
    // the radius) and dim; most of what makes the boundary legible is the
    // interior wash falling away behind it, which is how a membrane reads and
    // how a stroke does not.
    float rim = exp(-pow((d - R) / (0.028 * uRadius / 0.62), 2.0));
    float inside = smoothstep(R, R - 0.5, d);

    // §22 — a few Bio Green filaments, not a diagram. Two soft arcs at
    // different radii, each modulated around the circumference so that most of
    // each one is simply absent: clamping at zero clips the negative half of
    // the wave, so neither ever closes into a complete ring.
    float f1 = exp(-pow((d - R * 0.46) / 0.055, 2.0))
             * (sin(ang + uTime * 0.07 + 1.1) - 0.15);
    float f2 = exp(-pow((d - R * 0.72) / 0.04, 2.0))
             * (sin(ang * 2.0 - uTime * 0.052) - 0.25);
    float fil = max(0.0, f1) * 0.10 + max(0.0, f2) * 0.075;

    // §23 — 0.995 → 1.005 of perceived scale over ~12s, expressed as brightness
    // rather than as a transform so nothing on screen actually moves.
    float breathe = 0.955 + 0.045 * sin(uTime * 0.52);

    vec3 c = uMembrane;
    c = mix(c, uHalo, clamp(rim * 0.75 + fil * 2.4 + inside * 0.08, 0.0, 1.0));
    // §22 — the core resolves toward soft Bio Green rather than staying the
    // near-white the collapsed target ends on. It cannot start there: at
    // uForm = 0 this fragment has to be the seed.
    c = mix(c, mix(uCore, uHalo, 0.34 * uForm), core);

    float a = (core + halo) * breathe
            // Faint on purpose: the headline crosses the upper arc of the
            // membrane at every desktop width, and a boundary bright enough to
            // be read as a stroke over type would be a circle drawn on the
            // page rather than a form behind it (§11).
            + (rim * 0.17 + inside * 0.038) * uForm
            + fil * uInterior;
    a *= uOpacity;

    if (a < 0.004) discard;
    gl_FragColor = vec4(c, a);
  }
`

/**
 * The interior signal points (§20).
 *
 * Their orbits are solved in the vertex shader from four attributes, so the
 * whole population is one static buffer that is never rewritten — the section
 * that has to be the page's quietest is not the place to be uploading a
 * position array every frame.
 *
 * `cellPointAt` in cta.constants is the same arithmetic, and the drawn cell
 * used below 769px projects *that*. The two presentations therefore show one
 * arrangement rather than two.
 */
export const POINT_VERT = /* glsl */ `
  precision highp float;

  attribute float aRadius;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aTilt;
  attribute float aSize;

  uniform float uTime;
  uniform float uSpan;
  uniform float uRadius;
  uniform float uScale;   // world half-extent of the quad these orbit inside
  uniform float uPixel;   // device pixel ratio

  varying float vFade;

  void main() {
    float a = aPhase + uTime * aSpeed;
    float r = aRadius * uRadius * uSpan * uScale;

    vec3 p = vec3(
      cos(a) * r,
      sin(a) * r * aTilt,
      sin(a * 0.7 + aPhase) * r * 0.34
    );

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Depth reads as brightness rather than as size: a point on the far side of
    // the membrane is behind something translucent, not further away.
    vFade = 0.45 + 0.55 * smoothstep(-1.0, 1.0, sin(a * 0.7 + aPhase));

    // Referenced to the camera's resting distance, so a point keeps its size
    // whatever the frustum is; the orbit's own z only ever moves it a little.
    gl_PointSize = aSize * 2.2 * uPixel * (5.0 / -mv.z);
  }
`

export const POINT_FRAG = /* glsl */ `
  precision highp float;

  uniform float uOpacity;
  uniform vec3  uColor;

  varying float vFade;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float a = exp(-d * d * 4.2) * vFade * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
  }
`
