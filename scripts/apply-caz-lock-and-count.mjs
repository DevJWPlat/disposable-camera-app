import fs from 'node:fs'

const file = 'src/views/CazAdminView.vue'
let source = fs.readFileSync(file, 'utf8')
const before = source

source = source.replace(
  'const testingUnlockEnabled = true',
  'const testingUnlockEnabled = false',
)

source = source.replace(
  /\.gallery-card small\{[^}]*\}/g,
  '.gallery-card small{display:block;margin:0;color:#716f69;font:400 13px/1.4 Montserrat,sans-serif;letter-spacing:0}',
)

if (!source.includes('.gallery-card small{display:block')) {
  source = source.replace(
    '.gallery-card strong{font:400 28px Georgia,serif}',
    '.gallery-card strong{font:400 28px Georgia,serif}.gallery-card small{display:block;margin:0;color:#716f69;font:400 13px/1.4 Montserrat,sans-serif;letter-spacing:0}',
  )
}

source = source.replace(
  /\.gallery-card\.unlocked small(?:,[^{]+)?\{[^}]*\}/g,
  '.gallery-card.unlocked small{color:#fff!important}',
)

if (!source.includes('.gallery-card.unlocked small{color:#fff!important}')) {
  source = source.replace(
    /\.gallery-card\.unlocked\{[^}]*\}/,
    (match) => `${match}.gallery-card.unlocked small{color:#fff!important}`,
  )
}

if (source === before) {
  throw new Error('No Caz admin gallery changes were required.')
}

fs.writeFileSync(file, source)
console.log('Caz gallery relocked and photo-count text size fixed. Sophie files were not touched.')
