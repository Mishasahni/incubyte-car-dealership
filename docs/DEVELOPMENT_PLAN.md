# Development Plan — Car Dealership Inventory System

Status: **Revision 2 for review** (planning stage, 2026-10-24 ~22:10 IST). No application code exists yet. Nothing in this plan has been executed except the read-only environment checks in §3.1.

**Deadline: Sunday 25 October 2026, 22:00 IST** (about 24 hours from this revision). Target for the final push: **21:30 IST**.

Related documents: `docs/REQUIREMENTS.md` (requirement IDs, API contract §2, decisions register §10), `docs/TEST_PLAN.md` (test IDs, priorities).

---

## 1. Confirmed, defaulted, and unresolved

| Category | Items |
|---|---|
| **Confirmed by the assignment** | Endpoint paths and methods; JWT-style token auth; admin-only DELETE and restock; vehicle fields; persistent (non-in-memory) database; React + Tailwind SPA with the listed pages; Purchase disabled at zero stock; TDD with visible Red-Green-Refactor history; AI co-author trailers; README sections; test report; root `PROMPTS.md` with raw logs; public repository. |
| **Confirmed by the user** | Stack: FastAPI, PostgreSQL, SQLAlchemy, JWT, secure password hashing, React, TypeScript, Vite, Tailwind CSS, pytest, HTTPX, Vitest, React Testing Library. Admin-only add/update (our interpretation, REQ-AUTH-05). Admin CLI with secure prompt and no public admin endpoint (REQ-AUTH-06). Registration always creates a regular user. Deadline 25 Oct 2026 22:00 IST. Public repo <https://github.com/Mishasahni/incubyte-car-dealership>. Optional features only after mandatory work is complete. |
| **Documented defaults** | API contract and validation rules (REQUIREMENTS §2–3, D-03–D-17); library choices in §3; `create_all` init script instead of migrations; `vi.mock` instead of MSW; manual E2E instead of Playwright. |
| **Confirmed setup decisions (user, 2026-10-24)** | D-18 trailer format (§8.2). Node.js may be installed if missing, from a trusted official source, without changing unrelated software. Pushes to the existing public repo are allowed after each completed milestone, once tests pass, the changes are reviewed, and the commit summary plus a no-secrets/no-unrelated-files check has been shown to the user; no force-push or history rewriting; failing or unverified work is never pushed. PostgreSQL: a dedicated least-privilege app role plus separate dev and test databases, credentials only in local environment variables or an ignored `.env`; no change to existing roles, databases, or server configuration without showing the change and getting approval. Git identity is never invented, and global Git config is not modified. |
| **Still open** | The Git name/email to use; the Node.js install method (§3.2); running the PostgreSQL setup (§3.3), which needs the user's administrator password. |

---

## 2. Architecture

```
React SPA (Vite)
   │  fetch, JSON, Authorization: Bearer <JWT>
   ▼
FastAPI app  ── routers (/api/auth, /api/vehicles)
   │             └─ dependencies: get_db, get_current_user, require_admin
   ├─ schemas (Pydantic): request validation, response shapes
   ├─ services: auth, vehicles, inventory (business rules, raise domain errors)
   ├─ core: settings, security (hashing, JWT)
   └─ models (SQLAlchemy ORM)
   ▼
PostgreSQL (car_dealership / car_dealership_test), tables via init script

scripts/create_admin.py ──► services + models (direct DB access, no HTTP)
```

### 2.1 Responsibilities

| Layer | Responsibility | Does not |
|---|---|---|
| **Routers** (`app/api/routes/`) | Map HTTP to service calls; declare auth dependencies; translate domain errors to status codes. | Contain business rules or SQL. |
| **Dependencies** (`app/api/deps.py`) | DB session per request; current user from token; admin check. | Duplicate role checks inside handlers. |
| **Schemas** (`app/schemas/`) | Validate and normalise input (trim, ranges); response models so hashes can never leak. | Talk to the DB. |
| **Services** (`app/services/`) | Registration, authentication, admin creation/promotion, vehicle CRUD, search, purchase/restock with atomic updates. Raise `NotFoundError`, `OutOfStockError`, `DuplicateEmailError`. | Know about HTTP. |
| **Core** (`app/core/`) | Settings from environment (`pydantic-settings`); hashing; token create/decode. | — |
| **Models** (`app/models/`) | Tables and constraints (`CHECK`, unique). | — |
| **Scripts** (`scripts/`) | `init_db.py` (idempotent `create_all`); `create_admin.py` (admin CLI). Thin wrappers over services. | Duplicate service logic. |
| **PostgreSQL** | Durable storage; final integrity guard via constraints. | — |
| **Frontend** | UI, client-side validation, role-aware rendering, token handling. | Act as the security boundary — the backend always re-checks. |

No separate repository layer: services use a SQLAlchemy `Session` directly, which is enough for this scope.

### 2.2 Planned layout (created in later milestones, not now)

```
backend/
  app/{main.py, core/, api/, schemas/, services/, models/, db/}
  scripts/{init_db.py, create_admin.py}
  tests/{unit/, api/, scripts/, conftest.py, factories.py}
  pyproject.toml  .env.example
frontend/
  src/{api/, auth/, components/, pages/, test/}
  index.html  vite.config.ts  package.json
docs/{REQUIREMENTS.md, TEST_PLAN.md, DEVELOPMENT_PLAN.md, TEST_REPORT.md, screenshots/}
README.md  PROMPTS.md  .gitignore
```

---

## 3. Technology stack

| Area | Choice | Notes |
|---|---|---|
| Backend | Python + FastAPI | Allowed by the assignment; dependency injection makes auth/role checks and test overrides clean. |
| Database | PostgreSQL | Meets "not in-memory"; real row locking for safe stock updates. |
| ORM | SQLAlchemy 2.x, **synchronous** sessions, `psycopg` (v3) driver | Sync is simpler to test; FastAPI runs sync endpoints in a thread pool. |
| Schema creation | `metadata.create_all` in an idempotent `scripts/init_db.py` | Alembic left out for the deadline (D-14, OPT-10); stated in README. |
| Settings | `pydantic-settings` | Environment-driven; tests inject their own settings. |
| JWT | PyJWT | Maintained; used in current FastAPI docs. |
| Password hashing | `pwdlib[argon2]` (fallback: `bcrypt` directly) | Avoid `passlib` (unmaintained; known issues with recent `bcrypt`). |
| Email validation | `email-validator` (for Pydantic `EmailStr`) | — |
| Backend tests | pytest, FastAPI `TestClient` (HTTPX), `pytest-cov` | As confirmed. |
| Lint/format | ruff (backend), ESLint from the Vite template (frontend) | Light-touch; supports REQ-PROC-03. |
| Frontend | React + TypeScript + Vite + Tailwind CSS (Vite plugin), React Router | As confirmed. |
| Data fetching | Small typed `fetch` wrapper in `src/api/` + React context/state | No extra libraries. |
| Frontend tests | Vitest + React Testing Library + user-event + jest-dom (jsdom); API module mocked with `vi.mock` | MSW dropped to reduce setup. |
| E2E | Manual checklist (TEST_PLAN §7) | Playwright only as OPT-03. |

### 3.1 Environment — what was actually checked

Read-only checks first run at about 22:05 IST on 2026-10-24 and repeated with more detail at about 22:40 IST. Anything not in the "Verified" column has **not** been checked.

| Item | Verified | Not verified / still to check |
|---|---|---|
| Local Git | `git rev-parse` in the project folder: **not a Git repository**. Folder contains only `docs/` (these three files). | — |
| Remote repository | GitHub API: `Mishasahni/incubyte-car-dealership` exists, **public**, default branch `main`, **empty** ("Git Repository is empty" from the commits API; `git ls-remote` returns no refs). So there is no commit history to take an identity from. | Whether pushes will authenticate. Git's `osxkeychain` credential helper is configured (system gitconfig), but whether GitHub credentials are stored in it is unknown. `gh` CLI is not on `PATH`; no SSH public keys found in `~/.ssh`. |
| Git identity | `git config --show-scope --get-regexp '^user\.'`: **no `user.name` or `user.email` in any scope**. No `~/.gitconfig` or `~/.config/git/config` file. No `GIT_AUTHOR_*`/`GIT_COMMITTER_*` environment variables. | The name and email the user wants. They will be set in the **repository-local** config only, never globally. |
| Node.js / npm | **Not installed**: not on `PATH` in this shell or in a login/interactive zsh; not in `/usr/local/bin`, `/opt/homebrew/bin`, `~/.nvm`, `~/.volta`, `~/.fnm`, asdf, mise, or `n` locations; no Homebrew `node` formula; no Node installer package receipt; Spotlight finds no `node` binary. Machine: Apple silicon (`arm64`), macOS 26.5.1, ~51 GB free. Homebrew 7.0.7 is installed. Current Node.js LTS per `nodejs.org/dist/index.json`: **v24.22.1 "Krypton"** (2026-10-20, npm 11.19.1), with a macOS arm64 build. **Update ~22:25 IST:** installed by the §3.2 method with the user's approval. SHA-256 matched `SHASUMS256.txt`. The GPG signature was not checked because `gpg` is not installed. A fresh login shell resolves `node` v24.22.1, `npm` 11.19.1 and `npx` from `~/.local/node-v24.22.1-darwin-arm64/bin`. |
| Python | `python3` → **3.14.4** (python.org build) with pip 26.0.1 and `venv` available. `/opt/homebrew/bin/python3.12` → **3.12.15**. | Whether every backend package installs on 3.14 (checked when the venv is created in M1). |
| PostgreSQL | `psql` **18.4** at `/Library/PostgreSQL/18/bin`; server **accepting connections** on the Unix socket `/tmp:5432` and `localhost:5432`. Connecting without a password (`psql -w`) as `nimishasahni` or `postgres`, over socket or TCP, fails with `fe_sendauth: no password supplied`, so **every connection needs a password**. No `PG*` environment variables, no `~/.pgpass`. The data directory (incl. `pg_hba.conf`) is owned by the `postgres` OS user and not readable. **Update 2026-10-25 ~01:20 IST:** the user had forgotten the `postgres` password. The server log showed the failures were a wrong password: the role exists and the rules are the standard `scram-sha-256` ones. Access was recovered with the user's step-by-step approval, without resetting the `postgres` password:<br>(1) `pg_hba.conf` backed up to `pg_hba.conf.bak-2026-10-24` (SHA-256 `3412fc92…112e`);<br>(2) a temporary `local all postgres peer` line added at the top;<br>(3) reloaded (logged at 00:43:44);<br>(4) inspected: the only role was `postgres`; databases were `ecommerce_analysis`, `postgres`, `template0`, `template1`;<br>(5) the §3.3 role and databases created;<br>(6) `pg_hba.conf` restored byte for byte from the backup and reloaded (logged at 01:19:27); password-free access confirmed gone;<br>(7) `car_dealership_app` password login over `localhost` to `car_dealership` succeeded.<br>The `postgres` password is still unknown to the user. The backup file remains in the data directory. |
| AI transcript | A transcript file for this Claude Code session exists under `~/.claude/projects/-Users-nimishasahni-Desktop-incubyte-car-dealership/` (`.jsonl`). | Its suitability for `PROMPTS.md` (D-19); the Claude desktop app's own export or share options; ChatGPT's share-link options for the relevant chats. |

### 3.2 Node.js install method (proposed, not yet done)

Recommended: the **official prebuilt macOS arm64 binary of Node.js v24.22.1 LTS from `nodejs.org`**, installed under the user's home directory:

1. Download `node-v24.22.1-darwin-arm64.tar.gz` and `SHASUMS256.txt` from `https://nodejs.org/dist/v24.22.1/`.
2. Verify the tarball's SHA-256 against `SHASUMS256.txt`; stop if it does not match.
3. Extract to `~/.local/node-v24.22.1-darwin-arm64` (no `sudo`, nothing outside the home directory).
4. Make it available by adding one line to `~/.zprofile` (`export PATH="$HOME/.local/node-v24.22.1-darwin-arm64/bin:$PATH"`) — shown to the user before it is added — and verify with `node --version` / `npm --version`.

Why this method: official source with checksum verification; touches no other software; no administrator password; removable by deleting one folder and one line. Alternatives: the official `.pkg` installer from nodejs.org (needs an administrator password, so the user would run it); `brew install node` (convenient, but a community package source, not nodejs.org, and it can update other Homebrew packages, which conflicts with "avoid changing unrelated software").

### 3.3 PostgreSQL setup (proposed, not yet done)

Because every connection needs a password the assistant does not have, the user runs these steps in their own terminal (the passwords are typed into prompts, never into chat, a command line, or a file in the repository):

```
/Library/PostgreSQL/18/bin/psql -h localhost -U postgres -d postgres
```

At the `postgres=#` prompt (it will ask for the superuser password first):

```sql
-- Inspect first; nothing below changes existing roles or databases.
\du
\l
-- New, least-privilege application role (no superuser, cannot create roles or databases).
CREATE ROLE car_dealership_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
\password car_dealership_app
-- Two new databases owned by that role (owner can create tables in the public schema).
CREATE DATABASE car_dealership OWNER car_dealership_app;
CREATE DATABASE car_dealership_test OWNER car_dealership_app;
-- Only the app role may connect to them.
REVOKE CONNECT ON DATABASE car_dealership, car_dealership_test FROM PUBLIC;
\q
```

Notes: if `\du` or `\l` already shows a `car_dealership_app` role or either database, stop and decide before running the rest. The app then uses `DATABASE_URL` / `TEST_DATABASE_URL` with this role's credentials in an ignored `backend/.env` (created by the user or from `.env.example`). Superusers keep their normal access. No server configuration (`pg_hba.conf`, `postgresql.conf`) is changed.

---

## 4. TDD workflow per feature

Each feature follows TEST_PLAN §2:

1. Pick the next **P1** scenario for the milestone.
2. **Red**: write the test; run it; confirm the failure reason. Commit (`test: …`).
3. **Green**: smallest change that passes; run the full backend suite. Commit (`feat: …` / `fix: …`).
4. **Refactor** if worthwhile, suite green before and after. Commit (`refactor: …`).

Practical rules:
- One behaviour per cycle, so each red→green pair is readable in `git log`. Closely related parametrised cases (e.g. all invalid prices) form one cycle.
- With the AI assistant: the assistant runs the tests and shows real output; the user can review the test before the implementation. Nobody claims a result that was not observed.
- Scaffolding with no behaviour is committed as `chore:` without a red phase, and not presented as TDD.
- Bugs found during integration get a failing regression test first, then the fix.
- Infrastructure is kept minimal (one truncate fixture, small factories). If a piece of test infrastructure is taking more than ~20 minutes, simplify it rather than let it delay features.

---

## 5. Database design and safe inventory updates

### 5.1 Tables

- `users(id PK, email UNIQUE — stored lower-cased by the service, password_hash, role CHECK IN ('user','admin') DEFAULT 'user', created_at)`
- `vehicles(id PK, make, model, category, price NUMERIC(12,2) CHECK (price > 0), quantity INTEGER CHECK (quantity >= 0), created_at, updated_at)`

### 5.2 Purchase (atomic decrement, one unit)

```sql
UPDATE vehicles SET quantity = quantity - 1, updated_at = now()
WHERE id = :id AND quantity > 0
RETURNING *;
```

- Row returned → success.
- No row → check existence: missing → `NotFoundError` (404); exists → `OutOfStockError` (409).
- `CHECK (quantity >= 0)` is a second line of defence. No read-then-write in Python, so concurrent purchases cannot oversell (CT-01).

### 5.3 Restock (atomic increment)

`UPDATE vehicles SET quantity = quantity + :n, updated_at = now() WHERE id = :id RETURNING *` — no lost updates under concurrent purchases (CT-02).

### 5.4 Other integrity points

- `price` is `Decimal` end to end. How Pydantic serialises `Decimal` to JSON (number vs string) is checked in M5 and pinned with API-VEH-01; the frontend type follows whatever is chosen there.
- One session/transaction per request; commit on success, rollback on error.
- Search uses `ILIKE` with escaped `%`/`_` and bound parameters.

---

## 6. Authentication and role-based authorisation

- **Registration** (`auth_service.register`): lower-case email; check uniqueness (and rely on the unique constraint for races → 409); hash password; store with role `user`. The request schema has no `role` field (DR-06).
- **Login** (`auth_service.authenticate`): look up by lower-cased email; verify hash; same 401 for unknown email and wrong password; issue JWT with `sub` = user id, `exp` = now + 60 min.
- **`get_current_user`**: parse `Authorization: Bearer`; decode with the configured secret and pinned algorithm; load the user from the DB; 401 on any failure. Applied to **every** `/api/vehicles…` route.
- **`require_admin`**: depends on `get_current_user`; 403 unless the DB role is `admin`. Applied to `POST /api/vehicles`, `PUT /api/vehicles/{id}` (our interpretation, REQ-AUTH-05), `DELETE /api/vehicles/{id}` and `POST /api/vehicles/{id}/restock` (assignment, REQ-AUTH-04).
- **Admin CLI** (`python -m scripts.create_admin --email admin@example.com`, REQ-AUTH-06):
  - Existing admin → prints "already an admin", exits 0, no prompt (idempotent).
  - Existing regular user → promoted to admin, password unchanged, no prompt.
  - New email → prompts twice with `getpass` (no echo), checks they match and meet the 8–128 policy, creates the admin.
  - No `--password` option, so the password never appears in shell history; the script never prints or logs it; non-zero exit with a clear message on any error.
  - Requires direct database access (same `DATABASE_URL` as the app). There is **no** HTTP endpoint that changes roles.
  - Tested by ADM-01–05 and API-AUTHZ-11; README documents usage.
- **Frontend**: `AuthContext` holds token and user (including role); `ProtectedRoute` redirects to login; admin controls render only for `role === "admin"`; the API client attaches the token and handles 401 by logging out.

---

## 7. Milestones

Order follows the user's priorities, adjusted only where a dependency requires it (the auth guard needs a real endpoint to protect, so the first vehicle endpoints are built inside the auth milestone). Each milestone ends with the full suite passing, committed, and pushed (subject to push approval, §12).

| # | Milestone | Scope | Key tests (P1 unless in TEST_PLAN §9) | Definition of Done | Risks / dependencies |
|---|---|---|---|---|---|
| **M0** | Verify environment & repository | Answer §12 items; set Git identity; `git init -b main`; add `origin` = the existing GitHub repo; verify push authentication with the first commit (these planning docs + `.gitignore`). Start Node.js install if approved. | — | First commit visible on GitHub `main`; trailer format verified (§8.2). | Push credentials unknown; user approvals. |
| **M1** | Backend, database & test infrastructure | `backend/` project, venv, dependencies; settings; DB engine/session; `init_db.py`; create `car_dealership` and `car_dealership_test`; `conftest.py` with `_test` guard, truncate fixture, `get_db` override; `.env.example`. | One smoke test (app starts; test DB reachable). | `pytest` green from a fresh shell; nothing secret committed. | Python 3.14 package compatibility (fallback 3.12); DB credentials. |
| **M2** | Data model | `User`, `Vehicle` models and constraints; `init_db` idempotent. | IT-DB-01, -02, -06. | Constraints proven at DB level. | — |
| **M3** | Security core, register & login | Hashing, JWT utilities; register/login schemas, service, routes. | UT-SEC-01, -02, -04–06; UT-VAL-07; API-AUTH-01–03, -05–11. | Contract matches REQUIREMENTS §2.1–2.2. | — |
| **M4** | Authorisation & admin creation | `get_current_user`, driven by `GET /api/vehicles`; `require_admin`, driven by `POST /api/vehicles`; `create_admin` script. | API-VEH-04–05; API-AUTHZ-01 (list, create), -03–05, -08(a), -11, -13 (list); API-VEH-01–02; ADM-01–05. | 401/403 behaviour proven for the first endpoints; an admin can be created and log in. | — |
| **M5** | Vehicle CRUD & search | `PUT`, `DELETE`, search; extend API-AUTHZ-01 to the new endpoints. | UT-VAL-01–04, -06; API-VEH-06–10, -12; API-AUTHZ-06, -08(b), -09; API-SRCH-01–10. | All CRUD and search per contract. | `Decimal` serialisation decision (§5.4). |
| **M6** | Purchase & restock | Atomic purchase/restock; extend API-AUTHZ-01. | UT-VAL-05; API-INV-01–08; API-AUTHZ-07, -13 (purchase); CT-01; IT-DB-05. | No oversell under concurrency on repeated runs; **backend feature-complete and pushed.** | Thread harness flakiness. |
| **M7** | Frontend foundation | Vite + React + TS + Tailwind scaffold; Vitest/RTL setup; API client; `AuthContext`; routing; Login & Register pages; CORS on the backend. | FE-AUTH-01–09. | Can register/log in against the real backend in a browser. | **Node.js must be installed**; CORS. |
| **M8** | Dashboard, search & purchase | Vehicle list and cards; loading/empty/error states; search panel; purchase button. | FE-VEH-01–02, -04–07; FE-SRCH-01–04. | REQ-FE-03/04/05 work in the browser. | — |
| **M9** | Admin UI | Add/edit/delete forms with confirmation; role-aware rendering. | FE-ADM-01–06. | REQ-FE-06 works in the browser; regular user sees no admin controls. | — |
| **M10** | Integration & defect fixing | Full E2E checklist; persistence and permission checks via curl; responsive pass at three widths; fix defects (each with a regression test). | E2E-01–08; FE-UX-01. | Checklist recorded with real outcomes. | Debugging time is the main schedule risk. |
| **M11** | Documentation & submission | README (all sections incl. REQ-AUTH-05 note, admin CLI, known limitations), screenshots, `docs/TEST_REPORT.md`, "My AI Usage", `PROMPTS.md`; fresh-clone check; final push. | — | Every item in §10 ticked. | "My AI Usage" reflection is the user's own writing. |
| *M12* | *Optional* | *P2 tests, then OPT-02 restock UI, then other OPT items — only if M11 is finished early.* | *TEST_PLAN §9.* | — | *Must not endanger the deadline.* |

---

## 8. Git practice and AI co-author trailers

### 8.1 Repository setup and commit style

- The local folder is not yet a repository (§3.1). Setup in M0: `git init -b main`, `git remote add origin https://github.com/Mishasahni/incubyte-car-dealership.git`, then the first commit and `git push -u origin main`. The remote is empty, so no merge with existing history is needed.
- Commits use the user's own Git identity. The AI is never the author.
- Conventional prefixes: `test:`, `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`. Subject ≤ 72 characters, imperative. Body says *why*, and for AI-assisted commits *what the AI did and what the user did*.
- Commit after every red, green, and real refactor step. No squashing; no rewriting pushed history.
- `.env`, virtual environments, `node_modules`, coverage output are git-ignored.
- Commits and pushes happen only with the user's approval (§12 asks for a standing approval per milestone to save time).

### 8.2 Co-author trailer — exact format

The assignment requires, at the end of the message, **two empty lines followed by** a co-author trailer, and shows the sample `Co-authored-by: AI Tool Name <AI@users.noreply.github.com>`. Its wording does not say whether that email is required text or part of the example (the whole sample command is illustrative and uniformly formatted).

**Correction (2026-10-25).** `AI@users.noreply.github.com` is GitHub's no-reply address format for the account whose username is `ai`, which belongs to an unrelated developer (Andrey Sitnik, github.com/ai). GitHub therefore credited that person as co-author of every commit using it: this repository's commit pages list `login: ai` (profile "Andrey Sitnik") as co-author, and the GitHub API confirms the account. The repository's Contributors section also showed them.

- The first 29 commits, `5c54df1` through `16bd017`, used the sample address. They were already pushed and are **left unchanged** rather than rewriting public history.
- The 11 M4 commits had not been pushed. Only their trailer lines were corrected before pushing; their code, order, authors and author dates are unchanged. They were originally `64a3149`…`203abcb` and are now `e70827a`…`7398e45`.
- From M4 on, each tool's own official no-reply address is used. GitHub attributes these to the vendors' own accounts, verified on real public commits:
  - `noreply@anthropic.com` → github.com/claude (Anthropic)
  - `noreply@openai.com` → github.com/codex, OpenAI's Codex account (so ChatGPT co-authorship is shown under the Codex name)

Current form (D-18): the two empty lines and the `Co-authored-by:` key exactly as the assignment shows, the tool's name, and its vendor's address:

```
feat: reject purchase when vehicle is out of stock

Claude Code wrote the atomic UPDATE in inventory_service and the 409
mapping; I reviewed the SQL and the failing test before accepting it.


Co-authored-by: Claude Code <noreply@anthropic.com>
```

When ChatGPT also contributed to a commit (e.g. it helped write the prompt or plan that produced the change), a second line `Co-authored-by: ChatGPT <noreply@openai.com>` follows directly under the first, and the body says what each tool did.

By default Git **collapses consecutive blank lines** in commit messages (`git commit -m` uses the `whitespace` cleanup mode), which would turn the two empty lines into one. So each AI-assisted commit is made from a message file kept outside the repository:

```
git commit --cleanup=verbatim -F <message-file>
```

Checked after the first such commit (and spot-checked later) with `git log -1 --format=%B | cat -e` (two lines that are only `$` before the trailer) and `git log -1 --format='%(trailers:key=Co-authored-by)'` (trailer recognised). The key is spelled exactly `Co-authored-by`. One trailer line per AI tool used. Commits with no AI involvement carry no trailer. This format replaces any default attribution line the assistant would otherwise add.

---

## 9. Documentation deliverables

| Deliverable | Plan |
|---|---|
| **README.md** | Overview; architecture summary; the permission matrix and the REQ-AUTH-05 interpretation; prerequisites (Python, Node, PostgreSQL); backend setup (venv, install, `.env`, create DBs, `init_db`, `create_admin`, run); frontend setup (install, `.env`, run); how to run tests; endpoint table; screenshots; test report summary + link; **"My AI Usage"**; known limitations (no migrations, `localStorage` token, no order history). Setup steps verified by following them on a fresh clone. |
| **My AI Usage** | Finalised by the user in their own words: **ChatGPT** (formulating and refining implementation prompts; discussing project planning) and **Claude Code** with Claude Opus 5.5 (revising the planning documents; implementation, tests, debugging); how each was used; reflection. Must agree with `PROMPTS.md` and the commit trailers. |
| **PROMPTS.md** | Assignment wording: "A root PROMPTS.md containing your raw, unedited AI chat logs or public chat links (no AI-generated summaries)." The plan was for it to cover both ChatGPT and Claude Code; see the D-19 decision below. Each entry is either the raw log of a project conversation or a real public link to it, headed only with date, tool, and what the conversation was for. No summaries presented as logs, no reconstructed or invented content. **Decided (D-19, 2026-10-25):** `PROMPTS.md` links the raw Claude Code session exports in `prompts/`; ChatGPT logs are not included, and `PROMPTS.md` and the README say so. Secrets are never typed into AI chats; any unavoidable redaction is marked in place. Entries are added as sessions happen, not reconstructed at the end. |
| **Screenshots** | Real captures from the running app in `docs/screenshots/`: login, register, dashboard (desktop and phone width), search results, zero-stock disabled button, admin add/edit form, delete confirmation, regular-user view without admin controls. |
| **Test report** | `docs/TEST_REPORT.md`: verbatim output of the final real runs with coverage, date/time, commit hash, and E2E checklist results (TEST_PLAN §8). |

---

## 10. Final submission checklist

- [ ] All backend and frontend tests pass from a fresh clone following only the README.
- [ ] E2E checklist re-run on the final code; results recorded.
- [ ] Every mandatory row in REQUIREMENTS §11 verified.
- [ ] Permission matrix (REQUIREMENTS §1.2) checked via E2E-06/07.
- [ ] Admin created via the README's `create_admin` instructions on the fresh clone.
- [ ] `git log` shows test-first commits for backend features; no fabricated red phases.
- [ ] Every AI-assisted commit has the two-empty-lines + `Co-authored-by` trailer.
- [ ] README has explanation, setup/run for both apps, screenshots, test report, "My AI Usage".
- [ ] Root `PROMPTS.md` covers every Claude Code session used, as raw exports, and states that ChatGPT logs are not included (D-19).
- [ ] No secrets in the repository or its history.
- [ ] Final commit visible at <https://github.com/Mishasahni/incubyte-car-dealership> while logged out, before 22:00 IST.
- [ ] The user can explain every part of the code and the AI's role in it (REQ-AI-03).

---

## 11. Risks and dependencies

| Risk | Impact | Mitigation |
|---|---|---|
| **~24 hours to deadline** | Mandatory scope may not all fit. | Strict P1-first; optional items only in M12; checkpoints and cut rules in §13. |
| Node.js not on `PATH` | Blocks M7–M9. | Install during M0/M1 so it is ready by midday; backend work proceeds meanwhile. |
| Push authentication unknown | Cannot deliver. | Verified with the very first commit in M0, not at the end. |
| Git identity not set | Cannot commit. | Set in M0. |
| Python 3.14 package incompatibility | Delays M1. | Fall back to `/opt/homebrew/bin/python3.12`. |
| PostgreSQL credentials | Delays M1. | User creates role/databases in M1 with commands from the plan. |
| Concurrency test flaky | Noise or false confidence. | Barrier start, repeated runs, atomic SQL (no timing-dependent logic). |
| TDD history looks staged | Assessment concern. | Small real cycles; commit at each real state; never backfill. |
| Trailer blank-line collapse | Format non-compliance. | `--cleanup=verbatim -F` and check (§8.2). |
| Incomplete `PROMPTS.md` | Deliverable non-compliance. | Decide D-19 tonight; add logs after each session. |
| Integration bugs (CORS, token handling, `Decimal`) | Late surprises. | Browser check at end of M7; contract pinned by API tests. |

---

## 12. Items needing the user before or during M0

Resolved: D-18 (§8.2); permission to install Node.js; push policy (§1); PostgreSQL approach (§3.3).

Still needed:
1. **D-19** — how `PROMPTS.md` will meet the assignment wording with project-relevant material only (§9). *Decided 2026-10-25; see §9.*
2. **Git identity** — no identity is configured anywhere (§3.1). The name and email to set in this repository's local config (e.g. the GitHub noreply address, if commits should link to the GitHub account).
3. ~~Node.js~~ — done (§3.1).
4. ~~PostgreSQL~~ — done: role `car_dealership_app` and databases `car_dealership` / `car_dealership_test` exist; login verified (§3.1). The user creates `backend/.env` locally with the credentials.

---

## 13. Schedule (IST)

Times are targets, not promises. Rest overnight is at the user's discretion; this plan assumes roughly 6–7 hours off.

| When | Work | Milestones | Checkpoint |
|---|---|---|---|
| Sat 22:30 – 23:15 | Answer §12; Git identity; `git init`; first commit (planning docs); **verify push**; start Node install | M0 | First commit on GitHub. |
| Sat 23:15 – Sun 00:45 | Backend scaffold, DBs, test harness, smoke test; push | M1 | `pytest` green. |
| Sun 00:45 – 07:30 | Rest | — | — |
| Sun 07:30 – 10:30 | Data model; security core; register/login; authorisation; admin CLI | M2–M4 | Auth + roles proven by tests. |
| Sun 10:30 – 12:30 | CRUD (PUT/DELETE) and search | M5 | — |
| Sun 12:30 – 14:00 | Purchase/restock, CT-01, persistence test; push | M6 | **14:00: backend feature-complete.** If not, finish it with P1 tests only and shorten frontend polish. |
| Sun 14:00 – 14:30 | Break | — | — |
| Sun 14:30 – 17:30 | Frontend: auth pages, dashboard, search, purchase, admin UI | M7–M9 | **17:30: all REQ-FE requirements usable.** If not, simplify styling; no new features. |
| Sun 17:30 – 19:00 | Integration, E2E checklist, defect fixes, responsive pass | M10 | **19:00: feature freeze.** Only bug fixes after this. |
| Sun 19:00 – 21:00 | README, screenshots, test report, My AI Usage, PROMPTS.md | M11 | — |
| Sun 21:00 – 21:30 | Fresh-clone verification; final push | M11 | **21:30: final push target.** |
| Sun 21:30 – 22:00 | Reserve for problems only; no new work | — | **22:00 deadline.** |

Cut order if behind: (1) all optional items, (2) P2 tests, (3) visual polish beyond clean, responsive Tailwind defaults. Never cut: mandatory endpoints and their P1 tests, the permission rules, the README deliverables, the test report, `PROMPTS.md`, or the final verification.
