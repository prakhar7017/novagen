export const CELL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const CELL_FRAG = /* glsl */ `
  precision highp float;

  uniform float uSpan;
  uniform float uCoreSpan;
  uniform float uForm;
  uniform float uInterior;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uRadius;
  uniform vec3  uCore;
  uniform vec3  uHalo;
  uniform vec3  uMembrane;

  varying vec2 vUv;

  void main() {
    vec2 v = (vUv - 0.5) * 2.0;

    vec2  q  = v / max(uSpan, 0.0001);
    float d  = length(q);
    float dc = length(v) / max(uCoreSpan, 0.0001);

    if (d > 1.35) discard;

    float ang = atan(q.y, q.x);

    float wob = sin(ang * 3.0 + uTime * 0.09) * 0.017
              + sin(ang * 2.0 - uTime * 0.061) * 0.012;
    float R = uRadius * (1.0 + wob * uForm);

    float core = exp(-dc * dc * 46.0);
    float halo = exp(-dc * dc * 15.0) * 0.24 + exp(-dc * dc * 5.0) * 0.05;

    float rim = exp(-pow((d - R) / (0.028 * uRadius / 0.62), 2.0));
    float inside = smoothstep(R, R - 0.5, d);

    float f1 = exp(-pow((d - R * 0.46) / 0.055, 2.0))
             * (sin(ang + uTime * 0.07 + 1.1) - 0.15);
    float f2 = exp(-pow((d - R * 0.72) / 0.04, 2.0))
             * (sin(ang * 2.0 - uTime * 0.052) - 0.25);
    float fil = max(0.0, f1) * 0.10 + max(0.0, f2) * 0.075;

    float breathe = 0.955 + 0.045 * sin(uTime * 0.52);

    vec3 c = uMembrane;
    c = mix(c, uHalo, clamp(rim * 0.75 + fil * 2.4 + inside * 0.08, 0.0, 1.0));
    c = mix(c, mix(uCore, uHalo, 0.34 * uForm), core);

    float a = (core + halo) * breathe
            + (rim * 0.17 + inside * 0.038) * uForm
            + fil * uInterior;
    a *= uOpacity;

    if (a < 0.004) discard;
    gl_FragColor = vec4(c, a);
  }
`

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
  uniform float uScale;
  uniform float uPixel;

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

    vFade = 0.45 + 0.55 * smoothstep(-1.0, 1.0, sin(a * 0.7 + aPhase));

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
