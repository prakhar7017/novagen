import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { viewportHeight } from '@/lib/viewport'

gsap.registerPlugin(ScrollTrigger)

export const INGRESS_VH = 56

export function buildResearchIngress(panel: HTMLElement, fill: HTMLElement) {
  const edge = panel.querySelector('.research-ingress-edge')

  gsap.timeline({
    scrollTrigger: {
      trigger: panel,
      start: 'top bottom',
      end: 'top 20%',
      scrub: 0.7,
      invalidateOnRefresh: true,
    },
    defaults: { ease: 'none' },
  })
    .fromTo(fill, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.78, ease: 'power2.inOut' }, 0)
    .fromTo(edge, { opacity: 0 }, { opacity: 0.55, duration: 0.22 }, 0.04)
    .to(edge, { opacity: 0, duration: 0.24 }, 0.62)
}

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
    start: reduced
      ? 'top top'
      : () => `top top+=${viewportHeight() * (INGRESS_VH / 100) * 0.96}`,
    end: 'bottom bottom',
    onEnter: () => setSurface(true),
    onEnterBack: () => setSurface(true),
    onLeaveBack: () => setSurface(false),
  })

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
  from: 'left' | 'right'
}

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
