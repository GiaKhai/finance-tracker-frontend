# Finance Tracker Frontend

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env.production
# Edit .env.production with your backend URL
```

3. Run:
```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

## Environment Variables

- `VITE_API_URL`: Backend API URL (e.g., https://your-backend.railway.app/api)

## Deploy

### Vercel
```bash
npm install -g vercel
vercel login
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### GitHub Pages
1. Update `vite.config.js` with base path
2. Push to GitHub
3. Enable GitHub Pages in repository settings

## Build Output

After running `npm run build`, static files will be in `dist/` directory.
