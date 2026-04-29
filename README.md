# ENOSOFT MIS

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://sdk.vercel.ai)

<br>

<img src="https://via.placeholder.com/800x400/1a1a2e/ffffff?text=ENOSOFT+MIS+Dashboard" alt="ENOSOFT MIS Dashboard Preview" width="800">

**AI-Powered Management Information System**

_Streamline workforce management with intelligent automation_

</div>

---

## Features

<div align="center">

| **Workforce Management**            | **AI Assistant**            | **Analytics**           |
| :---------------------------------- | :-------------------------- | :---------------------- |
| Employee profiles & skills tracking | Natural language queries    | Real-time dashboards    |
| Project lifecycle management        | Streaming AI chat interface | Automated PDF reports   |
| Task dependencies & assignments     | Smart quick actions         | Performance metrics     |
| Team collaboration tools            | Context-aware responses     | Progress visualizations |

</div>

### Core Capabilities

<details>
<summary><b>Employee Management</b></summary>

- Comprehensive employee profiles with skill matrices
- Department organization and role assignments
- Performance tracking and workload analysis
- Secure authentication with role-based access
</details>

<details>
<summary><b>Project Management</b></summary>

- Full project lifecycle from initiation to completion
- Milestone tracking with automatic progress calculation
- Priority levels and status workflows
- Timeline visualization and calendar integration
</details>

<details>
<summary><b>Task Management</b></summary>

- Task dependencies and blocking relationships
- Priority-based task scheduling
- Assignment workflows with notifications
- Due date tracking and deadline management
</details>

<details>
<summary><b>AI-Powered Assistant</b></summary>

- **Streaming Chat** — Real-time AI responses with rich markdown formatting
- **Natural Language** — Ask complex questions about your workforce in plain English
- **Semantic Search** — AI understands context, not just keywords
- **Quick Actions** — One-click shortcuts for common operations
- **Report Generation** — Automated insights with charts and metrics
</details>

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account ([sign up free](https://supabase.com))
- **OpenAI** API key
- **Gmail** account (for email verification)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd enosoft-mis

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Initialize database
# Run migrations in supabase/migrations/ via Supabase Dashboard

# Start development server
npm run dev
```

### Environment Setup

```bash
# Required environment variables
cp .env.example .env.local
```

> **Security Note:** Never commit `.env.local` or expose API keys. All sensitive configuration stays local.

---

## Tech Stack

<div align="center">

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION                            │
│  React 18  •  Radix UI  •  Custom CSS Modules              │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION                              │
│  Next.js 15  •  Vercel AI SDK  •  Streaming Architecture   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN                                 │
│  Services  •  Embeddings  •  Knowledge Context           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE                            │
│  Supabase (PostgreSQL)  •  Supabase Auth  •  Email         │
└─────────────────────────────────────────────────────────────┘
```

</div>

| Layer          | Technology               | Purpose                                      |
| -------------- | ------------------------ | -------------------------------------------- |
| **Framework**  | Next.js 15+ (App Router) | Server-side rendering, API routes            |
| **Language**   | TypeScript 5.0+          | Type safety and developer experience         |
| **Database**   | Supabase PostgreSQL      | Relational data with real-time subscriptions |
| **AI/ML**      | Vercel AI SDK + OpenAI   | Streaming AI responses and tool calling      |
| **Embeddings** | BGE-small-en-v1.5        | Local semantic search via Transformer.js     |
| **UI**         | Radix UI + Custom CSS    | Accessible primitives with design tokens     |
| **Validation** | Zod                      | Runtime type safety                          |
| **Testing**    | Vitest                   | Unit and integration testing                 |

---

## Project Structure

```
enosoft-mis/
├── app/                        # Next.js App Router
│   ├── components/             # React components
│   │   ├── forms/              # Data entry forms
│   │   ├── modals/             # Dialog overlays
│   │   └── ui/                 # Primitive components
│   ├── styles/                 # CSS modules
│   │   ├── base.css            # Design tokens
│   │   └── *.css               # Component styles
│   └── (auth)/                 # Auth pages
│
├── lib/                        # Business logic
│   ├── services/               # Domain services
│   ├── hooks/                  # React hooks
│   ├── context/                # State management
│   └── utils/                  # Utilities
│
├── types/                      # TypeScript definitions
├── supabase/                   # Database migrations
└── scripts/                    # Automation scripts
```

---

## Security

- **Authentication** — Secure session management via Supabase Auth
- **Authorization** — Role-based access control (Admin/Super-admin)
- **Data Protection** — PostgreSQL RLS policies configured
- **Input Sanitization** — Zod validation on all inputs
- **Content Security** — Markdown sanitized with rehype-sanitize
- **Secrets Management** — Environment variables isolated from source

---

## Development

### Available Scripts

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run test             # Run test suite
npm run lint             # ESLint code check
npm run backfill:embeddings  # Generate AI embeddings for existing data
```

### CSS Architecture

This project uses a **custom CSS module system** — no Tailwind. Design tokens power a consistent visual language:

```css
/* From app/styles/base.css */
:root {
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  /* ... more tokens */
}
```

**Module Organization:**

- `base.css` — CSS variables, typography scale, spacing system
- `utilities.css` — Helper classes
- `buttons.css`, `forms.css`, `chat.css` — Component categories

---

## Performance

| Feature                | Implementation                       |
| ---------------------- | ------------------------------------ |
| **AI Streaming**       | Real-time token-by-token responses   |
| **Data Caching**       | SWR stale-while-revalidate pattern   |
| **Query Optimization** | Database indexes on all relations    |
| **Code Splitting**     | Dynamic imports for heavy components |
| **Asset Delivery**     | Next.js image optimization           |

---

## Browser Support

| Chrome | Firefox | Safari | Edge |
| :----: | :-----: | :----: | :--: |
|  90+   |   88+   |  14+   | 90+  |

---

<div align="center">

**Built with modern web technologies for enterprise workforce management**

</div>
