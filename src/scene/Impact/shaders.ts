const IMPACT_MORPH = /* glsl */ `
  attribute vec3  aScale;
  attribute vec3  aPrioritize;
  attribute vec3  aValidate;
  attribute vec3  aInward;
  attribute float aRandom;
  attribute float aStrength;
  attribute float aWinner;

  uniform float uMorph;
  uniform float uCompress;
  uniform float uStagger;

  vec3 morphedPosition() {
    float f = fract(uMorph);
    float settle = 1.0 - abs(f - 0.5) * 2.0;
    settle = settle * settle * (3.0 - 2.0 * settle);
    float lead = (1.0 - aStrength) * 0.35;
    float m = clamp(uMorph + ((aRandom - 0.5) * uStagger + lead * uStagger) * settle, 0.0, 2.0);

    vec3 p = aScale;
    p = mix(p, aPrioritize, clamp(m,       0.0, 1.0));
    p += aInward * uCompress * 0.42 * clamp(m, 0.0, 1.0);
    p = mix(p, aValidate,    clamp(m - 1.0, 0.0, 1.0));
    return p;
  }

  vec3 drift(vec3 p, float t) {
    float ph = aRandom * 6.2831;
    p.x += sin(t * 0.15 + ph) * 0.014;
    p.y += cos(t * 0.12 + ph * 1.7) * 0.011;
    return p;
  }
`

export const SIGNAL_VERT = /* glsl */ `
  precision highp float;

  ${IMPACT_MORPH}

  attribute vec3  aColor;
  attribute float aSize;

  uniform float uTime;
  uniform float uReveal;
  uniform float uFilter;
  uniform float uValidate;
  uniform float uExit;
  uniform float uSizeScale;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = drift(morphedPosition(), uTime);
    pos = mix(pos, vec3(0.0, 0.0, pos.z * 0.4), uExit * 0.86);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uSizeScale * (18.0 / -mv.z);
    gl_Position = projectionMatrix * mv;

    float born = smoothstep(aRandom * 0.72, aRandom * 0.72 + 0.28, uReveal);

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
    float a = exp(-d * d * 3.4) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

export const NODE_VERT = /* glsl */ `
  precision highp float;

  ${IMPACT_MORPH}

  attribute vec3  aColor;
  attribute float aSize;

  uniform float uTime;
  uniform float uReveal;
  uniform float uFilter;
  uniform float uValidate;
  uniform float uSettle;
  uniform float uExit;
  uniform float uSizeScale;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = drift(morphedPosition(), uTime * (1.0 - uSettle * 0.72));
    pos = mix(pos, vec3(0.0, 0.0, pos.z * 0.4), uExit * 0.86);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uSizeScale * (20.0 / -mv.z);
    gl_Position = projectionMatrix * mv;

    float born = smoothstep(aRandom * 0.6, aRandom * 0.6 + 0.34, uReveal);

    float pass = mix(1.0, 0.1 + 0.9 * smoothstep(0.46, 0.86, aStrength), uFilter);
    float survive = mix(1.0, aWinner, uValidate);

    float live = 0.84 + 0.16 * sin(uTime * 0.38 + aRandom * 6.2831) * (1.0 - uSettle * 0.6);

    vColor = aColor;
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
    float a = (exp(-d * d * 5.2) * 0.74 + smoothstep(1.0, 0.4, d) * 0.16) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

export const LINE_VERT = /* glsl */ `
  precision highp float;

  ${IMPACT_MORPH}

  uniform float uTime;
  uniform float uDraw;
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

    float drawn = smoothstep(aRandom * 0.66, aRandom * 0.66 + 0.34, uDraw);

    float pass = mix(1.0, 0.05 + 0.95 * smoothstep(0.46, 0.7, aStrength), uFilter);
    float survive = mix(1.0, aWinner, uValidate);

    vStrength = aStrength;
    vFade = drawn * pass * survive * (0.6 + 0.4 * sin(uTime * 0.24 + aRandom * 6.2831));
  }
`

export const LINE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3  uColor;
  uniform vec3  uActive;
  uniform float uOpacity;
  varying float vFade;
  varying float vStrength;

  void main() {
    float a = uOpacity * vFade;
    if (a < 0.004) discard;
    vec3 c = mix(uColor, uActive, smoothstep(0.74, 0.96, vStrength));
    gl_FragColor = vec4(c, a);
  }
`
