# 🚀 Visual Workflow Builder

[![Visual Workflow Banner](./public/banner.png)](https://github.com/your-repo/visual-workflow-builder)

Visual Workflow Builder is a feature-rich, high-performance, and visually stunning web application for constructing, managing, and executing node-based automation graphs. Built on top of **Next.js 16**, **React 19**, and **React Flow**, this application integrates database persistence on **Neon PostgreSQL** and real-time collaboration updates using broadcast channels.

---

## ✨ Key Features

### 🎨 Premium Visual Canvas (React Flow)
- **Drag-and-Drop Editor**: Build complex node connections with high performance (supporting 200+ nodes).
- **Custom Nodes**:
  - **Manual Trigger**: The starting point of all logic traversals.
  - **IF Condition**: Multi-handle branching node supporting distinct `True` and `False` output ports.
  - **HTTP Request**: Action node to configure and trigger custom REST API calls.
  - **AI Action (Placeholder)**: Integrating with OpenRouter AI for direct processing.
  - **Unknown Node**: Graceful fallback rendering for unrecognized node schemas during imports, preserving graph connectivity.
- **Real-time Synchronization**: Interactive canvas changes sync instantly using broadcast channels via **Supabase Realtime**.

### ⚙️ Contextual Canvas Preferences
- Canvas properties are integrated directly into the editor view:
  - **Show Dot Grid**: Toggle background grid layout.
  - **Snap to Grid**: Snap nodes cleanly to `[20, 20]` coordinates.
  - **Show Minimap**: Sleek visual overlay in the bottom right corner showing the broad canvas.
  - **Edge Animations**: Smooth marching-ants dash animation on active edge connections.
  - **Compact Layout Mode**: Minimalist node styling for dense, large-scale workflows.
- **Dynamic Accent Colors**: Select your workspace style (Blue, Purple, Green, Orange, etc.) with instant, application-wide styling updates.
- **Class-based Dark Mode**: A unified theme setting that styles every sidebar, background, input field, and React Flow overlay (controls, minimap) cleanly.

### 📥 Robust JSON Import & Export
- **Security-First Validation**: Evaluates imported payloads via a strict **Zod validation pipeline**, stripping out corrupt structures or nodes with invalid fields.
- **Edge Integrity Checking**: Automatically matches edges to existing nodes. Broken or dangling edges are discarded and logged to prevent canvas rendering crashes.
- **Import Preview Dialog**: Reviews imported metrics (node counts, edge counts, versioning schemas) and highlights any validation warnings prior to updating.
- **Double Import Modes**:
  - **Replace Current**: Safely overrides the existing canvas while keeping system-managed ownerships and workspace IDs.
  - **Merge Workflows**: Appends the new nodes and edges, automatically offset by `100px` to prevent overlaps, while regenerating IDs and mapping multi-handle edge outlets (e.g. `If Condition` true/false handles) accurately.

### 🛡️ Forms Guarding & Navigation Security
- **Dirty State Tracking**: Prevents accidental tab changes in Settings by popping up confirmation alerts.
- **Navigation Interception**: Hooks into the Next.js router to prevent page-switching (e.g., to Dashboard) if the user has unsaved modifications.
- **Secure Account Deletion**: Requiring double confirmation—typing `"DELETE"` along with typing the user's active session email—backed by server-side verification.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2.9 (App Router) & React 19.2.4
- **Styling**: Tailwind CSS 3.4.17 (Custom color tokens mapped to CSS variables)
- **Database**: Neon PostgreSQL & Drizzle ORM
- **Authentication**: Better Auth (Cookie-based session client)
- **Real-time Service**: Supabase Realtime (Broadcast mode only)
- **Graph Engine**: @xyflow/react (React Flow v12)
- **Validation**: Zod (Dual client-side and server-side verification)

---

## 📁 Project Architecture

The codebase follows a **Feature-first / Clean Architecture** convention, structuring pages and actions under feature boundaries:

```text
src/
├── app/                  # Next.js App Router pages and API routes
├── components/           # Core design system and reusable UI components
├── db/                   # Drizzle ORM database schemas & index client
├── features/             # Business capability modules
│   ├── auth/             # Login, SignUp, settings forms, session context
│   ├── dashboard/        # Workflow list boards and analytics
│   └── workflow/         # Node engine, components, inspector panels, and import/export flows
└── lib/                  # Shared utility methods, auth clients, and configuration constants
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v20+
- **PostgreSQL Database** (e.g. Neon or local instance)

### 2. Environment Setup
Create a `.env` file in the root directory and populate the variables:

```env
# Database Connection
DATABASE_URL="postgresql://neondb_owner:password@ep-wandering-star.aws.neon.tech/neondb"

# Application Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Better Auth Configuration
BETTER_AUTH_SECRET="your_generate_secret_here"

# Supabase Client Credentials
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Migrations
Generate and push database tables to PostgreSQL using Drizzle:
```bash
# Push schema state to the database
npm run db:push

# Generate static migration files (optional)
npm run db:generate
```

### 5. Running the Application
Launch the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 6. Build for Production
Build the optimized production bundle:
```bash
npm run build
```

---

## 📝 Document Reference
- Detailed database schema designs: Check [DATABASE.md](./docs/DATABASE.md).
- Technical architectural design: Check [architecture.md](./architecture.md).
- Detailed component guidelines: Check [DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md).
- PRD specifications: Check [PRD.md](./docs/PRD.md).
- Implementation plan: Check [IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md).
- Progress report: Check [progress_report.md](./progress_report.md).
