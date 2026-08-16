import CtaCell from './CtaCell'
import { useExperienceStore } from '@/store/experienceStore'

interface Props {
  pointerEnabled: boolean
}

export default function CtaScene({ pointerEnabled }: Props) {
  const armed = useExperienceStore((s) => s.ctaArmed)
  if (!armed) return null
  return <CtaCell pointerEnabled={pointerEnabled} />
}
