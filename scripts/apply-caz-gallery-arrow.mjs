import fs from 'node:fs'

const file = 'src/views/CazAdminView.vue'
let source = fs.readFileSync(file, 'utf8')

const before = source

source = source.replace(
  /\{\{\s*galleryUnlocked\s*\?\s*'Open gallery'\s*:\s*'Gallery locked'\s*\}\}/g,
  "{{ galleryUnlocked ? 'Gallery open' : 'Gallery locked' }}",
)

source = source.replace(
  /<span class="gallery-lock-icon" aria-hidden="true"><i :class="galleryUnlocked \? 'fa-solid fa-lock-open' : 'fa-solid fa-lock'"><\/i><\/span>/g,
  '<span class="gallery-arrow" aria-hidden="true">→</span>',
)

source = source.replace(
  /<span class="gallery-lock-icon" aria-hidden="true">[\s\S]*?<\/span>/g,
  '<span class="gallery-arrow" aria-hidden="true">→</span>',
)

source = source.replace(
  /\.gallery-lock-icon\s*\{[^}]*\}/g,
  '.gallery-arrow{display:grid;width:44px;height:44px;place-items:center;font-size:34px;line-height:1;color:inherit;flex:0 0 auto}',
)

if (!source.includes('.gallery-arrow{')) {
  source = source.replace(
    '</style>',
    '.gallery-arrow{display:grid;width:44px;height:44px;place-items:center;font-size:34px;line-height:1;color:inherit;flex:0 0 auto}\n</style>',
  )
}

if (source === before) {
  throw new Error('No matching Caz gallery markup found; no changes were made.')
}

fs.writeFileSync(file, source)
console.log('Updated Caz admin gallery card: “Gallery open” + simple arrow.')
