# ARCHITECTURE.md

# Visual Workflow Builder - System Architecture

Version: 2.0

Status: Approved

---

# 1. Purpose

Dokumen ini menjelaskan arsitektur teknis aplikasi Visual Workflow Builder.

Tujuan utama dokumen ini adalah menjadi referensi tunggal mengenai bagaimana sistem dibangun, bagaimana setiap layer berinteraksi, serta keputusan arsitektur yang harus diikuti selama pengembangan.

Dokumen ini harus selalu konsisten dengan:

* PRD.md
* DATABASE.md

---

# 2. Architecture Principles

Project mengikuti prinsip berikut.

* Feature-first Architecture
* Clean Architecture
* Server-first
* Type-safe
* Modular
* Stateless Backend
* Progressive Enhancement
* Reusable Components
* Separation of Concerns

---

# 3. Technology Stack

## Frontend

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* React Flow
* shadcn/ui

---

## Backend

* Next.js Route Handlers
* Server Actions

Backend bertanggung jawab terhadap:

* Authentication
* Validation
* Business Rules
* Database Access

---

## Database

Neon PostgreSQL

Database merupakan source of truth untuk seluruh data aplikasi.

---

## ORM

Drizzle ORM

Drizzle Kit Migration

---

## Validation

Zod

Digunakan untuk validasi pada Client dan Server.

---

## Authentication

Better Auth

Session berbasis Cookie.

Authorization dilakukan pada setiap request.

---

## Storage

Supabase Storage

Digunakan untuk:

* Thumbnail
* Avatar
* Import
* Export

---

## Realtime

Supabase Realtime

Realtime hanya digunakan untuk sinkronisasi UI.

Business logic tetap dijalankan melalui backend.

---

## Deployment

Frontend

Vercel

Database

Neon

---

# 4. High-Level Architecture

```text
Browser
    │
    ▼
Next.js App
    │
    ▼
Server Actions / Route Handlers
    │
    ▼
Domain Services
    │
    ▼
Repositories
    │
    ▼
Neon PostgreSQL
```

Realtime

```text
Supabase

↓

Realtime Channel

↓

Browser
```

Realtime tidak boleh menggantikan backend.

---

# 5. Layer Responsibilities

## Presentation Layer

Bertanggung jawab terhadap:

* UI
* Form
* React Flow
* Interaction

Tidak boleh berisi business logic.

---

## Application Layer

Bertanggung jawab terhadap:

* Server Actions
* Route Handlers
* Authentication
* Authorization

Mengatur alur request.

---

## Domain Layer

Berisi aturan bisnis.

Contoh:

* Publish Workflow
* Create Draft
* Execute Workflow
* Validation Rule

Layer ini tidak mengetahui framework.

---

## Infrastructure Layer

Berisi:

* Database
* Storage
* Realtime
* External API

---

# 6. Feature Modules

Setiap feature memiliki struktur yang sama.

```text
features/

auth/

dashboard/

workflow/

editor/

execution/
```

Setiap feature dapat memiliki:

```text
components/

server/

hooks/

schemas/

types/

services/
```

Feature tidak boleh saling mengakses database secara langsung.

Semua akses data melalui Repository.

---

# 7. Domain Model

## Workflow

Workflow adalah container utama.

Workflow hanya menyimpan metadata.

Workflow tidak memiliki Node secara langsung.

---

## Workflow Version

Workflow Version menyimpan struktur workflow.

Workflow Version memiliki:

* Nodes
* Edges

Status:

* Draft
* Published
* Archived

---

## Node

Node adalah instance dari sebuah jenis node.

Node hanya dimiliki oleh Workflow Version.

Node menyimpan:

* posisi
* konfigurasi
* metadata

---

## Edge

Menghubungkan dua Node.

Edge hanya dimiliki oleh Workflow Version.

---

## Execution

Execution selalu dijalankan berdasarkan Workflow Version.

Execution tidak pernah dijalankan berdasarkan Draft.

---

# 8. Workflow Lifecycle

Workflow dibuat

↓

Draft dibuat

↓

User mengedit Draft

↓

Save Draft

↓

Publish

↓

Draft menjadi Published

↓

Published lama menjadi Archived

↓

Draft baru otomatis dibuat

↓

Execution menggunakan Published Version

---

# 9. Data Flow

## Save Draft

```text
Editor

↓

Server Action

↓

Validation

↓

Repository

↓

Supabase

↓

Realtime

↓

UI Update
```

---

## Publish Workflow

```text
Publish

↓

Create Transaction

↓

Archive Published

↓

Publish Draft

↓

Update Current Version

↓

Commit
```

Publish harus bersifat atomic.

---

## Execute Workflow

```text
Run Workflow

↓

Get Published Version

↓

Load Nodes

↓

Load Edges

↓

Execute

↓

Save Logs

↓

Update Status
```

Execution tidak boleh membaca Draft.

---

# 9.1. Execution Engine

## Graph Traversal

Execution engine menjalankan node secara sequential berdasarkan topological order dimulai dari Trigger Node.

Trigger Node

↓

Follow Outgoing Edges

↓

Execute Next Node

↓

Repeat Until No Outgoing Edges

---

## IF Condition Branching

IF Condition Node menghasilkan dua outgoing edge:

* `true` — dijalankan jika kondisi terpenuhi.
* `false` — dijalankan jika kondisi tidak terpenuhi.

Edge dibedakan berdasarkan `edges.label`.

---

## Terminal Conditions

Execution berhenti ketika:

* Node tidak memiliki outgoing edge.
* Node menghasilkan error dan tidak ada error handler.
* Semua branch telah selesai dijalankan.

---

## Constraints

* Hanya satu Trigger Node per workflow.
* Workflow tanpa Trigger Node tidak dapat dijalankan.
* Circular reference tidak diizinkan.

---

# 10. Realtime Strategy

Realtime hanya menyinkronkan Draft.

Yang disinkronkan:

* Node Position
* Edge
* Node Configuration
* Workflow Metadata

Realtime tidak digunakan untuk:

* Publish
* Execute
* Authentication
* Business Logic

Database tetap menjadi source of truth.

---

# 11. Validation Strategy

Semua input divalidasi dua kali.

Client

↓

Zod

↓

Server

↓

Zod

↓

Database

Tidak ada request yang langsung masuk ke database.

---

# 12. Error Handling

Kategori error:

* Validation
* Authentication
* Authorization
* Database
* Unexpected

Semua response memiliki format yang konsisten.

---

# 13. Security

Semua endpoint wajib:

* Verify Session
* Verify Ownership
* Validate Input

Workflow hanya dapat diakses oleh pemiliknya.

Draft dan Published memiliki aturan akses yang sama.

---

# 14. Performance Strategy

Target:

* ±200 Node tetap responsif.
* Editor tidak melakukan unnecessary re-render.
* Lazy Loading pada feature besar.
* Query database seminimal mungkin.

---

# 15. AI Integration

AI bukan bagian dari MVP.

AI hanya dipanggil ketika user meminta.

Contoh:

* Generate Workflow
* Explain Workflow
* Optimize Workflow

AI diakses melalui abstraction layer.

```text
AI Service

↓

Provider

↓

Response
```

Provider dapat diganti tanpa mengubah domain.

---

# 16. Future Worker Architecture

Belum termasuk MVP.

Ketika workflow menjadi kompleks.

```text
Browser

↓

Next.js

↓

Redis Queue

↓

Worker

↓

Execution Engine

↓

Database
```

Worker bertanggung jawab terhadap:

* Retry
* Delay
* Scheduler
* Long Running Task

---

# 17. Coding Standards

* TypeScript Strict
* Hindari any
* Functional Component
* Named Export
* Feature-first Folder
* Business Logic tidak berada di UI
* Repository Pattern untuk database
* Domain Service untuk business rule

---

# 18. Architecture Decision Records

## ADR-001

Framework

Next.js Full Stack

Accepted

---

## ADR-002

Database

Neon PostgreSQL

Accepted

---

## ADR-003

Authentication

Better Auth

Accepted

---

## ADR-004

Realtime

Supabase Realtime

Accepted

---

## ADR-005

Workflow menggunakan Versioning.

Accepted

---

## ADR-006

Execution selalu menggunakan Published Version.

Accepted

---

## ADR-007

Workflow Editor hanya mengedit Draft Version.

Accepted

---

## ADR-008

Repository Pattern digunakan untuk seluruh akses database.

Accepted

---

## ADR-009

Business Rules berada pada Domain Service.

Accepted

---

## ADR-010

AI bukan bagian dari MVP.

Accepted
