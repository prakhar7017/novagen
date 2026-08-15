import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  GRID_ALPHA,
  TECHNOLOGY_STAGES,
  TECH_MILESTONE,
  TECH_SCROLL,
  techMorph,
  techStageIndex,
  type TechnologyStageId,
} from '@/sections/Technology/technology.constants'
import { scrollProgress } from '@/store/progressRef'

gsap.registerPlugin(ScrollTrigger)

export interface TechnologyRefs {
  section: React.RefObject<HTMLElement | null>
  veil: React.RefObject<HTMLDivElement | null>
  plate: React.RefObject<HTMLDivElement | null>
  plateIn: React.RefObject<HTMLDivElement | null>
  shade: React.RefObject<HTMLDivElement | null>
  grid: React.RefObject<HTMLDivElement | null>
  glow: React.RefObject<HTMLDivElement | null>
  header: React.RefObject<HTMLDivElement | null>
  label: React.RefObject<HTMLDivElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  lead: React.RefObject<HTMLParagraphElement | null>
  copies: React.RefObject<(HTMLElement | null)[]>
  metas: React.RefObject<(HTMLDivElement | null)[]>
  pipeline: React.RefObject<HTMLDivElement | null>
  stageNodes: React.RefObject<(HTMLElement | null)[]>
}

const ingressPx = () => (window.innerHeight * TECH_SCROLL.ingressVh) / 100

/**
 * Where the pipeline's own timeline begins, as a fraction of the ingress.
 *
 * The last third of the ingress and the first moments of the platform overlap
 * on purpose: the specimen has to be resolving underneath while the microscopy
 * plate is still dissolving, or the two read as a cut rather than as one image
 * becoming another (§5).
 */
const STORY_OVERLAP = 0.65

/** Progress values where each stage is fully established (§15). */
export const STAGE_ANCHOR = [0.08, 0.28, 0.48, 0.68, 0.9] as const

// ── Innovation → Technology ingress ─────────────────────────────────────────

/**
 * The handoff out of the Bone section.
 *
 * Two windows. The first runs while the section is still rising into view, and
 * during it the whole viewport is flat Bone — the same trick the Journey's
 * aperture uses, Bone meeting Bone, so the section boundary itself is invisible.
 * The microscopy plate fades up inside a small window in the middle of it.
 *
 * The second runs with the stage already stuck: the window opens out to full
 * bleed, its dark biological regions take the viewport, the Bone veil recedes,
 * the measurement grid emerges underneath, and the plate finally dissolves into
 * the platform's own signal field. No wipe, no cut — the specimen simply
 * becomes the environment.
 */
function buildIngress(refs: TechnologyRefs) {
  const section = refs.section.current
  const plate = refs.plate.current
  const plateIn = refs.plateIn.current
  const veil = refs.veil.current
  if (!section || !plate || !plateIn || !veil) return

  // Fades the plate *in*, on its own element. The dissolve below owns the
  // outer .technology-ingress-plate; sharing one element let a scroll jump
  // land with this scrub rendering last, which re-asserted opacity 1 over a
  // platform the other timeline had already uncovered.
  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
      defaults: { ease: 'none' },
    })
    .fromTo(plateIn, { opacity: 0 }, { opacity: 1, duration: 0.55 }, 0.25)

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `top top-=${ingressPx()}`,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        scrollProgress.techIngress = self.progress
      },
      // scrub settles asynchronously, so the ends are clamped explicitly rather
      // than left wherever the last frame happened to read. The WebGL gate
      // depends on these being exact.
      onLeave: () => {
        scrollProgress.techIngress = 1
      },
      onLeaveBack: () => {
        scrollProgress.techIngress = 0
      },
    },
    defaults: { ease: 'none' },
  })

  tl.fromTo(
    plate,
    { clipPath: 'inset(26% 33% 24% 33%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.48, ease: 'power1.inOut' },
    0,
  )

  // The specimen's own darkness is what replaces the Bone — hence a shade over
  // the image rather than a black panel sliding in over everything.
  if (refs.shade.current) {
    tl.fromTo(refs.shade.current, { opacity: 0 }, { opacity: 1, duration: 0.52 }, 0.06)
  }

  // Held until the plate has reached full bleed and is covering it. Fading Bone
  // out over a dark background while any of it is still exposed turns the whole
  // viewport grey for half a second — a colour that appears nowhere in the
  // palette. Hidden behind the plate, the same fade is invisible.
  tl.fromTo(veil, { opacity: 1 }, { opacity: 0, duration: 0.28 }, 0.38)

  if (refs.grid.current) {
    tl.fromTo(
      refs.grid.current,
      { opacity: 0 },
      { opacity: GRID_ALPHA.sample, duration: 0.34 },
      0.56,
    )
  }

  if (refs.glow.current) {
    tl.fromTo(refs.glow.current, { opacity: 0 }, { opacity: 1, duration: 0.34 }, 0.58)
  }

  // Dissolves last, over the platform that has already started resolving
  // underneath it — and finishes with room to spare, so that by the time the
  // SAMPLE stage is established (progress 0.08) nothing of the transition is
  // still tinting the section.
  tl.to(plate, { opacity: 0, duration: 0.32, ease: 'power1.in' }, 0.56)

  tl.set({}, {}, 1)
}

// ── The pipeline ────────────────────────────────────────────────────────────

/**
 * The section's single scroll spine.
 *
 * One ScrollTrigger produces the normalized 0–1 the whole platform runs on: the
 * shaders read it from progressRef, the copy windows are placed on a timeline
 * whose duration is pinned to exactly 1 so a tween at t = 0.4 fires at progress
 * 0.4, and the rail's fill is the same `techMorph` the vertex shader mixes with.
 * One number, drawn four ways, which is why reverse scrubbing cannot desync.
 */
function buildStory(
  refs: TechnologyRefs,
  setStage: (stage: TechnologyStageId | null) => void,
) {
  const section = refs.section.current
  if (!section) return

  const nodes = () => (refs.stageNodes.current ?? []).filter(Boolean) as HTMLElement[]
  const pipeline = refs.pipeline.current

  let active = -1

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: () => `top top-=${ingressPx() * STORY_OVERLAP}`,
      end: 'bottom bottom',
      scrub: 0.7,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress
        scrollProgress.technology = p

        // The rail fills with the same continuous stage index the scene morphs
        // with, so the marker is never ahead of or behind the visualization.
        if (pipeline) pipeline.style.setProperty('--tech-fill', String(techMorph(p) / 4))

        const next = techStageIndex(p)
        if (next === active) return
        active = next
        setStage(TECHNOLOGY_STAGES[next].id)
        // Class toggling rather than React state: this fires on scroll, and
        // ACCEPTANCE_CRITERIA §20 rules out re-rendering during animation.
        nodes().forEach((el, i) => {
          el.classList.toggle('is-active', i === next)
          el.classList.toggle('is-done', i < next)
          // Colour alone must not carry the current step (§55), so the same
          // change updates the accessible state — set here for the same reason
          // the classes are: five times per pass, without a re-render.
          if (el.tagName === 'BUTTON') {
            el.setAttribute('aria-current', i === next ? 'step' : 'false')
          }
        })
      },
      onLeave: () => {
        scrollProgress.technology = 1
      },
      onLeaveBack: () => {
        scrollProgress.technology = 0
      },
    },
    defaults: { ease: 'none' },
  })

  TECHNOLOGY_STAGES.forEach((stage, i) => {
    const copy = refs.copies.current?.[i]
    const meta = refs.metas.current?.[i]
    const isLast = i === TECHNOLOGY_STAGES.length - 1

    // Each stage has left before the next arrives: overlapping two copy blocks
    // in the same box reads as ghosting, not as a cross-fade.
    const IN = 0.03
    const OUT = 0.026

    if (copy) {
      const lines = copy.querySelectorAll('.technology-stage-line')
      const body = copy.querySelector('.technology-stage-body')

      tl.fromTo(copy, { opacity: 0 }, { opacity: 1, duration: IN }, stage.enter)
      if (lines.length) {
        // The same mask reveal as the section headline, at a fifth of the
        // travel — a stage change is a smaller event than an arrival.
        tl.fromTo(
          lines,
          { yPercent: 106 },
          { yPercent: 0, duration: IN * 1.2, stagger: IN * 0.25 },
          stage.enter,
        )
      }
      if (body) {
        tl.fromTo(body, { opacity: 0 }, { opacity: 1, duration: IN * 0.8 }, stage.enter + IN * 0.7)
      }
      if (!isLast) tl.to(copy, { opacity: 0, duration: OUT }, stage.exit)
    }

    if (meta) {
      tl.fromTo(meta, { opacity: 0 }, { opacity: 1, duration: IN }, stage.enter + 0.012)
      if (!isLast) tl.to(meta, { opacity: 0, duration: OUT }, stage.exit)
    }
  })

  // The environment reacts to the stage: the measurement grid firms up while
  // space is being resolved and settles back once it is (§38).
  if (refs.grid.current) {
    const grid = refs.grid.current
    tl.to(grid, { opacity: GRID_ALPHA.map, duration: 0.1 }, TECH_MILESTONE.mapStart)
      .to(grid, { opacity: GRID_ALPHA.interpret, duration: 0.1 }, TECH_MILESTONE.interpretStart)
      .to(grid, { opacity: GRID_ALPHA.predict, duration: 0.1 }, TECH_MILESTONE.predictStart)
      .to(grid, { opacity: GRID_ALPHA.validate, duration: 0.1 }, TECH_MILESTONE.validateStart)
  }

  // ── Exit toward Capabilities (§43) ────────────────────────────────────────
  // The validated candidate is the only thing that holds; the instrumentation
  // around it steps back first, which is what makes the next section feel like
  // a consequence rather than a new topic.
  if (pipeline) {
    tl.to(pipeline, { opacity: 0.12, duration: 0.05 }, TECH_MILESTONE.exitStart)
  }
  const lastMeta = refs.metas.current?.[TECHNOLOGY_STAGES.length - 1]
  if (lastMeta) tl.to(lastMeta, { opacity: 0.25, duration: 0.05 }, TECH_MILESTONE.exitStart)

  // Pins the timeline's duration to exactly 1: without this anchor the duration
  // is wherever the last tween happens to end, and every cue placed at position
  // p would fire at some other scroll progress.
  tl.set({}, {}, 1)
}

/**
 * The one-time entrance (§41).
 *
 * Held until the ingress is nearly half done — the header sits behind the Bone
 * veil until then, and an entrance nobody can see is an entrance that never
 * happened. Total run is a shade under a second.
 */
function buildEntrance(refs: TechnologyRefs) {
  const section = refs.section.current
  const header = refs.header.current
  if (!section || !header) return

  const lines = (refs.headlineLines.current ?? []).filter(
    (el): el is HTMLSpanElement => !!el?.isConnected,
  )

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      // Once the plate has dissolved far enough for the header to be legible:
      // an entrance played behind an opaque panel is an entrance that never
      // happened.
      start: () => `top top-=${ingressPx() * 0.7}`,
      once: true,
    },
  })

  if (refs.label.current) {
    tl.fromTo(refs.label.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
  }
  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 105 },
      { yPercent: 0, duration: 0.72, stagger: 0.12, ease: 'power3.out' },
      0.06,
    )
  }
  if (refs.lead.current) {
    tl.fromTo(
      refs.lead.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      0.34,
    )
  }
  if (refs.pipeline.current) {
    tl.fromTo(refs.pipeline.current, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.42)
  }
}

/**
 * The dark surface, and the canvas that draws into it.
 *
 * Both flip at the point the Bone veil has finished receding rather than at the
 * section's own top edge: the fixed header's Bone type would be invisible while
 * any Bone is still on screen, and the canvas has nothing to draw until then.
 */
export function buildTechnologySurface(
  section: HTMLElement,
  setCanvasActive: ((active: boolean) => void) | null,
  setStage: (stage: TechnologyStageId | null) => void,
  /** True for the flowing layout, which has no ingress to hide the switch in */
  flowing: boolean,
) {
  const setSurface = (dark: boolean) => {
    document.documentElement.dataset.surface = dark ? 'dark' : 'light'
  }

  const surface = ScrollTrigger.create({
    trigger: section,
    // Both layouts switch at the moment the strip beneath the fixed header
    // stops being Bone. Any earlier and the header's dark type is stranded on
    // the dark surface arriving under it — which is exactly what happens if
    // this is tied to the section's own top edge instead. With motion that
    // point is partway through the ingress, where the plate has darkened; in
    // the flowing layout it is just past the top edge, where the transition
    // band has gone from Bone to deep green.
    start: flowing
      ? () => `top top-=${window.innerHeight * 0.12}`
      : () => `top top-=${ingressPx() * 0.42}`,
    end: 'bottom top',
    onEnter: () => setSurface(true),
    onEnterBack: () => setSurface(true),
    onLeaveBack: () => setSurface(false),
  })

  // Arming: mounts the platform (and starts fetching the specimen) a viewport
  // before it is needed, so nothing pops in during the ingress — and unmounts
  // it again on the way back up.
  const arm = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom+=60%',
    end: 'bottom top',
    onEnter: () => {
      setStage('sample')
      setCanvasActive?.(true)
    },
    onEnterBack: () => {
      setStage('sample')
      setCanvasActive?.(true)
    },
    onLeaveBack: () => {
      setStage(null)
      setCanvasActive?.(false)
    },
  })

  return () => {
    surface.kill()
    arm.kill()
    setSurface(false)
    setStage(null)
  }
}

/**
 * Everything the pinned desktop/laptop presentation animates.
 */
export function buildTechnologyTimeline(
  refs: TechnologyRefs,
  setStage: (stage: TechnologyStageId | null) => void,
  reduced: boolean,
) {
  if (reduced) return
  buildIngress(refs)
  buildEntrance(refs)
  buildStory(refs, setStage)
}

/**
 * The flowing presentation used below 769px and under reduced motion.
 *
 * Same five stages, same order, no pin and no scrub: each block reveals once as
 * it arrives and then stays put, and the rail marks how far through the pipeline
 * the reader is. §49 and §54 both rule out running the desktop sequence here.
 */
export function buildTechnologyFlow(refs: TechnologyRefs, reduced: boolean) {
  const section = refs.section.current
  if (!section || reduced) return

  const blocks = (refs.copies.current ?? []).filter(Boolean) as HTMLElement[]

  blocks.forEach((block, i) => {
    gsap
      .timeline({ scrollTrigger: { trigger: block, start: 'top 82%', once: true } })
      .fromTo(block, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })

    const node = refs.stageNodes.current?.[i]
    if (!node) return
    ScrollTrigger.create({
      trigger: block,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => node.classList.toggle('is-active', self.isActive),
      onLeave: () => node.classList.add('is-done'),
      onEnterBack: () => node.classList.remove('is-done'),
    })
  })
}

/**
 * Scrolls to the point where a stage is established.
 *
 * Derived from the same geometry the story trigger uses, so a click lands the
 * viewer exactly where scrolling would have. Scroll stays the primary control:
 * this is a shortcut, never a mode (§36).
 */
export function scrollToStage(section: HTMLElement, index: number) {
  const top = section.getBoundingClientRect().top + window.scrollY
  const startY = top + ingressPx() * STORY_OVERLAP
  const endY = top + section.offsetHeight - window.innerHeight
  const target = STAGE_ANCHOR[index] ?? 0
  return startY + (endY - startY) * target
}
