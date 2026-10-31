import fs from 'node:fs'

const file = 'src/views/CazLandingView.vue'
let source = fs.readFileSync(file, 'utf8')

// Remove the temporary PNG tear import if it was added previously.
source = source.replace(/^import\s+paperTear\s+from\s+['"]@\/assets\/events\/caz-and-dan\/hero-paper-tear\.png['"]\s*\n/m, '')

// Normalise the tear markup back to a CSS-driven element.
source = source.replace(
  /<img\s+class=["']paper-tear["'][^>]*>/m,
  '<div class="paper-tear" aria-hidden="true"></div>',
)

if (!source.includes('class="paper-tear"')) {
  source = source.replace(
    /(<\/button>\s*\n)(\s*<section class="welcome-copy">)/,
    '$1\n      <div class="paper-tear" aria-hidden="true"></div>\n\n$2',
  )
}

const css = `.paper-tear {
  position: relative;
  z-index: 4;
  width: calc(100% + 44px);
  height: 44px;
  margin: -22px -22px 0;
  background: #faf9f4;
  clip-path: polygon(
    0 42%,
    2.5% 34%,
    5% 45%,
    7.5% 30%,
    10% 41%,
    12.5% 33%,
    15% 47%,
    18% 35%,
    21% 44%,
    24% 31%,
    27% 43%,
    30% 36%,
    33% 48%,
    36% 32%,
    39% 42%,
    42% 34%,
    45% 46%,
    48% 31%,
    51% 43%,
    54% 35%,
    57% 48%,
    60% 32%,
    63% 42%,
    66% 35%,
    69% 47%,
    72% 31%,
    75% 43%,
    78% 35%,
    81% 46%,
    84% 32%,
    87% 42%,
    90% 34%,
    93% 47%,
    96% 33%,
    98% 43%,
    100% 36%,
    100% 100%,
    0 100%
  );
  filter: drop-shadow(0 -2px 2px rgba(17, 17, 17, 0.08));
  pointer-events: none;
}
`

// Replace any existing paper-tear CSS block, whether it came from the dotted CSS
// version or the temporary PNG implementation.
const cssBlock = /\.paper-tear\s*\{[\s\S]*?\}\s*/m
if (cssBlock.test(source)) {
  source = source.replace(cssBlock, css)
} else {
  source = source.replace(/(\.hero-button img\s*\{[^}]*\}\s*)/m, `$1\n${css}`)
}

// Remove the old short-screen height override that was meant for the previous tear.
source = source.replace(/\.paper-tear\s*\{\s*height\s*:\s*26px\s*;?\s*\}/g, '.paper-tear{height:34px;margin-top:-17px}')
source = source.replace(/\.paper-tear\s*\{\s*margin-top\s*:\s*-26px\s*;?\s*\}/g, '.paper-tear{height:34px;margin-top:-17px}')

fs.writeFileSync(file, source)
console.log(`Updated ${file} with the Caz & Dan CSS torn-paper edge.`)
