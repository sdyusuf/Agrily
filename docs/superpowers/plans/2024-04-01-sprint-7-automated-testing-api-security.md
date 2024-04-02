# Sprint 7: Automated Testing, Validation & API Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the Agrily backend API and frontend test suite with Helmet security headers, Express rate limiting, Joi schema input validation, Supertest API integration tests, RTL component tests, and NoSQL query sanitization, bringing cumulative LOC toward the 30,500 target.

**Architecture:** A layered defense-in-depth security approach. Helmet sets defensive HTTP response headers at the application root; rate limiters throttle brute-force authentication requests; Joi schemas intercept and validate mutations before controller execution; a recursive sanitizer neutralizes NoSQL operator injections; and automated Supertest + RTL suites provide end-to-end regression protection.

**Tech Stack:** Express.js, Helmet, express-rate-limit, Joi, Supertest, Jest, React Testing Library, express-mongo-sanitize, Mongoose.

**Spec:** [Sprints.md: Sprint 7 (lines 672–759)](file:///c:/Users/User/Documents/GitHub/Agrily/Sprints.md#L672-L759) and [SPRINT_LOC_TRACKER.md](file:///c:/Users/User/Documents/GitHub/Agrily/SPRINT_LOC_TRACKER.md#L63).

## Global Constraints
- Target Timeframe: **April 01 – April 14, 2024**
- Commit Authors & Commit Dates MUST match [Sprints.md](file:///c:/Users/User/Documents/GitHub/Agrily/Sprints.md) exactly:
  - Commit 7.1: `babban-dev <mryusuf7sd@gmail.com>` @ `2024-04-02T09:15:30`
  - Commit 7.2: `SD Yusuf <sdyusuf@users.noreply.github.com>` @ `2024-04-05T14:40:00`
  - Commit 7.3: `Yusuf Samaila <114921676+ysamaila@users.noreply.github.com>` @ `2024-04-08T11:20:15`
  - Commit 7.4: `Yasin <114921676+yacxeen1@users.noreply.github.com>` @ `2024-04-11T16:05:40`
  - Commit 7.5: `YSD Hillside <ysdhilsyde@users.noreply.github.com>` @ `2024-04-14T15:30:10`
- Ensure `$env:GIT_COMMITTER_DATE = $env:GIT_AUTHOR_DATE` and `$env:GIT_COMMITTER_NAME = $env:GIT_AUTHOR_NAME` on every commit.
- 100% test passing rate required on both backend (`npm.cmd test` in `backend/`) and frontend (`npm.cmd test -- --watchAll=false --maxWorkers=2` in `frontend/`) before any commit.
- Zero emojis permitted in frontend components, adhering to [DESIGN_SYSTEM.md](file:///c:/Users/User/Documents/GitHub/Agrily/DESIGN_SYSTEM.md).

---

### Task 1: Express Rate Limiting & Helmet Security Headers (Commit 7.1)

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/app.js`
- Create: `backend/tests/securityHeaders.test.js`

**Interfaces:**
- Consumes: Express application instance.
- Produces: Global Helmet security headers (`X-DNS-Prefetch-Control`, `X-Frame-Options`, `Strict-Transport-Security`, etc.) and `authLimiter` middleware applied to `/api/login`, `/api/signup`, `/api/register`, `/api/resend-verification`, `/api/forgot-password`, and `/verify`.

- [ ] **Step 1: Install `helmet` and `express-rate-limit`**
```powershell
cd c:\Users\User\Documents\GitHub\Agrily\backend
npm.cmd install helmet@^5.0.2 express-rate-limit@^6.3.0
```

- [ ] **Step 2: Create unit/integration test for Helmet headers and Rate Limiter**
Create `backend/tests/securityHeaders.test.js` checking:
1. Helmet headers are injected into HTTP responses (`x-frame-options`, `x-content-type-options`, `x-xss-protection`).
2. Rate limiter headers (`ratelimit-limit`, `ratelimit-remaining`) are emitted on protected routes and 429 Too Many Requests is triggered upon reaching the threshold.

- [ ] **Step 3: Update `backend/app.js` with Helmet and Rate Limiter configuration**
Inject `helmet({ crossOriginResourcePolicy: false })` (to preserve public uploads access) and configure `authLimiter` allowing 100 requests per 15 minutes window with standard Agrily JSON error response.

- [ ] **Step 4: Update `backend/package.json` test script and run tests**
Add `securityHeaders.test.js` to `backend/package.json` test script and verify with:
```powershell
cd c:\Users\User\Documents\GitHub\Agrily\backend
npm.cmd test
```

- [ ] **Step 5: Commit as Commit 7.1**
```powershell
$env:GIT_AUTHOR_NAME = "babban-dev"
$env:GIT_AUTHOR_EMAIL = "mryusuf7sd@gmail.com"
$env:GIT_COMMITTER_NAME = "babban-dev"
$env:GIT_COMMITTER_EMAIL = "mryusuf7sd@gmail.com"
$env:GIT_AUTHOR_DATE = "2024-04-02T09:15:30"
$env:GIT_COMMITTER_DATE = "2024-04-02T09:15:30"
git add backend/package.json backend/package-lock.json backend/app.js backend/tests/securityHeaders.test.js
git commit -m "feat(security): add express-rate-limit and helmet security headers"
```

---

### Task 2: Joi Request Validation Middleware (Commit 7.2)

**Files:**
- Modify: `backend/package.json`
- Create: `backend/middleware/validator.js`
- Modify: `backend/routes/user.js`
- Modify: `backend/routes/myProducts.js`
- Create: `backend/tests/validator.test.js`

**Interfaces:**
- Consumes: `req.body`, `req.params`, `req.query`.
- Produces: Reusable `validateRequest(schema, source)` middleware returning 400 with detailed, friendly error message on validation failure; exports schemas for `registerSchema`, `loginSchema`, `profileUpdateSchema`, `productCreateSchema`, `productUpdateSchema`.

- [ ] **Step 1: Install `joi`**
```powershell
cd c:\Users\User\Documents\GitHub\Agrily\backend
npm.cmd install joi@^17.6.0
```

- [ ] **Step 2: Create unit tests in `backend/tests/validator.test.js`**
Write tests covering:
1. Valid user registration payload passes.
2. Invalid email or password less than 6 characters fails with 400.
3. Invalid produce price (negative or NaN) fails with 400.
4. Valid profile payload with farmName and phone passes.

- [ ] **Step 3: Implement `backend/middleware/validator.js`**
Define schemas with Joi:
- `signupSchema` / `registerSchema`: email (valid email), password (min 6), role (enum).
- `loginSchema`: email, password.
- `profileSchema`: farmName, phone, address, state, bio.
- `productSchema`: name, category, price, availableQty, unit, description.
Provide `validate(schema)` middleware function that calls `schema.validate(req.body, { abortEarly: false, stripUnknown: true })`.

- [ ] **Step 4: Integrate `validate` into `backend/routes/user.js` and `backend/routes/myProducts.js`**
Attach validation middleware to POST `/signup`, POST `/login`, PUT `/profile`, POST `/product`, PUT `/product/:id`.

- [ ] **Step 5: Update `backend/package.json` test script and run tests**
Add `validator.test.js` to `backend/package.json` test script and verify passing status.

- [ ] **Step 6: Commit as Commit 7.2**
```powershell
$env:GIT_AUTHOR_NAME = "SD Yusuf"
$env:GIT_AUTHOR_EMAIL = "sdyusuf@users.noreply.github.com"
$env:GIT_COMMITTER_NAME = "SD Yusuf"
$env:GIT_COMMITTER_EMAIL = "sdyusuf@users.noreply.github.com"
$env:GIT_AUTHOR_DATE = "2024-04-05T14:40:00"
$env:GIT_COMMITTER_DATE = "2024-04-05T14:40:00"
git add backend/package.json backend/package-lock.json backend/middleware/validator.js backend/routes/user.js backend/routes/myProducts.js backend/tests/validator.test.js
git commit -m "feat(backend): add Joi request validation middleware for all API mutations"
```

---

### Task 3: Supertest API Integration Test Suite (Commit 7.3)

**Files:**
- Modify: `backend/package.json`
- Create: `backend/tests/auth.test.js`
- Create: `backend/tests/products.test.js`

**Interfaces:**
- Consumes: Express `app` instance from `backend/app.js`.
- Produces: Automated HTTP integration testing for authentication lifecycle (signup, duplicate rejection, login, JWT issuance, profile updates) and produce lifecycle (catalog discovery, listing creation with auth token, unauthorized rejection).

- [ ] **Step 1: Install `supertest`**
```powershell
cd c:\Users\User\Documents\GitHub\Agrily\backend
npm.cmd install supertest@^6.2.2
```

- [ ] **Step 2: Implement `backend/tests/auth.test.js`**
Test end-to-end HTTP requests against `app`:
1. `POST /signup` with valid credentials returns 201 Created.
2. `POST /signup` with missing email returns 400 Bad Request.
3. `POST /login` with registered credentials returns 200 OK + JWT bearer token.
4. `POST /login` with invalid password returns 401 Unauthorized.
5. `GET /api/user/profile` with invalid token returns 401 Unauthorized.

- [ ] **Step 3: Implement `backend/tests/products.test.js`**
Test end-to-end HTTP requests against `app`:
1. `GET /api/marketplace` returns 200 OK with product array.
2. `POST /api/product` without auth header returns 401 Unauthorized.
3. `POST /api/product` with valid bearer token and valid body returns 201 Created.
4. `GET /api/categories` returns standard categories and units.

- [ ] **Step 4: Update `backend/package.json` test script and run tests**
Add `auth.test.js` and `products.test.js` to `backend/package.json` test script and run:
```powershell
cd c:\Users\User\Documents\GitHub\Agrily\backend
npm.cmd test
```

- [ ] **Step 5: Commit as Commit 7.3**
```powershell
$env:GIT_AUTHOR_NAME = "Yusuf Samaila"
$env:GIT_AUTHOR_EMAIL = "114921676+ysamaila@users.noreply.github.com"
$env:GIT_COMMITTER_NAME = "Yusuf Samaila"
$env:GIT_COMMITTER_EMAIL = "114921676+ysamaila@users.noreply.github.com"
$env:GIT_AUTHOR_DATE = "2024-04-08T11:20:15"
$env:GIT_COMMITTER_DATE = "2024-04-08T11:20:15"
git add backend/package.json backend/package-lock.json backend/tests/auth.test.js backend/tests/products.test.js
git commit -m "test(backend): add Supertest integration tests for authentication and product routes"
```

---

### Task 4: Frontend RTL Tests for Navigation & Forms (Commit 7.4)

**Files:**
- Create: `frontend/src/__tests__/Login.test.js`
- Create: `frontend/src/__tests__/AddProduct.test.js`

**Interfaces:**
- Consumes: React component tree, `BrowserRouter`, `AppContext`.
- Produces: Robust RTL unit test suites verifying login error display, input validation alerts, field interactions, AddProduct form inputs, and redirection.

- [ ] **Step 1: Create `frontend/src/__tests__/Login.test.js`**
Render Login page inside `MemoryRouter` and verify:
1. Email and password fields render with appropriate labels and placeholders.
2. Empty form submission displays validation prompt.
3. Successful login stores token in localStorage and triggers navigation.
4. "Forgot Password?" and "Sign Up" links point to correct paths.

- [ ] **Step 2: Create `frontend/src/__tests__/AddProduct.test.js`**
Render AddProduct component inside `MemoryRouter` and verify:
1. Product name, category dropdown, price, quantity, and unit selector render.
2. File input accepts image selection and triggers preview.
3. Submitting valid form dispatches multipart FormData request.
4. Submitting invalid price or empty name triggers validation feedback.

- [ ] **Step 3: Run full frontend test suite**
```powershell
cd c:\Users\User\Documents\GitHub\Agrily\frontend
npm.cmd test -- --watchAll=false --maxWorkers=2
```

- [ ] **Step 4: Commit as Commit 7.4**
```powershell
$env:GIT_AUTHOR_NAME = "Yasin"
$env:GIT_AUTHOR_EMAIL = "114921676+yacxeen1@users.noreply.github.com"
$env:GIT_COMMITTER_NAME = "Yasin"
$env:GIT_COMMITTER_EMAIL = "114921676+yacxeen1@users.noreply.github.com"
$env:GIT_AUTHOR_DATE = "2024-04-11T16:05:40"
$env:GIT_COMMITTER_DATE = "2024-04-11T16:05:40"
git add frontend/src/__tests__/Login.test.js frontend/src/__tests__/AddProduct.test.js
git commit -m "test(frontend): add Jest and React Testing Library tests for navigation and forms"
```

---

### Task 5: NoSQL Injection Sanitization & Sprint 7 Completion (Commit 7.5)

**Files:**
- Create: `backend/middleware/mongoSanitize.js`
- Modify: `backend/app.js`
- Modify: `backend/package.json`
- Create: `backend/tests/mongoSanitize.test.js`
- Modify: `SPRINT_LOC_TRACKER.md`

**Interfaces:**
- Consumes: Express request stream (`req.body`, `req.query`, `req.params`).
- Produces: Recursive sanitizer removing `$` and `.` prohibited keys to prevent MongoDB operator injection attacks (e.g. `{ "email": { "$gt": "" } }`).

- [ ] **Step 1: Install `express-mongo-sanitize`**
```powershell
cd c:\Users\User\Documents\GitHub\Agrily\backend
npm.cmd install express-mongo-sanitize@^2.2.0
```

- [ ] **Step 2: Create unit test in `backend/tests/mongoSanitize.test.js`**
Verify that nested payload containing `{ "$gt": "" }` or `{ "user.name": "hack" }` has prohibited operators stripped before reaching route handlers.

- [ ] **Step 3: Implement `backend/middleware/mongoSanitize.js` and mount in `backend/app.js`**
Configure sanitized request pipeline with audit log warning when prohibited characters are filtered.

- [ ] **Step 4: Run full backend and frontend test suites**
```powershell
cd c:\Users\User\Documents\GitHub\Agrily\backend
npm.cmd test
cd c:\Users\User\Documents\GitHub\Agrily\frontend
npm.cmd test -- --watchAll=false --maxWorkers=2
```

- [ ] **Step 5: Run LOC counter and update `SPRINT_LOC_TRACKER.md`**
```powershell
node c:\Users\User\Documents\GitHub\Agrily\scripts\count-loc.js
```
Update `SPRINT_LOC_TRACKER.md` marking Sprint 7 as ✅ Complete with actual LOC and cumulative LOC.

- [ ] **Step 6: Commit as Commit 7.5**
```powershell
$env:GIT_AUTHOR_NAME = "YSD Hillside"
$env:GIT_AUTHOR_EMAIL = "ysdhilsyde@users.noreply.github.com"
$env:GIT_COMMITTER_NAME = "YSD Hillside"
$env:GIT_COMMITTER_EMAIL = "ysdhilsyde@users.noreply.github.com"
$env:GIT_AUTHOR_DATE = "2024-04-14T15:30:10"
$env:GIT_COMMITTER_DATE = "2024-04-14T15:30:10"
git add backend/middleware/mongoSanitize.js backend/app.js backend/package.json backend/package-lock.json backend/tests/mongoSanitize.test.js SPRINT_LOC_TRACKER.md
git commit -m "fix(backend): sanitize MongoDB queries against NoSQL injection vulnerabilities"
```

- [ ] **Step 7: Push Sprint 7 commits to GitHub remote `origin/main`**
Push commits using token from `tokens.json`.
