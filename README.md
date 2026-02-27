# Wild Fief — World Showcase Website

A public-facing fantasy world showcase for the **Wild Fief** D&D campaign setting. Built as a static site with Astro.

## Features

- **Interactive World Map** — Pan, zoom, and click location pins for details
- **100+ Lore Entries** — Full-page entries for every faction, god, nation, person, location, and event
- **Global Search** — Instant client-side search across all entries (Fuse.js)
- **Relationship Web** — D3.js force graph showing connections between all entries
- **Auto Cross-Linking** — Obsidian wiki-links (`[[Entry Name]]`) automatically converted to site links
- **Dark Fantasy Design** — Cinzel typography, warm gold accents, parchment texture

## Updating Content

All content lives in the source Obsidian vault at `C:/Users/tonyt/Desktop/wild-fief/`. The site reads directly from there.

**To add or edit a lore entry:**
1. Edit the `.md` file in the appropriate folder in the Wild Fief vault
2. Rebuild the site: `npm run build`
3. The site regenerates automatically

**To add a new category:**
1. Create a new folder in the Wild Fief vault
2. Add the folder to `CATEGORY_FOLDERS` in `scripts/prepare-content.mjs`
3. Add it to `getStaticPaths()` in `src/pages/[category]/index.astro`

**To add location pins to the map:**
Edit the `locations` array in `src/pages/map.astro`. Each pin takes:
```js
{
  name: 'City Name',
  category: 'locations',
  slug: 'city-slug',
  desc: 'Short description',
  pos: [yPercent, xPercent],  // position on the map image
  color: '#c9a227',           // pin color
}
```

**Supported Obsidian syntax:**
- `[[Link Name]]` → converted to internal links
- `[[Link Name|Display Text]]` → converted with display text
- `![[image.png]]` → rendered as `<img>` tag
- Standard markdown (headings, bold, lists, blockquotes)

## Development

```bash
# Install dependencies
npm install

# Start dev server (also runs content prep)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repo to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Set root directory: `wild-fief-site` (if monorepo)

**Important:** The content preparation script reads from `C:/Users/tonyt/Desktop/wild-fief/`. For cloud deployment, either:
- Copy the Wild Fief folder into the project and update `SOURCE_ROOT` in the prepare script
- Commit the processed `src/content/entries/` files to the repo (run `npm run prepare-content` first)

### GitHub Pages
After building, deploy the `dist/` folder. Add a `deploy.yml` GitHub Action:
```yaml
- uses: actions/deploy-pages@v3
  with:
    artifact_path: dist
```

## Project Structure

```
wild-fief-site/
├── scripts/
│   └── prepare-content.mjs    # Reads Wild Fief .md files → src/content/entries/
├── src/
│   ├── content/
│   │   ├── config.ts           # Content collection schema
│   │   └── entries/            # Generated — do not edit manually
│   ├── layouts/
│   │   └── Base.astro          # Site-wide layout + nav
│   ├── pages/
│   │   ├── index.astro         # Hero landing page
│   │   ├── map.astro           # Interactive Leaflet map
│   │   ├── search.astro        # Fuse.js search
│   │   ├── connections.astro   # D3 relationship graph
│   │   ├── [category]/
│   │   │   ├── index.astro     # Category index (cards)
│   │   │   └── [slug].astro    # Entry detail page
│   └── styles/
│       └── global.css          # Full design system
└── public/
    ├── images/                 # Copied from Wild Fief
    ├── search-index.json       # Generated search data
    └── categories.json         # Generated category data
```
