export const scrollProgress = {
  hero: 0,
  journey: 0,
  handoff: 0,
  techIngress: 0,
  technology: 0,
  impactIngress: 0,
  impact: 0,
  impactExit: 0,
  ctaForm: 0,
  ctaDepart: 0,
}

if (import.meta.env.DEV) {
  ;(window as unknown as { __scrollProgress?: typeof scrollProgress }).__scrollProgress =
    scrollProgress
}
