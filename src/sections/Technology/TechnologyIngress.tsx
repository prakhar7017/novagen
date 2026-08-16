import { MICROSCOPY_SRC } from '@/sections/Innovation/innovation.constants'

interface Props {
  veilRef: React.RefObject<HTMLDivElement | null>
  plateRef: React.RefObject<HTMLDivElement | null>
  plateInRef: React.RefObject<HTMLDivElement | null>
  shadeRef: React.RefObject<HTMLDivElement | null>
}

export default function TechnologyIngress({
  veilRef,
  plateRef,
  plateInRef,
  shadeRef,
}: Props) {
  return (
    <div className="technology-ingress" aria-hidden="true">
      <div ref={veilRef} className="technology-ingress-veil" />

      <div ref={plateRef} className="technology-ingress-plate">
        <div ref={plateInRef} className="technology-ingress-plate-in">
          <img
            className="technology-ingress-img"
            src={MICROSCOPY_SRC}
            alt=""
            loading="lazy"
            decoding="async"
          />
          <div ref={shadeRef} className="technology-ingress-shade" />
        </div>
      </div>
    </div>
  )
}
