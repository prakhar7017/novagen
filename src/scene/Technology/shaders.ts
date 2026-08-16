import { NOISE } from '@/scene/Journey/shaders'

const TECH_MORPH = /* glsl */ `
  attribute vec3  aSample;
  attribute vec3  aMap;
  attribute vec3  aInterpret;
  attribute vec3  aPredict;
  attribute vec3  aValidate;
  attribute float aRandom;
  attribute float aStrength;
  attribute float aWinner;

  uniform float uMorph;
  uniform float uStagger;

  vec3 morphedPosition() {
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

  vec3 drift(vec3 p, float t) {
    float ph = aRandom * 6.2831;
    p.x += sin(t * 0.16 + ph) * 0.012;
    p.y += cos(t * 0.13 + ph * 1.7) * 0.010;
    return p;
  }
`

export const NODE_VERT = /* glsl */ `
  precision highp float;

  ${TECH_MORPH}

  attribute vec3  aColor;
  attribute float aSize;

  uniform float uTime;
  uniform float uReveal;
  uniform float uSelect;
  uniform float uValidate;
  uniform float uExit;
  uniform float uSizeScale;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = drift(morphedPosition(), uTime);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uSizeScale * (20.0 / -mv.z);
    gl_Position = projectionMatrix * mv;

    float born = smoothstep(aRandom * 0.7, aRandom * 0.7 + 0.3, uReveal);

    float select = mix(1.0, 0.14 + 0.86 * smoothstep(0.45, 0.9, aStrength), uSelect);
    float survive = mix(1.0, aWinner, uValidate);

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
    float a = (exp(-d * d * 5.5) * 0.72 + smoothstep(1.0, 0.35, d) * 0.18) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

export const TECH_LINE_VERT = /* glsl */ `
  precision highp float;

  ${TECH_MORPH}

  uniform float uTime;
  uniform float uDraw;
  uniform float uSelect;
  uniform float uValidate;

  varying float vFade;
  varying float vStrength;

  void main() {
    vec3 pos = drift(morphedPosition(), uTime);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    float drawn = smoothstep(aRandom * 0.7, aRandom * 0.7 + 0.3, uDraw);

    float select = mix(1.0, 0.1 + 0.9 * smoothstep(0.5, 0.92, aStrength), uSelect);
    float survive = mix(1.0, aWinner * 0.5, uValidate);

    vStrength = aStrength;
    vFade = drawn * select * survive * (0.55 + 0.45 * sin(uTime * 0.25 + aRandom * 6.2831));
  }
`

export const TECH_LINE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3  uColor;
  uniform vec3  uActive;
  uniform float uOpacity;
  varying float vFade;
  varying float vStrength;

  void main() {
    float a = uOpacity * vFade;
    if (a < 0.004) discard;
    vec3 c = mix(uColor, uActive, smoothstep(0.72, 0.95, vStrength));
    gl_FragColor = vec4(c, a);
  }
`

export const RING_VERT = /* glsl */ `
  precision highp float;

  attribute vec3  aAnchor;
  attribute float aAngle;
  attribute float aRadius;
  attribute float aConf;
  attribute float aWinner;

  uniform float uValidate;
  uniform float uAppear;

  varying float vT;
  varying float vConf;
  varying float vWinner;

  void main() {
    vec3 base = mix(aAnchor, vec3(0.0), uValidate * aWinner);
    float r = aRadius * (1.0 + 1.35 * uValidate * aWinner);

    vec3 pos = base + vec3(cos(aAngle) * r, sin(aAngle) * r, 0.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

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
    float arc = smoothstep(vConf + 0.008, vConf - 0.008, vT);
    float a = uOpacity * (0.14 + 0.86 * arc) * mix(1.0, vWinner, uValidate);
    if (a < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, uActive, arc * vWinner), a);
  }
`

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
  uniform float uReveal;
  uniform float uErode;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3  uEdge;

  varying vec2 vUv;

  ${NOISE}

  void main() {
    vec2 uv = vUv + vec2(
      sin(vUv.y * 9.0 + uTime * 0.22),
      cos(vUv.x * 8.0 - uTime * 0.19)
    ) * 0.0032 * (1.0 - uErode);

    vec4 tex = texture2D(uMap, uv);

    float n = fbm(vUv * 3.6);

    float appear = smoothstep(n * 0.5, n * 0.5 + 0.5, uReveal);

    float field = n * 0.62 + (1.0 - clamp(length(vUv - 0.5) * 1.9, 0.0, 1.0)) * 0.38;
    float thr = mix(-0.18, 1.18, uErode);
    float open = smoothstep(thr - 0.18, thr + 0.18, field);

    float alpha = tex.a * appear * open * uOpacity;

    float band = exp(-pow((field - thr) / 0.18, 2.0) * 1.7);
    vec3 rgb = tex.rgb + uEdge * band * 0.34 * tex.a * uOpacity;

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(rgb, alpha);
  }
`
