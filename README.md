# 🚀 ThinkSoul LMS — Startup Incubation & Learning Management System

> **A real-time, scalable, Notion-like Learning & Incubation Management Platform designed to track, mentor, and incubate 300–400+ startup projects simultaneously.**

[![Netlify Live Demo](https://img.shields.io/badge/Netlify-Live%20Demo-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://thinksoul-lms-demo.netlify.app)

---

## 📌 Executive Summary

**ThinkSoul LMS** is a modern, high-performance web platform built to solve the operational bottlenecks of startup incubators, accelerators, and educational hubs. 

Instead of juggling static spreadsheets, dis-jointed chat apps, and bulky enterprise LMS platforms, ThinkSoul provides a single **Notion-like collaborative workspace** coupled with **bird's-eye management dashboards**, real-time task tracking, interactive analytics, and multi-tenant security.

---

## ✨ Key Features & Capabilities

- 📄 **Notion-Like Block Editor**: Block-based rich-text editor powered by `@blocknote/react` and `@blocknote/mantine` for creating daily logs, execution docs, pitch decks, and knowledge bases with nested pages, icons, and cover images.
- 📊 **Kanban Task Management**: Drag-and-drop task boards using `@hello-pangea/dnd` for smooth sprint management, status tracking (To-Do, In Progress, Review, Done), assignees, and priority tags.
- 📅 **Integrated Calendar View**: Visual scheduling for incubator check-ins, demo days, sprint deadlines, and daily founder logs.
- 📈 **Custom Chart Builder**: Interactive analytics powered by `recharts` for monitoring cohort velocity, task completion rates, and startup milestone progress.
- 🏢 **Multi-Tenant Workspace Groups**: Hierarchical organization supporting global founders, incubator group admins, and individual startup workspace members.
- 🔒 **Row-Level Security (RLS) & Auth**: Supabase Auth SSR middleware integration (`@supabase/ssr`) with PKCE auth flow, cookie-based session management, and granular database RLS policies.
- 🖼️ **AWS S3 Presigned Uploads**: Direct-to-S3 client media uploads using `@aws-sdk/s3-request-presigner` for seamless high-resolution image and video embedding.
- 📧 **Automated Email Onboarding**: Nodemailer SMTP integration for inviting Group Admins and workspace members with cryptographically secure single-use invitation tokens.
- ⚡ **Realtime Caching & Updates**: Data fetching powered by `swr` and Supabase Realtime WebSocket subscriptions for instantaneous UI updates across workspaces.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client Layer
        A[Browser / Web Client]
        B[Mobile PWA / Capacitor APK]
    end

    subgraph Next.js 16 App Router Frontend & API
        C[Next.js Edge Middleware]
        D[App Router Pages / Dashboard]
        E[SWR Data Fetching Layer]
        F[API Routes /api/auth /api/invite /api/upload]
    end

    subgraph Supabase BaaS Backend
        G[Supabase Auth SSR]
        H[PostgreSQL Database]
        I[Row Level Security RLS]
        J[Supabase Realtime Engine]
    end

    subgraph External Infrastructure Services
        K[AWS S3 Asset Storage]
        L[SMTP Mail Service Hostinger / SES]
    end

    A -->|HTTPS Requests| C
    B -->|HTTPS Requests| C
    C -->|Session Validation| G
    C -->|Render Route| D
    D -->|Client State & Cache| E
    E -->|REST / PostgREST| H
    E -->|WebSocket Subscriptions| J
    D -->|Internal Calls| F
    F -->|Generate Presigned URL| K
    F -->|Send Invitation Emails| L
    F -->|Service Role Mutations| H
    H --- I
```

---

## 🗄️ Database Schema & Entity Relationships (ERD)

```mermaid
erDiagram
    PROFILES ||--o{ WORKSPACE_GROUPS : "creates (Founder)"
    PROFILES ||--o{ GROUP_ADMINS : "assigned to"
    WORKSPACE_GROUPS ||--o{ GROUP_ADMINS : "has admins"
    WORKSPACE_GROUPS ||--o{ WORKSPACES : "contains"
    PROFILES ||--o{ WORKSPACES : "owns"
    PROFILES ||--o{ WORKSPACE_MEMBERS : "belongs to"
    WORKSPACES ||--o{ WORKSPACE_MEMBERS : "has members"
    WORKSPACES ||--o{ PAGES : "contains"
    PAGES ||--o{ PAGES : "parent of (Nested Pages)"
    PAGES ||--o{ BLOCKS : "contains rich text blocks"

    PROFILES {
        uuid id PK "Matches auth.users"
        enum user_role "founder | group_admin | admin"
        string user_role_str "Legacy / String role fallback"
        timestamp created_at
        timestamp updated_at
    }

    WORKSPACE_GROUPS {
        uuid id PK
        string name
        uuid created_by FK "References profiles.id"
        timestamp created_at
        timestamp updated_at
    }

    GROUP_ADMINS {
        uuid group_id PK, FK "References workspace_groups.id"
        uuid user_id PK, FK "References profiles.id"
        timestamp created_at
    }

    WORKSPACES {
        uuid id PK
        string name
        uuid owner_id FK "References profiles.id"
        uuid group_id FK "References workspace_groups.id"
        timestamp created_at
        timestamp updated_at
    }

    WORKSPACE_MEMBERS {
        uuid workspace_id PK, FK "References workspaces.id"
        uuid user_id PK, FK "References profiles.id"
        string role "owner | admin | member"
        timestamp created_at
    }

    PAGES {
        uuid id PK
        uuid workspace_id FK "References workspaces.id"
        uuid parent_id FK "Self-referencing parent page"
        string title
        string icon
        string cover_image
        boolean is_public
        timestamp created_at
        timestamp updated_at
    }

    BLOCKS {
        uuid id PK
        uuid page_id FK "References pages.id"
        json content "BlockNote JSON block structure"
        timestamp created_at
        timestamp updated_at
    }
```

---

## 👥 User Roles & Permissions Matrix (RBAC)

```mermaid
graph LR
    subgraph Role Hierarchy
        Founder[👑 Founder / Super Admin]
        GroupAdmin[🛡️ Group Admin / Cohort Lead]
        WorkspaceAdmin[🏢 Workspace Owner / Startup Admin]
        Member[👤 Workspace Member]
    end

    Founder -->|Manages All Groups & Global Metrics| GroupAdmin
    GroupAdmin -->|Manages Assigned Workspace Group| WorkspaceAdmin
    WorkspaceAdmin -->|Manages Startup Pages & Members| Member
```

| Feature / Action | 👑 Founder | 🛡️ Group Admin | 🏢 Workspace Owner | 👤 Member |
| :--- | :---: | :---: | :---: | :---: |
| **Global Admin Dashboard View** | ✅ | ❌ | ❌ | ❌ |
| **Create / Manage Workspace Groups** | ✅ | ❌ | ❌ | ❌ |
| **Assign Group Admins** | ✅ | ❌ | ❌ | ❌ |
| **Manage Group Workspaces** | ✅ | ✅ | ❌ | ❌ |
| **Invite Group Members** | ✅ | ✅ | ✅ | ❌ |
| **Create / Edit Notion Pages & Blocks** | ✅ | ✅ | ✅ | ✅ |
| **Drag & Drop Kanban Tasks** | ✅ | ✅ | ✅ | ✅ |
| **Build & Customize Analytics Charts** | ✅ | ✅ | ✅ | ❌ |

---

## 🔐 Authentication & Session Security Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Middleware as Next.js Middleware (middleware.ts)
    participant Auth as Supabase Auth SSR (@supabase/ssr)
    participant App as Next.js Dashboard App Router
    participant DB as Supabase Postgres (RLS)

    User->>Middleware: Incoming HTTP Request (e.g. /dashboard)
    Middleware->>Auth: Read & refresh session cookies
    alt Invalid / Expired Token
        Auth-->>Middleware: No active session
        Middleware-->>User: HTTP 307 Redirect to /login
    else Valid Session
        Auth-->>Middleware: Return user claims & JWT
        Middleware->>App: Forward request with updated Auth headers/cookies
        App->>DB: Query data (Applies RLS based on auth.uid())
        DB-->>App: Return scoped workspace data
        App-->>User: Render Dashboard Component with hydrated SWR cache
    end
```

---

## 📑 Notion-Like Workspace & Content Hierarchy

```mermaid
graph TD
    Group[🏢 Workspace Group e.g. Cohort 2026]
    Group --> WS1[🚀 Startup A Workspace]
    Group --> WS2[🚀 Startup B Workspace]

    WS1 --> Page1[📄 Product Overview]
    WS1 --> Page2[📄 Sprint Kanban Board]
    WS1 --> Page3[📄 Daily Founder Log]

    Page1 --> SubPage1[📑 Architecture Spec]
    Page1 --> SubPage2[📑 API Reference]

    Page2 --> Block1[🧱 Block: Task Card To-Do]
    Page2 --> Block2[🧱 Block: Task Card In Progress]

    Page3 --> Block3[🧱 Block: Heading & Rich Text]
    Page3 --> Block4[🧱 Block: AWS S3 Media Embed]
```

---

## 📋 Kanban & Task Management Workflow

```mermaid
stateDiagram-v2
    [*] --> Backlog: Task Created
    Backlog --> ToDo: Assigned to Sprint
    ToDo --> InProgress: Developer starts work
    InProgress --> InReview: PR Submitted / Draft Ready
    InReview --> Done: Approved & Verified
    InReview --> InProgress: Revisions Requested
    Done --> [*]: Archived / Task Completed
```

---

## 🖼️ Media Upload & AWS S3 Presigned URL Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client Browser (BlockNote Editor)
    participant API as Next.js API Route (/api/upload)
    participant AWS as AWS S3 Storage Service
    participant S3Bucket as S3 Asset Bucket

    Client->>API: POST /api/upload { filename, contentType }
    API->>AWS: AWS SDK PutObjectCommand & getSignedUrl()
    AWS-->>API: Presigned Upload URL (Valid 15 mins)
    API-->>Client: Return { uploadUrl, fileUrl }
    Client->>S3Bucket: PUT file binary directly to uploadUrl
    S3Bucket-->>Client: 200 OK
    Client->>Client: Render S3 fileUrl inside BlockNote Page
```

---

## 📧 Member Invitation & Onboarding Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Group Admin / Founder
    participant App as Dashboard UI (Invite Modal)
    participant API as Next.js API Route (/api/invite)
    participant DB as Supabase Database
    participant SMTP as Hostinger / SES SMTP Mailer
    actor Invitee as Invited Founder / Member

    Admin->>App: Submit invite form (email, group_id / workspace_id, role)
    App->>API: POST /api/invite
    API->>DB: Store invitation token & metadata
    API->>SMTP: Send email with secure token link
    SMTP-->>Invitee: Deliver onboarding email
    Invitee->>App: Click join link (/join?token=xyz)
    App->>API: Validate token & auto-assign user to Workspace/Group
    API->>DB: Insert profile & workspace_members / group_admins
    DB-->>App: Registration successful
    App-->>Invitee: Redirect to Dashboard with active access
```

---

## 🚀 CI/CD & Production Deployment Pipeline

```mermaid
graph LR
    subgraph Development
        Dev[💻 Developer] -->|git push origin main| GitHub[🐙 GitHub Repository]
    end

    subgraph GitHub Actions Runner
        GitHub -->|Triggers Workflow| Workflow[.github/workflows/deploy.yml]
        Workflow -->|1. Checkout & Setup Node 20| BuildStep[npm run build]
        BuildStep -->|2. Next.js Standalone Bundle| ZipStep[Package deploy.zip]
    end

    subgraph Production VPS Server
        ZipStep -->|3. SCP Transfer| Transfer[Secure Copy to VPS]
        Transfer -->|4. SSH Commands| DeployStep[Unzip & Inject Production .env]
        DeployStep -->|5. PM2 Process Manager| PM2[pm2 restart thinksoul]
        PM2 -->|Serves Traffic| Web[🌐 Production Web App https://thinksoul.in]
    end
```

---

## 🛠️ Technology Stack Breakdown

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Core Framework** | Next.js 16 (App Router) | Server & Client components, Edge middleware, Server Actions, API routes |
| **UI Library & React** | React 19, TypeScript | Strict typed components and client hooks |
| **Styling & CSS** | Tailwind CSS v4, PostCSS | Modern responsive styling engine |
| **Rich Text Editor** | `@blocknote/react` `@blocknote/mantine` | Notion-style block editor with customizable block structures |
| **Drag & Drop** | `@hello-pangea/dnd` | Accessible fluid drag-and-drop for Kanban boards |
| **Charts & Analytics** | `recharts` | Composable charting library for progress tracking |
| **Database & Auth** | Supabase (PostgreSQL, Auth SSR, RLS) | Relational database, JWT Auth, RLS policies, Realtime Engine |
| **Object Storage** | AWS S3 SDK (`@aws-sdk/client-s3`) | Presigned URL direct client uploads for media assets |
| **Email Service** | Nodemailer | Transactional email delivery for invitations and password resets |
| **Icons** | Lucide React | Clean, scalable UI icon system |
| **Process Manager** | PM2 | Daemon process management for production VPS deployment |

---

## 📂 Project Directory Structure

```files
thinksoul-lms/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated GitHub Actions CI/CD workflow
├── docs/
│   ├── LMS_Project_Proposal.md     # Platform architecture proposal
│   ├── clarity.md                  # Comprehensive requirements & spec
│   └── implementation_Plan.md      # Feature roadmap & technical milestones
├── public/                         # Static icons, favicons, and images
├── src/
│   ├── app/                        # Next.js App Router Pages & API Endpoints
│   │   ├── api/
│   │   │   ├── auth/              # Auth callbacks & session management
│   │   │   ├── invite/            # Group & workspace invitation handling
│   │   │   ├── register/          # New user registration endpoints
│   │   │   └── upload/            # AWS S3 Presigned upload URL generation
│   │   ├── dashboard/             # Core multi-workspace dashboard UI
│   │   ├── join/                  # Onboarding & invite token acceptance page
│   │   ├── login/                 # User authentication page
│   │   ├── register/              # Founder registration page
│   │   ├── reset-password/        # Password reset flow
│   │   ├── globals.css            # Tailwind & global stylesheet rules
│   │   └── layout.tsx             # Main application layout wrapper
│   ├── components/
│   │   ├── admin/                 # Founder Master Admin views
│   │   ├── board/                 # Kanban board, Calendar, and Charts components
│   │   ├── editor/                # BlockNote Notion-like block editor component
│   │   ├── landing/               # Marketing & landing page UI
│   │   ├── layout/                # Dashboard Shell, Topbar, Sidebar, Spaces views
│   │   └── modals/                # Task, Group, Workspace, Profile, Settings modals
│   ├── types/
│   │   └── supabase.ts            # Auto-generated Supabase database TypeScript types
│   ├── utils/
│   │   ├── mail.ts                # Nodemailer email utility functions
│   │   ├── s3/                    # AWS S3 client setup & presigned URL helpers
│   │   └── supabase/              # Supabase server/client auth middleware helpers
│   └── proxy.ts                   # Custom proxy handling
├── supabase/
│   ├── config.toml                # Supabase local environment configuration
│   └── migrations/                # Versioned SQL migration files & RLS policies
├── .env.example                   # Environment variable template
├── next.config.ts                 # Next.js framework configuration
├── package.json                   # Project dependencies and npm scripts
├── postcss.config.mjs             # PostCSS plugin settings
├── tsconfig.json                  # TypeScript compiler settings
└── README.md                      # Detailed project documentation
```

---

## ⚡ Getting Started & Local Development

### 1. Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Supabase Account / Local CLI**: For database & authentication
- **AWS S3 Bucket**: For media uploads (optional for basic local dev)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Omkar-Hundre/thinksoul.git
cd thinksoul
npm install
```

### 3. Environment Configuration

Copy the sample environment file and configure your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

AWS_REGION=eu-north-1
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_FROM_EMAIL=contact@yourdomain.com
SMTP_USER=contact@yourdomain.com
SMTP_PASS=your-smtp-password

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

Apply Supabase SQL migrations to your database:

```bash
npx supabase db push
# Or run migrations located in supabase/migrations/ directly via Supabase SQL Editor
```

### 5. Running Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser to access ThinkSoul LMS.

---

## 📜 Available NPM Scripts

- `npm run dev`: Starts local development server on port 3000 with hot reloading.
- `npm run build`: Compiles production build with TypeScript check & Next.js static optimizations.
- `npm run start`: Runs production server using compiled `.next` build.
- `npm run lint`: Runs ESLint check across all codebase files.

---

## 🌐 Production VPS Deployment

ThinkSoul LMS includes an automated GitHub Actions deployment workflow (`.github/workflows/deploy.yml`).

### Steps for Deployment:

1. Configure GitHub Repository Secrets:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AWS_REGION`, `AWS_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM_EMAIL`, `SMTP_USER`, `SMTP_PASS`
   - `SERVER_IP`, `SSH_PRIVATE_KEY`

2. Push changes to `main` branch:
   ```bash
   git add .
   git commit -m "feat: updates and documentation"
   git push origin main
   ```

3. The GitHub Action automatically builds the standalone Next.js package, transfers it via SCP to your VPS, writes `.env`, and restarts the app using **PM2**.

---

## 🛡️ Security & Row-Level Security (RLS)

All tables in ThinkSoul LMS enforce strict **PostgreSQL Row-Level Security (RLS)**:
- Users can only read/write workspaces and pages where they hold valid membership (`workspace_members`) or group administration rights (`group_admins`).
- Founders bypass group boundaries via global `user_role = 'founder'`.
- All media uploads are signed server-side using AWS SDK S3 Presigned URLs, preventing unauthorized bucket writes.

---

## 🤝 License & Support

Developed with ❤️ for the startup incubation ecosystem. 

For inquiries, support, or custom deployment requests, contact: **[contact@thinksoul.in](mailto:contact@thinksoul.in)**.
