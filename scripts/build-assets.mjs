import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const JOBS = [
  { src: 'organism.png',                     dir: 'story', out: '01-organism.webp',            width: 1600, alpha: true },
  { src: 'CELL_CLUSTER.png',                 dir: 'story', out: '02-cell-cluster.webp',        width: 1920, alpha: false },
  { src: 'NUCLEUS _INTRACELLULAR_WORLD.png', dir: 'story', out: '03-nucleus.webp',             width: 1920, alpha: false },
  { src: 'MOLECULAR_CANDIDATE.png',          dir: 'story', out: '07-molecular-candidate.webp', width: 1200, alpha: true },
  { src: 'INNOVATION_MICROSCOPY_FIELD.png',  dir: 'innovation', out: 'innovation-microscopy.webp', width: 1240, alpha: false, quality: 74 },
  { src: 'TECHNOLOGY_SAMPLE_SPECIMEN.png',   dir: 'technology', out: 'sample-specimen.webp', width: 900, alpha: true, quality: 78 },
  { src: 'SPATIAL_BIOLOGY_MICROSCOPY.png',   dir: 'capabilities', out: 'spatial-biology.webp',     width: 1280, alpha: false, quality: 76 },
  { src: 'PROTEIN_ENGINEERING_STRUCTURE.png', dir: 'capabilities', out: 'protein-engineering.webp', width: 880,  alpha: true,  quality: 84 },
  { src: 'Neon_Cellular_Tissue_Network.png',  dir: 'research', out: 'research-cellular-field.webp',     width: 1536, alpha: false, quality: 78 },
  { src: 'Neon_Cellular_Tissue_Network.png',  dir: 'research', out: 'research-cellular-field-820.webp', width: 820,  alpha: false, quality: 76 },
  { src: 'Neon_Ligand_in_Molecular_Depths.png', dir: 'research', out: 'research-protein-study.webp',     width: 1200, alpha: false, quality: 80 },
  { src: 'Neon_Ligand_in_Molecular_Depths.png', dir: 'research', out: 'research-protein-study-720.webp', width: 720,  alpha: false, quality: 78 },
  { src: 'Focused_Scientist_in_a_Teal_Laboratory.png', dir: 'impact', out: 'human-impact.webp', width: 720, alpha: false, quality: 80,
    crop: { left: 0, top: 308, width: 1122, height: 701 } },
]

for (const job of JOBS) {
  const inPath = join(root, job.src)

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
