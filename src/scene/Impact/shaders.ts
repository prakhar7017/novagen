/**
 * GLSL for the Impact network.
 *
 * Three small programs — the signal dust, the network nodes and the connections
 * between them — all driven from the same section progress, so any frame is
 * reproducible and scrubbing backward is exact rather than approximate (§57).
 *
 * The vocabulary here is deliberately *computational*: no elastic settling, no
 * explosive travel, and the reduction expressed mostly through brightness,
 * grouping and connection pruning rather than through speed (§20). What is left
 * moving is a drift small enough that a paused frame still composes.
 */

/**
 * Chained clamped mixes across the three arrangements, plus the extra
 * PRIORITIZE contraction.
 *
 * Same form as the Journey's and Technology's morph so all three sections
 * interpolate identically, with the smallest stagger on the page: this network
 * reorganises as a system being filtered, and a wide per-point desync would
 * smear the candidate regions into a cloud exactly when their separation is the
 * thing being explained.
 */
const IMPACT_MORPH = /* glsl */ `
  attribute vec3  aScale;
  attribute vec3  aPrioritize;
  attribute vec3  aValidate;
  attribute vec3  aInward;
  attribute float aRandom;
  attribute float aStrength;
  attribute float aWinner;

  uniform float uMorph;      // 0 → 2
  uniform float uCompress;   // extra tightening inside PRIORITIZE
  uniform float uStagger;

  vec3 morphedPosition() {
    // The desync has to vanish at every whole step or no arrangement is ever
    // actually formed — same reasoning as the Journey, a third the amplitude.
    float f = fract(uMorph);
    float settle = 1.0 - abs(f - 0.5) * 2.0;
    settle = settle * settle * (3.0 - 2.0 * settle);
    // Weak signals are released from the field first: their filter threshold is
    // lower, so the collapse begins at the edges of what matters (§19).
    float lead = (1.0 - aStrength) * 0.35;
    float m = clamp(uMorph + ((aRandom - 0.5) * uStagger + lead * uStagger) * settle, 0.0, 2.0);

    vec3 p = aScale;
    p = mix(p, aPrioritize, clamp(m,       0.0, 1.0));
    // The second squeeze belongs to the prioritized arrangement only — it is
    // scaled out by the validate mix so the two never stack.
    p += aInward * uCompress * 0.42 * clamp(m, 0.0, 1.0);
    p = mix(p, aValidate,    clamp(m - 1.0, 0.0, 1.0));
    return p;
  }

  /** Low-amplitude drift so the field is alive without ever looking organic. */
  vec3 drift(vec3 p, float t) {
    float ph = aRandom * 6.2831;
    p.x += sin(t * 0.15 + ph) * 0.014;
    p.y += cos(t * 0.12 + ph * 1.7) * 0.011;
    return p;
  }
`

// ── Signal dust ─────────────────────────────────────────────────────────────

/**
 * The 14.8M abstraction.
 *
 * §15 forbids drawing the real figure and §17 says the network, not the
 * counter, is the expression of scale — so this population's whole job is to be
 * too much to read, and then to visibly stop being that. It carries no
 * connections and never takes the accent colour.
 */
export const SIGNAL_VERT = /* glsl */ `
  precision highp float;

  ${IMPACT_MORPH}

  attribute vec3  aColor;
  attribute float aSize;

  uniform float uTime;
  uniform float uReveal;    // the field populates at the section entrance
  uniform float uFilter;    // 0 → 1: weak signals are set aside
  uniform float uValidate;  // 0 → 1: only the validated candidate survives
  uniform float uExit;      // the closing collapse toward one point
  uniform float uSizeScale;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = drift(morphedPosition(), uTime);
    // The exit draws everything left toward the seed the Final CTA grows from
    // (§53). Applied after the morph so it composes with whatever state the
    // reader paused in, rather than replacing it.
    pos = mix(pos, vec3(0.0, 0.0, pos.z * 0.4), uExit * 0.86);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // gl_PointSize is in framebuffer pixels and uSizeScale carries the device
    // pixel ratio, so apparent size is resolution-independent. This lands the
    // dust between roughly 1 and 3 CSS pixels — present as density, never as
    // individually readable objects.
    gl_PointSize = aSize * uSizeScale * (18.0 / -mv.z);
    gl_Position = projectionMatrix * mv;

    // The field populates point by point rather than fading in as a block, so
    // the entrance reads as scale accumulating (§15).
    float born = smoothstep(aRandom * 0.72, aRandom * 0.72 + 0.28, uReveal);

    // Filtering drawn as deactivation: almost all of the dust is below the
    // threshold, which is the point — 14.8M relationships are not 14.8M
    // findings. What survives keeps very nearly its full weight, so the state
    // change reads as *fewer* signals rather than as the same field dimmed.
    float pass = mix(1.0, smoothstep(0.42, 0.78, aStrength) * 0.85, uFilter);
    float survive = mix(1.0, aWinner * 0.7, uValidate);

    vColor = aColor;
    vAlpha = born * pass * survive * (1.0 - uExit * 0.72) * 0.78;
  }
`

export const SIGNAL_FRAG = /* glsl */ `
  precision highp float;
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    // A soft mote rather than a measured point: at this size the falloff is
    // most of what stops ~2,400 additive sprites reading as static.
    float a = exp(-d * d * 3.4) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

// ── Network nodes ───────────────────────────────────────────────────────────

export const NODE_VERT = /* glsl */ `
  precision highp float;

  ${IMPACT_MORPH}

  attribute vec3  aColor;
  attribute float aSize;

  uniform float uTime;
  uniform float uReveal;
  uniform float uFilter;
  uniform float uValidate;
  uniform float uSettle;    // 0 → 1: motion slows as confidence resolves (§23)
  uniform float uExit;
  uniform float uSizeScale;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Drift is damped rather than stopped: §23 asks the network to *slow* as it
    // stabilizes, and a field that freezes outright reads as a dropped frame.
    vec3 pos = drift(morphedPosition(), uTime * (1.0 - uSettle * 0.72));
    pos = mix(pos, vec3(0.0, 0.0, pos.z * 0.4), uExit * 0.86);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // Roughly 3–9 CSS pixels: located biological material, not dust.
    gl_PointSize = aSize * uSizeScale * (20.0 / -mv.z);
    gl_Position = projectionMatrix * mv;

    float born = smoothstep(aRandom * 0.6, aRandom * 0.6 + 0.34, uReveal);

    // Selective brightness rather than removal: the discarded regions are still
    // there, they have simply stopped being candidates (§20).
    float pass = mix(1.0, 0.1 + 0.9 * smoothstep(0.46, 0.86, aStrength), uFilter);
    float survive = mix(1.0, aWinner, uValidate);

    // Barely-there breathing, out of phase per node so nothing pulses in unison,
    // and quieter still once the target is settled.
    float live = 0.84 + 0.16 * sin(uTime * 0.38 + aRandom * 6.2831) * (1.0 - uSettle * 0.6);

    vColor = aColor;
    // The surviving target brightens as it becomes the only thing on screen —
    // the exit reduces the population, not the candidate (§54).
    vAlpha = born * pass * survive * live * (1.0 + uExit * aWinner * 0.35 - uExit * 0.15);
  }
`

export const NODE_FRAG = /* glsl */ `
  precision highp float;
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    // Tighter falloff than the dust: these are measurements, so they read as
    // points with a small halo.
    float a = (exp(-d * d * 5.2) * 0.74 + smoothstep(1.0, 0.4, d) * 0.16) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

// ── Connections ─────────────────────────────────────────────────────────────

export const LINE_VERT = /* glsl */ `
  precision highp float;

  ${IMPACT_MORPH}

  uniform float uTime;
  uniform float uDraw;      // 0 → 1 as the network is traced in
  uniform float uFilter;
  uniform float uValidate;
  uniform float uSettle;
  uniform float uExit;

  varying float vFade;
  varying float vStrength;

  void main() {
    vec3 pos = drift(morphedPosition(), uTime * (1.0 - uSettle * 0.72));
    pos = mix(pos, vec3(0.0, 0.0, pos.z * 0.4), uExit * 0.86);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    // Each endpoint crosses its own threshold, so a connection brightens from
    // one end to the other — the network is drawn, not faded up.
    float drawn = smoothstep(aRandom * 0.66, aRandom * 0.66 + 0.34, uDraw);

    // Weak pathways are pruned first; the candidate ones hold through (§20).
    // The ramp sits just under the candidate band (0.6+) rather than inside it,
    // so the three surviving regions keep visible internal structure instead of
    // collapsing into three featureless smudges.
    float pass = mix(1.0, 0.05 + 0.95 * smoothstep(0.46, 0.7, aStrength), uFilter);
    float survive = mix(1.0, aWinner, uValidate);

    vStrength = aStrength;
    vFade = drawn * pass * survive * (0.6 + 0.4 * sin(uTime * 0.24 + aRandom * 6.2831));
  }
`

export const LINE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3  uColor;      // Signal Mint — the bulk of the network
  uniform vec3  uActive;     // Bio Green — the few strong relationships
  uniform float uOpacity;
  varying float vFade;
  varying float vStrength;

  void main() {
    float a = uOpacity * vFade;
    if (a < 0.004) discard;
    // A narrow ramp, so the network never turns green as a whole (§29 keeps Bio
    // Green to a few per cent of the field).
    vec3 c = mix(uColor, uActive, smoothstep(0.74, 0.96, vStrength));
    gl_FragColor = vec4(c, a);
  }
`
