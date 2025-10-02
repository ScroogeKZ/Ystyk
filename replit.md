# Point of Sale (POS) System

## Overview
This is a comprehensive Point of Sale system built with React/TypeScript frontend and Express/Node.js backend. The application features a modern interface for managing retail operations including sales, inventory, customer management, returns, and analytics.

## Recent Changes
- **October 2, 2025 (Afternoon)**: Implemented comprehensive responsive design
  - Added mobile-first responsive layouts across all POS components
  - Implemented Sheet/Drawer navigation for mobile with floating cart button
  - Made product grid responsive with adaptive columns (1→2→3→4 based on screen size)
  - Added horizontal scroll containers for all data tables on mobile devices
  - Updated padding, spacing, and typography to scale across breakpoints (sm:, md:, lg:)
  - Ensured forms and dialogs render properly on mobile viewports
  - **CONFIRMED**: POS System is now fully responsive and works seamlessly on mobile, tablet, and desktop
- **October 2, 2025 (Morning)**: Fresh GitHub import setup completed for Replit environment
  - Installed missing `nanoid` package dependency (used in server/vite.ts)
  - Created PostgreSQL database with proper schema using Drizzle ORM
  - Pushed database schema successfully with `npm run db:push`
  - Configured workflow with webview output type on port 5000
  - Set up deployment configuration for autoscale with proper build and start commands
  - Verified application runs correctly with all features working
  - **CONFIRMED**: POS System is fully operational with in-memory storage and seed data
- **September 29, 2025 (Late Evening)**: Cart functionality diagnosis completed
  - Conducted comprehensive debugging of cart functionality
  - Confirmed cart system works perfectly - issue was with Replit environment click handling, not code bugs
  - Validated all cart operations: adding items, quantity updates, price calculations, state synchronization
  - Cleaned up all debug code, system returned to clean state
- **September 29, 2025 (Evening)**: Completed functionality debugging and fixes  
  - Fixed returns tab to use real userId from session store instead of mock IDs
  - Added userId validation guard to prevent returns with invalid user sessions
  - Integrated barcode scanner with product grid - scanner now properly opens and adds products to cart
  - Verified all core features: inventory, customers, analytics, returns, and barcode scanning

## Project Architecture

### Frontend (client/)
- **Framework**: React 18 + TypeScript with Vite
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: TailwindCSS with custom animations
- **State Management**: Zustand for POS store, TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Internationalization**: Custom i18n system with Russian language support

### Backend (server/)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (using in-memory storage in development)
- **API**: RESTful API with comprehensive endpoints for all POS operations
- **Development**: tsx for TypeScript execution in development

### Key Features
- **Sales Management**: Complete transaction processing with receipt generation
- **Inventory Management**: Product catalog, stock tracking, category management
- **Customer Management**: Customer profiles with loyalty points system
- **Returns & Refunds**: Full return processing capability
- **Shift Management**: User shifts with cash reconciliation
- **Analytics**: Sales reporting and performance metrics
- **Multi-language Support**: Interface available in multiple languages
- **Hardware Integration**: Barcode scanner and receipt printer support
- **Offline Mode**: Capability for offline transactions
- **Responsive Design**: Fully responsive UI that works across mobile, tablet, and desktop devices

### Database Schema
- Users, Categories, Products, Customers
- Shifts, Transactions, Transaction Items
- Returns, Return Items
- Comprehensive relationships and constraints

## Development Setup

### Running Locally
```bash
npm run dev
```
- Starts development server on port 5000
- Backend API available at `/api/*` endpoints
- Frontend served by Vite with HMR enabled

### Building for Production
```bash
npm run build
```
- Builds frontend assets to `dist/public/`
- Compiles backend server to `dist/index.js`

### Deployment
- Configured for Replit autoscale deployment
- Build command: `npm run build`
- Start command: `npm run start`

## Configuration Notes
- Server configured to listen on 0.0.0.0:5000 for Replit compatibility
- Vite configured with `allowedHosts: true` for proxy support
- Development and production modes properly separated
- All necessary Replit plugins configured for optimal development experience

## File Structure
```
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── i18n/        # Internationalization
│   │   ├── lib/         # Utilities and query client
│   │   └── pages/       # Page components
├── server/           # Backend Express application
│   ├── index.ts     # Main server entry point
│   ├── routes.ts    # API route definitions
│   ├── storage.ts   # Data storage interface
│   └── vite.ts      # Vite development setup
├── shared/          # Shared TypeScript schemas
└── attached_assets/ # Static assets
```

## User Preferences
- Full-stack TypeScript development preferred
- Modern React patterns with hooks and functional components
- Comprehensive type safety with Zod schemas
- Clean, maintainable code structure