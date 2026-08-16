/**
 * The section's grain filter definition (§29 asks for 2–4%).
 *
 * Generated rather than shipped, the same device Hero, Innovation and Research
 * use — and with its own filter id, because those three run at different
 * frequencies and sharing one would change all four. The element that *wears*
 * the filter is `.impact-grain`; this is only the definition, so both
 * presentations can mount it without duplicating the markup.
 */
export default function ImpactGrain() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <filter id="impact-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" />
        </filter>
      </defs>
    </svg>
  )
}
