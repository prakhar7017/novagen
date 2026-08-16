/**
 * Story asset pipeline — converts source PNGs into optimized WebP
 * under public/assets/ using the ASSET_MANIFEST naming scheme.
 *
 * Run: node scripts/build-assets.mjs
 */
import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * @type {{
 *   src: string, dir: string, out: string, width: number, alpha: boolean,
 *   quality?: number,
 *   crop?: {left: number, top: number, width: number, height: number},
 * }[]}
 */
const JOBS = [
  { src: 'organism.png',                     dir: 'story', out: '01-organism.webp',            width: 1600, alpha: true },
  { src: 'CELL_CLUSTER.png',                 dir: 'story', out: '02-cell-cluster.webp',        width: 1920, alpha: false },
  { src: 'NUCLEUS _INTRACELLULAR_WORLD.png', dir: 'story', out: '03-nucleus.webp',             width: 1920, alpha: false },
  { src: 'MOLECULAR_CANDIDATE.png',          dir: 'story', out: '07-molecular-candidate.webp', width: 1200, alpha: true },
  // Section 03 · Innovation. The source is already a 4:5 portrait field with
  // its bright focal nucleus near the centre, so it needs no crop — only a
  // resize to 2x the largest frame the layout ever renders (620px).
  // Dense fluorescence detail compresses badly, so this one takes a lower
  // quality than the story assets — at display size the difference is invisible
  // and it saves ~80KB on a below-the-fold, lazily loaded image.
  { src: 'INNOVATION_MICROSCOPY_FIELD.png',  dir: 'innovation', out: 'innovation-microscopy.webp', width: 1240, alpha: false, quality: 74 },
  // Section 04 · Technology. The specimen is drawn into the shared canvas at
  // roughly 420px square and never larger, so 900px covers a 2x display. Its
  // fluorescent membrane detail compresses about as badly as the Innovation
  // field, hence the reduced quality — at display size, behind an erosion
  // shader, the difference is invisible and it saves ~120KB. Genuine alpha
  // outside the silhouette: the erosion depends on it.
  { src: 'TECHNOLOGY_SAMPLE_SPECIMEN.png',   dir: 'technology', out: 'sample-specimen.webp', width: 900, alpha: true, quality: 78 },
  // Section 05 · Capabilities. Both are drawn inside a module rather than
  // full-bleed, so they are sized to 2x the largest box the grid ever gives
  // them (~640px for the spatial field, ~430px for the protein).
  // The microscopy field is opaque and fills its module edge to edge; the
  // protein keeps genuine alpha, since it floats over the module surface and
  // its rim glow reads through the transparent corners.
  { src: 'SPATIAL_BIOLOGY_MICROSCOPY.png',   dir: 'capabilities', out: 'spatial-biology.webp',     width: 1280, alpha: false, quality: 76 },
  { src: 'PROTEIN_ENGINEERING_STRUCTURE.png', dir: 'capabilities', out: 'protein-engineering.webp', width: 880,  alpha: true,  quality: 84 },
  // Section 06 · Research. Both studies ship at two widths rather than one:
  // the lead image is ~880px wide on a 1440 desktop and 100% of a 350px phone,
  // and sending the desktop file to the phone is most of a megabyte of pixels
  // it will never resolve (§51). The narrow variants are what `srcset` picks.
  //
  // The cellular field is used uncropped at 3:2, so the annotations over it
  // land on the biology they name; the source is already that ratio.
  { src: 'Neon_Cellular_Tissue_Network.png',  dir: 'research', out: 'research-cellular-field.webp',     width: 1536, alpha: false, quality: 78 },
  { src: 'Neon_Cellular_Tissue_Network.png',  dir: 'research', out: 'research-cellular-field-820.webp', width: 820,  alpha: false, quality: 76 },
  // The protein is framed at 16:10 from a 4:3 source, so it carries a little
  // more width than the box needs and the crop stays centred on the structure.
  { src: 'Neon_Ligand_in_Molecular_Depths.png', dir: 'research', out: 'research-protein-study.webp',     width: 1200, alpha: false, quality: 80 },
  { src: 'Neon_Ligand_in_Molecular_Depths.png', dir: 'research', out: 'research-protein-study-720.webp', width: 720,  alpha: false, quality: 78 },
  // Section 07 · Impact. The human moment (§26, §27) is a small editorial
  // crop, never a full-bleed photograph — ~320px wide on a 1440 desktop, so
  // 720px covers a 2x display. The source is a 4:5 portrait; the crop takes a
  // 1.6:1 band through the middle of it, which keeps the researcher, the
  // pipette and the green field on the monitor and drops the empty ceiling and
  // the foreground glassware. Opaque: it sits inside a framed panel.
  { src: 'Focused_Scientist_in_a_Teal_Laboratory.png', dir: 'impact', out: 'human-impact.webp', width: 720, alpha: false, quality: 80,
    crop: { left: 0, top: 308, width: 1122, height: 701 } },
]

for (const job of JOBS) {
  const inPath = join(root, job.src)

  // Sources are kept out of the repo once converted, so a missing input means
  // "already built" rather than an error — skip it and leave the WebP in place.
  if (!existsSync(inPath)) {
    console.log(`${(job.dir + '/' + job.out).padEnd(42)} skipped (source not present)`)
    continue
  }

  const outDir = join(root, 'public', 'assets', job.dir)
  await mkdir(outDir, { recursive: true })

  const outPath = join(outDir, job.out)

  let pipeline = sharp(inPath)
  if (job.crop) pipeline = pipeline.extract(job.crop)
  pipeline = pipeline.resize({
    width: job.width,
    withoutEnlargement: true,
  })

  const info = await pipeline
    .webp({ quality: job.quality ?? (job.alpha ? 88 : 82), effort: 6, alphaQuality: 100 })
    .toFile(outPath)

  console.log(
    `${(job.dir + '/' + job.out).padEnd(42)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`,
  )
}

console.log('\nAssets written to public/assets/')
