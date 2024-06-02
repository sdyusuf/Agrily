# Agrily Agent Guidelines & Engineering Standards

All AI assistants, agents, and contributors working on the Agrily codebase MUST strictly adhere to the instructions below.

---

## 🎨 Mandatory Frontend UI Design Rule

**On EVERY prompt, query, or task involving the frontend (`frontend/`), UI components, styling, or page creation:**

1. **Mandatory Design System Consultation:**
   - You **MUST** read and adhere to the guidelines, color tokens, typography scales, component micro-interactions, and status pill standards defined in:
     👉 [DESIGN_SYSTEM.md](file:///c:/Users/User/Documents/GitHub/Agrily/DESIGN_SYSTEM.md)

2. **Core Visual Excellence Standards:**
   - **Never** use raw default browser styling or un-themed generic Bootstrap blue (`#0d6efd`) / pure red.
   - **Always** apply the curated Agrily brand color palette:
     - Lush Growth / Emerald: `#1b4332`, `#2d6a4f`, `#52b788`
     - Earth / Harvest Ochre: `#bc6c25`, `#dda15e`, `#fefae0`
     - Surface & Backgrounds: `#f8faf9`, `#ffffff`
     - Typography: Rich Slate (`#0f172a`, `#475569`)
   - **Tactile Micro-interactions:** Every card, button, and input MUST feature smooth hover lift (`translateY(-4px)`), soft shadows, and cubic-bezier transitions.
   - **Null & Auth State Safety:** Never assume user profile data or tokens exist. Always provide null-safe fallbacks (`user?.email || ''`) to prevent runtime crashes.
   - **Mobile-First Responsiveness:** All views must be tested and responsive across desktop, tablet, and mobile breakpoints (`< 768px`).

---

## 🛠️ Backend API Standards

1. **Authentication & JWT Security:**
   - Protected routes must verify bearer tokens via [auth.js](file:///c:/Users/User/Documents/GitHub/Agrily/backend/middleware/auth.js).
   - Never expose raw password hashes or sensitive internal keys.
2. **File Uploads:**
   - Image uploads must use Multer with file type validation (JPEG/PNG/WebP only) and maximum file size limits (5MB).
3. **Database Operations:**
   - Validate required fields on Mongoose models before database mutations.

---

## 🔄 Sprint Feature Branch & Merge Workflow (Fast-Forward Only)

All contributors and AI agents must follow the default PR integration workflow detailed in:
👉 [WORKFLOW.md](file:///c:/Users/User/Documents/GitHub/Agrily/WORKFLOW.md)

1. **Backdated Timestamps:** Every commit must have both `$env:GIT_AUTHOR_DATE` and `$env:GIT_COMMITTER_DATE` strictly set to the 2024 calendar according to [Sprints.md](file:///c:/Users/User/Documents/GitHub/Agrily/Sprints.md).
2. **Never Merge via GitHub Web UI:** Do not click "Merge", "Squash and merge", or "Rebase and merge" in GitHub web UI as this pollutes committer dates with current-day timestamps.
3. **Default Merge Protocol (Fast-Forward Only):**
   ```bash
   git fetch origin feat/sprint-XX
   git checkout main
   git merge --ff-only origin/feat/sprint-XX
   git push origin main
   ```

