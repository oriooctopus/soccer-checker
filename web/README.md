# Football Hub PWA

A mobile-friendly Progressive Web App for finding spoiler-free football highlights and upcoming fixtures.

## Features

- 📱 **Mobile-first design** - Optimized for phones and tablets
- ⚡ **PWA capabilities** - Install to home screen, offline support
- 🎥 **Highlights search** - Find spoiler-free video highlights
- 📅 **Fixtures** - View upcoming match schedules
- 🌙 **Dark mode** - Automatic based on system preference
- 💾 **Remembers preferences** - Saves your last searches

## Current Status

The frontend UI is complete, but needs backend integration:

### ✅ Completed
- Mobile-responsive interface
- PWA manifest and service worker
- Tab navigation (Highlights/Fixtures)
- Form handling and state management
- Local storage for preferences
- Install prompt for PWA

### 🔄 Backend Integration Needed
- Connect to highlights search API
- Connect to fixtures API (Football-Data.org)
- Handle CORS issues
- Deploy API endpoints

## Deployment Options

### Option 1: GitHub Pages + GitHub Actions
- Deploy static frontend to GitHub Pages
- Use GitHub Actions to periodically fetch data
- Store results as static JSON files

### Option 2: Vercel/Netlify + Serverless
- Deploy as serverless functions
- Use Vercel/Netlify Functions for API calls
- Automatic HTTPS and global CDN

### Option 3: Full Backend
- Deploy Node.js API to Railway/Render/Heroku
- Frontend calls API endpoints
- Real-time data fetching

## Files

- `index.html` - Main PWA interface
- `styles.css` - Mobile-first responsive styles
- `app.js` - Application logic and API calls
- `manifest.json` - PWA configuration
- `sw.js` - Service worker for offline support
- `icons/` - App icons for various sizes

## Testing Locally

1. Serve the files with a local server:
   ```bash
   cd web
   python -m http.server 8000
   # or
   npx serve .
   ```

2. Open http://localhost:8000

3. Test PWA features in Chrome DevTools > Application

## Next Steps

1. Generate proper app icons
2. Set up backend API integration
3. Deploy to chosen platform
4. Test PWA installation on mobile devices