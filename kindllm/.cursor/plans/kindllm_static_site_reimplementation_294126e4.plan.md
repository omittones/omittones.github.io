---
name: Kindllm Static Site Reimplementation
overview: Reimplement the kindllm project to compile to a static site that works on Kindle browsers by removing server-side dependencies, fixing browser compatibility issues, and following Kindle UX guidelines.
todos:
  - id: "1"
    content: Add Preact dependency and update tsconfig.json for Preact JSX
    status: pending
  - id: "2"
    content: Create main.tsx entry point with Preact app mounting
    status: pending
  - id: "3"
    content: Create app.tsx - Main app component with API key input and chat UI
    status: pending
  - id: "4"
    content: Refactor llm.ts for client-side fetch() API calls
    status: pending
  - id: "5"
    content: Create storage.ts for localStorage-based message persistence
    status: pending
  - id: "6"
    content: Convert all components from Hono JSX to Preact JSX (update imports and props handling)
    status: pending
  - id: "7"
    content: Delete index.tsx and renderer.tsx (Hono server files)
    status: pending
  - id: "8"
    content: Create static CSS file, extract and convert styles from renderer.tsx
    status: pending
  - id: "9"
    content: Update vite.config.ts - remove legacy plugin, configure for Preact static build
    status: pending
  - id: "10"
    content: Update index.html - proper structure with bundled Preact app, remove HTMX CDN
    status: pending
  - id: "11"
    content: Update package.json - add Preact, remove Hono, HTMX, zod, zod-validator
    status: pending
  - id: "12"
    content: Test build output and verify static site works
    status: pending
isProject: false
---

## Current State Analysis

The kindllm project is currently designed as a **server-side Hono app** that:

- Uses Hono's JSX renderer for server-side rendering
- Has API endpoints (`/chat`, `/suggestions`) that require server-side API keys
- References a non-existent `main.ts` entry point
- Uses HTMX from CDN with server-side endpoints
- Has Kindle UX violations (animations, gradients, external resources)

## Target Requirements

Based on [kindllm/.cursor/rules/browser-compatibility.mdc](kindllm/.cursor/rules/browser-compatibility.mdc) and [kindllm/.cursor/rules/kindle-ux.mdc](kindllm/.cursor/rules/kindle-ux.mdc):

**Browser Compatibility (from [supported-browser-features.txt](kindllm/supported-browser-features.txt)):**

- NO optional chaining (`?.`)
- NO nullish coalescing (`??`)
- CSS: NO `clamp()`, `min()/max()`, `:has()`, `aspect-ratio`, `backdrop-filter`

**Kindle UX Rules:**

- NO animations/transitions (e-ink can't handle them)
- NO gradients (hard to render on e-ink)
- NO shadows/blur effects
- High contrast only (#000 on #fff)
- Minimum 16px font, sans-serif
- Large touch targets (44x44px minimum)
- Simple semantic HTML

## Stage 1: Get It Working (Preact-Based Static Site)

### Architecture

```mermaid
flowchart TB
    subgraph ClientApp["Preact Client App"]
        main["main.tsx Entry"]
        app["app.tsx Root"]
        state["useState: messages, apiKey, isLoading"]
        storage["localStorage persistence"]
    end

    subgraph Components["Preact Components"]
        chatView["ChatView"]
        chatBox["ChatBox"]
        message["Message"]
        suggestions["Suggestions"]
        landing["LandingView"]
    end

    subgraph API["External API"]
        openai["OpenAI/Anyscale API"]
    end

    main --> app
    app --> state
    state --> storage
    app --> chatView
    app --> landing
    chatView --> chatBox
    chatView --> message
    chatView --> suggestions
    chatBox -->|fetch()| openai
```

### Key Changes for Stage 1

**Dependencies:**

- Add: `preact` (3KB UI framework)
- Keep: `openai` (API client)
- Remove: `hono`, `@hono/zod-validator`, `zod`, HTMX

**State Management:**

- Preact `useState` for messages, API key, loading states
- `fetch()` for direct API calls to OpenAI
- `localStorage` for persistence (supported: YES)

**Component Conversion:**

```typescript
// Before (Hono)
import { FC } from "hono/jsx";

// After (Preact)
import { FC } from "preact/compat";
import { useState, useEffect } from "preact/hooks";
```

### Files to Create/Modify

**New files:**

- `kindllm/src/main.tsx` - Entry point
- `kindllm/src/app.tsx` - Application controller
- `kindllm/src/storage.ts` - localStorage persistence
- `kindllm/src/styles.css` - Static CSS

**Files to modify:**

- `kindllm/vite.config.ts` - Simplify build for Preact
- `kindllm/tsconfig.json` - `jsxImportSource: "preact"`
- `kindllm/package.json` - Add Preact, remove Hono
- `kindllm/index.html` - Static structure with Preact mount point
- `kindllm/src/llm.ts` - Client-side fetch API calls
- All component files - Update imports to Preact

**Files to delete:**

- `kindllm/src/index.tsx` - Hono server app
- `kindllm/src/renderer.tsx` - Server renderer

## Stage 2: Kindle UX Optimization (Future)

Reserved for later:

- Remove animations/transitions
- Apply high contrast styling
- Simplify layout for e-ink
- Large touch targets (44x44px)
- Remove gradients from Logo
- Optimize for Kindle display
