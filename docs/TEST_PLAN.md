# Test Plan — Car Dealership Inventory System

Status: **Revision 2 for review** (planning stage, 2026-10-24 ~22:10 IST). **No tests have been written or run yet.** Every scenario below is planned, not done.

Related documents: `docs/REQUIREMENTS.md` (requirement IDs, contract in §2, decisions register §10), `docs/DEVELOPMENT_PLAN.md` (milestones and schedule).

All expected outcomes follow the contract in REQUIREMENTS §2 and the permission matrix in REQUIREMENTS §1.2.

---

## 1. Strategy

### 1.1 Test levels

| Level | Tooling | What it covers | Database |
|---|---|---|---|
| Backend unit (UT) | pytest | Pure logic: password hashing, JWT creation/validation, Pydantic validation rules. | None |
| Backend integration / API (IT, API) | pytest + FastAPI `TestClient` (built on HTTPX) | HTTP contract, status codes, auth/role enforcement, service + ORM behaviour, DB constraints, persistence. | Real PostgreSQL test database |
| Admin script (ADM) | pytest, calling the script's `main()` with arguments, a patched `getpass`, and `capsys` | Admin creation, idempotency, password secrecy. | Real PostgreSQL test database |
| Concurrency (CT) | pytest + threads, each with its own DB session | Atomic stock updates under parallel requests. | Real PostgreSQL |
| Frontend component (FE) | Vitest + React Testing Library + `@testing-library/user-event` + jest-dom, jsdom | Forms, validation, rendering, button states, role-aware UI, API calls made. | None — the app's typed API module is replaced with `vi.mock` |
| End-to-end (E2E) | Manual checklist against the running stack | Full user journeys across frontend, backend, PostgreSQL. | Development database |

Why PostgreSQL for backend tests (not SQLite): the atomic stock update, `CHECK` constraints, `NUMERIC` handling, and `ILIKE` matching must be tested on the engine the app actually uses.

Deliberately not used (to keep infrastructure small for the deadline): MSW, Playwright (OPT-03), CI (OPT-04), migrations tests.

### 1.2 Priorities

The deadline is 25 Oct 2026, 22:00 IST, so tests are prioritised explicitly:

- **P1 — required before a milestone is "done"**: happy path plus authentication, authorisation, validation, missing-record, persistence, and stock-integrity cases for every mandatory endpoint and frontend requirement. **Every scenario not listed under P2 below is P1.**
- **P2 — written only after all P1 scenarios and mandatory features are complete**: the IDs listed in §9.

Coverage is measured (`pytest-cov`; Vitest coverage with the v8 provider) and reported exactly as measured. Goals (not assignment requirements): ≥ 90 % line coverage of backend `app/`, ≥ 80 % of frontend `src/`. Missing P1 scenarios count as gaps regardless of the percentage; chasing percentage with low-value tests is not a goal and must not delay mandatory functionality.

---

## 2. Genuine TDD procedure

For each behaviour, in order:

1. **Red** — write *one* focused test (or a small parametrised group for the same rule). Run it. Confirm it fails **for the expected reason** (e.g. 404 because the route does not exist yet, or a wrong value) — not because of an import error or a typo. If it fails for the wrong reason, fix the test and re-run. If it unexpectedly passes, investigate before continuing.
2. **Commit the red state** (backend) — e.g. `test: add failing test for purchasing out-of-stock vehicle`. The message describes only what was observed.
3. **Green** — the minimum production code to pass. Run the **whole** backend suite.
4. **Commit the green state** — e.g. `feat: reject purchase when stock is zero`.
5. **Refactor** — only if worthwhile, suite green before and after; commit separately (`refactor: …`).
6. Repeat.

Rules:
- No production code without a failing test that requires it (scaffolding and configuration excepted — committed as `chore:` and not presented as TDD).
- Never edit an assertion to match buggy output. A wrong test is fixed in its own commit with the reason.
- Test output is never fabricated or paraphrased as if it were run.
- Frontend follows the same loop; committing each red state is optional there, since the assignment stresses backend history. Under time pressure, related frontend cycles may share a commit, but the test is still written and seen failing first.

---

## 3. Test environment, isolation, and repeatability

### 3.1 Databases

| Database | Purpose |
|---|---|
| `car_dealership` | Local development and manual E2E. |
| `car_dealership_test` | Automated backend tests only. |

- The test database URL comes from `TEST_DATABASE_URL`. `conftest.py` **refuses to run** unless the database name ends in `_test`, so tests can never wipe development data.
- Tables are created once per test session with `metadata.create_all` (the same function the init script uses).
- Creating the two databases (`createdb …`) is a one-time manual step, documented in the README. PostgreSQL credentials belong to the user and are not assumed.

### 3.2 Isolation between tests

One simple mechanism for every backend test: an autouse fixture runs `TRUNCATE users, vehicles RESTART IDENTITY CASCADE` before each test. Every test starts from an empty database, real commits work normally (so concurrency and persistence tests need no special handling), and test order does not matter. At this data size the cost is negligible. FastAPI's `get_db` dependency is overridden to use the test database.

Data is built with small helpers (`make_user(role=...)`, `make_vehicle(quantity=...)`, `auth_headers(user)`). No test depends on another test's data.

### 3.3 Repeatability

- Token-expiry tests create tokens with an explicit past `exp` instead of sleeping.
- Settings (JWT secret, lifetime, DB URL) are injected for tests, never read from the developer's real `.env`.
- Concurrency tests use a `threading.Barrier` so threads start together and are run several times during development to check for flakiness.
- Frontend tests reset mocks and `localStorage` after each test.
- Commands: `pytest` in `backend/`, `npm test` in `frontend/`. Both must pass from a clean checkout following the README.

---

## 4. Backend unit tests

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| UT-SEC-01 | DR-07 | — | `hash_password("Secr3t-pass")`, then `verify_password` with the same input | Hash ≠ plaintext and does not contain it; verify returns `True`. |
| UT-SEC-02 | DR-07 | A hash of `"Secr3t-pass"` | `verify_password("wrong", hash)` | `False`. |
| UT-SEC-03 | DR-07 | — | Hash the same password twice | Two different hashes (salted); both verify. |
| UT-SEC-04 | REQ-AUTH-02 | Test secret configured | `create_access_token(sub="42")`, then decode | `sub == "42"`; `exp` ≈ now + 60 min. |
| UT-SEC-05 | DR-01 | — | Decode a token whose `exp` is in the past | Invalid-token error. |
| UT-SEC-06 | DR-01 | — | Decode a token signed with a different secret | Invalid-token error. |
| UT-SEC-07 | DR-01 | — | Decode a token with a modified payload, and one with `alg: none` | Both rejected. |
| UT-VAL-01 | DR-05 | — | Vehicle schema with missing / empty / whitespace-only `make`, `model`, `category` | Validation error naming the field. |
| UT-VAL-02 | DR-05 | — | `price` = 0, −1, `"abc"` | Validation error. `0.01` accepted. |
| UT-VAL-03 | DR-05 | — | `quantity` = −1, 1.5, `"x"` | Validation error. `0` accepted. |
| UT-VAL-04 | REQ-VEH-01 | — | Valid payload with surrounding whitespace in text fields; `make` of 101 chars | Whitespace trimmed and accepted; 101 chars rejected. |
| UT-VAL-05 | REQ-INV-02 | — | Restock schema with `quantity` 0, −5, 2.5, missing | Validation error; `1` accepted. |
| UT-VAL-06 | REQ-VEH-04 | — | Search params with `min_price > max_price`; negative price | Validation error. Equal bounds accepted. |
| UT-VAL-07 | REQ-AUTH-01 | — | Register schema with invalid email; 7-char password; 129-char password | Validation error. 8-char password accepted. |

---

## 5. Backend integration and API tests

All run against `car_dealership_test` through `TestClient`. "User token" / "admin token" mean a valid token for a user created in the test with that role.

### 5.1 Persistence and database constraints

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| IT-DB-01 | REQ-DB-01 | Empty DB | Create a vehicle through the service and commit; open a **new** session and query it | Row found with identical values. |
| IT-DB-02 | DR-03, DR-05 | Vehicle exists | Bypass the API and set `quantity = -1` via SQL | Integrity error (`CHECK`). |
| IT-DB-03 | DR-05 | — | Insert a vehicle with `price = 0` via SQL | Integrity error. |
| IT-DB-04 | REQ-AUTH-01 | User `a@x.com` exists | Insert another user `a@x.com` at the ORM level | Integrity error (unique). |
| IT-DB-05 | REQ-DB-01 | — | Create a vehicle via the API; dispose the engine and build a fresh app instance; `GET /api/vehicles` | Vehicle still returned (data not held in process memory). |
| IT-DB-06 | REQ-DB-01 | Empty test database with tables dropped | Run the init script's `create_tables()` twice | Tables exist; second run succeeds without error or data loss (idempotent). |

### 5.2 Registration and login

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| API-AUTH-01 | REQ-AUTH-01 | Empty DB | `POST /api/auth/register` `{email, password}` valid | 201; body has `id`, `email`, `role: "user"`; no `password`, `password_hash`, or token. |
| API-AUTH-02 | DR-07 | After API-AUTH-01 | Read the user row | `password_hash` ≠ submitted password and verifies against it. |
| API-AUTH-03 | REQ-AUTH-01 | User `a@x.com` exists | Register `a@x.com` again | 409; still one user row. |
| API-AUTH-04 | REQ-AUTH-01 | User `a@x.com` exists | Register `A@X.COM` | 409 (email normalised to lower case). |
| API-AUTH-05 | REQ-AUTH-01, DR-05 | — | Register with (a) missing email, (b) invalid email, (c) missing password, (d) 7-char password, (e) empty body | 422 each; no user created. |
| API-AUTH-06 | DR-06, REQ-AUTH-06 | — | Register with extra field `"role": "admin"` | 201 with `role: "user"`; DB row role is `user`. |
| API-AUTH-07 | REQ-AUTH-02 | Registered user | `POST /api/auth/login` correct credentials | 200; non-empty `access_token`; `token_type == "bearer"`; `user.role == "user"`. |
| API-AUTH-08 | REQ-AUTH-02 | Registered user | Login with wrong password | 401; generic message. |
| API-AUTH-09 | REQ-AUTH-02 | — | Login with unregistered email | 401; **same** message as API-AUTH-08. |
| API-AUTH-10 | REQ-AUTH-02 | — | Login with missing email or password | 422. |
| API-AUTH-11 | REQ-AUTH-03 | Registered user | Login, then `GET /api/vehicles` with the returned token | 200. |
| API-AUTH-12 | REQ-AUTH-02 | User registered as `a@x.com` | Login with `A@X.com` | 200. |

### 5.3 Authentication and authorisation (cross-cutting)

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| API-AUTHZ-01 | REQ-AUTH-03, DR-01 | A vehicle exists | Call **each** of the 7 vehicle/inventory endpoints with no `Authorization` header (parametrised; the list grows as endpoints are added) | 401 for every endpoint; no data changed. |
| API-AUTHZ-02 | DR-01 | — | Headers `Authorization: Token abc`, `Bearer` with no token, `Bearer not-a-jwt` | 401. |
| API-AUTHZ-03 | DR-01 | User exists | Token with `exp` in the past | 401. |
| API-AUTHZ-04 | DR-01 | User exists | Token signed with another secret | 401. |
| API-AUTHZ-05 | DR-01 | Token issued, then user row deleted | `GET /api/vehicles` | 401. |
| API-AUTHZ-06 | REQ-AUTH-04, DR-02 | Vehicle exists; user token | `DELETE /api/vehicles/{id}` | 403; vehicle still exists. |
| API-AUTHZ-07 | REQ-AUTH-04, DR-02 | Vehicle qty 2; user token | `POST /api/vehicles/{id}/restock` `{quantity: 5}` | 403; quantity still 2. |
| API-AUTHZ-08 | REQ-AUTH-05, DR-02 | Vehicle exists; user token | (a) `POST /api/vehicles` valid body; (b) `PUT /api/vehicles/{id}` valid body | 403 for both; vehicle count and stored values unchanged. |
| API-AUTHZ-09 | REQ-AUTH-04, REQ-AUTH-05 | Admin token | Create, update, delete, restock, purchase, list, search | Each returns its success code from REQUIREMENTS §2. |
| API-AUTHZ-10 | REQ-AUTH-04 | Admin issued a token, then role changed to `user` in DB | `DELETE /api/vehicles/{id}` with the old token | 403 (role read from DB, not trusted from the token). |
| API-AUTHZ-11 | REQ-AUTH-06 | Admin created via the script's `main()` (as ADM-01) | Log in through the API as that admin; `POST /api/vehicles` | 200 login with `role: "admin"`; 201 create. |
| API-AUTHZ-12 | DR-01 | Unauthenticated | `POST /api/vehicles` with an invalid body | Expected 401 rather than 422. Confirm actual FastAPI behaviour when implemented; if it differs, record the observed behaviour and decide whether to change the code or the expectation — do not silently adjust. |
| API-AUTHZ-13 | REQ-AUTH-05 | Regular user token | Regular user calls `GET /api/vehicles`, `GET /api/vehicles/search`, `POST …/purchase` on an in-stock vehicle | 200 for each (regular-user permissions are not over-restricted). |

### 5.4 Vehicle create, list, update, delete

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| API-VEH-01 | REQ-VEH-01, REQ-VEH-02 | Admin token | `POST /api/vehicles` `{make: "Toyota", model: "Corolla", category: "Sedan", price: 21999.99, quantity: 3}` | 201; body echoes fields plus integer `id`; price exactly `21999.99`; row persisted. |
| API-VEH-02 | DR-05 | Admin token | Parametrised invalid creates: each field missing; empty `make`; `price` 0 / −1 / `"abc"`; `quantity` −1 / 1.5 | 422 each; vehicle count unchanged. |
| API-VEH-03 | REQ-VEH-01 | Admin token | Create two identical vehicles; also send `id: 999` in a body | Two distinct server-generated IDs; client `id` ignored. |
| API-VEH-04 | REQ-VEH-03 | Empty DB; user token | `GET /api/vehicles` | 200 `[]`. |
| API-VEH-05 | REQ-VEH-03 | 3 vehicles, one with quantity 0; user token | `GET /api/vehicles` | 200; all 3 returned, including the zero-stock one, each with all six fields. |
| API-VEH-06 | REQ-VEH-05 | Vehicle exists; admin token | `PUT /api/vehicles/{id}` with new make/model/category/price/quantity | 200; response and a following list show new values; `id` unchanged. |
| API-VEH-07 | REQ-VEH-05, DR-04 | Admin token | `PUT /api/vehicles/99999` valid body | 404. |
| API-VEH-08 | REQ-VEH-05, DR-05 | Vehicle exists; admin token | `PUT` with `price: -5`; with missing `model`; with `quantity: -1` | 422 each; stored vehicle unchanged. |
| API-VEH-09 | REQ-VEH-06 | Vehicle exists; admin token | `DELETE /api/vehicles/{id}` | 204; list and search no longer include it; a following `PUT` returns 404. |
| API-VEH-10 | REQ-VEH-06, DR-04 | Admin token | `DELETE /api/vehicles/99999` | 404. |
| API-VEH-11 | DR-05 | Admin token | `PUT`, `DELETE`, purchase, restock on `/api/vehicles/abc` | 422. |
| API-VEH-12 | REQ-VEH-05 | Vehicle qty 3; admin token | `PUT` with `quantity: 0`, then with `quantity: 10` | 200 both; stored quantity follows (admin may correct stock via PUT). |

### 5.5 Search

Seed for this group: Toyota Corolla Sedan 20000 (qty 2); Toyota RAV4 SUV 30000 (qty 0); Honda Civic Sedan 25000 (qty 1); Ford F-150 Truck 45000 (qty 4). User token.

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| API-SRCH-01 | REQ-VEH-04 | Seed | `?make=toy` | Corolla and RAV4 (case-insensitive substring; zero-stock RAV4 included). |
| API-SRCH-02 | REQ-VEH-04 | Seed | `?model=CIVIC` | Civic only. |
| API-SRCH-03 | REQ-VEH-04 | Seed | `?category=sedan` | Corolla and Civic. |
| API-SRCH-04 | REQ-VEH-04 | Seed | `?min_price=25000` | Civic, RAV4, F-150 (inclusive lower bound). |
| API-SRCH-05 | REQ-VEH-04 | Seed | `?max_price=25000` | Corolla, Civic (inclusive upper bound). |
| API-SRCH-06 | REQ-VEH-04 | Seed | `?min_price=20000&max_price=30000` | Corolla, Civic, RAV4. |
| API-SRCH-07 | REQ-VEH-04 | Seed | `?make=toyota&category=suv&max_price=35000` | RAV4 only (AND). |
| API-SRCH-08 | REQ-VEH-04 | Seed | `?make=Tesla` | 200 `[]`. |
| API-SRCH-09 | REQ-VEH-04 | Seed | No parameters | All 4 vehicles. |
| API-SRCH-10 | REQ-VEH-04, DR-05 | Seed | `?min_price=30000&max_price=10000`; `?min_price=-1`; `?max_price=abc` | 422 each. |
| API-SRCH-11 | REQ-VEH-04 | Seed | `?make=%`, `?make=_`, `?make=' OR 1=1 --` | 200 `[]` (matched literally). |
| API-SRCH-12 | REQ-VEH-04 | Seed | `GET /api/vehicles/search` | 200 (not shadowed by an `/{id}` route). |

### 5.6 Purchase and restock

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| API-INV-01 | REQ-INV-01 | Vehicle qty 3; user token | `POST /api/vehicles/{id}/purchase` (no body) | 200; quantity 2 in response and DB (exactly one unit). |
| API-INV-02 | REQ-INV-01 | Vehicle qty 1 | Purchase | 200; quantity 0. |
| API-INV-03 | DR-03 | Vehicle qty 0 | Purchase | 409 "out of stock"; quantity stays 0. |
| API-INV-04 | DR-04 | — | Purchase `/api/vehicles/99999/purchase` | 404. |
| API-INV-05 | REQ-INV-02 | Vehicle qty 2; admin token | Restock `{quantity: 5}` | 200; quantity 7 in response and DB. |
| API-INV-06 | REQ-INV-02, DR-05 | Vehicle qty 2; admin token | Restock `{quantity: 0}`, `{quantity: -3}`, `{quantity: 1.5}`, `{}` | 422 each; quantity stays 2. |
| API-INV-07 | DR-04 | Admin token | Restock `/api/vehicles/99999/restock` `{quantity: 1}` | 404. |
| API-INV-08 | REQ-INV-01, REQ-INV-02 | Vehicle qty 0 | User purchase (409); admin restock 1; user purchase | 409, then 200 qty 1, then 200 qty 0. |

### 5.7 Concurrency

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| CT-01 | DR-08, DR-03 | Vehicle qty 3 committed | 10 threads, each with its own session, purchase simultaneously (barrier start) | Exactly 3 succeed and 7 get out-of-stock; final quantity 0; never negative. |
| CT-02 | DR-08 | Vehicle qty 5 committed | 5 concurrent purchases and 1 concurrent restock of 10 | All purchases succeed; final quantity 10 (5 − 5 + 10). |
| CT-03 | DR-08 | Vehicle qty 5 committed | 5 concurrent purchases | All succeed; final quantity 0. |

Harness: threads call the inventory service directly, each with its own session, because `TestClient` is synchronous. The HTTP mapping of out-of-stock to 409 is already covered by API-INV-03.

### 5.8 Admin-creation script (REQ-AUTH-06)

The script is `scripts/create_admin.py`, run as `python -m scripts.create_admin --email <email>`. Behaviour (from DEVELOPMENT_PLAN §6): if the email belongs to an admin, report and exit 0 without prompting; if it belongs to a regular user, promote to admin without changing the password; otherwise prompt twice with `getpass` (no echo), validate the password policy, and create the admin.

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| ADM-01 | REQ-AUTH-06 | Empty DB | `main(["--email", "admin@x.com"])` with `getpass` patched to return a valid password twice | Exit code 0; one user with role `admin`; stored hash verifies the password. |
| ADM-02 | REQ-AUTH-06 | After ADM-01 | Run the same command again | Exit code 0; still exactly one user; hash unchanged; `getpass` not called; message says the admin already exists. |
| ADM-03 | REQ-AUTH-06 | Regular user `u@x.com` exists | Run with `--email u@x.com` | Exit 0; role becomes `admin`; password hash unchanged; `getpass` not called. |
| ADM-04 | REQ-AUTH-06, DR-07 | Empty DB | Run ADM-01 capturing stdout/stderr (`capsys`) and log records (`caplog`) | The password string appears in none of them. The argument parser has no `--password` option (passing one is an error). |
| ADM-05 | REQ-AUTH-06 | Empty DB | (a) confirmation does not match; (b) 7-char password; (c) invalid email | Non-zero exit with a clear message; no user created. |

---

## 6. Frontend component tests

The app's API module is replaced with `vi.mock`; tests assert on what the user sees and on which API functions were called with which arguments. Queries use accessible roles and labels (`getByRole`, `getByLabelText`).

### 6.1 Authentication UI

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| FE-AUTH-01 | REQ-FE-02 | Login page | Submit with empty fields | Required-field messages; no API call. |
| FE-AUTH-02 | REQ-FE-02 | Login page | Enter `not-an-email`, submit | Email format message; no API call. |
| FE-AUTH-03 | REQ-FE-02 | `login` resolves with token and user | Valid credentials, submit | `login` called with the input; token stored; navigates to dashboard. |
| FE-AUTH-04 | REQ-FE-02 | `login` rejects with 401 | Submit valid-looking credentials | Error message; stays on login; no token stored. |
| FE-AUTH-05 | REQ-FE-02 | Register page | Submit empty; invalid email; 7-char password | Field messages; no API call. No role field rendered. |
| FE-AUTH-06 | REQ-FE-02 | `register` resolves 201; `login` resolves | Valid submit | `register` then `login` called; lands on dashboard. |
| FE-AUTH-07 | REQ-FE-02 | `register` rejects with 409 | Valid submit | "Email already registered" shown. |
| FE-AUTH-08 | REQ-FE-02 | Logged in | Click "Log out" | Token cleared; redirected to login. |
| FE-AUTH-09 | REQ-FE-03, DR-01 | No token | Visit dashboard route | Redirected to login. |
| FE-AUTH-10 | DR-01 | Logged in; `listVehicles` rejects with 401 | Load dashboard | Token cleared; redirected to login with a "session expired" message. |
| FE-AUTH-11 | REQ-FE-02 | `login` pending | Observe submit button | Disabled while pending. |

### 6.2 Vehicle list and purchase

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| FE-VEH-01 | REQ-FE-03 | `listVehicles` resolves 2 vehicles | Render dashboard | Loading indicator, then both vehicles with make, model, category, formatted price, quantity. |
| FE-VEH-02 | REQ-FE-03 | `listVehicles` resolves `[]` | Render | Empty-state message. |
| FE-VEH-03 | REQ-FE-03 | `listVehicles` rejects (500) | Render | Error message with retry. |
| FE-VEH-04 | REQ-FE-05 | Vehicle qty 2 | Render card | "Purchase" enabled. |
| FE-VEH-05 | REQ-FE-05 | Vehicle qty 0 | Render card | "Purchase" **disabled**; "Out of stock" shown. |
| FE-VEH-06 | REQ-INV-01, REQ-FE-05 | Vehicle qty 2; `purchaseVehicle` resolves qty 1 | Click Purchase | `purchaseVehicle(id)` called once; button disabled while pending; quantity shows 1; success feedback. |
| FE-VEH-07 | REQ-FE-05 | Vehicle qty 1; `purchaseVehicle` resolves qty 0 | Click Purchase | Quantity 0; button disabled. |
| FE-VEH-08 | DR-03 | Vehicle qty 1 shown; `purchaseVehicle` rejects 409 | Click Purchase | "Out of stock" error; list refreshed from the server. |

### 6.3 Search and filter

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| FE-SRCH-01 | REQ-FE-04 | Dashboard | Fill make, model, category, min, max; submit | `searchVehicles` called once with `{make, model, category, min_price, max_price}`; results replace the list. |
| FE-SRCH-02 | REQ-FE-04 | Dashboard | Fill only make; submit | Called with only `make`. |
| FE-SRCH-03 | REQ-FE-04 | Dashboard | min 30000, max 10000; submit | Validation message; no API call. |
| FE-SRCH-04 | REQ-FE-04 | `searchVehicles` resolves `[]` | Submit | "No vehicles match" message. |
| FE-SRCH-05 | REQ-FE-04 | Results shown | Click "Clear" | Inputs empty; full list shown again. |

### 6.4 Admin UI

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| FE-ADM-01 | REQ-FE-06, REQ-AUTH-05 | Logged in as regular user | Render dashboard | No Add / Edit / Delete controls; Purchase still shown. |
| FE-ADM-02 | REQ-FE-06 | Logged in as admin | Render dashboard | Add button and Edit/Delete per card visible. |
| FE-ADM-03 | REQ-FE-06, DR-05 | Admin, Add form open | Submit empty; price 0; quantity −1; quantity 1.5 | Field errors; no API call. |
| FE-ADM-04 | REQ-FE-06, REQ-VEH-02 | `createVehicle` resolves | Submit valid form | Called with correct body; new vehicle appears; form closes. |
| FE-ADM-05 | REQ-FE-06, REQ-VEH-05 | Admin; `updateVehicle` resolves | Click Edit, change price, save | Form pre-filled with current values; `updateVehicle(id, body)` called; card updates. |
| FE-ADM-06 | REQ-FE-06, REQ-VEH-06 | Admin; `deleteVehicle` resolves | Delete → Cancel; then Delete → Confirm | Cancel: no call. Confirm: `deleteVehicle(id)` called; card removed. |
| FE-ADM-07 | OPT-02 | Admin; `restockVehicle` resolves | Enter 0 → error; enter 5, submit | Validation for 0; called with 5; quantity updates. **Only if OPT-02 is built.** |
| FE-ADM-08 | REQ-FE-06 | Admin; `createVehicle` rejects 422 or 403 | Submit | Server error shown; form stays open with input preserved. |

### 6.5 Responsive design and UX (manual)

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| FE-UX-01 | REQ-FE-07 | Running app with seeded data | View login, register, dashboard, admin forms at 375, 768, 1280 px | No horizontal scroll; readable; controls reachable; grid adapts. |
| FE-UX-02 | REQ-FE-07 | Running app | Navigate all forms by keyboard only | Visible focus; logical tab order; errors next to their fields. |

---

## 7. End-to-end checklist (manual)

Run against the real stack (FastAPI + PostgreSQL + Vite). Outcomes, including failures, are recorded in `docs/TEST_REPORT.md`.

| ID | Req | Preconditions | Action | Expected outcome |
|---|---|---|---|---|
| E2E-01 | REQ-FE-02, REQ-AUTH-01/02 | Fresh DB | Register in the UI | Logged in automatically; dashboard shown. |
| E2E-02 | REQ-FE-03 | Admin has created several vehicles, one with qty 0 | Log in as a regular user | All vehicles listed, including the zero-stock one. |
| E2E-03 | REQ-FE-04 | As E2E-02 | Search by make, by category, by price range; clear | Results match the data; clear restores the list. |
| E2E-04 | REQ-FE-05, REQ-INV-01 | Vehicle qty 2 | Purchase twice | 2 → 1 → 0; button disabled at 0; still 0 after reload. |
| E2E-05 | REQ-FE-06, REQ-AUTH-05/06 | Admin created by following the README's `create_admin` instructions | Log in as admin; add, edit, delete a vehicle | Each change visible and survives reload; the regular user's UI shows no admin controls. |
| E2E-06 | DR-02, REQ-AUTH-04/05 | Regular user's token | `curl` POST, PUT, DELETE, restock | 403 for each. |
| E2E-07 | DR-01 | — | `curl` `GET /api/vehicles` without a token | 401. |
| E2E-08 | REQ-DB-01 | Data present | Stop and restart the backend; reload frontend | All data still present. |

---

## 8. Test reporting

- Backend: `pytest --cov=app --cov=scripts --cov-report=term-missing`.
- Frontend: `npx vitest run --coverage`.
- `docs/TEST_REPORT.md` contains the verbatim terminal output of the final runs, the date/time, the commit hash, and the E2E/FE-UX checklist results. The README quotes the real totals. Failing or skipped tests are reported, not hidden. No result is written before it has been produced.

---

## 9. P2 scenarios (after all P1 work is done)

UT-SEC-03, UT-SEC-07, IT-DB-03, IT-DB-04, API-AUTH-04, API-AUTH-12, API-AUTHZ-02 (beyond the missing-header case), API-AUTHZ-10, API-AUTHZ-12, API-VEH-03, API-VEH-11, API-SRCH-11, API-SRCH-12, CT-02, CT-03, FE-AUTH-10, FE-AUTH-11, FE-VEH-03, FE-VEH-08, FE-SRCH-05, FE-ADM-07 (only with OPT-02), FE-ADM-08, FE-UX-02.

Everything else in §4–§7 is P1, including CT-01 (oversell protection), all ADM tests, and all 401/403 checks for the permission matrix.

---

## 10. Traceability check

Every mandatory requirement in `REQUIREMENTS.md` §11 has at least one scenario here. Requirements verified only by inspection (process, Git, README, `PROMPTS.md`, plagiarism) are checked in the final submission review (DEVELOPMENT_PLAN §10).
