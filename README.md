# Image Gallery

A local-first image management desktop application with AI-powered tagging, cloud sync, and dual-shell support (Electron + Tauri).

## Overview

Image Gallery is a feature-rich desktop app for organizing, browsing, and managing image collections. It stores all data locally in IndexedDB, supports AI-driven auto-tagging across 9 providers, cloud synchronization via WebDAV/HTTP, and full import/export with ZIP backups.

The codebase was refactored into a pnpm monorepo with clear package boundaries, TypeScript type safety, and comprehensive test coverage.

## Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | Vue 3 (Composition API), Element Plus, Pinia, Vue Router, Vue I18n |
| **Desktop Shell** | Electron 37 / Tauri 2.0 (dual-shell) |
| **Language** | TypeScript (strict-ready), JavaScript (legacy app code) |
| **Database** | Dexie.js (IndexedDB wrapper) — 9 object stores |
| **AI Integration** | OpenAI, Google Vision, Azure CV, Baidu Ernie, Alibaba Qwen, Zhipu GLM, Kimi, Doubao, SiliconFlow |
| **Image Processing** | sharp (thumbnails, pHash, color extraction) |
| **Sync** | WebDAV, HTTP API (extensible adapter pattern) |
| **Build** | Vite 6, pnpm Workspace |
| **Testing** | Vitest (unit + component), Playwright (E2E) |
| **CI/CD** | GitHub Actions (lint → typecheck → test → build → e2e) |
| **Tooling** | ESLint 9 (flat config), Prettier, lefthook |

## Architecture

```
gallery-app/
├── apps/
│   └── desktop/                    # @gallery/desktop — Electron + Tauri app
│       ├── src/                    # Vue 3 renderer (views, components, stores)
│       ├── src-tauri/              # Tauri 2.0 Rust backend
│       │   ├── Cargo.toml
│       │   ├── src/main.rs         # Tauri entry + IPC commands
│       │   └── tauri.conf.json     # Plugins: dialog, clipboard, fs, shell
│       ├── vite.config.js          # Vite 6 config
│       └── package.json
├── packages/
│   ├── shared/                     # @gallery/shared — Types, constants, utilities
│   ├── db/                         # @gallery/db — Dexie.js schema + repositories
│   ├── ai/                         # @gallery/ai — Unified provider abstraction (9 providers)
│   ├── sync/                       # @gallery/sync — Cloud sync adapters + conflict resolution
│   ├── image-processor/            # @gallery/image-processor — sharp: thumbnail, pHash, colors
│   └── ui/                         # @gallery/ui — Reusable Vue components + composables
├── tests/
│   └── e2e/                        # Playwright E2E tests
├── pnpm-workspace.yaml
├── vitest.config.ts
├── playwright.config.ts
└── .github/workflows/ci.yml
```

### Dependency Graph

```
apps/desktop
  ├── @gallery/ui           (shared Vue components)
  ├── @gallery/db           (Dexie.js database layer)
  ├── @gallery/ai           (unified AI providers)
  ├── @gallery/sync         (cloud sync adapters)
  ├── @gallery/image-processor (sharp image processing)
  └── @gallery/shared       (shared types)
```

## Features

### Image Management
- Drag-and-drop / click to upload images
- Ctrl+V clipboard paste support
- Grid gallery with configurable column count
- Full-size image detail view with thumbnail carousel
- Image metadata panel (name, dimensions, creation date)
- Single and batch delete

### Groups & Albums
- Create, edit, delete groups with drag-and-drop reorder
- Assign images to groups / move between groups
- Album mode for organizing images into named collections
- Default "All" and "Ungrouped" views
- Bulk group management (rename, reorder, delete)

### Trash / Recycle Bin
- Deleted images move to trash with restore capability
- Single and batch restore / permanent delete
- Trash image detail preview

### AI Auto-Tagging
- 9 AI service providers supported
- 4 recommendation strategies:
  - **AI Direct** — AI-powered content recognition
  - **Similarity Match** — tag library similarity matching
  - **Semantic Analysis** — semantic feature analysis
  - **Visual Similarity** — perceptual hash + feature vectors
- Complete analysis log system with detail viewer
- Extensible provider architecture (add a new provider in ~30 lines)

### Visual Similarity
- Perceptual hash (pHash) via DCT-based algorithm
- Multi-dimensional visual feature extraction
- Person / scene / style recognition
- Hamming distance-based similarity matching

### Cloud Sync
- Multi-server support (WebDAV, HTTP API)
- Configurable auto-sync intervals (realtime / 1min / 5min / 10min / 1h)
- 3 conflict resolution strategies (local priority / remote priority / ask)
- Real-time sync status monitoring
- Full data sync: images, groups, background settings

### Import / Export
- Export all data as ZIP (metadata.json + images organized by group)
- Import ZIP backups with merge or replace modes
- Automatic validation of import file structure

### Settings
- AI service configuration (API keys, model selection)
- Custom background image with adjustable opacity
- Cloud sync server management
- Import/export operations
- Gallery column count personalization

### Additional
- i18n: Chinese (zh-CN) and English (en-US)
- Global custom background
- Custom UI component system (dialog, notification, drawer)
- Search by image name
- Collapsible menu bars

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9
- **Rust** (optional, for Tauri builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/bomu1121/image-gallery.git
cd image-gallery

# Install dependencies
pnpm install

# Start development server (browser)
pnpm dev
```

### Development

```bash
# Browser dev server (http://localhost:8883)
pnpm dev

# Electron desktop app
pnpm start

# Tauri desktop app (requires Rust toolchain)
pnpm --filter @gallery/desktop tauri:dev
```

### Testing

```bash
# Run all unit/component tests (22 tests)
pnpm test:run

# Run UI component tests separately
pnpm --filter @gallery/ui test

# Run E2E tests (requires Playwright browsers)
pnpm exec playwright install chromium
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

### Build

```bash
# Production build (browser)
pnpm build

# Preview production build
pnpm preview

# Tauri production build
pnpm --filter @gallery/desktop tauri:build
```

### Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Production build |
| `pnpm start` | Launch Electron app |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Run Prettier |
| `pnpm typecheck` | Run TypeScript checks (all packages) |
| `pnpm test:run` | Run all unit/component tests |
| `pnpm test:e2e` | Run Playwright E2E tests |

## Package Details

### @gallery/shared
Shared TypeScript type definitions for the entire monorepo. Includes interfaces for `ImageRecord`, `GroupRecord`, `AlbumRecord`, `TrashRecord`, `BackgroundRecord`, `AnalysisLogRecord`, and shared constants.

### @gallery/db
Dexie.js-based database layer with typed table schemas and repository pattern:
- `imagesRepo` — CRUD + search + batch operations
- `groupsRepo` — group management with ordering
- `albumsRepo` / `albumItemsRepo` — album organization
- `trashRepo` — trash bin management
- `backgroundRepo` — background settings
- `analysisLogsRepo` — AI analysis log storage

### @gallery/ai
Unified AI provider abstraction with factory pattern and lazy loading:
```ts
import { createAIProvider } from '@gallery/ai';
const provider = await createAIProvider('openai', { apiKey: 'sk-...' });
const result = await provider.analyze(imageBase64, { maxTags: 10 });
```

### @gallery/sync
Pluggable cloud sync adapter system:
- `SyncAdapter` interface for custom implementations
- WebDAV and HTTP API adapters built-in
- Conflict resolution strategies (local / remote / newest)
- `SyncScheduler` with configurable intervals

### @gallery/image-processor
Image processing utilities using sharp:
- `generateThumbnail()` — JPEG thumbnails (256px, quality 80)
- `generatePHash()` — perceptual hash for similarity matching
- `hammingDistance()` — hash comparison
- `extractColors()` — dominant/accent/average color palette
- `getImageMetadata()` — width, height, format, orientation

### @gallery/ui
Reusable Vue 3 components:
- `GalleryDialog` — typed dialog with confirm/cancel
- `ToastNotification` — notification stack with transitions
- `useNotification()` — composable: success/error/warning/info

## CI Pipeline

Automated on every push and PR via GitHub Actions:

```
lint → format check → typecheck → unit tests → build → e2e tests
```

## License

Private project. All rights reserved.
