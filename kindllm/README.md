# Kindllm

A distraction-free LLM chat app optimized for Kindle e-readers. Static site with client-side LLM integration.

## Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run tests (TDD)
pnpm test

# Build for production
pnpm build
```

## Deployment

Build outputs to `dist/`. Commit this folder to git for GitHub Pages hosting.

```bash
pnpm build
git add dist/
git commit -m "Update build"
git push
```

## Architecture

- **Static site** - Pre-compiled HTML/JS, no backend required
- **Client-side LLM** - Uses user's own API key (stored in localStorage)
- **ES5 compatible** - Works on old Kindle browsers
- **Test-driven** - Write tests before implementation

## Browser Compatibility

- Kindle Paperwhite (all generations)
- Kindle Basic
- Any browser supporting ES5

## Project Structure

```
src/
  lib/           # Core utilities (storage, dom, llm-client, chat)
  styles.css     # Global styles (ES5 compatible)
  main.ts        # Entry point
dist/            # Build output (commit to git for deployment)
```
