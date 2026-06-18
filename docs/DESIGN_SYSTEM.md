# DESIGN_SYSTEM.md

# Visual Workflow Builder - Design System

Version: 1.0

Status: Approved

---

# 1. Purpose

Dokumen ini mendefinisikan aturan desain visual, pengalaman pengguna (UX), dan pola antarmuka yang harus diikuti selama pengembangan.

Tujuan utama:

- Menjaga konsistensi UI.
- Menjadi referensi utama AI Agent.
- Menghindari perbedaan desain antar halaman.
- Memastikan seluruh fitur terasa sebagai satu produk yang utuh.

Dokumen ini bukan spesifikasi pixel-perfect, tetapi kontrak implementasi UI.

---

# 2. Design Philosophy

Visual Workflow Builder harus memiliki karakteristik berikut:

- Modern
- Minimal
- Professional
- Developer-first
- Fast
- Clean
- Functional
- Dense but Readable

Prioritas utama adalah produktivitas pengguna, bukan dekorasi visual.

---

# 3. UI Inspiration

Referensi visual utama:

Primary

- Linear
- Figma

Secondary

- Notion
- Vercel Dashboard
- GitHub
- Raycast

Workflow Editor

- n8n
- React Flow

Google Stitch digunakan sebagai referensi:

- Layout
- Hierarchy
- Interaction

Bukan sebagai sumber implementasi kode.

---

# 4. Design Principles

## Clarity

Setiap elemen harus memiliki tujuan yang jelas.

Hindari elemen dekoratif yang tidak menambah nilai.

---

## Consistency

Gunakan pola yang sama di seluruh aplikasi.

Contoh:

- tombol
- dialog
- form
- spacing
- icon

harus konsisten.

---

## Simplicity

Lebih sedikit komponen lebih baik.

Utamakan pengalaman yang sederhana.

---

## Progressive Disclosure

Informasi kompleks hanya ditampilkan saat diperlukan.

Contoh:

Node configuration berada di Inspector,
bukan langsung di Node.

---

## Feedback

Setiap aksi pengguna harus memiliki feedback.

Contoh:

- loading
- success
- error
- confirmation

---

# 5. Color Strategy

Gunakan semantic color.

Bukan hardcoded color.

Kategori:

- Primary
- Secondary
- Accent
- Success
- Warning
- Error
- Muted

Implementasi mengikuti theme Tailwind/shadcn.

---

# 6. Typography

Hierarchy

H1

Page Title

---

H2

Section Title

---

H3

Card Title

---

Body

Default Text

---

Caption

Helper Text

---

Gunakan font bawaan aplikasi.

Prioritaskan readability.

---

# 7. Layout

Global Layout

Sidebar

↓

Header

↓

Content

↓

Optional Right Panel

---

Dashboard

Sidebar selalu terlihat pada Desktop.

Header berisi:

- Breadcrumb
- Search
- User Menu

Content menggunakan container yang konsisten.

---

Workflow Editor

Header

↓

Toolbar

↓

Canvas

↓

Inspector

---

Inspector berada di sisi kanan.

Canvas menjadi fokus utama.

---

# 8. Spacing

Gunakan spacing yang konsisten.

Jangan menggunakan nilai acak.

Ikuti skala Tailwind.

---

# 9. Components

Semua komponen menggunakan shadcn/ui jika tersedia.

Hindari membuat komponen custom apabila sudah tersedia.

---

## Button

Variant:

- Primary
- Secondary
- Outline
- Ghost
- Destructive

Ukuran:

- Small
- Default
- Large

---

## Card

Struktur:

Header

↓

Content

↓

Footer (optional)

---

## Dialog

Header

↓

Body

↓

Footer

---

## Dropdown

Gunakan untuk aksi sekunder.

Jangan menyembunyikan aksi utama di Dropdown.

---

## Badge

Digunakan untuk:

- Status
- Label
- Version

---

# 10. Forms

Urutan:

Label

↓

Input

↓

Helper Text

↓

Validation Error

Validation muncul di bawah input.

Placeholder bukan pengganti label.

---

# 11. Tables

Gunakan untuk data yang besar.

Aturan:

- Sticky Header
- Hover Row
- Compact
- Search
- Empty State

Pagination hanya jika diperlukan.

---

# 12. Empty State

Struktur:

Illustration / Icon

↓

Title

↓

Description

↓

Primary Action

Setiap halaman harus memiliki Empty State yang informatif.

---

# 13. Loading State

Prioritaskan Skeleton.

Gunakan Spinner hanya untuk proses singkat.

Jangan membekukan seluruh halaman saat loading.

---

# 14. Toast

Gunakan Toast untuk:

- Success
- Error
- Warning
- Information

Toast tidak boleh digunakan untuk error kritis.

---

# 15. Confirmation

Gunakan dialog konfirmasi untuk aksi destruktif.

Contoh:

- Delete Workflow
- Publish Workflow
- Reset Configuration

---

# 16. Icons

Gunakan Lucide Icons.

Aturan:

- Konsisten
- Mudah dikenali
- Tidak berlebihan

Ikon mendukung teks, bukan menggantikannya.

---

# 17. Workflow Editor

Canvas merupakan area utama aplikasi.

Canvas harus terasa ringan.

---

## Node

Node memiliki struktur:

Icon

↓

Title

↓

Description

↓

Status (optional)

Node harus mudah dikenali.

---

## Node Width

Gunakan ukuran yang konsisten.

Jangan berubah sesuai isi.

---

## Connection

Edge harus jelas terlihat.

Highlight saat dipilih.

---

## Selection

Node yang dipilih memiliki:

- Border aktif
- Shadow ringan

---

## Dragging

Saat drag:

- Shadow meningkat
- Cursor berubah
- Tidak ada lag

---

## Inspector

Inspector menampilkan:

- Nama Node
- Configuration
- Validation
- Metadata

Semua konfigurasi node dilakukan melalui Inspector.

---

# 18. Responsive

Strategi:

Desktop First

Tablet

Mobile

Workflow Editor dioptimalkan untuk Desktop.

Mobile hanya mendukung viewing sederhana pada MVP.

---

# 19. Accessibility

Wajib mendukung:

- Keyboard Navigation
- Focus Ring
- Screen Reader dasar
- Contrast yang baik

Jangan mengandalkan warna sebagai satu-satunya indikator status.

---

# 20. Motion

Gunakan animasi seperlunya.

Durasi:

150–250 ms

Animasi harus:

- Halus
- Cepat
- Tidak mengganggu

Hindari animasi berlebihan.

---

# 21. Error Experience

Setiap error harus:

- Menjelaskan masalah
- Menawarkan solusi jika memungkinkan
- Tidak menggunakan pesan teknis mentah

Contoh:

❌ "Unknown Error"

Lebih baik:

"Workflow gagal dipublikasikan. Silakan coba lagi."

---

# 22. UI Quality Checklist

Sebelum fitur dianggap selesai, pastikan:

- Konsisten dengan Design System.
- Menggunakan komponen reusable.
- Responsif.
- Memiliki Loading State.
- Memiliki Empty State.
- Memiliki Error State.
- Memiliki Success Feedback.
- Tidak ada layout shift.
- Mendukung keyboard dasar.

---

# 23. AI Agent Guidelines

Saat membuat UI baru, AI Agent harus:

1. Menggunakan komponen yang sudah ada.
2. Tidak membuat variasi desain baru tanpa alasan kuat.
3. Mengikuti layout global.
4. Menjaga konsistensi spacing.
5. Mengikuti prinsip Progressive Disclosure.
6. Memprioritaskan keterbacaan dibanding dekorasi.
7. Menggunakan Google Stitch sebagai referensi inspirasi, bukan implementasi langsung.
8. Mengutamakan pengalaman pengguna yang cepat, sederhana, dan profesional.

---

# 24. Future Evolution

Setelah MVP selesai, Design System dapat diperluas dengan:

- Dark / Light Theme
- Advanced Motion
- Component Tokens
- Design Tokens
- Figma Component Library
- Brand Identity
- Illustration System

Perluasan tersebut tidak boleh mengubah prinsip dasar yang telah ditetapkan pada dokumen ini.
