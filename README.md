# 🎨 Finance Tracker Frontend

Frontend web application for Finance Tracker, built with React, Vite, and Tailwind CSS.

## 📋 Requirements

- Node.js 18+
- npm or yarn

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` file:

```env
VITE_API_URL=http://localhost:5000/api
```

**Note:** Change URL if backend runs on different address.

### 3. Run Development Server

```bash
npm run dev
```

App will run at: `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

Build output will be in `dist/` folder

### 5. Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── transactions/        # Transaction components
│   │   ├── wallets/            # Wallet components
│   │   ├── categories/         # Category components
│   │   ├── data-table/         # Table component
│   │   ├── pagination/         # Pagination component
│   │   └── Layout.jsx          # Main layout
│   ├── pages/
│   │   ├── Dashboard.jsx       # Dashboard page
│   │   ├── Transactions.jsx    # Transactions list
│   │   ├── Wallets.jsx         # Wallets list
│   │   ├── Categories.jsx      # Categories management
│   │   ├── Login.jsx           # Login page
│   │   └── Register.jsx        # Register page
│   ├── services/
│   │   ├── api.js              # Axios instance
│   │   ├── authService.js      # Auth API calls
│   │   ├── walletService.js    # Wallet API calls
│   │   ├── transactionService.js
│   │   └── categoryService.js
│   ├── hooks/
│   │   ├── useWallets.js       # Wallet hooks
│   │   ├── useTransactions.js  # Transaction hooks
│   │   └── useCategories.js    # Category hooks
│   ├── store/
│   │   ├── authStore.js        # Auth state (Zustand)
│   │   └── useTransactionStore.js
│   ├── lib/
│   │   └── utils.js            # Utility functions
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # Entry point
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

## 🎯 Features

### Pages

- **Dashboard** - Financial overview with charts
- **Transactions** - Transaction management with pagination
- **Wallets** - Wallet management
- **Categories** - Income/expense category management
- **Login/Register** - User authentication

### Components

- **Data Table** - Table with sorting and pagination
- **Transaction Form** - Create/edit transaction form
- **Quick Dialogs** - Quick create wallet/category
- **Responsive Layout** - Mobile/tablet/desktop compatible

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **TanStack Query** - Data fetching & caching
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client
- **date-fns** - Date utilities
- **Recharts** - Charts
- **Lucide React** - Icons

## 🔌 API Integration

### Authentication

```javascript
import { authService } from "@/services/authService";

// Login
const { token, user } = await authService.login({
  email: "user@example.com",
  password: "password123",
});

// Register
await authService.register({
  name: "John Doe",
  email: "john@example.com",
  password: "password123",
});
```

### Wallets

```javascript
import { walletService } from "@/services/walletService";

// Get wallets with pagination
const { wallets, pagination } = await walletService.getWallets({
  page: 1,
  limit: 10,
});

// Create wallet
await walletService.createWallet({
  name: "Cash",
  type: "CASH",
  balance: 1000000,
});
```

### Transactions

```javascript
import { transactionService } from "@/services/transactionService";

// Get transactions
const { transactions, pagination } = await transactionService.getTransactions({
  page: 1,
  limit: 10,
  wallet_id: 1,
  type: "EXPENSE",
});

// Create transaction
await transactionService.createTransaction({
  wallet_id: 1,
  category: 5,
  amount: 50000,
  type: "expense",
  date: "2024-01-15",
  description: "Lunch",
});
```

## 🚀 Deploy

📚 **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** - Complete step-by-step guide

### Deploy to Vercel (Summary)

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Login**

```bash
vercel login
```

3. **Deploy**

```bash
vercel --prod
```

4. **Set Environment Variable**

```bash
vercel env add VITE_API_URL production
# Enter: https://your-backend-url.railway.app/api
```

Or deploy via Vercel Dashboard:

- Import GitHub repository
- Add env variable `VITE_API_URL`
- Deploy

### Deploy to Netlify

1. **Install Netlify CLI**

```bash
npm install -g netlify-cli
```

2. **Login**

```bash
netlify login
```

3. **Deploy**

```bash
npm run build
netlify deploy --prod --dir=dist
```

4. **Set Environment Variable**

```bash
netlify env:set VITE_API_URL "https://your-backend-url.railway.app/api"
```

## 🔧 Configuration

### vite.config.js

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
```

### tailwind.config.js

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...},
      },
    },
  },
  plugins: [],
}
```

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Run tests with coverage
npm run test:coverage
```

## 🔧 Troubleshooting

### Error: Cannot connect to API

**Solution:**

1. Check backend is running
2. Check `VITE_API_URL` in `.env.local`
3. Check CORS settings on backend

### Error: Module not found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error: Build failed

```bash
# Check for TypeScript errors
npm run build -- --mode development

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint (if configured)
```

## 🎨 UI Components

### Button

```jsx
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### Card

```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Dialog

```jsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    Content
  </DialogContent>
</Dialog>
```

## � Dependencies

### Core

- **react** - UI library
- **react-dom** - React DOM renderer
- **react-router-dom** - Routing

### Data Fetching

- **@tanstack/react-query** - Data fetching & caching
- **axios** - HTTP client

### UI & Styling

- **tailwindcss** - Utility-first CSS
- **@radix-ui/react-\*** - Headless UI components
- **lucide-react** - Icons
- **recharts** - Charts

### Forms & Validation

- **react-hook-form** - Form handling
- **zod** - Schema validation
- **@hookform/resolvers** - Form resolvers

### State Management

- **zustand** - State management

### Utilities

- **date-fns** - Date utilities
- **clsx** - Class name utility
- **tailwind-merge** - Merge Tailwind classes

## 🤝 Contributing

1. Fork the project
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

MIT License
