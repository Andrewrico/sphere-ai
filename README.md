# SPHERE — AI Interface

A futuristic 11ty site with an animated 3D sphere chatbot powered by the Anthropic API.

## Quick Start

```bash
# 1. Install dependencies (only needed once)
npm install

# 2. Start the dev server with hot reload
npm run dev
```

Then open **http://localhost:8080** in your browser.

## Build for Production

```bash
npm run build
```

Output goes to `_site/`.

## Notes

- The chatbot calls `https://api.anthropic.com/v1/messages` directly from the browser.
- No API key is needed when running inside Claude.ai artifacts — elsewhere you'll need to proxy the request server-side and inject your key securely.
- Click the sphere to trigger the pulse animation.
