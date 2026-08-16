import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  IMPACT_METRICS,
  IMPACT_MILESTONE,
  IMPACT_SCROLL,
  impactArc,
  impactExit,
  impactStageIndex,
  type ImpactStageId,
} from '@/sections/Impact/impact.constants'
import { scrollProgress } from '@/store/progressRef'

gsap.registerPlugin(ScrollTrigger)

export interface ImpactRefs {
  section: React.RefObject<HTMLElement | null>
  /** The Bone veil the Research → Impact handoff clips away (§7) */
  veil: React.RefObject<HTMLDivElement | null>
  /** The lit copy of the handoff scatter, revealed under the veil */
  signals: React.RefObject<HTMLDivElement | null>
  glow: React.RefObject<HTMLDivElement | null>
  grid: React.RefObject<HTMLDivElement | null>
  header: React.RefObject<HTMLDivElement | null>
  label: React.RefObject<HTMLDivElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  lead: React.RefObject<HTMLParagraphElement | null>
  metrics: React.RefObject<(HTMLElement | null)[]>
  steps: React.RefObject<(HTMLElement | null)[]>
  arc: React.RefObject<SVGCircleElement | null>
  arcRoot: React.RefObject<SVGSVGElement | null>
  human: React.RefObject<HTMLDivElement | null>
  humanFrame: React.RefObject<HTMLDivElement | null>
}

const ingressPx = () => (window.innerHeight * IMPACT_SCROLL.ingressVh) / 100

/**
 * Where the metric story begins, as a fraction of the ingress.
 *
 * The last third of the handoff and the first moments of the field overlap on
 * purpose: the network has to be populating underneath while the Bone is still
 * leaving, or the two read as a cut rather than as one becoming the other (§7).
 */
const STORY_OVERLAP = 0.66

/** Progress values where each metric is fully established (§13). */
export const METRIC_ANCHOR = [0.2, 0.46, 0.82] as const

// ── Research → Impact ───────────────────────────────────────────────────────

/**
 * The handoff out of Bone (§7).
 *
 * Two windows, matching the Innovation → Technology ingress:
 *
 *   rising   The stage travels up the viewport carrying a full-bleed Bone veil.
 *            Bone meets Bone, so there is no seam to see, and the scatter of
 *            signal points settles onto it as dark ink.
 *
 *   stuck    With the stage held, the veil is clipped away downward over the
 *            identical scatter drawn in Signal Mint underneath, and the
 *            environment resolves behind both.
 *
 * The flood has to happen in the *held* viewport. Run while the section is
 * still rising it would be a dark band crossing mid-screen with Bone above and
 * below it, which reads as a panel rather than as an environment arriving.
 */
function buildIngress(refs: ImpactRefs) {
  const section = refs.section.current
  const veil = refs.veil.current
  if (!section || !veil) return

  const ink = veil.querySelector('.impact-signals--ink')
  const lit = refs.signals.current

  // Both copies of the scatter, always tweened together: they have to occupy
  // identical coordinates at every frame or the inversion becomes a cross-fade
  // between two slightly different fields.
  const scatters = [ink, lit].filter(Boolean) as HTMLElement[]

  // ── Rising ───────────────────────────────────────────────────────────────
  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: 0.7,
        invalidateOnRefresh: true,
      },
      defaults: { ease: 'none' },
    })
    .fromTo(scatters, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.62 }, 0.24)

  // Research's unexplained 14.8M strengthens while its footer is still on
  // screen — the number this section is about to explain is the last thing
  // legible on the light surface (§7). A class and a CSS transition rather than
  // a second tween: Research already animates that element's opacity and scale,
  // and two timelines fighting over one property is how a reversed scrub strands
  // an element half-lit.
  const marker = document.querySelector('.research-footer-marker')
  if (marker) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom+=45%',
      end: 'top top',
      onToggle: ({ isActive }) => marker.classList.toggle('is-handoff', isActive),
    })
  }

  // ── Stuck ────────────────────────────────────────────────────────────────
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `top top-=${ingressPx()}`,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        scrollProgress.impactIngress = self.progress
      },
      // scrub settles asynchronously, so the ends are clamped explicitly rather
      // than left wherever the last frame happened to read. The WebGL gate
      // depends on these being exact in both directions.
      onLeave: () => {
        scrollProgress.impactIngress = 1
      },
      onLeaveBack: () => {
        scrollProgress.impactIngress = 0
      },
    },
    defaults: { ease: 'none' },
  })

  // The Bone is eaten away from the top down. A straight-edged mask, not a
  // dissolve: Bone fading to dark passes through the middle greys, a range that
  // appears nowhere in this palette.
  tl.fromTo(
    veil,
    { clipPath: 'inset(0% 0% 0% 0%)' },
    { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.6, ease: 'power2.inOut' },
    0,
  )

  // The leading edge travels on its own tween rather than riding the clip: a
  // 1px line cannot be pinned to a mask boundary, so it is given the same
  // duration and the same easing and simply arrives at the same place.
  const edge = veil.querySelector('.impact-veil-edge')
  if (edge) {
    tl.fromTo(edge, { top: '0%' }, { top: '100%', duration: 0.6, ease: 'power2.inOut' }, 0)
      .fromTo(edge, { opacity: 0 }, { opacity: 0.7, duration: 0.16 }, 0.02)
      .to(edge, { opacity: 0, duration: 0.2 }, 0.62)
  }

  if (refs.glow.current) {
    tl.fromTo(refs.glow.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.4)
  }
  if (refs.grid.current) {
    tl.fromTo(refs.grid.current, { opacity: 0 }, { opacity: 1, duration: 0.36 }, 0.46)
  }

  // The lit points hand over to the network: they spread and fade exactly as
  // the field behind them populates, so the handoff does not read as a layer
  // being switched off (§7).
  tl.to(scatters, { scale: 1.14, opacity: 0, duration: 0.34, ease: 'power1.in' }, 0.62)

  tl.set({}, {}, 1)
}

// ── The section spine ───────────────────────────────────────────────────────

/**
 * One ScrollTrigger produces the normalized 0–1 the whole section runs on.
 *
 * The shaders read it from progressRef, the metric windows sit on a timeline
 * whose duration is pinned to exactly 1 so a tween at t = 0.3 fires at progress
 * 0.3, and the arc and the step indicator are drawn from the same functions the
 * constants file exports. One number, drawn five ways, which is why a reversed
 * scrub cannot desync (§57).
 */
function buildStory(refs: ImpactRefs, setStage: (stage: ImpactStageId | null) => void) {
  const section = refs.section.current
  if (!section) return

  const steps = () => (refs.steps.current ?? []).filter(Boolean) as HTMLElement[]
  const arc = refs.arc.current
  const circumference = arc ? 2 * Math.PI * arc.r.baseVal.value : 0

  let active = -1

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: () => `top top-=${ingressPx() * STORY_OVERLAP}`,
      end: 'bottom bottom',
      scrub: 0.55,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress
        scrollProgress.impact = p
        scrollProgress.impactExit = impactExit(p)

        // The arc *is* the 91% — it is drawn from the same function the metric
        // is authored against, so the two can never state different things
        // (§25). Written here rather than tweened, because a dash offset that
        // lags the scrub reads as a gauge catching up.
        if (arc) {
          arc.style.strokeDashoffset = String(circumference * (1 - impactArc(p)))
        }

        // Discrete state, at most three flips per pass (§35).
        const i = impactStageIndex(p)
        if (i !== active) {
          active = i
          setStage(IMPACT_METRICS[i].id)
          steps().forEach((el, k) => {
            el.classList.toggle('is-current', k === i)
            el.classList.toggle('is-past', k < i)
          })
        }
      },
      onLeave: () => {
        scrollProgress.impact = 1
        scrollProgress.impactExit = 1
      },
      onLeaveBack: () => {
        scrollProgress.impact = 0
        scrollProgress.impactExit = 0
      },
    },
    defaults: { ease: 'none' },
  })

  // Pins the timeline's duration to exactly 1 so every position below is a
  // progress value rather than a fraction of an arbitrary length.
  tl.to({}, { duration: 1 })

  // ── Metric states ────────────────────────────────────────────────────────
  // §39 — the outgoing number lifts and the incoming rises into the same mask.
  // Deliberately small travel and no digit rolling: a casino counter would be
  // exactly the "generic animated counter plugin" §55 fails the section for.
  const metrics = refs.metrics.current ?? []
  IMPACT_METRICS.forEach((metric, i) => {
    const el = metrics[i]
    if (!el) return

    const value = el.querySelector('.impact-metric-value')
    const body = el.querySelectorAll('.impact-metric-line')

    if (i === 0) {
      // The first state is already in place when the section opens; it only
      // has to arrive, which it does under the ingress.
      gsap.set(el, { opacity: 1 })
      gsap.set(value, { yPercent: 0 })
      gsap.set(body, { opacity: 1, y: 0 })
    } else {
      gsap.set(el, { opacity: 0 })
      gsap.set(value, { yPercent: 108 })
      gsap.set(body, { opacity: 0, y: 14 })

      tl.to(el, { opacity: 1, duration: 0.02 }, metric.enter - 0.02)
      tl.fromTo(
        value,
        { yPercent: 108 },
        { yPercent: 0, duration: 0.075, ease: 'power3.out' },
        metric.enter,
      )
      tl.fromTo(
        body,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.06, stagger: 0.012, ease: 'power2.out' },
        metric.enter + 0.018,
      )
    }

    if (metric.exit <= 1) {
      tl.to(value, { yPercent: -104, duration: 0.06, ease: 'power2.in' }, metric.exit - 0.06)
      tl.to(body, { opacity: 0, y: -12, duration: 0.05, ease: 'power2.in' }, metric.exit - 0.06)
      tl.to(el, { opacity: 0, duration: 0.01 }, metric.exit)
    }
  })

  // ── The confidence arc (§25) ─────────────────────────────────────────────
  // Its offset is written per frame above; only its presence is on the
  // timeline, so it appears with the validated state and leaves with §54.
  if (refs.arcRoot.current) {
    const root = refs.arcRoot.current
    gsap.set(root, { opacity: 0 })
    tl.to(root, { opacity: 1, duration: 0.06 }, IMPACT_MILESTONE.arcStart - 0.04)
    tl.to(root, { opacity: 0, duration: 0.05 }, IMPACT_MILESTONE.exitStart)
  }

  // ── The human moment (§26, §28) ──────────────────────────────────────────
  // A vertical mask and a fractional scale, nothing more: §28 rules out the
  // organic aperture and rules out a dramatic zoom, and this is the one place
  // on the page where restraint is the entire point.
  if (refs.human.current && refs.humanFrame.current) {
    const root = refs.human.current
    const frame = refs.humanFrame.current
    gsap.set(root, { opacity: 0 })
    gsap.set(frame, { clipPath: 'inset(100% 0% 0% 0%)', scale: 0.985 })

    tl.to(root, { opacity: 1, duration: 0.03 }, IMPACT_MILESTONE.humanIn - 0.02)
    tl.to(
      frame,
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.08, ease: 'power2.inOut' },
      IMPACT_MILESTONE.humanIn,
    )
    const copy = root.querySelectorAll('.impact-human-line, .impact-human-label')
    tl.fromTo(
      copy,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.05, stagger: 0.012, ease: 'power2.out' },
      IMPACT_MILESTONE.humanIn + 0.025,
    )
    // Leaves before the collapse rather than during it: §53 wants a single
    // biological point at the end, and a photograph fading under it would be a
    // second subject in the last frame.
    tl.to(root, { opacity: 0, y: -14, duration: 0.05 }, IMPACT_MILESTONE.humanOut)
  }

  // ── Exit (§54) ───────────────────────────────────────────────────────────
  // Metadata, the step indicator and the environment all reduce, so the section
  // ends calmer than it ran and the Final CTA inherits a quiet frame.
  const metaBlocks = section.querySelectorAll('.impact-metric-meta')
  if (metaBlocks.length) {
    tl.to(metaBlocks, { opacity: 0, duration: 0.05 }, IMPACT_MILESTONE.exitStart)
  }

  // The metric column and the section header lift out together, a little ahead
  // of everything else. Section 08 §6 asks for exactly this — "metric
  // typography moves out, validated target remains" — and it is the difference
  // between a section resolving and a section scrolling away: without it, the
  // last thing on screen before the closing cell is 91% and a headline about
  // meaningful possibility, which is the wrong sentence to end Impact on.
  const metricRoot = section.querySelector('.impact-metrics')
  if (metricRoot) {
    tl.to(metricRoot, { opacity: 0, y: -22, duration: 0.06 }, IMPACT_MILESTONE.exitStart - 0.02)
  }
  if (refs.header.current) {
    tl.to(
      refs.header.current,
      { opacity: 0, y: -18, duration: 0.06 },
      IMPACT_MILESTONE.exitStart - 0.02,
    )
  }
  const stepRoot = section.querySelector('.impact-steps')
  if (stepRoot) tl.to(stepRoot, { opacity: 0, duration: 0.06 }, IMPACT_MILESTONE.exitStart + 0.01)
  if (refs.grid.current) {
    tl.to(refs.grid.current, { opacity: 0, duration: 0.07 }, IMPACT_MILESTONE.exitStart)
  }
  if (refs.glow.current) {
    tl.to(refs.glow.current, { opacity: 0.55, duration: 0.07 }, IMPACT_MILESTONE.exitStart)
  }
}

/**
 * Section label, headline and supporting copy (§10).
 *
 * Arrives once, on its own trigger, rather than being scrubbed: a headline that
 * reverses as the reader scrolls back a little is a headline that never settles.
 */
function buildHeader(refs: ImpactRefs) {
  const root = refs.header.current
  if (!root) return

  const lines = (refs.headlineLines.current ?? []).filter(Boolean) as HTMLElement[]

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: refs.section.current ?? root,
      start: () => `top top-=${ingressPx() * 0.5}`,
      once: true,
    },
  })

  if (refs.label.current) {
    tl.fromTo(refs.label.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
  }
  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 106 },
      { yPercent: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
      0.06,
    )
  }
  if (refs.lead.current) {
    tl.fromTo(
      refs.lead.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.62, ease: 'power2.out' },
      0.32,
    )
  }
}

/**
 * Surface bookkeeping.
 *
 * The fixed header has to leave Research's light treatment behind, and the
 * shared canvas — stopped by Capabilities and left stopped by Research — has to
 * come back on before there is anything to draw. Driven from one place so the
 * two cannot disagree, and armed a viewport early so no buffer allocation
 * happens inside the transition.
 */
export function buildImpactSurface(
  section: HTMLElement,
  setCanvasActive: (active: boolean) => void,
  setStage: (stage: ImpactStageId | null) => void,
  flowing: boolean,
) {
  const setSurface = (light: boolean) => {
    document.documentElement.dataset.surface = light ? 'light' : 'dark'
  }

  // The moment the strip beneath the fixed header stops being Bone — which is
  // early, because the veil is clipped from the top down and the header sits at
  // the very top of the screen. Any later and Impact's dark type is stranded on
  // dark; any earlier and Research's light type is stranded on Bone.
  const surface = ScrollTrigger.create({
    trigger: section,
    start: flowing ? 'top bottom-=1' : () => `top top+=${ingressPx() * 0.14}`,
    end: 'bottom bottom',
    onEnter: () => setSurface(false),
    onEnterBack: () => setSurface(false),
    onLeaveBack: () => setSurface(true),
  })

  // Arming: one viewport before the section, so the buffers, the geometry and
  // the connection graph are built while there is still Bone on screen rather
  // than during the handoff itself (§52).
  const arm = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom+=100%',
    end: 'bottom top',
    onEnter: () => setStage('scale'),
    onEnterBack: () => setStage('scale'),
    onLeaveBack: () => setStage(null),
  })

  // Restarting the render loop is a *separate*, later trigger, and it has to be:
  // Capabilities stops the canvas and Research leaves it stopped, and Research's
  // own gate is still ahead of this one in scroll order. Turning the loop back
  // on at the arming point would simply be overwritten by it. This fires when
  // the stage sticks — the first moment the ingress has anything to reveal.
  const canvas = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onEnter: () => setCanvasActive(true),
    onEnterBack: () => setCanvasActive(true),
    onLeaveBack: () => setCanvasActive(false),
  })

  return () => {
    surface.kill()
    arm.kill()
    canvas.kill()
    setSurface(false)
    setStage(null)
  }
}

/**
 * Everything the section animates.
 *
 * Under reduced motion nothing is built at all, which leaves the flowing layout
 * in its natural, fully-revealed state — §49 asks for three static scientific
 * states, not for a section that has to be scrolled past to become complete.
 */
export function buildImpactTimeline(
  refs: ImpactRefs,
  setStage: (stage: ImpactStageId | null) => void,
  flowing: boolean,
) {
  if (flowing) return
  buildIngress(refs)
  buildHeader(refs)
  buildStory(refs, setStage)
}

/**
 * The flowing presentation's entrances (§41).
 *
 * Below 769px there is no pin, no canvas and no scrubbed sequence — the three
 * metrics are three blocks in normal document flow. What is left is one
 * entrance per block, which is the same vocabulary the rest of the page's
 * non-pinned content uses.
 */
export function buildImpactFlow(refs: ImpactRefs) {
  buildHeader(refs)

  const blocks = (refs.metrics.current ?? []).filter(Boolean) as HTMLElement[]
  blocks.forEach((block) => {
    const value = block.querySelector('.impact-metric-value')
    const body = block.querySelectorAll('.impact-metric-line')
    const visual = block.querySelector('.impact-flow-visual')

    const tl = gsap.timeline({
      scrollTrigger: { trigger: block, start: 'top 82%', once: true },
    })

    if (value) {
      tl.fromTo(value, { yPercent: 106 }, { yPercent: 0, duration: 0.7, ease: 'power3.out' }, 0)
    }
    if (body.length) {
      tl.fromTo(
        body,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out' },
        0.16,
      )
    }
    if (visual) {
      tl.fromTo(visual, { opacity: 0 }, { opacity: 1, duration: 0.7 }, 0.1)
    }
  })

  const human = refs.human.current
  if (human && refs.humanFrame.current) {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: human, start: 'top 84%', once: true },
    })
    tl.fromTo(
      refs.humanFrame.current,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'power2.inOut' },
      0,
    )
    tl.fromTo(
      human.querySelectorAll('.impact-human-line, .impact-human-label'),
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out' },
      0.3,
    )
  }
}
