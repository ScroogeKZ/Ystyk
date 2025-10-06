# Point of Sale (POS) System

## Overview
This is a comprehensive Point of Sale system designed for retail operations. It features a modern interface for managing sales, inventory, customer relationships, returns, and analytics. The system aims to provide a robust and user-friendly solution for businesses to streamline their retail processes.

## Recent Changes (October 2025)
- **Security & Logging Enhancements** (Oct 6): 
  - Added SESSION_SECRET environment variable for secure session management
  - Implemented CORS configuration with origin whitelisting for production
  - Integrated Winston for structured logging with JSON formatting and sanitization
  - Updated dependency security analysis (xlsx and esbuild vulnerabilities noted for monitoring)
- **Product Expiration Tracking** (Oct 4): Added expiration date field to products with automatic notifications for expiring and expired items
- **Expiration Alerts** (Oct 4): Implemented visual alerts that display products expiring within 7 days and already expired products
- **Enhanced Product Forms** (Oct 4): Updated product creation/editing forms to support optional expiration dates
- **API Rate Limiting** (Oct 5): Implemented comprehensive rate limiting for sensitive operations:
  - Login attempts: 5 per 15 minutes
  - User management: 20 operations per 15 minutes
  - Product modifications: 50 operations per 5 minutes
  - Transactions: 30 per minute
  - Returns processing: 20 per 5 minutes
- **Database Performance Optimization** (Oct 5): Added strategic indexes on frequently queried fields:
  - Products: categoryId, expirationDate, isActive, sku
  - Customers: phone, email
  - Shifts: userId, status, startTime
  - Transactions: shiftId, customerId, userId, createdAt, receiptNumber, status
  - Transaction/Return items: Foreign key relationships
- **Shift Report Printing** (Oct 5): Implemented PDF generation for shift reports using jsPDF library with comprehensive financial summaries
- **Accessibility Improvements** (Oct 5): Added ARIA labels and attributes to login page and key interactive elements
- **Excel/CSV Export** (Oct 5): Added Excel and CSV export functionality for shift reports using xlsx library
- **Keyboard Shortcuts System** (Oct 5): Implemented comprehensive keyboard shortcuts for faster cashier operations:
  - F1: Show keyboard shortcuts help dialog
  - F5: Initiate payment
  - F6: Clear cart
  - Escape: Cancel/close modal windows
  - Additional shortcuts for barcode scanner, customer management, quantity adjustments, and shift operations
- **Low Stock Alerts** (Oct 5): Created automated alert component that monitors inventory levels and displays warnings for items below configurable threshold (default: 5 units)

## User Preferences
- Full-stack TypeScript development preferred
- Modern React patterns with hooks and functional components
- Comprehensive type safety with Zod schemas
- Clean, maintainable code structure

## System Architecture

### UI/UX Decisions
- Built with shadcn/ui components and Radix UI primitives for a modern and accessible interface.
- Utilizes TailwindCSS for styling and custom animations, ensuring a responsive design across mobile, tablet, and desktop devices.
- Implements Sheet/Drawer navigation for mobile and adaptive product grids to optimize user experience on various screen sizes.
- Supports multi-language interfaces, including Russian.

### Technical Implementations
- **Frontend**: Developed with React 18 and TypeScript using Vite.
    - State Management: Zustand for client-side POS store, TanStack Query for server state synchronization.
    - Routing: Wouter for efficient client-side navigation.
- **Backend**: Built on Express.js with TypeScript.
    - Database Interaction: PostgreSQL managed with Drizzle ORM.
    - Authentication: Passport.js with LocalStrategy and express-session, using bcrypt for password hashing and `connect-pg-simple` for PostgreSQL-backed sessions.
    - API: RESTful architecture with all endpoints protected by `requireAuth` middleware and validated by Zod schemas.
    - Data Integrity: Critical operations are wrapped in database transactions to ensure atomicity and consistency.
    - Logging: Winston for structured JSON logging with error context and sensitive data sanitization.
    - Security: CORS configuration with origin whitelisting, SESSION_SECRET for production.

### Feature Specifications
- **Sales Management**: Full transaction processing, including receipt generation and support for barcode scanning.
- **Inventory Management**: Comprehensive product catalog, stock tracking, category management, and expiration date tracking with automatic alerts.
- **Customer Management**: Profiles with loyalty point systems.
- **Returns & Refunds**: Streamlined processing for product returns with rate limiting protection.
- **Shift Management**: Tools for managing user shifts, cash reconciliation, PDF report generation, and summary reports.
- **Analytics**: Provides sales reporting and performance metrics.
- **Product Expiration Notifications**: Real-time alerts for products that are expired or expiring within 7 days, with automatic categorization and visual indicators.
- **User Management & Role-Based Access Control**:
    - **Admin Role**: Full system access, including user management (create, edit, delete), reports, monitoring, hardware configuration, inventory management, and promotions.
    - **Cashier Role**: Limited to operational functions like sales, shift management, basic inventory viewing, customer management, returns processing, and loyalty programs.
- **Security & Performance**:
    - Rate limiting on all sensitive API endpoints (login, user management, product modifications, transactions, returns)
    - Database indexes for optimized query performance
    - Comprehensive error logging with sensitive data sanitization
    - Session-based authentication with secure password hashing
- **Accessibility**: ARIA labels and attributes for screen reader support
- **Hardware Integration**: Includes support for barcode scanners and receipt printers.
- **Offline Mode**: Designed with capabilities for offline transaction processing.

### System Design Choices
- The system employs a clear separation of concerns with distinct frontend and backend applications.
- Utilizes a PostgreSQL database with a defined schema for users, categories, products, customers, shifts, transactions, and returns, ensuring robust data relationships.
- Prioritizes security through session-based authentication, bcrypt for password hashing, comprehensive input validation, and transactional database operations.
- Optimized for Replit deployment with specific configurations for webview, database connections, and build/start commands.

## External Dependencies
- **Database**: PostgreSQL
- **Frontend Libraries**: React, Vite, shadcn/ui, Radix UI, TailwindCSS, Zustand, TanStack Query, Wouter.
- **Backend Libraries**: Express.js, Drizzle ORM, Passport.js, bcrypt, express-session, connect-pg-simple, Zod, express-rate-limit, cors, winston.
- **PDF Generation**: jsPDF for shift report printing.
- **Email Integration**: Resend integration available but not configured (user declined setup). For email functionality, manual setup with SMTP credentials required.

## Replit Setup (October 4, 2025 - Fresh Import)
- **Project Import**: Imported from GitHub and configured for Replit environment
- **Database**: PostgreSQL database provisioned and configured with environment variables
- **Workflow**: "Start application" workflow configured to run `npm run dev` on port 5000 with webview output
- **Database Schema**: Successfully pushed to database using `npm run db:push`
- **Seed Data**: Initial data seeded including:
  - Admin user (username: `admin`, password: `admin123`)
  - Cashier user (username: `cashier`, password: `password`)
  - Sample categories (Напитки/Beverages, Выпечка/Pastry, Закуски/Snacks)
  - Sample products (Эспрессо, Круассан, Сок апельсиновый, Сэндвич с курицей, Мороженое ванильное, Вода минеральная)
- **Dev Server**: Running on port 5000 with Vite HMR enabled
- **Host Configuration**: Frontend server configured with `allowedHosts: true` in Vite setup to work with Replit's proxy
- **Deployment**: Configured for autoscale deployment with build and start commands

## Development Commands
- `npm run dev` - Start development server (frontend + backend on port 5000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes to PostgreSQL
- `npx tsx server/seed.ts` - Seed database with initial data