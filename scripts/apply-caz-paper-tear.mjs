import { readFile, writeFile } from 'node:fs/promises'

const path = new URL('../src/views/CazLandingView.vue', import.meta.url)
let source = await readFile(path, 'utf8')

const importLine = "import paperTear from '@/assets/events/caz-and-dan/hero-paper-tear.png'"

if (!source.includes(importLine)) {
  const eventImport = "import { eventConfig } from '@/config/event.js'"
  if (!source.includes(eventImport)) {
    throw new Error('Could not find the Caz eventConfig import in CazLandingView.vue')
  }

  source = source.replace(eventImport, `${eventImport}\n${importLine}`)
}

source = source.replace(
  /<div\s+class=["']paper-tear["']\s+aria-hidden=["']true["']\s*><\/div>/,
  '<img class="paper-tear" :src="paperTear" alt="" aria-hidden="true" />',
)

if (!source.includes(':src="paperTear"')) {
  throw new Error('Could not find the paper-tear element in CazLandingView.vue')
}

const cssPattern = /\.paper-tear\s*\{[\s\S]*?\n\}/
const cssReplacement = `.paper-tear {
  position: relative;
  z-index: 4;
  display: block;
  width: calc(100% + 44px);
  height: auto;
  margin: -34px -22px 0;
  pointer-events: none;
}`

if (!cssPattern.test(source)) {
  throw new Error('Could not find the .paper-tear CSS block in CazLandingView.vue')
}

source = source.replace(cssPattern, cssReplacement)

source = source.replace(/\.paper-tear\s*\{\s*height:\s*26px\s*\}/g, '.paper-tear{margin-top:-26px}')

await writeFile(path, source)
console.log('Caz & Dan paper tear asset applied to CazLandingView.vue')
