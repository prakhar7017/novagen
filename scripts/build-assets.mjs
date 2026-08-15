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

/** @type {{src: string, dir: string, out: string, width: number, alpha: boolean, quality?: number}[]} */
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

  const pipeline = sharp(inPath).resize({
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
