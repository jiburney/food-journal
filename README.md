# Food Journal PWA

A Progressive Web App for tracking meals and digestive symptoms to identify food triggers. Built with React, TypeScript, and Vite.

## Features

- **Voice Input**: Quickly log meals using speech recognition
- **Timeline View**: See your meal history with timestamps
- **Symptom Tracking**: Log digestive issues and their severity
- **Offline Support**: Works without internet connection via service workers
- **Installable**: Add to home screen on mobile devices
- **Local Storage**: All data stored locally using IndexedDB

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to Cloudflare Pages

This app is configured for deployment to Cloudflare Pages.

### Build Settings

- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node version**: 18 or higher

### Automatic Deployment

1. Connect your repository to Cloudflare Pages
2. Every push to `main` triggers a production deployment
3. Pull requests get automatic preview deployments

### Features on Cloudflare

- ✅ Automatic HTTPS (required for PWA and Web Speech API)
- ✅ Global CDN for fast loading
- ✅ Automatic cache invalidation on deploy
- ✅ Custom domains supported
- ✅ Security headers configured via `_headers` file

## Tech Stack

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **IndexedDB (idb)**: Client-side database
- **date-fns**: Date formatting
- **vite-plugin-pwa**: PWA and service worker generation
- **Web Speech API**: Voice input

## Browser Requirements

- Modern browser with support for:
  - IndexedDB
  - Service Workers
  - Web Speech API (for voice input)
  - PWA installation

Best experience on Chrome/Edge on Android or Safari on iOS.
