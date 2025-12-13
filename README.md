# 🏥 SanTra-AI

**Next-Generation AI-Powered Customer Support Platform**

SanTra-AI is a comprehensive customer support solution that combines conversational AI, voice integration, and real-time chat widgets. Designed with healthcare and business applications in mind, it provides seamless customer engagement through multiple channels.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/prayas46/SanTra-AI)

## ✨ Features

- 🤖 **AI-Powered Conversations** - Intelligent chat responses using advanced AI models
- 🎙️ **Voice Integration** - Voice AI capabilities through Vapi integration
- 📱 **Embeddable Widget** - Easy-to-integrate chat widget for any website
- 👥 **Organization Management** - Multi-tenant support with Clerk authentication
- 📊 **Real-time Analytics** - Track conversations and customer interactions
- 🔧 **Customizable Settings** - Configurable widget appearance and behavior
- 🏥 **Healthcare Focused** - Optimized for medical and healthcare customer support
- 🌐 **Multi-Platform** - Web dashboard, embeddable widget, and standalone components

## 🏗️ Architecture

SanTra-AI is built as a **Turborepo monorepo** with the following structure:

### Applications

- **`apps/web/`** - Main Next.js dashboard with Clerk authentication
- **`apps/widget/`** - Embeddable Next.js widget for customer websites
- **`apps/embed/`** - Lightweight Vite-based embeddable component

### Packages

- **`packages/ui/`** - Shared shadcn/ui component library
- **`packages/backend/`** - Convex backend with AI agents and real-time sync
- **`packages/math/`** - Utility mathematical functions
- **`packages/eslint-config/`** - Shared ESLint configurations
- **`packages/typescript-config/`** - Shared TypeScript configurations

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **pnpm 10.15.0+**
- **Convex account** for backend services

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SanTra-AI
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up Convex backend**

   ```bash
   cd packages/backend
   pnpm run setup
   ```

4. **Start development servers**

   ```bash
   # Start all applications
   pnpm dev

   # Or start individual apps
   pnpm --filter web dev          # Main dashboard (port 3000)
   pnpm --filter widget dev       # Widget app (port 3001)
   pnpm --filter embed dev        # Embed app (port 3002)
   ```

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start all applications
pnpm --filter web dev       # Start main web app
pnpm --filter widget dev    # Start widget app
pnpm --filter backend dev   # Start Convex backend

# Building
pnpm build                  # Build all packages
pnpm --filter web build     # Build specific package

# Code Quality
pnpm lint                   # Lint all packages
pnpm format                 # Format code with Prettier
pnpm --filter web typecheck # Type checking
```

### Adding shadcn/ui Components

To add new shadcn/ui components to the shared UI package:

```bash
pnpm dlx shadcn@latest add [component-name] -c apps/web
```

Components are automatically placed in `packages/ui/src/components/` for sharing across applications.

### Using Components

Import shared components from the UI package:

```tsx
import { Button } from "@workspace/ui/components/button";
import { Dialog } from "@workspace/ui/components/dialog";
```

## 🧩 Integration

### Widget Integration

1. **Get your Organization ID** from the dashboard
2. **Copy the integration script** from the Integrations page
3. **Paste the script** into your website's HTML
4. **Preview integration** using our demo page

```html
<script
  src="https://san-tra-ai-widget.vercel.app/widget.js"
  data-organization-id="your-org-id"
></script>
```

### API Usage

The platform uses Convex for real-time data synchronization:

```typescript
// Query conversations
const conversations = useQuery(api.conversations.list, {
  organizationId: "your-org-id",
});

// Send message
const sendMessage = useMutation(api.messages.send);
```

## 🏥 Healthcare Applications

SanTra-AI is specifically designed for healthcare organizations:

- **Patient Support** - 24/7 automated patient inquiries
- **Appointment Scheduling** - AI-powered booking assistance
- **Medical Information** - HIPAA-compliant information sharing
- **Emergency Triage** - Priority routing for urgent cases
- **Multi-language Support** - Serve diverse patient populations

## 🌟 Technology Stack

- **Frontend**: Next.js 15.5.9, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Convex (BaaS), Convex Agents (AI)
- **Authentication**: Clerk
- **State Management**: Jotai
- **Voice AI**: Vapi integration
- **Build System**: Turborepo, pnpm workspaces
- **Deployment**: Vercel (apps), Convex (backend)

## 📊 Data Model

Core entities in the Convex schema:

- **`widgetSettings`** - Widget configuration and appearance
- **`conversations`** - Chat conversations with status tracking
- **`contactSessions`** - User sessions with metadata
- **`plugins`** - Third-party service integrations
- **`messages`** - Individual chat messages
- **`files`** - Uploaded documents and media

## 🔐 Security & Compliance

- **HIPAA Compliance** - Healthcare data protection
- **SOC 2 Type II** - Enterprise security standards
- **End-to-end Encryption** - Secure data transmission
- **Role-based Access** - Organization-level permissions
- **Audit Logging** - Comprehensive activity tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

---

**Built with ❤️ for the future of customer support**
