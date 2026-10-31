import fs from 'node:fs'

function replaceOrFail(text, search, replacement, label) {
  if (!text.includes(search)) throw new Error(`Could not find ${label}`)
  return text.replace(search, replacement)
}

// Caz landing only
{
  const file = 'src/views/CazLandingView.vue'
  let s = fs.readFileSync(file, 'utf8')
  s = s.replace('background:#ecebe7;', 'background:#f7f5ef;')
  s = s.replace('background:#faf9f4;', 'background:#f7f5ef;')
  s = s.replace(/\.paper-tear\s*\{[\s\S]*?\n\}/, `.paper-tear {
  position: relative;
  z-index: 4;
  display: block;
  width: calc(100% + 44px);
  max-width: none;
  height: auto;
  margin: -22px -22px 0;
  pointer-events: none;
}`)
  s = s.replace(/font-size:(?:17|18|19|20)px; letter-spacing:\.18em; cursor:pointer; box-shadow:0 10px 22px rgba\(0,0,0,\.12\); \}/, 'font-size:16px; letter-spacing:.16em; cursor:pointer; box-shadow:0 10px 22px rgba(0,0,0,.12); }')
  fs.writeFileSync(file, s)
}

// Caz admin only
{
  const file = 'src/views/CazAdminView.vue'
  let s = fs.readFileSync(file, 'utf8')
  s = s.replace(/\.gallery-lock-icon\{[^}]*\}/, '.gallery-lock-icon{display:grid;width:68px;height:68px;place-items:center;font-size:38px;color:#fff;flex:0 0 auto}')
  if (!s.includes('.gallery-lock-icon i{')) s = s.replace('.gallery-lock-icon{display:grid;width:68px;height:68px;place-items:center;font-size:38px;color:#fff;flex:0 0 auto}', '.gallery-lock-icon{display:grid;width:68px;height:68px;place-items:center;font-size:38px;color:#fff;flex:0 0 auto}.gallery-lock-icon i{font-size:38px!important;line-height:1}')
  s = s.replace(/\.gallery-card\{[^}]*\}/, '.gallery-card{width:100%;margin-top:20px;display:flex;align-items:center;justify-content:space-between;text-align:left!important;padding:24px!important;background:#111!important;color:#fff!important;border-color:#111!important;box-shadow:none!important}')
  s = s.replace(/\.gallery-card small\{[^}]*\}/, '.gallery-card small{color:#d8d5cd}')
  if (!s.includes('.gallery-card:disabled .gallery-lock-icon')) s = s.replace(/(\.gallery-card:disabled\{[^}]*\})/, '$1.gallery-card:disabled .gallery-lock-icon{color:#716f69}')
  fs.writeFileSync(file, s)
}

// Caz gallery only
{
  const file = 'src/components/admin/CazAdminGallery.vue'
  let s = fs.readFileSync(file, 'utf8')
  if (!s.includes('class="sort-select"')) {
    s = replaceOrFail(
      s,
      '<div class="controls"><select v-model="sortOrder"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>',
      '<div class="controls"><div class="sort-select"><select v-model="sortOrder"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></div>',
      'gallery sort select'
    )
  }
  if (!s.includes("font-awesome/6.7.2")) s = s.replace('<style scoped>\n', "<style scoped>\n@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css');\n")
  if (!s.includes('.sort-select{')) {
    s = s.replace('.gallery button,.gallery select{min-height:44px;border:1px solid #cac7bf;border-radius:7px;background:#fff;color:#111;padding:9px 14px;font:inherit;cursor:pointer}', '.gallery button,.gallery select{min-height:44px;border:1px solid #cac7bf;border-radius:7px;background:#fff;color:#111;padding:9px 14px;font:inherit;cursor:pointer}.sort-select{position:relative;width:290px;max-width:100%}.sort-select select{width:100%;appearance:none;-webkit-appearance:none;padding-right:46px;background:#fff}.sort-select i{position:absolute;top:50%;right:16px;transform:translateY(-50%);font-size:16px;pointer-events:none;color:#111}')
  }
  if (!s.includes('@media(max-width:767px){.gallery{padding:24px 12px 40px}.sort-select{width:100%}')) {
    s = s.replace('@media(max-width:767px){.gallery{padding:24px 12px 40px}', '@media(max-width:767px){.gallery{padding:24px 12px 40px}.sort-select{width:100%}')
  }
  fs.writeFileSync(file, s)
}

console.log('Applied Caz final visual polish. Sophie files were not touched.')
