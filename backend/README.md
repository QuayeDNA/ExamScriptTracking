# Backend - Exam Logistics System (ELMS)

## Description

Node.js + Express + TypeScript backend API with Prisma ORM and Socket.io for real-time communication.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Real-time:** Socket.io
- **Authentication:** JWT + bcrypt
- **Validation:** Zod

## Prerequisites

- Node.js 20+ LTS
- PostgreSQL 15+
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials and settings
```

## Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (optional)
npm run prisma:studio
```

## Development

```bash
# Start development server with hot reload
npm run dev
```

The API will be available at:

- Express API: http://localhost:3000
- Socket.io: http://localhost:3001

## Build

```bash
# Build TypeScript to JavaScript
npm run build

# Run production server
npm start
```

## API Endpoints

### Health Check

- `GET /health` - Check server status

### API Base

- `GET /api` - API information

## Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time
- `PORT` - Express server port
- `SOCKET_PORT` - Socket.io server port
- `CORS_ORIGIN` - Allowed CORS origin
- `NODE_ENV` - Environment (development/production)

## Storage Configuration

The application automatically selects storage providers based on environment:

### Automatic Storage Selection

- **Development** (`NODE_ENV=development`): Local storage
- **Production** (`NODE_ENV=production`): Cloudinary

### Local Storage (Development)

- Files stored in `uploads/incidents/` directory
- Faster for development, no external dependencies
- Files are **excluded from git** (added to `.gitignore`)

### Cloudinary (Production)

- `STORAGE_PROVIDER=cloudinary` (automatically set in production)
- 25GB storage, 25GB monthly bandwidth
- ✅ **CONFIGURED AND TESTED**
- Cloudinary credentials required:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### Cloudflare R2 (Production - Free Tier)

- `STORAGE_PROVIDER=cloudflare`
- 10GB storage, 1GB egress/month
- Copy `.env.example.cloudflare` to `.env` and configure:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_ACCESS_KEY_ID`
  - `CLOUDFLARE_SECRET_ACCESS_KEY`
  - `CLOUDFLARE_BUCKET_NAME`
  - `CLOUDFLARE_PUBLIC_URL`

### Migration from Local to Cloud

If you have existing local files and want to migrate to cloud storage:

```bash
# Run migration script
npm run migrate:attachments
```

This will upload all existing local files to your configured cloud provider and update the database records.

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   └── server.ts          # Main server file
├── dist/                  # Compiled JavaScript (generated)
├── .env.example           # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json          # TypeScript configuration
└── README.md
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## License

ISC
