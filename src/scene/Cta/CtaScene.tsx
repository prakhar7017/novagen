import CtaCell from './CtaCell'
import { useExperienceStore } from '@/store/experienceStore'

interface Props {
  /** Desktop only — a coarse pointer gets no parallax at all (§24) */
  pointerEnabled: boolean
}

/**
 * Everything section 08 draws into the shared canvas.
 *
 * A thin wrapper, and deliberately so: the closing scene is one cell, and the
 * only thing worth owning at this level is *when it exists at all*. Nothing is
 * built until the section arms itself a viewport away, which matters here more
 * than anywhere else on the page — the arming trigger is also what disposes
 * Impact's network, so the two never hold buffers at the same time (§53).
 */
export default function CtaScene({ pointerEnabled }: Props) {
  const armed = useExperienceStore((s) => s.ctaArmed)
  if (!armed) return null
  return <CtaCell pointerEnabled={pointerEnabled} />
}
