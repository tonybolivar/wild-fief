# Wild Fief

Built with Astro, deployed on Vercel.

## Features

- **Interactive World Map** - Pan, zoom, and click location pins for details
- **100+ Lore Entries** - Full-page entries for every faction, god, nation, person, location, and event
- **Global Search** - Instant client-side search across all entries
- **Relationship Web** - D3.js force graph showing connections between all entries
- **Auto Cross-Linking** - Obsidian wiki-links (`[[Entry Name]]`) automatically converted to site links
- **Dark Fantasy Design** - Cinzel typography, warm gold accents, parchment texture

## Project Structure

```
wild-fief/
├── content/                        # Source lore files (Obsidian vault)
├── scripts/
│   └── prepare-content.mjs         # Reads content/ and writes to src/content/entries/
├── src/
│   ├── content/
│   │   ├── config.ts               # Content collection schema
│   │   └── entries/                # Generated, do not edit manually
│   ├── layouts/
│   │   └── Base.astro              # Site-wide layout and nav
│   ├── pages/
│   │   ├── index.astro             # Hero landing page
│   │   ├── map.astro               # Interactive Leaflet map
│   │   ├── search.astro            # Fuse.js search
│   │   ├── connections.astro       # D3 relationship graph
│   │   └── [category]/
│   │       ├── index.astro         # Category index
│   │       └── [slug].astro        # Entry detail page
│   └── styles/
│       └── global.css              # Design system
└── public/
    ├── images/                     # Copied from content/ at build time
    ├── search-index.json           # Generated
    └── categories.json             # Generated
```
