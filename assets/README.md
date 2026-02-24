# Assets (single source)

All app assets live **only here**. There is no second asset folder.

- **Root `assets/`** (this folder) – Bundled by Vite. Import with `@/assets/...`.
- **`public/`** – For static files that must keep a fixed URL (e.g. favicon, robots.txt). Not for images used in components; use `assets/` and import instead.

## Structure

- **`icons/`** – UI icons (left.svg, right.svg, ratings.svg)
- **`images/`** – General images (workflow.svg, users.png) and section images
- **`images/growth/`** – SmartGrowth section card images
- **`brand-logo/`** – Partner/brand logos for the slider
- **`data/`** – Static data (e.g. svgPaths.ts for inline SVG path strings)

## Usage

```ts
import leftSvg from "@/assets/icons/left.svg";
import workflowSvg from "@/assets/images/workflow.svg";
import svgPaths from "@/assets/data/svgPaths";
```
