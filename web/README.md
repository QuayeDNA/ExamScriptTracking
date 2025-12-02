# Web Dashboard - Exam Script Tracking System

## Description

React + Vite + TypeScript web dashboard for administrators to manage exam sessions, track batches, and view analytics.

## Tech Stack

- **Framework:** React 18+
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.1
- **Routing:** React Router v7
- **State Management:** Zustand + TanStack Query
- **HTTP Client:** Axios
- **Real-time:** Socket.io Client
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts

## Prerequisites

- Node.js 20+ LTS
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API URL
```

## Development

```bash
# Start development server
npm run dev
```

The dashboard will be available at: http://localhost:5173

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

See `.env.example` for required environment variables:

- `VITE_API_URL` - Backend API URL (default: http://localhost:3000)
- `VITE_SOCKET_URL` - Socket.io server URL (default: http://localhost:3001)

## Project Structure

```
web/
├── src/
│   ├── assets/          # Static assets
│   ├── lib/             # Utility functions
│   │   └── utils.ts     # Helper utilities
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles (Tailwind)
├── public/              # Public assets
├── .env.example         # Environment variables template
├── .gitignore
├── index.html           # HTML template
├── package.json
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── README.md
```

## Features

- User authentication and authorization
- Exam session management
- Batch QR code generation
- Real-time batch tracking
- Transfer chain visualization
- Reports and analytics dashboard
- Discrepancy management
- Audit trail viewer

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## License

ISC
