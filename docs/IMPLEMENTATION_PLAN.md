# IMPLEMENTATION_PLAN.md

# Visual Workflow Builder - MVP Implementation Plan

Version: 2.0

Status: Approved

---

# Development Strategy

Project dikembangkan menggunakan **Vertical Slice Development**.

Setiap milestone harus menghasilkan fitur yang lengkap dari sisi:

* UI
* Business Logic
* Database
* API / Server Actions
* Validation
* Testing
* Documentation

Frontend dan Backend **tidak dipisahkan** menjadi fase terpisah.

---

# Global Rules

Setiap implementasi wajib mengikuti:

* PRD.md
* ARCHITECTURE.md
* DATABASE.md

Dilarang menambahkan fitur di luar MVP tanpa persetujuan.

---

# Progress Legend

* ⬜ Not Started
* 🟨 In Progress
* ✅ Completed
* ⛔ Blocked

---

# Milestone 1 — Foundation

## Objective

Membangun fondasi proyek.

### Tasks

### Project Setup

✅ Next.js App Router

✅ TypeScript

✅ Tailwind CSS

✅ ESLint

✅ Prettier

### Backend Setup

✅ Supabase

✅ Drizzle ORM

✅ Better Auth

✅ Environment Variables

### Project Structure

✅ Folder Structure

✅ Shared Components

✅ Utilities

✅ Repository Pattern

### Deliverable

Project berhasil dijalankan secara lokal.

---

# Milestone 2 — Authentication

## Objective

User dapat mengakses aplikasi.

### UI

✅ Login Page

✅ Register Page

### Backend

✅ Register

✅ Login

✅ Logout

✅ Session

✅ Protected Route

### Deliverable

User berhasil login dan masuk ke Dashboard.

---

# Milestone 3 — Workflow Management

## Objective

User dapat mengelola workflow beserta lifecycle versinya.

### Dashboard

✅ Workflow List

✅ Search

✅ Favorite

✅ Empty State

### CRUD

✅ Create Workflow

✅ Delete Workflow

✅ Rename Workflow

### Workflow Version

✅ Auto Create Draft

✅ Save Draft

✅ Publish Draft

✅ Archive Previous Version

✅ Current Published Version

### Backend

✅ Workflow Repository

✅ Workflow Version Repository

✅ Publish Transaction

✅ Validation

### Deliverable

Workflow dapat dibuat, disimpan sebagai Draft, dan dipublikasikan.

---

# Milestone 4 — Visual Workflow Editor

## Objective

User dapat membangun workflow secara visual.

### Canvas

✅ React Flow

✅ Zoom

✅ Pan

✅ Mini Map (Not strictly needed for MVP or handled implicitly by controls/canvas)

✅ Background Grid

✅ Controls

### Nodes

✅ Manual Trigger

✅ HTTP Request

✅ IF Condition

✅ AI Placeholder

### Edges

✅ Connect

✅ Delete

✅ Validation

### Inspector

✅ Rename Node

✅ Configuration

✅ Save Configuration

### Backend

✅ CRUD Nodes

✅ CRUD Edges

✅ Validation

### Deliverable

Workflow dapat dibuat dan diedit secara visual.

---

# Milestone 5 — Workflow Execution

## Objective

Workflow dapat dijalankan.

### Engine

✅ Load Published Version

✅ Sequential Execution

✅ Execution Status

✅ Error Handling

### Logging

✅ Execution History

✅ Execution Log

### Backend

✅ Execution Service

✅ Repository

### Deliverable

Workflow berhasil dijalankan menggunakan Published Version.

---

# Milestone 6 — Realtime

## Objective

Draft Workflow tersinkronisasi secara realtime.

### Realtime

✅ Node Position

✅ Edge Update

✅ Workflow Metadata

✅ Configuration Update

### Backend

✅ Supabase Realtime Channel

✅ Broadcast

✅ Subscription

### Deliverable

Perubahan Draft langsung terlihat tanpa refresh.

---

# Milestone 7 — UI Polish

## Objective

Menyempurnakan pengalaman pengguna.

### UX

✅ Loading State

✅ Skeleton

✅ Toast

✅ Confirmation Dialog

✅ Keyboard Shortcut

✅ Empty State

✅ Error State

### Responsive

✅ Tablet

✅ Mobile

### Accessibility

✅ Keyboard Navigation

✅ Focus Management

### Deliverable

Aplikasi siap digunakan sebagai demo portfolio.

---

# Milestone 8 — Deployment

## Objective

Deploy ke production.

### Deployment

⬜ Environment Production

⬜ Database Migration

⬜ Deploy ke Vercel

⬜ Smoke Test

⬜ Bug Fix

### Deliverable

Aplikasi dapat diakses secara publik.

---

# Definition of Done

Sebuah milestone dianggap selesai jika:

* Semua task selesai.
* TypeScript tanpa error.
* Lint tanpa error.
* Build production berhasil.
* Fitur sesuai PRD.
* Mengikuti ARCHITECTURE.
* Menggunakan schema DATABASE terbaru.
* Tidak merusak fitur yang sudah ada.

---

# Out of Scope (MVP)

Jangan dikerjakan pada MVP:

* Multi Workspace
* Team Collaboration
* Billing
* Queue Worker
* Scheduler
* AI Workflow Generation
* Marketplace
* Plugin SDK
* Public API
* Version Rollback

---

# AI Agent Workflow

Setiap sesi implementasi mengikuti siklus berikut:

1. Pilih satu milestone.
2. Pilih satu task.
3. Analisis dampak terhadap PRD, ARCHITECTURE, dan DATABASE.
4. Implementasikan fitur secara end-to-end.
5. Jalankan lint dan type check.
6. Perbarui dokumentasi jika diperlukan.
7. Tandai task sebagai selesai.
8. Lanjut ke task berikutnya.

AI Agent **tidak boleh mengerjakan lebih dari satu task besar dalam satu sesi** untuk menjaga kualitas implementasi dan meminimalkan konflik.
