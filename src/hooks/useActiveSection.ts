import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SECTION_IDS } from '@/lib/sections'
import { useExperienceStore } from '@/store/experienceStore'

/**
 * Track which section owns the viewport (§10).
 *
 * One ScrollTrigger per section rather than an IntersectionObserver, for a
 * specific reason: half the sections on this page are pinned or sticky, and an
 * IntersectionObserver reports a *sticky* stage as leaving the viewport the
 * moment its tall parent scrolls past — which would blank the navigation
 * indicator exactly while the reader is deepest inside a section. ScrollTrigger
 * measures the trigger element's own scroll range, which is what "current"
 * means here.
 *
 * The boundary is the middle of the viewport: a section becomes current when it
 * has taken over the reader's attention, not when its first pixel appears.
 */
export function useActiveSection() {
  const setCurrentSection = useExperienceStore((s) => s.setCurrentSection)

  useEffect(() => {
    const triggers = SECTION_IDS.map((id) => {
      const el = document.getElementById(id)
      if (!el) return null
      return ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) setCurrentSection(id)
        },
      })
    })

    return () => {
      for (const t of triggers) t?.kill()
    }
  }, [setCurrentSection])
}
