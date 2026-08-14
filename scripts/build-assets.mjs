/**
 * Story asset pipeline — converts source PNGs into optimized WebP
 * under public/assets/story/ using the ASSET_MANIFEST naming scheme.
 *
 * Run: node scripts/build-assets.mjs
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'assets', 'story')

/** @type {{src: string, out: string, width: number, alpha: boolean}[]} */
const JOBS = [
  { src: 'organism.png',                     out: '01-organism.webp',           width: 1600, alpha: true },
  { src: 'CELL_CLUSTER.png',                 out: '02-cell-cluster.webp',       width: 1920, alpha: false },
  { src: 'NUCLEUS _INTRACELLULAR_WORLD.png', out: '03-nucleus.webp',            width: 1920, alpha: false },
  { src: 'MOLECULAR_CANDIDATE.png',          out: '07-molecular-candidate.webp', width: 1200, alpha: true },
]

await mkdir(outDir, { recursive: true })

for (const job of JOBS) {
  const inPath = join(root, job.src)
  const outPath = join(outDir, job.out)

  const pipeline = sharp(inPath).resize({
    width: job.width,
    withoutEnlargement: true,
  })

  const info = await pipeline
    .webp({ quality: job.alpha ? 88 : 82, effort: 6, alphaQuality: 100 })
    .toFile(outPath)

  console.log(
    `${job.out.padEnd(30)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`,
  )
}

console.log('\nStory assets written to public/assets/story/')
