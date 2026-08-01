# Implementation Plan - ThinkSoul LMS (Notion/AppFlowy Clone)

This plan outlines the architecture and phased approach for building an enterprise-grade, highly scalable Notion/AppFlowy clone specifically tailored for a Startup Incubation LMS.

## 🎯 Goal
Create a high-performance workspace where:
- **Founders** can log daily progress using a rich block-based editor.
- **Mentors/Admins** can oversee all projects, provide feedback, and manage the incubation flow.
- **Data** is stored securely with Zero-Trust principles (Supabase RLS).
- **Media** is handled via AWS S3 + CloudFront for cost-efficiency and global speed.

## 🏗️ Technical Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | `Next.js` (App Router) | SEO, speed, and modern developer experience. |
| **Editor** | `BlockNote.js` | Best-in-class React block editor; feels exactly like Notion. |
| **Database** | `Supabase` (PostgreSQL) | Handles Auth, RLS, and JSONB storage for blocks. |
| **Storage** | `AWS S3` + `CloudFront` | Industry standard for scalable, fast media storage. |
| **Security** | `Supabase RLS` | Enforces "Zero-Trust" access at the database level. |
| **Real-time** | `Supabase Realtime` | Instant sync for collaboration. |
| **Deploy** | `Hostinger` (Static) | Blazing fast, static-only hosting. |

---

## 🔒 Security & Architecture

### 1. Database Schema (Supabase)
- **`profiles`**: User metadata (ID, role: `founder`, `mentor`, `admin`).
- **`workspaces`**: Logical containers for projects.
- **`pages`**: Metadata for pages (title, icon, cover, `parent_id` for nesting).
- **`blocks`**: The actual content stored as `JSONB` for flexibility and scaling.

### 2. Zero-Trust Security
- **RLS (Row Level Security)**: Every query will be filtered by the database itself. A user cannot even "see" a page ID they don't own.
- **Admin Bypass**: Admins will use a `service_role` or a specific RLS policy that allows viewing all records for mentorship.
- **Presigned URLs**: AWS keys are **never** exposed to the frontend. Supabase Edge Functions will generate temporary upload links.

---

## 🛠️ Phase-by-Phase Roadmap

### Phase 1: Foundation & Security
- [ ] Initialize Next.js project with Tailwind CSS and TypeScript.
- [ ] Configure Supabase project and Auth (Email/Google).
- [ ] Create `profiles` table with Role-Based Access Control (RBAC).
- [ ] Implement initial RLS policies to protect user data.

### Phase 2: The Core Data Engine
- [ ] Create `workspaces`, `pages`, and `blocks` migrations.
- [ ] Set up the recursive page structure (parent-child relationships).
- [ ] Optimize PostgreSQL with B-Tree indexes for fast lookups.
- [ ] Enable Supabase Realtime for the `blocks` table.

### Phase 3: Notion-like Interface
- [ ] Build the **Recursive Sidebar**: Fetch and display page titles only for performance.
- [ ] Integrate **BlockNote.js**: Connect the editor to Supabase `blocks` table.
- [ ] Implement **Optimistic UI**: Character-level changes saved locally instantly, synced to DB in background.
- [ ] Global Search (CMD+K) using Supabase Full-Text Search.

### Phase 4: Media & AWS Integration
- [ ] Set up AWS S3 bucket and CloudFront distribution.
- [ ] Create a Supabase Edge Function to generate **S3 Presigned URLs**.
- [ ] Build the `MediaUploader` component to handle drag-and-drop uploads.
- [ ] Add Image/Video/Document block support in the editor.

### Phase 5: Admin & Mentor Oversight
- [ ] Build the **Admin Master Dashboard**.
- [ ] Implementation of the `mentor` role: Mentors can see specific assigned projects.
- [ ] **Feedback System**: Admins/Mentors can add "Comment Blocks" or "Task Blocks" directly to founder pages.
- [ ] Usage Analytics: Monitor project activity levels.

### Phase 6: Optimization & Multi-Platform
- [ ] Next.js static export configuration for Hostinger.
- [ ] Wrap with **Tauri** for Desktop (.exe/.dmg).
- [ ] Wrap with **Capacitor** for Mobile App (APK).
- [ ] Performance audit: Ensure 0 redundant API calls.

---

## 🧪 Verification Plan

### Automated Tests
- **Supabase Policies**: Verify that a user cannot access another user's `blocks` via direct API calls.
- **Edge Functions**: Test presigned URL generation and file upload.
- **Editor Sync**: Verify changes on one client reflect on another in <500ms.

### Manual Verification
- Test recursive page creation (nesting 5 levels deep).
- Test media upload (Image/Video) and verify they load via CloudFront.
- Check Admin visibility: Verify Admin can see Founder data but Founder cannot see Admin-only tables.

---

## ❓ Open Questions
1. **Real-time Collaboration**: Do we need multi-user simultaneous typing (Google Docs style) immediately, or is single-user editing with instant sync sufficient for V1?
2. **AWS Account**: Do you currently have an AWS account ready for S3/CloudFront, or should we start with Supabase Storage for the prototype?
3. **Admin Dashboard**: Should mentors have their own dashboard, or should they just have "elevated access" within the main UI?
