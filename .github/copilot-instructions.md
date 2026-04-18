# Portfolio Tracker AI Guide

## Project Architecture
- **Core Framework**: Vue 3 (Composition API) + Vite.
- **State Management**: Pinia (`src/stores/*`). Stores are the single source of truth for application, managing API interaction and local state.
- **UI System**: PrimeVue v4 components styled with Tailwind CSS v4.
- **Authentication**: Firebase Auth integration via `src/firebase.js` and `useAuthStore`.
- **Backend/API**: Custom backend (local port 3000) accessed via `src/utils/api.js` wrapper.
- **Language**: Hybrid TypeScript/JavaScript. Prefer TypeScript (`.ts`) for logic/stores and strongly typed Vue components where possible.

## Critical Workflows
- **Run Development**: `npm run dev`
- **Run Tests**: `npm run test:unit` (Vitest)
- **Build**: `npm run build`

## Code Conventions & Patterns

### API Communication
- **Strict Rule**: ALL network requests must use `src/utils/api.js` (exported as `api`).
- **Pattern**: `api.get(url)`, `api.post(url, data)`.
- **Configuration**: API Base URL is determined dynamically (localhost:3000 in dev, or `VITE_API_URL_BASE`).

### State Management (Pinia)
- Use **Setup Stores** syntax (`defineStore('id', () => { ... })`).
- Stores handle business logic and formatting data from APIs.
- Example: `src/stores/portfolio.ts` synchronizes remote data and uses `localStorage` for persistence of user preferences (like `currentPortfolio`).

### UI Components
- **Style**: Use Tailwind CSS utility classes (`flex`, `mb-4`, `text-gray-500`) for layout and spacing.
- **Components**: Prefer PrimeVue components (e.g., `<Button>`, `<Select>`, `<Dialog>`) over native HTML elements.
- **Composition**: Use `<script setup>` for all Vue components.

### Internationalization
- Use `vue-i18n`. Access via `useI18n()` hook in script or `$t()` in template.
- Translations located in `src/i18n/`.

## Key Files
- `src/utils/api.js`: Centralized API request wrapper.
- `src/stores/portfolio.ts`: Example of store structure with API integration and types.
- `src/main.js`: Application bootstrapping, PrimeVue config, and global styles.
- `src/theme/customPreset.js`: PrimeVue theme customization.

## Testing Strategy
- **Unit Tests**: Located in `__tests__` directories next to the source files.
- **Tools**: Vitest + Vue Test Utils.
