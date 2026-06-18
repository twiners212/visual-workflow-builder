# PRD.md

# Visual Workflow Builder

Version: 2.0

Status: Approved

---

# 1. Product Overview

## Product Name

Visual Workflow Builder

## Tagline

Build powerful workflows visually without writing code.

## Vision

Visual Workflow Builder adalah aplikasi berbasis web yang memungkinkan pengguna membangun automation workflow melalui editor visual berbasis node (drag-and-drop).

Produk dirancang dengan arsitektur modern yang mendukung versioning workflow, realtime collaboration, dan integrasi AI di masa depan tanpa mengubah fondasi sistem.

Fokus MVP adalah menyediakan pengalaman membangun, mengelola, dan menjalankan workflow secara stabil dan mudah digunakan.

---

# 2. Goals

## Primary Goals

* Membangun visual workflow editor yang intuitif.
* Menyediakan workflow versioning sejak awal.
* Menjalankan workflow secara konsisten menggunakan Published Version.
* Menyediakan realtime synchronization untuk Draft Workflow.
* Menjadi proyek portfolio yang menunjukkan kemampuan Full Stack Engineering, System Design, dan SaaS Architecture.

---

# 3. Target Users

Primary

* Software Developer
* Indie Hacker
* Freelancer
* Startup Founder

Secondary

* Small Team
* Internal Automation Team

---

# 4. Problem Statement

Banyak platform automation memiliki beberapa kekurangan:

* UI kompleks.
* Sulit dipelajari.
* Versioning kurang jelas.
* Sulit melakukan rollback.
* Workflow aktif dapat berubah saat sedang diedit.

Visual Workflow Builder menyelesaikan masalah tersebut dengan memisahkan proses editing dan execution melalui konsep Workflow Version.

---

# 5. Core Concepts

## Workflow

Workflow adalah container utama.

Workflow hanya menyimpan metadata.

Contoh:

* Judul
* Deskripsi
* Thumbnail
* Favorite

Workflow tidak menyimpan node secara langsung.

---

## Workflow Version

Workflow Version menyimpan struktur workflow yang sebenarnya.

Setiap perubahan dilakukan pada Draft Version.

Satu Workflow dapat memiliki banyak versi.

Status:

* Draft
* Published
* Archived

---

## Draft

Draft adalah versi yang sedang diedit.

Seluruh perubahan editor hanya memengaruhi Draft.

Draft tidak pernah digunakan untuk execution.

---

## Published

Published adalah versi yang aktif.

Semua execution menggunakan Published Version.

Published tidak dapat diedit secara langsung.

---

## Archived

Version lama disimpan sebagai arsip.

Dapat digunakan untuk rollback di masa depan.

---

## Execution

Execution adalah proses menjalankan workflow.

Execution selalu mengacu pada Workflow Version tertentu sehingga hasil execution tetap konsisten walaupun pengguna sedang melakukan editing.

---

# 6. User Flow

## Create Workflow

User membuat workflow baru

↓

Workflow dibuat

↓

Draft Version otomatis dibuat

↓

Editor terbuka

---

## Save Workflow

User melakukan perubahan

↓

Perubahan disimpan ke Draft Version

↓

Realtime memperbarui editor pengguna lain (future)

---

## Publish Workflow

User memilih Publish

↓

Draft menjadi Published

↓

Published lama menjadi Archived

↓

Workflow menunjuk Published terbaru sebagai Current Version

↓

Draft baru otomatis dibuat

---

## Execute Workflow

User menjalankan workflow

↓

System mengambil Published Version

↓

Execution dimulai

↓

Execution Log disimpan

---

# 7. MVP Scope

## Authentication

* Register
* Login
* Logout

---

## Dashboard

* Create Workflow
* Search Workflow
* Delete Workflow
* Favorite Workflow
* Recent Workflow

---

## Workflow Editor

* Drag Node
* Connect Node
* Delete Node
* Move Node
* Zoom
* Pan
* Mini Map

---

## Node Types

Trigger

* Manual Trigger

Action

* HTTP Request

Logic

* IF Condition

AI

* AI Prompt Node (placeholder, execution belum diimplementasikan pada MVP)

---

## Inspector

* Edit Node
* Edit Configuration
* Rename Node

---

## Workflow Version

* Create Draft
* Save Draft
* Publish Draft
* View Current Published Version

---

## Workflow Execution

* Manual Run
* Sequential Execution
* Execution Status
* Execution History
* Basic Error Handling

Execution selalu menggunakan Published Version.

---

## Realtime

Realtime hanya digunakan untuk Draft Workflow.

Mencakup:

* Node Position
* Edge Update
* Node Configuration
* Workflow Metadata

Database tetap menjadi source of truth.

---

# 8. Future Features

## AI

* Generate Workflow
* Explain Workflow
* Optimize Workflow
* AI Debugger

---

## Collaboration

* Live Cursor
* Presence Indicator
* Comments
* Multi User Editing

---

## Workflow

* Version History
* Rollback Version
* Duplicate Workflow
* Import / Export

---

## Integrations

* Slack
* Discord
* GitHub
* Email
* Google Drive
* Notion

---

## Engine

* Retry
* Delay
* Loop
* Parallel Execution
* Scheduler

---

## SaaS

* Workspace
* Team Member
* Permission
* Billing
* Marketplace

---

# 9. Out of Scope (MVP)

Fitur berikut tidak termasuk MVP:

* Multi Workspace
* Billing
* Plugin Marketplace
* Queue Worker
* Scheduler
* Mobile App
* AI Automation
* Public API

---

# 10. Functional Requirements

Pengguna harus dapat:

* membuat workflow
* membuat Draft Version
* mengedit Draft
* menyimpan Draft
* mempublikasikan Draft
* menjalankan Published Version
* melihat riwayat execution
* menghapus workflow

---

# 11. Non Functional Requirements

Performance

* Editor tetap responsif hingga ±200 node.
* Save Draft < 1 detik pada kondisi normal.

Security

* Authentication wajib.
* Workflow hanya dapat diakses pemiliknya.
* Published Version bersifat immutable.

Scalability

Arsitektur harus mendukung:

* Team Collaboration
* Queue Worker
* Plugin System
* Marketplace
* AI Integration

tanpa perubahan besar pada model data.

---

# 12. Success Metrics

MVP dianggap selesai apabila pengguna dapat:

* membuat workflow
* mengedit Draft Version
* menyimpan Draft
* mempublikasikan workflow
* menjalankan Published Version
* melihat hasil execution
* menggunakan editor secara responsif

---

# 13. Technology Decisions

Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* React Flow
* shadcn/ui

Backend

* Next.js Route Handlers
* Server Actions

Database

* Supabase PostgreSQL
* Drizzle ORM

Validation

* Zod

Authentication

* Better Auth

Storage

* Supabase Storage

Realtime

* Supabase Realtime

Deployment

* Vercel

AI

* Belum menjadi bagian dari MVP.

---

# 14. Product Principles

* Draft selalu dapat diedit.
* Published tidak dapat diedit.
* Execution selalu menggunakan Published Version.
* Database adalah source of truth.
* Realtime hanya menyinkronkan UI.
* Semua fitur harus mendukung pengembangan bertahap menuju produk SaaS.

---

# 15. Roadmap

Phase 1

Planning & Documentation

↓

Phase 2

Foundation

↓

Phase 3

Frontend Development

↓

Phase 4

Backend Development

↓

Phase 5

Integration

↓

Phase 6

Deployment

↓

Phase 7

Future Features
