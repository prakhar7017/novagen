/**
 * GLSL for the Biological Journey.
 *
 * Two reusable programs:
 *   DISSOLVE_* — procedural noise threshold between two biological images
 *   PARTICLE_* / LINE_* — the morphing signal population
 *
 * Both are driven entirely by uniforms set from scroll progress, so every
 * frame is reproducible and scrubbing backward is exact.
 */

// ── Shared noise ────────────────────────────────────────────────────────────
// Hash-based value noise + 4-octave fbm. Cheap enough for a fullscreen pass on
// integrated GPUs and avoids shipping a noise texture.
export const NOISE = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i),                 hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0,1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
`

// ── Dissolve ────────────────────────────────────────────────────────────────

export const DISSOLVE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const DISSOLVE_FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform vec2  uScaleA;
  uniform vec2  uOffsetA;
  uniform vec2  uScaleB;
  uniform vec2  uOffsetB;

  /** 0 = fully A, 1 = fully B (or fully eroded when uHasB is 0) */
  uniform float uProgress;
  uniform float uHasB;
  uniform float uAlpha;
  uniform float uTime;

  uniform float uNoiseScale;
  uniform float uEdgeWidth;
  uniform float uEdgeGlow;
  uniform vec3  uEdgeColor;

  varying vec2 vUv;

  ${NOISE}

  void main() {
    // Threshold field. Remapped so the sweep spends its time in the range the
    // fbm actually occupies rather than stalling in the empty tails.
    float raw = fbm(vUv * uNoiseScale + uTime * 0.012);
    float n = smoothstep(0.28, 0.70, raw);

    // Sweep the cut across [0,1] with the soft band fully clearing both ends
    float thr = mix(-uEdgeWidth, 1.0 + uEdgeWidth, uProgress);
    float m = smoothstep(thr + uEdgeWidth, thr - uEdgeWidth, n);

    vec4 a = texture2D(uTexA, (vUv - 0.5) * uScaleA + 0.5 + uOffsetA);
    vec4 b = texture2D(uTexB, (vUv - 0.5) * uScaleB + 0.5 + uOffsetB) * uHasB;

    vec4 col = mix(a, b, m);

    // Fragments near the cut break into microscopic specks rather than a
    // clean wipe — this is what sells "membrane destabilising".
    float band = exp(-pow((n - thr) / max(uEdgeWidth, 0.001), 2.0) * 1.6);
    float speck = vnoise(vUv * uNoiseScale * 9.0 + 17.0);
    col.a *= 1.0 - band * 0.55 * step(speck, 0.42);

    // Bio-green emission along the dissolving boundary
    col.rgb += uEdgeColor * band * uEdgeGlow * max(a.a, b.a);

    gl_FragColor = vec4(col.rgb, col.a * uAlpha);
    if (gl_FragColor.a < 0.004) discard;
  }
`

// ── Particles ───────────────────────────────────────────────────────────────

/**
 * Chained clamped mixes give exact piecewise-linear interpolation across the
 * five arrangements: at m = 2.5 the first two mixes have saturated to `signal`
 * and only the signal→network term is partial.
 */
const MORPH = /* glsl */ `
  attribute vec3  aNucleus;
  attribute vec3  aField;
  attribute vec3  aSignal;
  attribute vec3  aNetwork;
  attribute vec3  aCandidate;
  attribute float aRandom;

  uniform float uMorph;     // 0 → 4
  uniform float uStagger;   // per-particle desync, keeps motion organic

  vec3 morphedPosition() {
    // The stagger has to vanish whenever uMorph rests on an arrangement.
    // Applied flat, it means no arrangement is ever actually formed: half the
    // population is still arriving from the previous shape while the other half
    // has already set off for the next, and readable structure (the expression
    // columns especially) dissolves into an undifferentiated cloud. Weighting
    // it by distance from the nearest whole step keeps transitions organic and
    // still lets every state resolve completely.
    float f = fract(uMorph);
    float settle = 1.0 - abs(f - 0.5) * 2.0;
    settle = settle * settle * (3.0 - 2.0 * settle);
    float m = clamp(uMorph + (aRandom - 0.5) * uStagger * settle, 0.0, 4.0);
    vec3 p = aNucleus;
    p = mix(p, aField,     clamp(m,       0.0, 1.0));
    p = mix(p, aSignal,    clamp(m - 1.0, 0.0, 1.0));
    p = mix(p, aNetwork,   clamp(m - 2.0, 0.0, 1.0));
    p = mix(p, aCandidate, clamp(m - 3.0, 0.0, 1.0));
    return p;
  }
`

export const PARTICLE_VERT = /* glsl */ `
  precision highp float;

  ${MORPH}

  attribute vec3  aColor;
  attribute float aSize;

  uniform float uTime;
  uniform float uReveal;     // 0 → 1 as particles emerge from the nucleus
  uniform float uSizeScale;
  uniform float uDim;        // late-stage density falloff
  uniform vec2  uPointer;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = morphedPosition();

    // Constant low-amplitude wander so the field never looks frozen
    float ph = aRandom * 6.2831;
    pos.x += sin(uTime * 0.21 + ph) * 0.035;
    pos.y += cos(uTime * 0.17 + ph * 1.7) * 0.030;
    pos.z += sin(uTime * 0.13 + ph * 2.3) * 0.025;

    // Very subtle spatial response to the cursor (spec caps this at 4–8px)
    pos.xy += uPointer * (0.06 + aRandom * 0.05);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // gl_PointSize is in framebuffer pixels. The perspective divisor keeps
    // depth cues, but the constant must stay small: the visible frame is only
    // ~4.7 world units tall, so a large multiplier turns each "microscopic
    // signal" into a screen-filling blob. uSizeScale carries the device pixel
    // ratio so apparent size is resolution-independent.
    gl_PointSize = aSize * uSizeScale * (11.0 / -mv.z);
    gl_Position = projectionMatrix * mv;

    // Staggered emergence: each particle has its own reveal threshold
    float born = smoothstep(aRandom * 0.85, aRandom * 0.85 + 0.15, uReveal);

    vColor = aColor;
    vAlpha = born * (0.35 + 0.65 * abs(sin(uTime * 0.5 + ph))) * uDim;
  }
`

export const PARTICLE_FRAG = /* glsl */ `
  precision highp float;
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float a = exp(-d * d * 4.5) * vAlpha * 0.62;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

// ── Network connections ─────────────────────────────────────────────────────

export const LINE_VERT = /* glsl */ `
  precision highp float;

  ${MORPH}

  uniform float uTime;

  varying float vFade;

  void main() {
    vec3 pos = morphedPosition();

    float ph = aRandom * 6.2831;
    pos.x += sin(uTime * 0.21 + ph) * 0.035;
    pos.y += cos(uTime * 0.17 + ph * 1.7) * 0.030;
    pos.z += sin(uTime * 0.13 + ph * 2.3) * 0.025;

    // A slow travelling pulse brightens a few pathways at a time
    vFade = 0.35 + 0.65 * pow(abs(sin(uTime * 0.35 + ph * 3.0)), 3.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

export const LINE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3  uColor;
  uniform float uOpacity;
  varying float vFade;

  void main() {
    float a = uOpacity * vFade;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
  }
`
