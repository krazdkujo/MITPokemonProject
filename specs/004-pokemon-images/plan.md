# Implementation Plan: Pokemon Images Download

**Branch**: `004-pokemon-images` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-pokemon-images/spec.md`

## Summary

Download and store all Generation 1 Pokemon sprite images locally within the project's public assets folder, enabling offline access and eliminating runtime dependency on external image APIs. Images will be sourced from PokeAPI and stored as PNG files named by national dex number.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14, node-fetch (for download script)
**Storage**: Static files in `public/images/pokemon/` directory (served by Next.js)
**Testing**: Manual verification script, visual inspection
**Target Platform**: Web (Next.js on Vercel)
**Project Type**: Web application (Next.js)
**Performance Goals**: Images load in under 100ms from local storage
**Constraints**: Total image storage under 10MB, individual sprites under 50KB
**Scale/Scope**: 151 Generation 1 Pokemon sprites

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Two-Tier Data Model | PASS | Images are static assets, not database storage. Pokemon reference data stays in Source/. |
| II. External JWT Authentication | N/A | No auth required for static image assets. |
| III. Row-Level Security | N/A | Static assets, no database involvement. |
| IV. Data Merging Pattern | N/A | No API response merging needed; images are directly referenced by URL. |
| V. Serverless Architecture | PASS | Static images served from public/ folder, compatible with Vercel static hosting. |
| VI. Pokemon 5e Compliance | PASS | Images complement Source data; Pokemon IDs from Source used for file naming. |
| VII. Educational API Design | N/A | No API endpoints for images; served as static files. |
| VIII. Spec-Driven Development | PASS | Following spec-driven workflow. |

**Gate Result**: PASSED - No constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-pokemon-images/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal for this feature)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty for this feature)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
public/
└── images/
    └── pokemon/
        ├── 1.png          # Bulbasaur
        ├── 2.png          # Ivysaur
        ├── ...
        ├── 151.png        # Mew
        └── placeholder.png # Fallback for missing images

scripts/
└── download-pokemon-images.js  # One-time download utility

lib/
└── pokemonImages.js     # Helper to construct image paths

components/
└── PokemonSprite.js     # Reusable component for displaying Pokemon images
```

**Structure Decision**: Images go in `public/images/pokemon/` which Next.js serves as static files at `/images/pokemon/`. A download script in `scripts/` handles the one-time fetch from PokeAPI. A helper library and component provide consistent access patterns.

## Complexity Tracking

> No constitutional violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
