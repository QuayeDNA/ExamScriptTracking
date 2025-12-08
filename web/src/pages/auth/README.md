# Authentication Pages

This folder contains all authentication-related pages for the Exam Script Tracking system.

## Pages

### LoginPage.tsx

- Main authentication entry point
- Email/password login form
- Link to forgot password flow

### ForgotPasswordPage.tsx

- Password reset request page
- Generates reset token (displayed in toast for development)
- Links to ResetPasswordPage

### ResetPasswordPage.tsx

- Token-based password reset
- Validates reset token
- Password confirmation with validation

### ChangePasswordRequiredPage.tsx

- Forced password change for first-time login
- Users with temporary passwords must change them here

## Layout

All auth pages use the **AuthLayout** (`src/layouts/AuthLayout.tsx`) which provides:

- Centered card-based design
- Theme toggle in top-right corner
- Footer with copyright
- Consistent responsive styling

## Design System

All auth pages follow the design system guidelines:

- Use shadcn/ui components (Card, Button, Input, Label, Alert)
- Semantic color tokens (bg-background, text-foreground, etc.)
- Lucide React icons for visual context
- Toast notifications for user feedback
- Mobile-first responsive design

## Routing

Auth routes are grouped in App.tsx under the AuthLayout:

```tsx
<Route element={<AuthLayout />}>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />
  <Route
    path="/change-password-required"
    element={<ChangePasswordRequiredPage />}
  />
</Route>
```

## Imports

Use the index file for convenient imports:

```tsx
import { LoginPage, ChangePasswordRequiredPage } from "@/pages/auth";
```
