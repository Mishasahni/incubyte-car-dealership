# Test Report

Generated from real runs on **2026-10-26 00:22 IST** at commit **`7d3e352`**, on the local development machine against the PostgreSQL test database.
- All output below is pasted verbatim from the terminal.
- The only edits: colour codes were removed, and so were the exit-status lines the runner appended. Every command exited with status 0.

## Summary

| Suite | Result | Coverage |
|---|---|---|
| Backend (pytest, PostgreSQL test database) | **155 passed**, 0 failed, 1 warning | 97% of `app/` and `scripts/` (481 statements, 14 missed) |
| Frontend (Vitest + React Testing Library) | **50 passed**, 0 failed (7 files) | 90.09% of lines in `src/` (391 of 434) |
| Backend lint (`ruff check`, `ruff format --check`) | Clean | — |
| Frontend lint (oxlint) | 1 warning, 0 errors | — |
| Frontend production build (`tsc -b && vite build`) | Succeeds | — |

**The warnings:**
- **pytest:** Starlette's deprecation notice about using `httpx` with its test client. It comes from a dependency, not from the project's code.
- **oxlint:** `setState` in the effect that loads the inventory when a page opens (`useInventory.ts`). That load-on-open behaviour is intended.

**Changes since the previous report**, which ran at `45eb915` with 138 backend and 29 frontend tests:
- 17 new backend tests: demo access and the demo-account script.
- 21 new frontend tests: the separate buyer and admin experiences and routing, the sign-in and registration redesign, and demo access.

## How to reproduce

```bash
cd backend && .venv/bin/python -m pytest --cov=app --cov=scripts --cov-report=term
```

```bash
cd backend && .venv/bin/ruff check . && .venv/bin/ruff format --check .
```

```bash
cd frontend && npm run coverage
```

```bash
cd frontend && npx oxlint && npm run build
```

## Backend: pytest with coverage

```
============================= test session starts ==============================
platform darwin -- Python 3.14.4, pytest-9.1.1, pluggy-1.7.0
rootdir: /Users/nimishasahni/Desktop/incubyte-car-dealership/backend
configfile: pyproject.toml
testpaths: tests
plugins: cov-7.1.0, anyio-4.15.1
collected 155 items

tests/api/test_auth_demo.py ..........                                   [  6%]
tests/api/test_auth_login.py .......                                     [ 10%]
tests/api/test_auth_register.py .........                                [ 16%]
tests/api/test_authorization.py ...................                      [ 29%]
tests/api/test_cors.py ....                                              [ 31%]
tests/api/test_smoke.py ..                                               [ 32%]
tests/api/test_vehicles_create.py ..................                     [ 44%]
tests/api/test_vehicles_delete.py ..                                     [ 45%]
tests/api/test_vehicles_list.py ..                                       [ 47%]
tests/api/test_vehicles_purchase.py ....                                 [ 49%]
tests/api/test_vehicles_restock.py .......                               [ 54%]
tests/api/test_vehicles_search.py .................                      [ 65%]
tests/api/test_vehicles_update.py ......                                 [ 69%]
tests/db/test_concurrent_purchases.py .                                  [ 69%]
tests/db/test_persistence.py .                                           [ 70%]
tests/db/test_user_model.py .                                            [ 70%]
tests/db/test_vehicle_model.py ...                                       [ 72%]
tests/scripts/test_create_admin.py .........                             [ 78%]
tests/scripts/test_create_demo_accounts.py .......                       [ 83%]
tests/scripts/test_init_db.py .                                          [ 83%]
tests/unit/test_auth_schemas.py ....                                     [ 86%]
tests/unit/test_db_guard.py ......                                       [ 90%]
tests/unit/test_inventory_schemas.py .....                               [ 93%]
tests/unit/test_security.py .....                                        [ 96%]
tests/unit/test_vehicle_schemas.py .....                                 [100%]

=============================== warnings summary ===============================
.venv/lib/python3.14/site-packages/fastapi/testclient.py:1
  /Users/nimishasahni/Desktop/incubyte-car-dealership/backend/.venv/lib/python3.14/site-packages/fastapi/testclient.py:1: StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.
    from starlette.testclient import TestClient as TestClient  # noqa

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
================================ tests coverage ================================
_______________ coverage: platform darwin, python 3.14.4-final-0 _______________

Name                                Stmts   Miss  Cover
-------------------------------------------------------
app/__init__.py                         0      0   100%
app/api/__init__.py                     0      0   100%
app/api/deps.py                        31      0   100%
app/api/routes/__init__.py              0      0   100%
app/api/routes/auth.py                 33      0   100%
app/api/routes/vehicles.py             39      0   100%
app/core/__init__.py                    0      0   100%
app/core/config.py                     20      1    95%
app/core/security.py                   21      0   100%
app/db/__init__.py                      0      0   100%
app/db/base.py                          2      0   100%
app/db/session.py                      13      0   100%
app/main.py                            17      0   100%
app/models/__init__.py                  3      0   100%
app/models/user.py                      9      0   100%
app/models/vehicle.py                  12      0   100%
app/schemas/__init__.py                 0      0   100%
app/schemas/auth.py                    12      0   100%
app/schemas/inventory.py                3      0   100%
app/schemas/vehicle.py                 24      0   100%
app/services/__init__.py                0      0   100%
app/services/auth_service.py           33      3    91%
app/services/demo_service.py           28      0   100%
app/services/inventory_service.py      19      0   100%
app/services/vehicle_service.py        39      0   100%
scripts/__init__.py                     0      0   100%
scripts/create_admin.py                51      1    98%
scripts/create_demo_accounts.py        57      3    95%
scripts/init_db.py                     15      6    60%
-------------------------------------------------------
TOTAL                                 481     14    97%
======================== 155 passed, 1 warning in 6.02s ========================
```

## Backend: lint

```
All checks passed!
63 files already formatted
```

## Frontend: Vitest with coverage

```
> car-dealership-frontend@0.0.0 coverage
> vitest run --coverage


 RUN  v5.0.5 /Users/nimishasahni/Desktop/incubyte-car-dealership/frontend
      Coverage enabled with v8


 Test Files  7 passed (7)
      Tests  50 passed (50)
   Start at  00:23:04
   Duration  2.08s (environment 43%, tests 37%, setup 9%, import 6%, transform 4%, worker 2%)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |    89.2 |    86.11 |    89.2 |   90.09 |                   
 src/api           |   62.16 |    58.33 |      40 |   61.29 |                   
  auth.ts          |      25 |      100 |      25 |      25 | 18-22,39          
  client.ts        |      84 |    58.33 |     100 |   89.47 | 40,48             
  vehicles.ts      |    12.5 |      100 |   14.28 |    12.5 | 28-49             
 src/auth          |   96.49 |    95.65 |     100 |      98 |                   
  AuthContext.tsx  |   96.96 |       75 |     100 |     100 | 84                
  session.ts       |   85.71 |      100 |     100 |   85.71 | 16                
 src/components    |   85.02 |    81.81 |   91.66 |   86.14 |                   
  AccountMenu.tsx  |   89.47 |    66.66 |     100 |   93.75 | 16                
  AdminDialogs.tsx |   80.76 |       80 |   83.33 |   80.76 | 9,39-40,94-95     
  BuyerFilters.tsx |      70 |    66.66 |   57.14 |   77.77 | 28,58             
  ...toryTable.tsx |   91.66 |       75 |   85.71 |   91.66 | 68                
  Modal.tsx        |      50 |    45.83 |     100 |      48 | 29-31,34-43       
  ...FormPanel.tsx |   97.36 |    94.44 |     100 |     100 | 22,68             
  ...ustration.tsx |    87.5 |    66.66 |     100 |    92.3 | 13                
 ...omponents/auth |    97.5 |    97.22 |   94.44 |   97.29 |                   
  DemoAccess.tsx   |   96.29 |    92.85 |      90 |      96 | 75                
 src/inventory     |   96.38 |    81.81 |   96.55 |   95.77 |                   
  useInventory.ts  |   95.16 |    76.47 |   95.23 |   94.23 | 51,107-108        
 src/pages         |    93.5 |    93.25 |   90.62 |   95.77 |                   
  ...ntoryPage.tsx |   94.11 |    91.11 |   88.88 |   96.77 | 136               
  AuthForm.tsx     |   95.23 |       90 |     100 |     100 | 32,42             
  ...ntoryPage.tsx |   81.81 |      100 |      80 |      80 | 20-21             
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 89.2% ( 438/491 )
Branches     : 86.11% ( 310/360 )
Functions    : 89.2% ( 157/176 )
Lines        : 90.09% ( 391/434 )
================================================================================
```

## Frontend: lint

```
src/inventory/useInventory.ts:40:10: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
```

## Frontend: production build

```
> car-dealership-frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 126 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                        0.73 kB │ gzip:  0.39 kB
dist/assets/masar-auto-D2bH-M5O.jpg   23.89 kB
dist/assets/index-BE2fnwdy.css        27.99 kB │ gzip:  6.38 kB
dist/assets/index-Bvp8guVK.js        298.49 kB │ gzip: 93.19 kB

✓ built in 101ms
```

## Concurrency test (CT-01) repeated runs

CT-01 (ten simultaneous buyers, stock of three) was run repeatedly during M6, in a shell loop, because a single pass cannot show that a race is absent:

| Code under test | Runs | Result |
|---|---|---|
| Read-then-write purchase (before the fix, commit `e3153fe`) | 20 | Failed 20 of 20: all 10 buyers succeeded, final stock 2 (oversold) |
| Atomic conditional `UPDATE` (commit `017f2d7`) | 25 | Passed 25 of 25 |
| Final M6 code (commit `86cbd65`) | 20 | Passed 20 of 20 |

A passing run shows no oversell occurred in that run; the guarantee itself comes from PostgreSQL's row locking and the `CHECK (quantity >= 0)` constraint.

In the run above, CT-01 is `tests/db/test_concurrent_purchases.py` and passed once. The repeated runs in the table date from M6 and weren't repeated for this report.

## Manual end-to-end checks (browser)

These checks were made by driving the running app in a browser against the real backend and the local PostgreSQL development database. They aren't automated; each records what was actually observed at the time.

### Redesigned interface (25–26 Oct)

Commits `d492c78`, `dad6526` and `4bce7da`. The code tested by those checks is unchanged at `7d3e352`.

| Area | Check | Outcome |
|---|---|---|
| Buyer storefront | Grid at 1280, 768 and 375 px | Pass: 3, 2 and 1 columns; no horizontal scrolling |
| Buyer storefront | Search by category, and by category with a minimum price | Pass: the API returned only matching vehicles |
| Buyer storefront | "In stock only", then Reset | Pass: the sold-out vehicle was hidden without a new request; Reset restored the full list |
| Buyer storefront | Purchase | Pass: stock fell by one from the backend's response; confirmation shown |
| Buyer storefront | A buyer opens `/admin` directly | Pass: redirected to the storefront; no admin navigation |
| Admin console | Add, edit, restock and delete a test vehicle | Pass: each change was saved by the backend, shown in the table and summary, and confirmed; delete asked for confirmation naming the vehicle |
| Admin console | Stock attention view | Pass: only vehicles with one unit or none |
| Admin console | Layout at 375 px | Pass: sidebar becomes a top bar, rows stack, no horizontal scrolling |
| Sign-in | Wrong password, then correct password (buyer and admin) | Pass: "Invalid email or password" with the email kept; the right password opened the storefront or `/admin` |
| Registration | Short password, then an email already registered | Pass: the 8–128 rule shown inline; "Email already registered" from the server |
| Sign-in and registration | Password visibility toggle, keyboard order, layout at 375, 768 and 1280 px | Pass |
| Demo access | Server setting off | Pass: status reports it off, demo sign-in returns 404, no demo entry on the sign-in page |
| Demo access | Server setting on: buyer demo, admin demo | Pass: buyer session refused vehicle creation (403) and redirected away from `/admin`; admin session opened Inventory Management |
| Demo access | Demo passwords in the frontend build | Pass: absent from the built bundle |

### First interface (25 Oct, before the redesign)

Run on 2026-10-25 against the real stack (FastAPI on port 8000, Vite on port 5173, local PostgreSQL), using local demo accounts and demo inventory.

| ID | Check | Outcome |
|---|---|---|
| E2E-01 | Register a new account in the UI | Pass: signed in automatically, inventory shown |
| E2E-02 | Regular user sees every vehicle, including one with zero stock | Pass |
| E2E-03 | Search by category and minimum price | Pass: `suv` with min 1,500,000 returned the two matching SUVs and excluded the ₹14,99,000 one |
| E2E-04 | Purchase as a regular user | Pass: stock 3 → 2, confirmation shown; the zero-stock vehicle's button is disabled |
| E2E-05 | Admin adds, restocks and deletes a vehicle | Pass: add (after a server-side validation message), restock 1 → 5, delete after confirmation |
| E2E-06 | Regular user has no admin controls | Pass in the UI; the 403 responses are covered by backend tests API-AUTHZ-06 to -08 |
| E2E-07 | Request without a token | Covered by backend test API-AUTHZ-01 (401 on every endpoint); not repeated by hand |
| E2E-08 | Data survives a backend restart | Covered by backend test IT-DB-05; not repeated by hand |
| FE-UX-01 | Layout at 375, 768 and 1280 px | Pass after one fix: at 375 px the header wrapped, fixed in `f42fe4d`. See `docs/screenshots/` |

Defect found during this check and fixed test-first: the vehicle form accepted prices longer than the backend's `NUMERIC(12,2)` column allows (red `78c06db`, green `766c795`).

## Not covered

**Lower-priority tests from TEST_PLAN §9 that weren't written:**
- UT-SEC-03 and UT-SEC-07.
- API-AUTH-04 and -12 (email case-insensitivity: emails are currently matched exactly).
- API-AUTHZ-12, API-VEH-11 and API-SRCH-12.
- CT-02 and CT-03.
- FE-VEH-03 (error state with retry).
- FE-UX-02 (keyboard-only navigation of every form). The sign-in and registration pages were checked by hand.

**Test IDs:**
- TEST_PLAN's FE-AUTH-11 (submit button disabled while sign-in is pending) is now covered, by the test labelled FE-AUTH-13 in `LoginPage.test.tsx`.
- The frontend tests labelled FE-AUTH-11 to -16, FE-SRCH-06/07, FE-ADM-09/10, FE-ROLE-01 to -03 and FE-DEMO-01 to -08 were added after the test plan. Their numbers don't refer to TEST_PLAN entries.

**Frontend-to-backend integration:** the frontend tests mock the API module, so this is verified by the manual checks above rather than by automated tests.
