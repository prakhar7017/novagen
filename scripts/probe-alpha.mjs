import sharp from 'sharp'

const files = [
  'D:/nova-gen/MOLECULAR_CANDIDATE.png',
  'D:/nova-gen/organism.png',
  'D:/nova-gen/public/assets/story/07-molecular-candidate.webp',
  'D:/nova-gen/public/assets/story/01-organism.webp',
]

for (const f of files) {
  const img = sharp(f)
  const m = await img.metadata()
  console.log(`\n${f.split('/').pop()}`)
  console.log(`  ${m.width}x${m.height}  channels=${m.channels}  hasAlpha=${m.hasAlpha}`)

  if (!m.hasAlpha) {
    console.log('  -> NO ALPHA CHANNEL')
    continue
  }

  const { data, info } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const ch = info.channels
  const corner = (x, y) => {
    const i = (y * info.width + x) * ch
    return `[${data[i]},${data[i + 1]},${data[i + 2]},a=${data[i + 3]}]`
  }
  console.log(`  TL${corner(2, 2)} TR${corner(info.width - 3, 2)} BL${corner(2, info.height - 3)}`)

  let transparent = 0
  let opaque = 0
  for (let i = 3; i < data.length; i += ch) {
    if (data[i] < 8) transparent++
    else if (data[i] > 247) opaque++
  }
  const total = info.width * info.height
  console.log(
    `  fully transparent: ${((transparent / total) * 100).toFixed(1)}%  ` +
      `fully opaque: ${((opaque / total) * 100).toFixed(1)}%`,
  )
}
