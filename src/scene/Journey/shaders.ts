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
    float raw = fbm(vUv * uNoiseScale + uTime * 0.012);
    float n = smoothstep(0.28, 0.70, raw);

    float thr = mix(-uEdgeWidth, 1.0 + uEdgeWidth, uProgress);
    float m = smoothstep(thr + uEdgeWidth, thr - uEdgeWidth, n);

    vec4 a = texture2D(uTexA, (vUv - 0.5) * uScaleA + 0.5 + uOffsetA);
    vec4 b = texture2D(uTexB, (vUv - 0.5) * uScaleB + 0.5 + uOffsetB) * uHasB;

    vec4 col = mix(a, b, m);

    float band = exp(-pow((n - thr) / max(uEdgeWidth, 0.001), 2.0) * 1.6);
    float speck = vnoise(vUv * uNoiseScale * 9.0 + 17.0);
    col.a *= 1.0 - band * 0.55 * step(speck, 0.42);

    col.rgb += uEdgeColor * band * uEdgeGlow * max(a.a, b.a);

    gl_FragColor = vec4(col.rgb, col.a * uAlpha);
    if (gl_FragColor.a < 0.004) discard;
  }
`

const MORPH = /* glsl */ `
  attribute vec3  aNucleus;
  attribute vec3  aField;
  attribute vec3  aSignal;
  attribute vec3  aNetwork;
  attribute vec3  aCandidate;
  attribute float aRandom;

  uniform float uMorph;
  uniform float uStagger;

  vec3 morphedPosition() {
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
  uniform float uReveal;
  uniform float uSizeScale;
  uniform float uDim;
  uniform vec2  uPointer;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = morphedPosition();

    float ph = aRandom * 6.2831;
    pos.x += sin(uTime * 0.21 + ph) * 0.035;
    pos.y += cos(uTime * 0.17 + ph * 1.7) * 0.030;
    pos.z += sin(uTime * 0.13 + ph * 2.3) * 0.025;

    pos.xy += uPointer * (0.06 + aRandom * 0.05);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uSizeScale * (11.0 / -mv.z);
    gl_Position = projectionMatrix * mv;

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
