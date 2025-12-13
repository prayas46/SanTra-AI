# 💬 SanTra-AI

**Enterprise-Grade AI Customer Support Platform for Modern Businesses**

SanTra-AI is a comprehensive customer support solution that combines conversational AI, voice integration, and real-time chat widgets. Designed with healthcare and business applications in mind, it provides seamless customer engagement through multiple channels.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/prayas46/SanTra-AI)

## 📚 Table of Contents

- **Overview**
- **Features**
- **Architecture**
- **Getting Started**
- **Development Workflow**
- **Integration Guide**
- **Use Cases Across Industries**
- **Technology Stack**
- **Data Model**
- **Security, Privacy & Compliance**
- **Contributing**
- **License**
- **Support**

## 🔎 Overview

SanTra-AI is built as a Turborepo-based monorepo with separate applications for the admin dashboard, embeddable widgets, and backend services powered by Convex. It is designed for teams that need:

- Centralized management of organizations, agents, and integrations.
- Real-time, AI-assisted conversations across web and voice channels.
- An opinionated but extensible architecture suitable for production deployments.

## ✨ Features

- 🤖 **AI-Powered Conversations** - Intelligent chat responses using advanced AI models
- 🎙️ **Voice Integration** - Voice AI capabilities through Vapi integration
- 📱 **Embeddable Widget** - Easy-to-integrate chat widget for any website
- 👥 **Organization Management** - Multi-tenant support with Clerk authentication
- 📊 **Real-time Analytics** - Track conversations and customer interactions
- 🔧 **Customizable Settings** - Configurable widget appearance and behavior
- 🏥 **Healthcare Focused** - Optimized for medical and healthcare customer support
- 🌐 **Multi-Platform** - Web dashboard, embeddable widget, and standalone components
- 🕒 **24/7 Self-Service Support** - Automate FAQs and repetitive queries for any business
- 🧾 **Contact & Session History** - Track conversations and sessions for rich customer context
- 🔌 **Plugin-Based Integrations** - Extend the platform with third-party tools and services
- 🧠 **File-Aware Conversations** - Use uploaded documents and media to enrich support flows
- 📡 **Real-time Sync** - Live updates between dashboard, widget, and backend powered by Convex
- 🧩 **AI Agents & RAG** - Agentic workflows and retrieval-augmented generation using Convex Agents and Convex RAG
- 🧪 **Experimentation-Friendly** - Safe playground-style environment for iterating on prompts, flows, and bots
- 🧱 **Shared UI Library** - Centralized design system and components via the `@workspace/ui` package
- 🧮 **Shared Utilities** - Reusable math and utility functions via the `@workspace/math` package

## 💼 Use Cases Across Industries

SanTra-AI can be embedded into a wide range of businesses and industries. Common scenarios include:

- 🛒 **E-commerce & Q-commerce** - Power product discovery and support for Blinkit-style storefronts
- 🏖️ **Hospitality & Resorts** - Answer FAQs and handle booking inquiries on resort websites
- 🏥 **Healthcare Providers** - Support clinics and hospitals with patient queries and triage
- 🧩 **SaaS & Service Businesses** - Reduce support load and capture leads across your app and site
- 🤝 **Customer Support Automation** - 24/7 handling of frequent inquiries for customers, patients, or clients
- 📅 **Appointment & Booking Assistance** - AI-powered scheduling for clinics, services, and consultations
- 📚 **Information & Knowledge Delivery** - Consistent, policy-aware information sharing based on your knowledge sources
- 🚨 **Triage & Prioritization** - Routing urgent or high-priority cases to the right queues or teams
- 🌍 **Multi-language Support** - Serve diverse populations across regions and markets

## 🏗️ Architecture

SanTra-AI is organized as a **Turborepo-based monorepo** with clearly separated deployable applications and shared packages:

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

## 🚀 Getting Started

Use this guide to spin up a local development environment for evaluation or contribution.

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

## 🛠️ Development Workflow

The following scripts are used for local development, CI, and production builds.

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

## 🧩 Integration Guide

Use SanTra-AI in your own applications via the embeddable widget and Convex APIs.

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

## 🌟 Technology Stack

- **Frontend**: Next.js 15 (web & widget), React 19, TypeScript, Vite (embed app)
- **Styling & UI**: Tailwind CSS, shadcn/ui, Radix UI, lucide-react, Dicebear avatars, Embla Carousel, Recharts, Sonner toasts, markdown rendering with react-markdown + remark-gfm
- **Backend & Realtime**: Convex (BaaS), Convex Agents, convex-helpers, WebSockets (`ws`)
- **AI & LLM Orchestration**: Vercel AI SDK (`ai`), OpenAI (`@ai-sdk/openai`), Google (`@ai-sdk/google`), Convex RAG (`@convex-dev/rag`)
- **Voice AI**: Vapi server SDK (`@vapi-ai/server-sdk`) and web SDK (`@vapi-ai/web`)
- **Authentication & Identity**: Clerk (web + backend)
- **Data & Integrations**: Neon serverless Postgres (`@neondatabase/serverless`), AWS Secrets Manager & RDS Data (`@aws-sdk/client-secrets-manager`, `@aws-sdk/client-rds-data`)
- **Validation & Schemas**: Zod for type-safe validation
- **State Management**: Jotai
- **Observability & Monitoring**: Sentry for error tracking and performance insights
- **On-device / Browser Models**: `@xenova/transformers` for running transformer models without a separate backend service
- **Internal Packages**: Shared packages `@workspace/ui`, `@workspace/backend`, and `@workspace/math` for UI, backend logic, and utilities
- **Monorepo & Tooling**: Turborepo, pnpm workspaces, TypeScript, ESLint, Prettier, Tailwind CSS 4, Vite
- **Deployment**: Vercel (applications) and Convex (backend)

## 📊 Data Model

Core entities in the Convex schema:

- **`widgetSettings`** - Widget configuration and appearance
- **`conversations`** - Chat conversations with status tracking
- **`contactSessions`** - User sessions with metadata
- **`plugins`** - Third-party service integrations
- **`messages`** - Individual chat messages
- **`files`** - Uploaded documents and media

## 🔐 Security, Privacy & Compliance

Security is a first-class concern. SanTra-AI is intended to be deployed in environments that follow strong organizational security and compliance practices.

- **Regulated-environment ready** – Can be integrated into environments that must comply with regulations (for example, HIPAA in healthcare); overall compliance depends on your hosting and operational controls.
- **Enterprise-ready controls** – Supports standard security practices (least-privilege access, logging, separation of concerns) when combined with your existing IAM and observability stack.
- **Secure transport** – Intended to be served over HTTPS/TLS for data-in-transit protection.
- **Role-based access** – Organization-level permissions via Clerk authentication and backend authorization.
- **Auditability** – Convex backend and logging integrations can be used to build detailed activity trails for sensitive operations.

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
