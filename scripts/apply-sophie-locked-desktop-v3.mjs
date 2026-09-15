import { readFileSync, writeFileSync } from 'node:fs'

const file = 'src/views/AdminView.vue'
let source = readFileSync(file, 'utf8')

const targetImport = "import galleryLockedScreen from '@/assets/events/sophies-last-rodeo/gallery-locked-screen-final-v3.png'"

const importPattern = /import galleryLockedScreen from '@\/assets\/events\/sophies-last-rodeo\/[^']+'/m

if (!importPattern.test(source)) {
  console.error('Could not find the galleryLockedScreen import in src/views/AdminView.vue')
  process.exit(1)
}

source = source.replace(importPattern, targetImport)

writeFileSync(file, source)
console.log('Updated desktop locked gallery artwork import.')
console.log('Mobile locked and all unlocked-state assets were left untouched.')
