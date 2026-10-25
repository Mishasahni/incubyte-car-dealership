# Requirements — Car Dealership Inventory System

Status: **Revision 2 for review** (planning stage, 2026-10-24 ~22:10 IST). Nothing described here has been implemented or verified yet.

Submission deadline (provided by the user; not stated in the assignment): **25 October 2026, 10:00 PM IST**.

Source of truth: *TDD Kata: Car Dealership Inventory System* (`AI_Kata_Car_Dealership_Inventory_System_V2.docx`, Incubyte Software Craftsperson Apprenticeship), plus the project decisions the user confirmed on 2026-10-24. Where this document goes beyond the assignment, it says so.

## 0. How to read this document

Every requirement is tagged with its origin:

| Tag | Meaning |
|---|---|
| **A** | Stated explicitly in the assignment. Mandatory. |
| **D** | *Derived*: not worded in the assignment, but follows necessarily from it (e.g. "Admin only" implies a role check). Mandatory. |
| **C** | *Confirmed project decision* by the user — our chosen interpretation where the assignment is silent or ambiguous. Mandatory for this project. |
| **U** | From the user's planning brief (e.g. secure password hashing, concurrency safety), not from the assignment. Mandatory for this project. |
| **P** | *Documented default* for a routine choice the assignment leaves open (request shapes, validation limits, etc.). Adopted unless the reviewer objects; listed in §10. |
| **OPT** | Optional enhancement. Not built until all mandatory functionality and deliverables are complete. |

Requirement IDs (e.g. `REQ-VEH-02`) are referenced from `docs/TEST_PLAN.md` and `docs/DEVELOPMENT_PLAN.md`.

What the assignment does **not** state: a deadline, a scoring rubric, how admin users are created, request/response formats, status codes, search semantics, a category list, or how much a purchase/restock changes stock. The deadline came from the user; the rest are covered by confirmed decisions (C) or documented defaults (P) in §10.

---

## 1. Mandatory functional requirements — Backend

### 1.1 Platform and persistence

| ID | Requirement | Tag |
|---|---|---|
| REQ-BE-01 | A RESTful backend API built with one of: Node.js/TypeScript (Express/NestJS), Python (Django/FastAPI), or Ruby (Rails). This project uses **Python + FastAPI** (an allowed option). | A |
| REQ-DB-01 | The application must connect to a real database (e.g. PostgreSQL, MongoDB, SQLite). **An in-memory database is not sufficient.** This project uses **PostgreSQL**. Data must survive a backend restart. | A |

### 1.2 Authentication and roles

| ID | Requirement | Tag |
|---|---|---|
| REQ-AUTH-01 | Users must be able to **register** via `POST /api/auth/register`. | A |
| REQ-AUTH-02 | Users must be able to **log in** via `POST /api/auth/login`. | A |
| REQ-AUTH-03 | Token-based authentication (JWT) must secure the protected endpoints. **All** `/api/vehicles…` endpoints (vehicle and inventory) require authentication. | A |
| REQ-AUTH-04 | **Admin only, as stated in the assignment**: `DELETE /api/vehicles/:id` and `POST /api/vehicles/:id/restock`. The system therefore needs two roles, *admin* and *regular user*, enforced on the server. | A (endpoints) + D (roles) |
| REQ-AUTH-05 | **Admin only, as our chosen interpretation**: `POST /api/vehicles` (add) and `PUT /api/vehicles/:id` (update). The assignment's backend section only marks these "Protected", but its frontend section gives the add/update/delete forms to admin users only. We read that as the intended permission model and enforce it on the server. The README will state this interpretation explicitly. | C |
| REQ-AUTH-06 | Admin accounts are created **only** by a small, documented, idempotent command-line script that prompts for the password securely (not as a command-line argument, never echoed or logged). **No public endpoint can grant admin privileges.** | C |

Resulting permission matrix:

| Endpoint | Unauthenticated | Regular user | Admin | Basis |
|---|---|---|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | ✅ | ✅ | ✅ | A |
| `GET /api/vehicles` | ❌ 401 | ✅ | ✅ | A |
| `GET /api/vehicles/search` | ❌ 401 | ✅ | ✅ | A |
| `POST /api/vehicles/:id/purchase` | ❌ 401 | ✅ | ✅ | A |
| `POST /api/vehicles` | ❌ 401 | ❌ 403 | ✅ | **C** (REQ-AUTH-05) |
| `PUT /api/vehicles/:id` | ❌ 401 | ❌ 403 | ✅ | **C** (REQ-AUTH-05) |
| `DELETE /api/vehicles/:id` | ❌ 401 | ❌ 403 | ✅ | **A** (REQ-AUTH-04) |
| `POST /api/vehicles/:id/restock` | ❌ 401 | ❌ 403 | ✅ | **A** (REQ-AUTH-04) |

### 1.3 Vehicle data

| ID | Requirement | Tag |
|---|---|---|
| REQ-VEH-01 | Each vehicle must have a **unique ID, make, model, category, price, and quantity in stock**. | A |

### 1.4 Vehicle endpoints (all require authentication)

| ID | Endpoint | Assignment wording | Access |
|---|---|---|---|
| REQ-VEH-02 | `POST /api/vehicles` | Add a new vehicle. | Admin (C, REQ-AUTH-05) |
| REQ-VEH-03 | `GET /api/vehicles` | View a list of all available vehicles. | Any authenticated user |
| REQ-VEH-04 | `GET /api/vehicles/search` | Search for vehicles by make, model, category, or price range. | Any authenticated user |
| REQ-VEH-05 | `PUT /api/vehicles/:id` | Update a vehicle's details. | Admin (C, REQ-AUTH-05) |
| REQ-VEH-06 | `DELETE /api/vehicles/:id` | Delete a vehicle (Admin only). | Admin (A, REQ-AUTH-04) |

### 1.5 Inventory endpoints (all require authentication)

| ID | Endpoint | Assignment wording | Access |
|---|---|---|---|
| REQ-INV-01 | `POST /api/vehicles/:id/purchase` | Purchase a vehicle, decreasing its quantity. | Any authenticated user |
| REQ-INV-02 | `POST /api/vehicles/:id/restock` | Restock a vehicle, increasing its quantity (Admin only). | Admin (A, REQ-AUTH-04) |

### 1.6 Derived and brief-sourced backend requirements

| ID | Requirement | Tag | Reason |
|---|---|---|---|
| DR-01 | Protected endpoints reject requests with a missing, malformed, expired, or forged token (**401**). | D | Needed for REQ-AUTH-03 to mean anything. |
| DR-02 | An authenticated non-admin calling an admin-only endpoint is rejected (**403**) and no data changes. | D | Needed for REQ-AUTH-04/05. |
| DR-03 | A purchase must never take quantity below zero; purchasing a vehicle with zero stock is rejected (**409**) and stock stays at 0. | D | "Decreasing its quantity" plus the frontend rule that purchase is disabled at zero. |
| DR-04 | Operations on a vehicle ID that does not exist return **404** and change nothing. | D | Basic REST correctness for `:id` routes. |
| DR-05 | Invalid input is rejected (**422**) with no data change: required text fields non-empty, price positive, quantity a non-negative integer, restock amount a positive integer. | D | Data integrity of REQ-VEH-01. Limits in §3. |
| DR-06 | Public registration always creates a regular user; any client-supplied role is ignored. | D + C | Otherwise REQ-AUTH-04/05 are meaningless. |
| DR-07 | Passwords are stored only as salted hashes from a slow, purpose-built algorithm (Argon2 or bcrypt). Hashes and plaintext passwords never appear in any API response, script output, or log. | U | "Secure password hashing" in the brief. |
| DR-08 | Stock changes are atomic: concurrent purchases cannot oversell, and concurrent purchase/restock cannot lose updates. | U | "Concurrent purchases where relevant" in the brief; follows from DR-03 in a multi-user system. |
| DR-09 | Data persists in PostgreSQL across application restarts. | A | Restatement of REQ-DB-01 as a testable property. |

---

## 2. API contract (documented defaults)

The assignment defines paths, methods, and purposes only. The bodies, responses, and status codes below are **documented defaults (P)** except where tagged C. They are the single contract the tests and frontend are built against.

Conventions:
- JSON request and response bodies.
- `Authorization: Bearer <token>` on all `/api/vehicles…` endpoints.
- Errors use FastAPI's default shape `{"detail": ...}`.
- Status codes:

| Code | Used for |
|---|---|
| 200 | Successful read, update, purchase, restock, login. |
| 201 | Successful register, vehicle create. |
| 204 | Successful delete (no body). |
| 401 | Missing/invalid/expired token; wrong login credentials. |
| 403 | Authenticated but not an admin, on an admin-only endpoint. |
| 404 | Vehicle ID does not exist. |
| 409 | Email already registered; purchase of an out-of-stock vehicle. |
| 422 | Request validation failure (body, query, or path — e.g. non-integer ID). |

- Precedence: authentication (401) and authorisation (403) are checked before the vehicle lookup (404). The exact interaction with FastAPI's request validation (422) will be confirmed by a test when implemented (API-AUTHZ-12); it is not assumed here.
- Vehicle IDs are auto-increment integers.

### 2.1 `POST /api/auth/register` — public

| | |
|---|---|
| Request | `{ "email": string, "password": string }` |
| Success | **201** `{ "id", "email", "role": "user" }` — no password, no hash. |
| Errors | **422** invalid email, missing field, or password outside 8–128 characters. **409** email already registered (case-insensitive). |
| Rules | Any `role` field sent by the client is ignored; new accounts are always `user` (DR-06). Registration does not return a token; the frontend logs in immediately afterwards. |

### 2.2 `POST /api/auth/login` — public

| | |
|---|---|
| Request | `{ "email": string, "password": string }` (JSON, not OAuth2 form data). Email matched case-insensitively. |
| Success | **200** `{ "access_token": string, "token_type": "bearer", "user": { "id", "email", "role" } }` |
| Errors | **401** with the same generic message for unknown email and wrong password (no account enumeration). **422** missing fields. |

### 2.3 `POST /api/vehicles` — admin only (C)

| | |
|---|---|
| Request | `{ "make": string, "model": string, "category": string, "price": number, "quantity": integer }` |
| Success | **201** full vehicle including generated `id`. A client-supplied `id` is ignored. |
| Errors | 401, 403, 422. |

### 2.4 `GET /api/vehicles` — authenticated

| | |
|---|---|
| Success | **200** JSON array of **all** vehicles, including those with quantity 0 (may be empty). |
| Rationale | "All available vehicles" is read as "all vehicles in the inventory": the frontend must show a *disabled* Purchase button for zero-stock vehicles, which is only possible if they are listed. |

### 2.5 `GET /api/vehicles/search` — authenticated

| | |
|---|---|
| Query parameters | `make`, `model`, `category`, `min_price`, `max_price` — all optional. |
| Semantics | `make`/`model`: case-insensitive substring match. `category`: case-insensitive exact match. Price bounds inclusive. Multiple parameters combine with AND. No parameters returns all vehicles (same as the list). Input is matched literally (SQL wildcards `%` and `_` are escaped). |
| Success | **200** array (possibly empty), including zero-stock vehicles that match. |
| Errors | 401; **422** for negative or non-numeric prices, or `min_price > max_price`. |
| Routing note | `/api/vehicles/search` must not be captured by an `/{id}` route. No `GET /api/vehicles/:id` is required, so there is no conflict; a test still guards it. |

### 2.6 `PUT /api/vehicles/:id` — admin only (C)

| | |
|---|---|
| Request | All five fields, as for create (full replacement). `quantity` may be set to any integer ≥ 0 — safe because PUT is admin-only, like restock. |
| Success | **200** updated vehicle. The `id` cannot be changed. |
| Errors | 401, 403, 404, 422. On any error the vehicle is unchanged. |

### 2.7 `DELETE /api/vehicles/:id` — admin only (A)

| | |
|---|---|
| Success | **204** no body. The vehicle no longer appears in list or search. |
| Errors | 401, 403 (vehicle not deleted), 404. |

### 2.8 `POST /api/vehicles/:id/purchase` — authenticated

| | |
|---|---|
| Request | No body. Each request purchases **exactly one unit**. |
| Success | **200** updated vehicle with quantity reduced by 1. |
| Errors | 401, 404, **409** out of stock (quantity unchanged at 0). |

### 2.9 `POST /api/vehicles/:id/restock` — admin only (A)

| | |
|---|---|
| Request | `{ "quantity": integer ≥ 1 }` — the number of units to **add**. |
| Success | **200** updated vehicle with quantity increased by that amount. |
| Errors | 401, 403 (unchanged), 404, 422 (missing, zero, negative, or non-integer amount). |

---

## 3. Data requirements

### 3.1 Vehicle (REQ-VEH-01)

| Field | Type | Constraints |
|---|---|---|
| `id` | integer, primary key, auto-generated | Unique (A). Not client-settable. |
| `make` | text | Required, trimmed, 1–100 characters. |
| `model` | text | Required, trimmed, 1–100 characters. |
| `category` | text | Required, trimmed, 1–50 characters. Free text (no fixed list, which would be an invented requirement). |
| `price` | `NUMERIC(12,2)` | Required, > 0. Exact decimal, never float. Displayed with two decimals; currency symbol set in one frontend constant (default ₹ / INR — display only, the assignment names no currency). |
| `quantity` | integer | Required, ≥ 0. Enforced by a database `CHECK` constraint as well as API validation. |
| `created_at`, `updated_at` | timestamp | P, for auditability; not required. |

Two vehicles may share make and model (no extra uniqueness constraint).

### 3.2 User (derived from REQ-AUTH-01/02/04)

| Field | Type | Constraints |
|---|---|---|
| `id` | integer, primary key | Unique. |
| `email` | text | Required, valid email format, stored lower-cased, unique. |
| `password_hash` | text | Never exposed. |
| `role` | `user` \| `admin` | Defaults to `user`. `CHECK` limits values. Only the admin script sets `admin`. |
| `created_at` | timestamp | P. |

Password policy: 8–128 characters (P).

### 3.3 Persistence

- PostgreSQL is the only store for application data (REQ-DB-01). No in-memory fallback.
- Tables are created by a small, idempotent initialisation script using SQLAlchemy `metadata.create_all` (P). A migration tool (Alembic) is deliberately left out given the deadline; this is noted in the README as a known limitation.
- Tests use a separate PostgreSQL database and must never touch development data (TEST_PLAN §3).
- No purchase/order history is stored; a purchase only changes stock.

---

## 4. Mandatory functional requirements — Frontend

| ID | Requirement | Tag |
|---|---|---|
| REQ-FE-01 | A modern **single-page application** using **HTML5, CSS3, Tailwind, and React**. This project uses React + TypeScript + Vite + Tailwind CSS (TypeScript and Vite are additions, not substitutions). | A |
| REQ-FE-02 | User **registration and login forms**. | A |
| REQ-FE-03 | A **dashboard or homepage** that displays all available vehicles. | A |
| REQ-FE-04 | Functionality to **search and filter** vehicles. | A |
| REQ-FE-05 | A **"Purchase" button on each vehicle**, **disabled when quantity is zero**. | A |
| REQ-FE-06 | For **admin users**: forms/UI to **add, update, and delete** vehicles. | A |
| REQ-FE-07 | **Design**: visually appealing, **responsive**, great user experience. | A |

### 4.1 Pages and interactions

| Page / component | Behaviour | Covers |
|---|---|---|
| Register page | Email + password with inline validation (8–128 chars); shows server errors (e.g. email taken); on success, logs in automatically and opens the dashboard. Never offers a role choice. | REQ-FE-02, DR-06 |
| Login page | Email + password; generic error on failure; on success, stores token and opens the dashboard. | REQ-FE-02 |
| Route guard | All vehicle endpoints require auth, so the dashboard requires login; unauthenticated users are redirected to login. A 401 from the API logs the user out. | REQ-FE-03, DR-01 |
| Dashboard | Grid of vehicle cards showing make, model, category, price, and quantity; loading, empty, and error states. Zero-stock vehicles are shown. | REQ-FE-03 |
| Search/filter panel | Inputs for make, model, category, min and max price; calls `GET /api/vehicles/search` with only the filled fields; "Clear" restores the full list; client-side check that min ≤ max. | REQ-FE-04 |
| Vehicle card | Purchase button: enabled when quantity > 0; disabled with an "Out of stock" label when 0; disabled while a purchase request is in flight; quantity updates after success. | REQ-FE-05 |
| Admin controls | Visible only when the logged-in user's role is `admin`: "Add vehicle" form, "Edit" form (pre-filled), "Delete" with confirmation. Hiding controls is UX only; the backend enforces roles. | REQ-FE-06, REQ-AUTH-05 |
| Restock control | Admin-only control per card. Not in the frontend requirements; built only if time remains (OPT-02). Restock is always available through the API. | OPT-02 |
| Layout | Usable at phone (~375 px), tablet (~768 px) and desktop (≥1280 px) widths; no horizontal scrolling; labelled inputs; visible focus states. | REQ-FE-07 |

---

## 5. Security and data-integrity considerations

| Concern | Approach | Tag |
|---|---|---|
| Password storage | Salted slow hash (Argon2 via pwdlib, or bcrypt); never returned or logged. | U (DR-07) |
| Token | Signed JWT (HS256), secret from environment configuration, `sub` (user id) and `exp` claims, 60-minute lifetime, no refresh tokens. Algorithm pinned on decode. | A + P |
| Role checks | Enforced server-side by one reusable dependency (`require_admin`). The role is read from the database on each request, not trusted from the token, so demotions take effect immediately. | D + C |
| Admin provisioning | Only via the CLI script (REQ-AUTH-06), which needs direct database access. Password read with a no-echo prompt and confirmed; there is no `--password` option, so it never reaches shell history; the script never prints it. No HTTP endpoint changes roles. | C |
| Self-promotion | Registration ignores any `role` input (DR-06). | D + C |
| Account enumeration | Login returns the same error for unknown email and wrong password. | P |
| Injection | All queries via SQLAlchemy parameter binding; search wildcards escaped. | P |
| Stock integrity | Atomic conditional update (`… SET quantity = quantity - 1 WHERE id = :id AND quantity > 0`) plus `CHECK (quantity >= 0)`. | D + U (DR-03, DR-08) |
| Price integrity | `NUMERIC` type and `CHECK (price > 0)`. | P |
| Secrets | No secrets committed. `.env` is git-ignored; `.env.example` documents variables. | P |
| CORS | Restricted to the frontend origin from configuration. | P |
| Token storage in browser | `localStorage` (accepted trade-off: simple, but readable by injected scripts). Mitigated by React's default escaping and no `dangerouslySetInnerHTML`. Documented in the README. | P |
| Error leakage | Unexpected errors return a generic 500 without stack traces. | P |
| Original work | All code written for this project; nothing copied from other repositories (REQ-DEL-07). | A |

---

## 6. Process requirements

| ID | Requirement | Tag |
|---|---|---|
| REQ-PROC-01 | **Test-Driven Development**: write tests before implementation. A clear **Red-Green-Refactor** pattern must be visible in the **commit history**, especially for backend logic. | A |
| REQ-PROC-02 | Aim for **high test coverage with meaningful test cases**. Coverage is measured and reported honestly; any percentage target in the test plan is our goal, not an assignment requirement. | A |
| REQ-PROC-03 | **Clean code**: readable, maintainable; follow **SOLID** and other good design practice; well documented with meaningful comments and clear naming. | A |
| REQ-PROC-04 | **Git**: commit frequently with clear, descriptive messages that narrate the development journey. | A |
| REQ-AI-01 | **AI co-authorship**: every commit where an AI tool was used must add the AI as co-author: at the end of the commit message, **two empty lines, then a trailer** in the form `Co-authored-by: AI Tool Name <AI@users.noreply.github.com>` (the assignment's sample; for the address actually used, and why, see D-18). | A |
| REQ-AI-02 | **README section titled exactly "My AI Usage"**, describing: which AI tools were used; how they were used; a reflection on how AI affected the workflow. Must be *detailed*. | A |
| REQ-AI-03 | Be prepared to **discuss AI usage in detail during the interview**. Not a repository artefact, but every part of the submission must be understood by the candidate. | A |

Honesty constraints (U): TDD failures, test results, commits, and AI logs must be real. No fabricated red phases, test reports, verification claims, or chat logs.

---

## 7. Deliverables

| ID | Deliverable | Tag |
|---|---|---|
| REQ-DEL-01 | A **public Git repository** link. The repository exists: <https://github.com/Mishasahni/incubyte-car-dealership> (checked 2026-10-24 22:05 IST via the GitHub API: public, default branch `main`, no commits yet). The local working directory is not yet connected to it. | A |
| REQ-DEL-02 | `README.md` with a **clear explanation of the project**. | A |
| REQ-DEL-03 | `README.md` with **detailed instructions to set up and run locally — backend and frontend**, including database setup and the admin-creation script. | A |
| REQ-DEL-04 | `README.md` with **screenshots of the final application in action**. | A |
| REQ-AI-02 | `README.md` with the mandatory **"My AI Usage"** section (see §6). | A |
| REQ-DEL-05 | A **test report showing the results of the test suite**: `docs/TEST_REPORT.md` with verbatim output of a real final run (backend and frontend, with coverage), its date and commit hash, linked and summarised from the README. | A + P (location) |
| REQ-DEL-06 | A root **`PROMPTS.md`** containing **raw, unedited AI chat logs or public chat links**. **No AI-generated summaries.** | A |
| REQ-DEL-07 | **No plagiarism**: no code copied from other repositories or developers. | A |
| OPT-01 | *(Optional — brownie points)* Link to a deployed, live application. | OPT |

---

## 8. Optional enhancements (not required)

Not built unless all mandatory functionality and deliverables (§9) are complete before the deadline.

| ID | Enhancement | Note |
|---|---|---|
| OPT-01 | Live deployment | Explicitly optional in the assignment. Unlikely within the deadline. |
| OPT-02 | Restock UI for admins | Backend endpoint is mandatory; the UI is not. First optional item if time remains. |
| OPT-03 | Automated browser E2E tests (Playwright) | Manual E2E checklist is the baseline. |
| OPT-04 | CI pipeline (GitHub Actions) | — |
| OPT-05 | Pagination/sorting of the vehicle list | — |
| OPT-06 | Purchase/order history | — |
| OPT-07 | Additional vehicle fields (year, colour, image) | — |
| OPT-08 | Rate limiting on login | — |
| OPT-09 | Docker Compose for local setup | — |
| OPT-10 | Database migrations (Alembic) | Replaced by an idempotent `create_all` script for now. |

---

## 9. Acceptance criteria

The project is complete when **all** of the following are true and have been checked by actually running them:

1. **Backend API**: every endpoint in §1.4–1.5 exists at the exact path and method in the assignment and behaves as in §2; the P1 backend tests for each pass.
2. **Persistence**: vehicles and users created through the API are still present after the backend process is restarted (REQ-DB-01).
3. **Auth**: a new user can register and log in; the token grants access to the authenticated endpoints; requests without a valid token get 401.
4. **Roles**: the permission matrix in §1.2 holds — a regular user gets 403 (data unchanged) on add, update, delete, and restock; an admin succeeds. Registration never creates an admin; the CLI script creates one, is idempotent, and never exposes the password.
5. **Inventory**: purchase reduces stock by exactly one and is refused at zero (409); restock increases stock by the given amount; a concurrency test shows no overselling.
6. **Frontend**: a user can register, log in, see all vehicles, search/filter, and purchase; the Purchase button is disabled at zero stock; an admin can add, edit, and delete vehicles from the UI; a regular user sees no admin controls. The layout works at phone, tablet, and desktop widths.
7. **Tests**: backend and frontend suites pass from a clean checkout following the README; coverage is reported as measured.
8. **TDD history**: the Git log shows test-first commits followed by implementation (and refactor, where done) for backend features, reflecting work actually done.
9. **AI disclosure**: every AI-assisted commit carries the `Co-authored-by:` trailer preceded by two empty lines; README has a detailed "My AI Usage" section; `PROMPTS.md` at the repo root contains raw, unedited logs or real public links for every Claude Code session used, and says that ChatGPT logs are not included (D-19).
10. **README**: explains the project and the REQ-AUTH-05 interpretation, gives working setup/run instructions for backend, frontend, database, and admin script (verified by following them), includes real screenshots and links the test report.
11. **Repository**: all of the above pushed to the public repository before the deadline, with no secrets committed.

---

## 10. Decisions register

Status: **Confirmed** = decided by the user; **Default** = documented default adopted under §2/§3 (no review needed unless the reviewer objects); **Open** = still affects correctness, security, or the assessment and needs an answer.

| ID | Question | Resolution | Status |
|---|---|---|---|
| D-01 | How does a user become admin? | Idempotent CLI script with a secure password prompt; no public endpoint (REQ-AUTH-06). | Confirmed |
| D-02 | Who may create and update vehicles? | Admin only (REQ-AUTH-05), documented as our interpretation of REQ-FE-06. | Confirmed |
| D-03 | "Available vehicles": all or only in stock? | All vehicles, including quantity 0 (§2.4). | Default |
| D-04 | Units per purchase? | Exactly one, no body (§2.8). | Default |
| D-05 | Restock amount? | Body `{ "quantity": n }`, n ≥ 1, added to stock (§2.9). | Default |
| D-06 | Search parameters and matching. | §2.5. | Default |
| D-07 | Category free text or fixed list? | Free text, trimmed, case-insensitive matching. | Default |
| D-08 | Registration fields; auto-login? | Email + password; 201 without token; frontend logs in immediately. | Default |
| D-09 | Password policy. | 8–128 characters. | Default |
| D-10 | Token lifetime and browser storage. | 60 minutes, no refresh, `localStorage`; trade-off documented in README. | Default |
| D-11 | Integer IDs or UUIDs? | Integers. | Default |
| D-12 | Currency display. | Two decimals, one configurable symbol, default ₹ (display only). | Default |
| D-13 | Duplicate make + model allowed? | Yes. | Default |
| D-14 | Migrations tool? | No Alembic; idempotent `create_all` init script (OPT-10 later). | Default |
| D-15 | Purchase history? | Not stored. | Default |
| D-16 | Test report format and location. | `docs/TEST_REPORT.md`, verbatim real output, dated, with commit hash. | Default |
| D-17 | Status codes. | §2 conventions table. | Default |
| D-18 | Co-author trailer format. | The message, then **two empty lines**, then `Co-authored-by: <tool name> <vendor no-reply address>`: `Claude Code <noreply@anthropic.com>` and `ChatGPT <noreply@openai.com>`. One trailer line per tool that contributed to the commit. Corrected on 2026-10-25: the assignment's sample address `AI@users.noreply.github.com` is GitHub's no-reply format for the unrelated user `@ai`, so it credited a stranger. The 29 already-pushed commits keep it; the 11 unpushed M4 commits were corrected before pushing. Details in DEVELOPMENT_PLAN §8.2. | Confirmed |
| D-19 | `PROMPTS.md` content. Tools used (per the user): **ChatGPT** — formulating and refining implementation prompts and discussing project planning; **Claude Code** — revising the planning documents and implementation. The user does not want unrelated casual conversation in the repository. The assignment asks for "raw, unedited AI chat logs or public chat links (no AI-generated summaries)" and says nothing more about scope or format. | **Decided (user, 2026-10-25):** `PROMPTS.md` links the raw, unedited Claude Code session exports in `prompts/`, one per session used. ChatGPT, a supplementary tool used outside the repository for planning, clarifying concepts, reviewing parts of the workflow and refining prompts, is not given logs there. `PROMPTS.md` and the README's "My AI Usage" say so openly. The assignment's wording does not explicitly require logs from every tool. | **Decided** |

---

## 11. Traceability matrix

Verification methods: **UT** unit test, **IT** backend API/integration test against PostgreSQL, **CT** concurrency test, **CLI** admin-script test, **FE** frontend component test, **E2E** manual end-to-end check, **INSP** inspection of repository/README/Git history. Test IDs refer to `docs/TEST_PLAN.md`.

| Requirement | Implementation area (planned) | Verification |
|---|---|---|
| REQ-BE-01 | `backend/` FastAPI app, routers under `/api` | INSP; all IT tests exercise it |
| REQ-DB-01 / DR-09 | PostgreSQL via SQLAlchemy; `scripts/init_db.py` | IT-DB-01, IT-DB-05, IT-DB-06; E2E-08 |
| REQ-AUTH-01 | `api/routes/auth.py`, `services/auth_service.py`, `User` model | API-AUTH-01–06; IT-DB-04; FE-AUTH-05–07; E2E-01 |
| REQ-AUTH-02 | auth routes + `core/security.py` | API-AUTH-07–12; UT-SEC-01–07; FE-AUTH-01–04; E2E-01 |
| REQ-AUTH-03 / DR-01 | `api/deps.py::get_current_user` on all vehicle routes | API-AUTHZ-01–05, API-AUTHZ-12; FE-AUTH-09–10; E2E-07 |
| REQ-AUTH-04 / DR-02 | `api/deps.py::require_admin` on DELETE and restock | API-AUTHZ-06–07, API-AUTHZ-09–10; E2E-06 |
| REQ-AUTH-05 | `require_admin` on POST and PUT; README note | API-AUTHZ-08–09, API-AUTHZ-13; FE-ADM-01–02; E2E-05–06 |
| REQ-AUTH-06 | `scripts/create_admin.py`; absence of any role-changing endpoint | ADM-01–05; API-AUTHZ-11; API-AUTH-06; INSP of routes; README instructions followed in E2E-05 |
| DR-06 | Register schema has no role; service forces `user` | API-AUTH-06 |
| DR-07 | `core/security.py` hashing; script output | UT-SEC-01–03; API-AUTH-02; ADM-04 |
| REQ-VEH-01 | `Vehicle` model, Pydantic schemas, DB constraints | UT-VAL-01–04; IT-DB-01–03; API-VEH-01, API-VEH-03 |
| REQ-VEH-02 | `POST /api/vehicles` | API-VEH-01–03; API-AUTHZ-08; FE-ADM-03–04 |
| REQ-VEH-03 | `GET /api/vehicles` | API-VEH-04–05; FE-VEH-01–03 |
| REQ-VEH-04 | `GET /api/vehicles/search`, search service | UT-VAL-06; API-SRCH-01–12; FE-SRCH-01–05 |
| REQ-VEH-05 | `PUT /api/vehicles/{id}` | API-VEH-06–08, API-VEH-11–12; API-AUTHZ-08; FE-ADM-05 |
| REQ-VEH-06 | `DELETE /api/vehicles/{id}` | API-VEH-09–10; API-AUTHZ-06; FE-ADM-06 |
| REQ-INV-01 / DR-03 | `services/inventory_service.py::purchase` (atomic update) | API-INV-01–04; FE-VEH-04–08 |
| REQ-INV-02 | `inventory_service.restock` | UT-VAL-05; API-INV-05–08; API-AUTHZ-07 |
| DR-04 | Services raise not-found → 404 | API-VEH-07, API-VEH-10; API-INV-04, API-INV-07 |
| DR-05 | Pydantic schemas + DB `CHECK` constraints | UT-VAL-01–07; API-VEH-02, API-VEH-08; API-INV-06; IT-DB-02–03 |
| DR-08 | Atomic conditional UPDATE; `CHECK` constraint | CT-01–03 |
| REQ-FE-01 | `frontend/` React + TS + Vite + Tailwind SPA | INSP; E2E-01–08 |
| REQ-FE-02 | Login/Register pages, auth context | FE-AUTH-01–08, FE-AUTH-11; E2E-01 |
| REQ-FE-03 | Dashboard page, vehicle list/card | FE-VEH-01–03; E2E-02 |
| REQ-FE-04 | Search/filter panel | FE-SRCH-01–05; E2E-03 |
| REQ-FE-05 | Vehicle card purchase button | FE-VEH-04–08; E2E-04 |
| REQ-FE-06 | Admin forms, role-aware UI | FE-ADM-01–06, FE-ADM-08; E2E-05 |
| REQ-FE-07 | Tailwind responsive layout, accessible components | FE-UX-01–02 (manual); screenshots |
| REQ-PROC-01 | TDD workflow (DEVELOPMENT_PLAN §4) | INSP of `git log` (test commit precedes implementation commit) |
| REQ-PROC-02 | pytest-cov, Vitest coverage | Coverage figures in REQ-DEL-05 as measured |
| REQ-PROC-03 | Layered backend, small components, docstrings, linting | INSP; ruff and ESLint clean |
| REQ-PROC-04 | Small commits per TDD step | INSP of `git log` |
| REQ-AI-01 | Commit procedure (DEVELOPMENT_PLAN §8) | INSP: `git log --format=%B` shows two empty lines then the trailer; `git log --format='%(trailers:key=Co-authored-by)'` |
| REQ-AI-02 | `README.md` "My AI Usage" | INSP against the three required points |
| REQ-AI-03 | Candidate understands all code | Self-review before submission |
| REQ-DEL-01 | <https://github.com/Mishasahni/incubyte-car-dealership> | INSP: link opens while logged out and shows the final commit |
| REQ-DEL-02–04 | `README.md`, `docs/screenshots/` | INSP; follow setup steps on a fresh clone |
| REQ-DEL-05 | `docs/TEST_REPORT.md` + README summary | INSP: generated by a real run, dated, tied to a commit |
| REQ-DEL-06 | Root `PROMPTS.md` | INSP: raw exported transcripts / real links; no summaries |
| REQ-DEL-07 | Original work | INSP; self-review |
| OPT-01, OPT-02 | Only if time remains | E2E against deployed URL / FE-ADM-07 |
