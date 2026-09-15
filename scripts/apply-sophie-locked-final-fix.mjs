import fs from 'node:fs'
import path from 'node:path'

const file = path.resolve('src/views/AdminView.vue')
if (!fs.existsSync(file)) {
  console.error('Could not find src/views/AdminView.vue')
  process.exit(1)
}

let source = fs.readFileSync(file, 'utf8')

const replacements = [
  [
    /import\s+galleryLockedScreen\s+from\s+['"][^'"]+['"]/,
    "import galleryLockedScreen from '@/assets/events/sophies-last-rodeo/gallery-locked-screen-final.png'",
  ],
  [
    /import\s+galleryLockedMobile\s+from\s+['"][^'"]+['"]/,
    "import galleryLockedMobile from '@/assets/events/sophies-last-rodeo/gallery-locked-mobile-final.png'",
  ],
]

for (const [pattern, replacement] of replacements) {
  if (!pattern.test(source)) {
    console.error(`Could not find expected import matching: ${pattern}`)
    process.exit(1)
  }
  source = source.replace(pattern, replacement)
}

fs.writeFileSync(file, source)
console.log('Updated locked gallery assets in src/views/AdminView.vue')
console.log('Unlocked-state imports and styling were left untouched.')
