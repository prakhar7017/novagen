/**
 * GLSL for the Technology platform.
 *
 * Four small programs — nodes, connections, confidence rings and the specimen —
 * all driven from the same section progress, so any frame is reproducible and
 * scrubbing backward is exact rather than merely approximate.
 *
 * The motion here is deliberately tighter than the Journey's: a fraction of the
 * per-particle desync, no elastic settling, no large travel. §40 wants this
 * section to read as an instrument, and that difference lives mostly in these
 * constants.
 */
import { NOISE } from '@/scene/Journey/shaders'

/**
 * Chained clamped mixes across the five arrangements. Identical in form to the
 * Journey's morph so the two sections interpolate the same way, but with a much
 * smaller stagger: the platform reorganises as a system, not as a swarm.
 */
const TECH_MORPH = /* glsl */ `
  attribute vec3  aSample;
  attribute vec3  aMap;
  attribute vec3  aInterpret;
  attribute vec3  aPredict;
  attribute vec3  aValidate;
  attribute float aRandom;
  attribute float aStrength;
  attribute float aWinner;

  uniform float uMorph;    // 0 → 4
  uniform float uStagger;

  vec3 morphedPosition() {
    // The desync has to vanish at every whole step or no arrangement is ever
    // actually formed — same reasoning as the Journey, smaller amplitude.
    float f = fract(uMorph);
    float settle = 1.0 - abs(f - 0.5) * 2.0;
    settle = settle * settle * (3.0 - 2.0 * settle);
    float m = clamp(uMorph + (aRandom - 0.5) * uStagger * settle, 0.0, 4.0);

    vec3 p = aSample;
    p = mix(p, aMap,       clamp(m,       0.0, 1.0));
    p = mix(p, aInterpret, clamp(m - 1.0, 0.0, 1.0));
    p = mix(p, aPredict,   clamp(m - 2.0, 0.0, 1.0));
    p = mix(p, aValidate,  clamp(m - 3.0, 0.0, 1.0));
    return p;
  }

  /** Low-amplitude drift so the field is alive without ever looking organic. */
  vec3 drift(vec3 p, float t) {
    float ph = aRandom * 6.2831;
    p.x += sin(t * 0.16 + ph) * 0.012;
    p.y += cos(t * 0.13 + ph * 1.7) * 0.010;
    return p;
  }
`

// ── Nodes ───────────────────────────────────────────────────────────────────

export const NODE_VERT = /* glsl */ `
  precision highp float;

  ${TECH_MORPH}

  attribute vec3  aColor;
  attribute float aSize;

  uniform float uTime;
  uniform float uReveal;     // signal emergence at the section entrance
  uniform float uSelect;     // predict: everything unimportant recedes
  uniform float uValidate;   // validate: only the winning cluster survives
  uniform float uExit;       // handoff toward Capabilities
  uniform float uSizeScale;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = drift(morphedPosition(), uTime);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // gl_PointSize is in framebuffer pixels and uSizeScale carries the device
    // pixel ratio, so the apparent size is resolution-independent: this lands
    // cells between roughly 3 and 10 CSS pixels. Much smaller and the map reads
    // as dust rather than as located biological material.
    gl_PointSize = aSize * uSizeScale * (20.0 / -mv.z);
    gl_Position = projectionMatrix * mv;

    // Nodes resolve one by one out of the field rather than fading in as a
    // block (§42).
    float born = smoothstep(aRandom * 0.7, aRandom * 0.7 + 0.3, uReveal);

    // Filtering, drawn as brightness rather than as a chart: weak signals sink
    // toward the background while the shortlisted clusters hold.
    float select = mix(1.0, 0.14 + 0.86 * smoothstep(0.45, 0.9, aStrength), uSelect);
    float survive = mix(1.0, aWinner, uValidate);

    // Barely-there breathing — a fifth of the Journey's, and out of phase per
    // node so nothing pulses in unison.
    float live = 0.82 + 0.18 * sin(uTime * 0.4 + aRandom * 6.2831);

    vColor = aColor;
    vAlpha = born * select * survive * live * (1.0 - uExit * 0.55);
  }
`

export const NODE_FRAG = /* glsl */ `
  precision highp float;
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    // Tighter falloff than the Journey's particles: these are measurements, so
    // they read as points with a small halo rather than as soft motes.
    float a = (exp(-d * d * 5.5) * 0.72 + smoothstep(1.0, 0.35, d) * 0.18) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

// ── Connections ─────────────────────────────────────────────────────────────

export const TECH_LINE_VERT = /* glsl */ `
  precision highp float;

  ${TECH_MORPH}

  uniform float uTime;
  uniform float uDraw;      // 0 → 1 as the network is traced in
  uniform float uSelect;
  uniform float uValidate;

  varying float vFade;
  varying float vStrength;

  void main() {
    vec3 pos = drift(morphedPosition(), uTime);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    // Each endpoint crosses its own threshold, so a connection brightens from
    // one end to the other — the network is drawn, not faded up (§40).
    float drawn = smoothstep(aRandom * 0.7, aRandom * 0.7 + 0.3, uDraw);

    // Weak pathways dim first; the important ones hold through the filter.
    float select = mix(1.0, 0.1 + 0.9 * smoothstep(0.5, 0.92, aStrength), uSelect);
    // Half weight, not full: what remains around the validated target should
    // read as a few converging evidence signals, not as the network again.
    float survive = mix(1.0, aWinner * 0.5, uValidate);

    vStrength = aStrength;
    vFade = drawn * select * survive * (0.55 + 0.45 * sin(uTime * 0.25 + aRandom * 6.2831));
  }
`

export const TECH_LINE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3  uColor;      // Signal Mint — the bulk of the network
  uniform vec3  uActive;     // Bio Green — the few active pathways
  uniform float uOpacity;
  varying float vFade;
  varying float vStrength;

  void main() {
    float a = uOpacity * vFade;
    if (a < 0.004) discard;
    // Only the strongest pathways take the accent, and the ramp is narrow so
    // the network never turns green as a whole (§26).
    vec3 c = mix(uColor, uActive, smoothstep(0.72, 0.95, vStrength));
    gl_FragColor = vec4(c, a);
  }
`

// ── Confidence rings ────────────────────────────────────────────────────────

export const RING_VERT = /* glsl */ `
  precision highp float;

  attribute vec3  aAnchor;
  attribute float aAngle;    // radians around the ring
  attribute float aRadius;
  attribute float aConf;     // 0–1 confidence, drawn as arc length
  attribute float aWinner;

  uniform float uValidate;   // winner travels to the centre, others dissolve
  uniform float uAppear;     // arcs sweep in

  varying float vT;
  varying float vConf;
  varying float vWinner;

  void main() {
    // The winning ring migrates to the target at the centre of the frame; the
    // rest stay where the prediction put them and fade out around it.
    vec3 base = mix(aAnchor, vec3(0.0), uValidate * aWinner);
    // The surviving ring opens out as it arrives at the centre, so it frames
    // the validated candidate instead of sitting on top of it.
    float r = aRadius * (1.0 + 1.35 * uValidate * aWinner);

    vec3 pos = base + vec3(cos(aAngle) * r, sin(aAngle) * r, 0.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    // 0 at twelve o'clock, increasing clockwise, so the arc reads like an
    // instrument dial rather than a progress bar.
    vT = fract((1.5707963 - aAngle) / 6.2831853 + 1.0);
    vConf = aConf * uAppear;
    vWinner = aWinner;
  }
`

export const RING_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3  uColor;
  uniform vec3  uActive;
  uniform float uOpacity;
  uniform float uValidate;
  varying float vT;
  varying float vConf;
  varying float vWinner;

  void main() {
    // Faint full track plus the confidence arc over it.
    float arc = smoothstep(vConf + 0.008, vConf - 0.008, vT);
    float a = uOpacity * (0.14 + 0.86 * arc) * mix(1.0, vWinner, uValidate);
    if (a < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, uActive, arc * vWinner), a);
  }
`

// ── Specimen ────────────────────────────────────────────────────────────────

export const SPECIMEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const SPECIMEN_FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uMap;
  uniform float uReveal;   // 0 → 1: the specimen resolves out of the field
  uniform float uErode;    // 0 → 1: the membrane opens as the map takes over
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3  uEdge;

  varying vec2 vUv;

  ${NOISE}

  void main() {
    // Membrane motion: a slow, tiny distortion that stops the specimen reading
    // as a photograph pinned to the screen. It stills as the sample opens.
    vec2 uv = vUv + vec2(
      sin(vUv.y * 9.0 + uTime * 0.22),
      cos(vUv.x * 8.0 - uTime * 0.19)
    ) * 0.0032 * (1.0 - uErode);

    vec4 tex = texture2D(uMap, uv);

    float n = fbm(vUv * 3.6);

    // Entrance: brighter biological material resolves first, so the specimen
    // assembles out of signal rather than cross-fading in.
    float appear = smoothstep(n * 0.5, n * 0.5 + 0.5, uReveal);

    // Erosion sweeps a soft threshold across the same field. Biased by radius
    // so the outer membrane opens before the dense interior — the internal
    // structure is what survives longest, which is the point of the transition.
    float field = n * 0.62 + (1.0 - clamp(length(vUv - 0.5) * 1.9, 0.0, 1.0)) * 0.38;
    float thr = mix(-0.18, 1.18, uErode);
    float open = smoothstep(thr - 0.18, thr + 0.18, field);

    float alpha = tex.a * appear * open * uOpacity;

    // A restrained emission along the opening edge, the same language as the
    // Journey's dissolve but at roughly half the gain.
    float band = exp(-pow((field - thr) / 0.18, 2.0) * 1.7);
    vec3 rgb = tex.rgb + uEdge * band * 0.34 * tex.a * uOpacity;

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(rgb, alpha);
  }
`
