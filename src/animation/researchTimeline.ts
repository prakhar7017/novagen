import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Section 06 — Research.
 *
 * The quietest motion on the page, by design (§35). Four sections have already
 * spent the reader's attention on pinned sequences, particle fields and
 * instrument panels; this one is asked to communicate confidence through
 * restraint, so nothing here scales, explodes or takes the viewport. What is
 * left is the editorial vocabulary: things are uncovered, rules are drawn, and
 * images drift by a couple of percent.
 *
 * Every builder below is a no-op under reduced motion at the call site — the
 * components never build them — which leaves the section in its natural, fully
 * revealed state rather than one that has to be scrolled past to become
 * complete (§49).
 */

/**
 * Scroll length, in vh, of the Capabilities → Research handoff.
 *
 * Reserved *above* Research's own top edge: the Bone panel is that tall, sits
 * at exactly minus this height, and paints over the end of Capabilities. The
 * section itself is unchanged by it, which is what keeps the two sections
 * independent — Capabilities settles on its own schedule and this reveals on
 * its own, and neither has to know the other's timeline.
 */
export const INGRESS_VH = 56

/**
 * The Bone reveal (§5, §6).
 *
 * TOOL → OBSERVATION → EVIDENCE, in three overlapping moves: the modules above
 * have already flattened (see the Capabilities settle), Bone floods upward
 * through a straight-edged mask, and the section label arrives afterwards on
 * its own trigger — by which point the background is roughly two thirds
 * established.
 *
 * A mask rather than a dissolve, and upward rather than radial: Innovation
 * already owns the aperture and the Journey owns the dissolve, and a third
 * fullscreen cinematic handoff would be a tic rather than a language (§5).
 */
export function buildResearchIngress(panel: HTMLElement, fill: HTMLElement) {
  const edge = panel.querySelector('.research-ingress-edge')

  gsap.timeline({
    scrollTrigger: {
      trigger: panel,
      // From the moment the panel's top edge enters the viewport to the moment
      // it is a fifth of the way down it — so the Bone is complete well before
      // the section's real top edge arrives, and the two never meet as a seam.
      start: 'top bottom',
      end: 'top 20%',
      scrub: 0.7,
      invalidateOnRefresh: true,
    },
    defaults: { ease: 'none' },
  })
    // The surface slides up behind the panel's own overflow rather than being
    // uncovered by an animated clip-path. Same movement, same easing, but a
    // compositor transform instead of a full-viewport repaint per frame — this
    // tween spans the whole Capabilities → Research boundary, which was the
    // roughest transition on the page before the change.
    .fromTo(fill, { yPercent: 100 }, { yPercent: 0, duration: 0.78, ease: 'power2.inOut' }, 0)
    // The leading edge now sits at the top of the surface and rides it, which
    // is what it was always imitating with a second tween of its own. All that
    // is left for it is the fade: in as the surface starts moving, out before
    // it arrives, so the Bone finishes on its own rather than under a line.
    .fromTo(edge, { opacity: 0 }, { opacity: 0.55, duration: 0.22 }, 0.04)
    .to(edge, { opacity: 0, duration: 0.24 }, 0.62)
}

/**
 * Surface bookkeeping.
 *
 * The fixed header's Bone type is invisible on Bone, and the shared canvas has
 * nothing to draw behind an opaque section — both are true from the moment the
 * rising panel floods the strip under the header, which is well before this
 * section's own top edge arrives. Driven from one place so they cannot
 * disagree.
 */
export function buildResearchSurface(
  section: HTMLElement,
  setCanvasActive: (active: boolean) => void,
  reduced: boolean,
) {
  const setSurface = (light: boolean) => {
    document.documentElement.dataset.surface = light ? 'light' : 'dark'
  }

  const surface = ScrollTrigger.create({
    trigger: section,
    // The moment the strip beneath the fixed header stops being dark — which
    // is when the rising panel's own top edge clears the top of the screen,
    // most of a viewport before this section's top edge arrives. Any later and
    // the header's Bone type is stranded on Bone. Without motion the panel
    // never shows, and the two surfaces simply meet at the section's top edge.
    start: reduced
      ? 'top top'
      : () => `top top+=${window.innerHeight * (INGRESS_VH / 100) * 0.96}`,
    end: 'bottom bottom',
    onEnter: () => setSurface(true),
    onEnterBack: () => setSurface(true),
    onLeaveBack: () => setSurface(false),
  })

  // Held to the section's own top edge: the canvas is already stopped by
  // Capabilities above, and stopping it any earlier would freeze a handoff that
  // is still on screen. This exists so the state is correct when the reader
  // arrives here from below as well.
  const canvas = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onEnter: () => setCanvasActive(false),
    onEnterBack: () => setCanvasActive(false),
  })

  return () => {
    surface.kill()
    canvas.kill()
    setSurface(false)
    setCanvasActive(true)
  }
}

/**
 * Section label, headline and supporting copy (§21).
 *
 * Arrives after the background rather than with it, and once — the header is
 * not a scrubbed element, because a headline that reverses as the reader
 * scrolls back a little is a headline that never settles.
 */
export function buildResearchHeader(root: HTMLElement) {
  const label = root.querySelector('.research-label')
  const lines = gsap.utils.toArray<HTMLElement>('.research-headline .line-inner', root)
  const lead = root.querySelector('.research-lead')
  const meta = root.querySelector('.research-label-meta')

  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: 'top 82%', once: true },
  })

  if (label) tl.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 104 },
      { yPercent: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
      0.08,
    )
  }
  if (lead) {
    tl.fromTo(lead, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.62, ease: 'power2.out' }, 0.34)
  }
  if (meta) tl.fromTo(meta, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.42)
}

interface StudyOptions {
  /**
   * Direction the image uncovers from. The lead study opens left-to-right and
   * the second right-to-left, matching the side each one sits on — the reveal
   * runs *away* from the text it belongs to rather than toward it.
   */
  from: 'left' | 'right'
}

/**
 * One study's entrance (§21, §22).
 *
 * A scientific shutter, not an organic mask: a straight edge crosses the frame
 * and the image is simply there behind it. Research is the precise section, and
 * the blob reveal belongs to the biology earlier in the page.
 *
 * The text follows rather than accompanies — label, then title lines out of
 * their clips, then the summary, then the metadata rules drawing from zero
 * width. Total travel is under 300ms of stagger, which is what keeps a
 * four-part entrance feeling like one movement.
 */
export function buildStudyEntrance(root: HTMLElement, { from }: StudyOptions) {
  const frame = root.querySelector('.study-frame')
  const index = root.querySelector('.study-index')
  const lines = gsap.utils.toArray<HTMLElement>('.study-title .line-inner', root)
  const summary = root.querySelector('.study-summary')
  const rules = gsap.utils.toArray<HTMLElement>('.study-meta-rule', root)

  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: 'top 78%', once: true },
  })

  if (frame) {
    const closed = from === 'left' ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)'
    tl.fromTo(
      frame,
      { clipPath: closed, y: 18 },
      { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1, ease: 'power3.inOut' },
      0,
    )
  }
  if (index) tl.fromTo(index, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.18)
  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 106 },
      { yPercent: 0, duration: 0.72, stagger: 0.09, ease: 'power3.out' },
      0.26,
    )
  }
  if (summary) {
    tl.fromTo(summary, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.46)
  }
  if (rules.length) {
    tl.fromTo(
      rules,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.55, stagger: 0.08, ease: 'power2.out' },
      0.56,
    )
  }

  // The index marker in the margin takes Bio Green while the study owns the
  // viewport and gives it back afterwards (§30) — the only piece of state in
  // the section, and the only reason the three studies feel like one sequence
  // rather than three blocks.
  const marker = root.querySelector('.study-index')
  if (marker) {
    ScrollTrigger.create({
      trigger: root,
      start: 'top 62%',
      end: 'bottom 38%',
      onToggle: ({ isActive }) => marker.classList.toggle('is-current', isActive),
    })
  }
}

/**
 * Image parallax (§36).
 *
 * Four percent of travel in total, over a whole viewport of scroll. Deliberately
 * at the edge of perceptible: enough that the image is not pinned to the page
 * like a screenshot, far short of anything that makes the section feel unstable.
 */
export function buildStudyParallax(image: HTMLElement) {
  gsap.fromTo(
    image,
    { yPercent: -2 },
    {
      yPercent: 2,
      ease: 'none',
      scrollTrigger: {
        trigger: image.closest('.study-frame') ?? image,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    },
  )
}

/**
 * Study 03's figure (§27).
 *
 * Drawn in the order the figure is read: the three distributions appear as
 * distributions (staggered within each state, so they accumulate rather than
 * switch on), the stems draw downward, and the shared cluster resolves last.
 * The point of the sequencing is the argument — evidence first, convergence
 * after — not the animation.
 */
export function buildFigureReveal(root: HTMLElement) {
  const columns = gsap.utils.toArray<HTMLElement>('.figure-state', root)
  const stems = gsap.utils.toArray<SVGPathElement>('.figure-stem', root)
  const divider = root.querySelector('.figure-divider')
  const cluster = root.querySelector('.figure-cluster')
  const edges = gsap.utils.toArray<SVGLineElement>('.figure-edge', root)
  const nodes = gsap.utils.toArray<SVGCircleElement>('.figure-node', root)

  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: 'top 74%', once: true },
  })

  columns.forEach((column, i) => {
    const dots = gsap.utils.toArray<SVGCircleElement>('.figure-dot', column)
    const label = column.querySelector('.figure-state-label')
    if (label) tl.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.4 }, i * 0.12)
    if (dots.length) {
      tl.fromTo(
        dots,
        { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          // Randomised rather than sequential: a distribution that fills in
          // left to right is a bar chart being drawn, not a sample.
          stagger: { each: 0.012, from: 'random' },
          ease: 'power2.out',
        },
        i * 0.12 + 0.08,
      )
    }
  })

  if (divider) {
    tl.fromTo(divider, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, 0.5)
  }

  stems.forEach((stem, i) => {
    const length = stem.getTotalLength()
    tl.fromTo(
      stem,
      { strokeDasharray: length, strokeDashoffset: length },
      { strokeDashoffset: 0, duration: 0.62, ease: 'power2.inOut' },
      0.58 + i * 0.07,
    )
  })

  if (cluster) tl.fromTo(cluster, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.9)
  if (edges.length) {
    tl.fromTo(edges, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.04 }, 0.94)
  }
  if (nodes.length) {
    tl.fromTo(
      nodes,
      { scale: 0.3, transformOrigin: '50% 50%' },
      { scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(2)' },
      0.96,
    )
  }
}

/**
 * The section footer (§38, §39).
 *
 * Two statements and one number. The number is the only element in Research
 * that grows: it starts fractionally small and faint and settles as the section
 * ends, which is the whole preparation for Impact — enough that the reader
 * registers a figure arriving, not enough to explain it here.
 */
export function buildResearchFooter(root: HTMLElement) {
  const lines = gsap.utils.toArray<HTMLElement>('.research-footer-line', root)
  const support = root.querySelector('.research-footer-support')
  const marker = root.querySelector('.research-footer-marker')

  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: 'top 84%', once: true },
  })

  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 104 },
      { yPercent: 0, duration: 0.76, stagger: 0.1, ease: 'power3.out' },
      0,
    )
  }
  if (support) {
    tl.fromTo(support, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.3)
  }

  if (marker) {
    gsap.fromTo(
      marker,
      { opacity: 0, scale: 0.88 },
      {
        opacity: 1,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top 76%',
          end: 'bottom 72%',
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      },
    )
  }
}
