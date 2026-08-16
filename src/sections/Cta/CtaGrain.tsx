/**
 * The closing section's grain filter definition (§36 asks for 2–3%).
 *
 * Its own id and its own frequency, matching the pattern Hero, Innovation,
 * Research and Impact each follow — sharing one definition would change all
 * five. Coarser and weaker than Impact's: §36 asks for static or extremely
 * subtle, and this is the frame the page is meant to rest on.
 */
export default function CtaGrain() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <filter id="cta-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
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
