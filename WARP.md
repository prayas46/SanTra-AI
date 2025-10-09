# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Repository Setup
```bash
# Install dependencies
pnpm install

# Set up Convex backend (first time)
cd packages/backend && pnpm run setup
```

### Development
```bash
# Start all applications in development mode
pnpm dev

# Start individual applications
pnpm --filter web dev          # Main web app (port 3000)
pnpm --filter widget dev       # Widget app (port 3001)  
pnpm --filter embed dev        # Embed app (port 3002)
pnpm --filter backend dev      # Convex backend
```

### Building
```bash
# Build all packages and applications
pnpm build

# Build individual packages
pnpm --filter @workspace/ui build
pnpm --filter @workspace/math build
pnpm --filter web build
```

### Code Quality
```bash
# Run linting across all packages
pnpm lint

# Fix linting issues
pnpm --filter web lint:fix
pnpm --filter widget lint:fix

# Type checking
pnpm --filter web typecheck
pnpm --filter widget typecheck

# Format code
pnpm format
```

### Testing Individual Components
```bash
# Run specific package commands
pnpm --filter @workspace/math dev    # Watch TypeScript compilation
pnpm --filter @workspace/ui lint     # Lint UI components
```

## Architecture Overview

### Monorepo Structure
This is a **Turborepo-based monorepo** using **pnpm workspaces** with the following structure:

- **`apps/`** - Applications that can be deployed
  - `web/` - Main Next.js web application with Clerk authentication
  - `widget/` - Next.js widget application for embedding
  - `embed/` - Vite-based embeddable component
- **`packages/`** - Shared packages and libraries
  - `ui/` - Shared shadcn/ui components with Tailwind CSS
  - `backend/` - Convex backend functions and database schema
  - `math/` - Utility math functions
  - `eslint-config/` - Shared ESLint configurations
  - `typescript-config/` - Shared TypeScript configurations

### Key Technologies

**Frontend Stack:**
- **Next.js 15** with React 19 for web applications
- **Vite** for the embed application
- **shadcn/ui** components with **Radix UI** primitives
- **Tailwind CSS** for styling
- **Clerk** for authentication (web app)
- **Jotai** for state management

**Backend Stack:**
- **Convex** as the backend-as-a-service platform
- **Convex Agents** for AI functionality
- **Vapi** integration for voice AI capabilities
- **Zod** for schema validation

**Development Tools:**
- **Turborepo** for build orchestration
- **pnpm** for package management
- **TypeScript** throughout
- **ESLint** for code quality

### Data Model (Convex Schema)

The backend uses Convex with the following main entities:
- **`widgetSettings`** - Configuration for widget appearance and behavior
- **`conversations`** - Chat conversations with status tracking
- **`contactSessions`** - User sessions with metadata
- **`plugins`** - Third-party service integrations (e.g., Vapi)

### Shared Components Architecture

The `@workspace/ui` package contains reusable components that can be imported across applications:

```typescript
import { Button } from "@workspace/ui/components/button"
```

Components are built on top of Radix UI primitives and styled with Tailwind CSS using class-variance-authority for variants.

### Adding New shadcn/ui Components

To add new shadcn/ui components to the shared UI package:

```bash
pnpm dlx shadcn@latest add [component-name] -c apps/web
```

This places components in `packages/ui/src/components/` for sharing across applications.

### Backend Development (Convex)

Convex functions are organized in `packages/backend/convex/`:
- `public/` - Client-accessible functions
- `private/` - Server-only functions  
- `system/` - System-level operations
- `lib/` - Shared utilities

The Convex backend provides real-time data synchronization and includes AI agents for conversation handling.

### Cross-Package Dependencies

Applications depend on shared packages via workspace references:
- `@workspace/ui` - Shared UI components
- `@workspace/backend` - Convex functions and types
- `@workspace/math` - Utility functions

### Environment Considerations

- **Node.js >= 20** required
- **pnpm 10.15.0** as the package manager
- Convex deployment for backend functionality
- Sentry integration for error monitoring (web app)