import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SECTION_IDS } from '@/lib/sections'
import { useExperienceStore } from '@/store/experienceStore'

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
