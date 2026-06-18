# DATABASE.md

# Visual Workflow Builder - Database Design

## 1. Purpose

Dokumen ini mendefinisikan struktur database utama untuk aplikasi Visual Workflow Builder.

Database dirancang untuk mendukung versioning workflow, execution history, serta pengembangan bertahap dari MVP menuju aplikasi production.

---

# 2. Database Engine

* PostgreSQL (Supabase)
* Drizzle ORM
* Drizzle Kit Migration

---

# 3. Design Principles

* UUID sebagai Primary Key.
* PostgreSQL sebagai source of truth.
* Workflow bersifat immutable setelah dipublikasikan.
* Seluruh perubahan workflow dilakukan pada Draft Version.
* Execution selalu mengacu pada Workflow Version, bukan Workflow.
* Semua tabel memiliki `created_at` dan `updated_at`.
* Gunakan foreign key dan cascade delete sesuai kebutuhan.

---

# 4. Entity Relationship

```text
User
 │
 └──────────────────┐
                    │
                    ▼
                Workflow
                    │
                    ▼
            Workflow Version
                    │
          ┌─────────┼─────────┐
          │         │         │
          ▼         ▼         ▼
        Node      Edge    Execution
                              │
                              ▼
                        Execution Log
```

Execution menyimpan `workflow_id` sebagai denormalized field untuk kemudahan query.

Relasi utama adalah Execution → Workflow Version.

---

# 5. Tables

## users

Menyimpan akun pengguna.

Fields

* id
* name
* email
* image
* created_at
* updated_at

Relationship

```
User

↓

Many Workflows
```

---

## workflows

Workflow adalah entitas utama.

Workflow **tidak menyimpan node**.

Workflow hanya menyimpan metadata.

Fields

* id
* user_id
* title
* description
* thumbnail
* current_version_id
* is_favorite
* created_at
* updated_at

Relationship

```
Workflow

↓

Many Workflow Versions

↓

Many Executions
```

---

## workflow_versions

Menyimpan seluruh versi workflow.

Contoh

```
Workflow A

↓

v1

↓

v2

↓

v3

↓

Draft
```

Fields

* id
* workflow_id
* version_number
* status
* published_at
* created_at
* updated_at

Status

* draft
* published
* archived

Satu workflow hanya boleh memiliki:

* satu Draft
* satu Published

Version lama akan berubah menjadi Archived.

---

## nodes

Node dimiliki oleh Workflow Version.

Fields

* id
* workflow_version_id
* type
* name
* position_x
* position_y
* configuration (JSON)
* created_at
* updated_at

Type

* trigger
* action
* logic
* ai

---

## edges

Fields

* id
* workflow_version_id
* source_node_id
* target_node_id
* label
* created_at

---

## executions

Execution selalu mengacu pada versi tertentu.

Bukan workflow.

Ini sangat penting.

Fields

* id
* workflow_id
* workflow_version_id
* status
* started_at
* finished_at
* duration

Status

* pending
* running
* success
* failed

Dengan demikian riwayat execution tidak berubah walaupun user mengedit workflow.

---

## execution_logs

Fields

* id
* execution_id
* node_id
* status
* message
* started_at
* finished_at

---

## assets

Digunakan untuk:

* thumbnail
* export
* import

Fields

* id
* user_id
* filename
* mime_type
* storage_path

---

# 6. Relationships

```
User

1

↓

Many

Workflow
```

```
Workflow

1

↓

Many

Workflow Version
```

```
Workflow Version

1

↓

Many

Nodes
```

```
Workflow Version

1

↓

Many

Edges
```

```
Workflow Version

1

↓

Many

Execution
```

```
Execution

1

↓

Many

Execution Logs
```

---

# 7. Version Lifecycle

Workflow dibuat

↓

Draft Version dibuat

↓

User mengedit Draft

↓

Publish

↓

Draft menjadi Published

↓

Published lama menjadi Archived

↓

Draft baru otomatis dibuat

Dengan pendekatan ini pengguna selalu mengedit Draft tanpa memengaruhi workflow yang sedang aktif.

---

# 8. Delete Strategy

Menghapus Workflow akan menghapus:

* Workflow Versions
* Nodes
* Edges
* Executions
* Execution Logs

Gunakan cascade delete.

---

# 9. Index Strategy

users

* email

workflows

* user_id
* current_version_id

workflow_versions

* workflow_id
* status
* version_number

nodes

* workflow_version_id

edges

* workflow_version_id

executions

* workflow_version_id
* status

execution_logs

* execution_id

---

# 10. JSON Usage

JSON hanya digunakan pada:

nodes.configuration

Karena konfigurasi setiap jenis node berbeda.

Contoh

HTTP Node

```json
{
  "url": "...",
  "method": "POST"
}
```

AI Node

```json
{
  "prompt": "...",
  "model": "..."
}
```

---

# 11. Naming Convention

* snake_case
* UUID primary key
* foreign key menggunakan *_id
* UTC timestamp
* Plural table name

---

# 12. Future Tables

Belum termasuk MVP.

* workspaces
* workspace_members
* templates
* integrations
* schedules
* queue_jobs
* ai_requests
* api_keys
* comments
* notifications

---

# 13. Migration Rules

* Semua perubahan schema melalui Drizzle Migration.
* Migration bersifat incremental.
* Migration tidak diubah setelah dipublikasikan.

---

# 14. Database Principles

* Workflow adalah container.
* Workflow Version adalah sumber konfigurasi.
* Node selalu dimiliki Workflow Version.
* Execution selalu berjalan berdasarkan Workflow Version.
* Realtime hanya menyinkronkan UI.
* PostgreSQL tetap menjadi source of truth.

---

# 15. Scalability

Model ini dirancang agar mendukung:

* Version History
* Rollback
* Publish Workflow
* Team Collaboration
* Workflow Approval
* Scheduled Execution
* Queue Worker
* Marketplace
* AI Automation

tanpa mengubah struktur inti database.
