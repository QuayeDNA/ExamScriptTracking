# Web Dashboard Quick Start

## Starting the Application

1. **Start Backend Server**

   ```bash
   cd backend
   npm run dev
   ```

   Backend runs on: http://localhost:5000

2. **Start Web Dashboard**
   ```bash
   cd web
   npm run dev
   ```
   Frontend runs on: http://localhost:5173

## Default Credentials

**Super Admin:**

- Email: `superadmin@examtrack.com`
- Password: `SuperAdmin@123`

## First Time Login Flow

1. Login with temporary credentials
2. System will redirect to password change page if `passwordChanged` is false
3. Set new password (minimum 8 characters)
4. Redirected to dashboard after successful password change

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout (requires auth)
- `GET /api/auth/profile` - Get current user (requires auth)
- `POST /api/auth/change-password` - Change password (requires auth)
- `POST /api/auth/first-time-password-change` - First time password change (requires auth)

### Users (Admin Only)

- `GET /api/users` - List all users (supports filters: role, isActive, search)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create new user (auto-generates secure password)
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/deactivate` - Deactivate user
- `POST /api/users/:id/reactivate` - Reactivate user
- `GET /api/users/handlers` - Get all handlers (INVIGILATOR, LECTURER, etc.)

## Tech Stack

### Backend

- Node.js with Express
- TypeScript
- Prisma ORM with PostgreSQL
- JWT authentication
- Zod validation

### Frontend

- React 19 with TypeScript
- Vite for build tooling
- TanStack Query for server state
- Zustand for client state
- Tailwind CSS for styling
- React Router v7 for routing

## Project Structure

```
web/
├── src/
│   ├── api/           # API client methods
│   ├── components/    # Reusable components
│   ├── hooks/         # Custom React hooks with TanStack Query
│   ├── layouts/       # Layout components
│   ├── lib/           # Utilities and shared config
│   ├── pages/         # Page components
│   ├── store/         # Zustand stores
│   ├── types/         # TypeScript type definitions
│   └── App.tsx        # Main app component with routing
```

## State Management

- **Auth State**: Zustand with localStorage persistence
- **Server State**: TanStack Query with automatic caching and invalidation
- **API Client**: Axios with interceptors for auth token injection

## Features Implemented

✅ Authentication with JWT
✅ First-time password change flow
✅ Protected routes with role-based access control
✅ User management (CRUD)
✅ Auto-generated secure passwords
✅ Real-time form validation
✅ Optimistic UI updates
✅ Error handling and loading states
✅ Responsive design with Tailwind CSS
