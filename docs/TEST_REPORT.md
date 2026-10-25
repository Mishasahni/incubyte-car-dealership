# Test Report

Generated from real runs on **2026-10-25 18:44 IST** at commit **`45eb915`**. All output below is pasted verbatim from the terminal; nothing has been edited except removing colour codes and blank lines from the frontend output.

## Summary

| Suite | Result | Coverage |
|---|---|---|
| Backend (pytest, PostgreSQL test database) | **138 passed**, 0 failed | 97% of `app/` and `scripts/` |
| Frontend (Vitest + React Testing Library) | **29 passed**, 0 failed | 88% of lines in `src/` |
| Backend lint (ruff check, ruff format --check) | Clean | — |
| Frontend lint (oxlint) and production build | 1 warning (see below), build succeeds | — |

The one pytest warning is Starlette's deprecation notice about using `httpx` with its test client. The oxlint warning flags `setState` in the effect that loads the inventory when the page opens; that load-on-open behaviour is intended.

## How to reproduce

```bash
cd backend && .venv/bin/python -m pytest --cov=app --cov=scripts --cov-report=term
```

```bash
cd frontend && npm run coverage
```

## Backend: pytest with coverage

```
........................................................................ [ 52%]
..................................................................       [100%]
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
app/api/routes/auth.py                 20      0   100%
app/api/routes/vehicles.py             46      0   100%
app/core/__init__.py                    0      0   100%
app/core/config.py                     12      1    92%
app/core/security.py                   21      0   100%
app/db/__init__.py                      0      0   100%
app/db/base.py                          2      0   100%
app/db/session.py                      13      0   100%
app/main.py                            16      0   100%
app/models/__init__.py                  3      0   100%
app/models/user.py                      9      0   100%
app/models/vehicle.py                  12      0   100%
app/schemas/__init__.py                 0      0   100%
app/schemas/auth.py                    10      0   100%
app/schemas/inventory.py                3      0   100%
app/schemas/vehicle.py                 24      0   100%
app/services/__init__.py                0      0   100%
app/services/auth_service.py           33      3    91%
app/services/inventory_service.py      19      0   100%
app/services/vehicle_service.py        39      0   100%
scripts/__init__.py                     0      0   100%
scripts/create_admin.py                51      1    98%
scripts/init_db.py                     15      6    60%
-------------------------------------------------------
TOTAL                                 379     11    97%
138 passed, 1 warning in 4.93s
```

## Backend: lint

```
All checks passed!
59 files already formatted
```

## Frontend: Vitest with coverage

```
 RUN  v5.0.5 /Users/nimishasahni/Desktop/incubyte-car-dealership/frontend
      Coverage enabled with v8
 Test Files  6 passed (6)
      Tests  29 passed (29)
   Start at  18:44:23
   Duration  1.89s (tests 39%, environment 32%, setup 13%, import 8%, transform 6%, worker 2%)
 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   88.04 |    83.68 |   88.03 |   88.37 |                   
 src/api           |      60 |       50 |   38.46 |   58.62 |                   
  auth.ts          |       0 |      100 |       0 |       0 | 18-22             
  client.ts        |      80 |       50 |     100 |   84.21 | 40,48-52          
  vehicles.ts      |    12.5 |      100 |   14.28 |    12.5 | 28-49             
 src/auth          |      96 |    94.73 |     100 |   97.72 |                   
  AuthContext.tsx  |   96.66 |       75 |     100 |     100 | 72                
  session.ts       |   85.71 |      100 |     100 |   85.71 | 16                
 src/components    |   84.28 |    82.92 |    92.3 |   84.67 |                   
  AdminDialogs.tsx |   80.76 |       75 |   83.33 |   80.76 | 9,39-40,84-85     
  FilterBar.tsx    |   91.66 |    81.81 |      80 |   95.23 | 49                
  Modal.tsx        |      50 |    45.83 |     100 |      48 | 29-31,34-43       
  ...FormPanel.tsx |   97.36 |    94.44 |     100 |     100 | 22,68             
 src/pages         |   97.22 |    92.06 |   93.47 |   96.87 |                   
  AuthForm.tsx     |     100 |    93.75 |     100 |     100 | 36                
  ...boardPage.tsx |    96.2 |    91.48 |    92.1 |   95.58 | 145,161,168       
-------------------|---------|----------|---------|---------|-------------------
=============================== Coverage summary ===============================
Statements   : 88.04% ( 302/343 )
Branches     : 83.68% ( 200/239 )
Functions    : 88.03% ( 103/117 )
Lines        : 88.37% ( 266/301 )
================================================================================
```

## Frontend: lint and production build

```
src/pages/DashboardPage.tsx:59:10: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.
> car-dealership-frontend@0.0.0 build
> tsc -b && vite build
vite v8.3.5 building client environment for production...
transforming...
✓ 111 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.47 kB │ gzip:  0.30 kB
dist/assets/index-DhGpllrM.css   21.73 kB │ gzip:  5.06 kB
dist/assets/index-k6_iiNSZ.js   279.21 kB │ gzip: 87.96 kB
✓ built in 86ms
```

## Concurrency test (CT-01) repeated runs

CT-01 (ten simultaneous buyers, stock of three) was run repeatedly during M6, in a shell loop, because a single pass cannot show that a race is absent:

| Code under test | Runs | Result |
|---|---|---|
| Read-then-write purchase (before the fix, commit `e3153fe`) | 20 | Failed 20 of 20: all 10 buyers succeeded, final stock 2 (oversold) |
| Atomic conditional `UPDATE` (commit `017f2d7`) | 25 | Passed 25 of 25 |
| Final M6 code (commit `86cbd65`) | 20 | Passed 20 of 20 |

A passing run shows no oversell occurred in that run; the guarantee itself comes from PostgreSQL's row locking and the `CHECK (quantity >= 0)` constraint.

## Manual end-to-end check (browser)

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

Lower-priority tests from TEST_PLAN §9 that were not written: UT-SEC-03, UT-SEC-07, API-AUTH-04 and -12 (email case-insensitivity: emails are currently matched exactly), API-AUTHZ-12, API-VEH-11, API-SRCH-12, CT-02, CT-03, FE-AUTH-11, FE-VEH-03, FE-UX-02. Frontend tests mock the API module, so frontend-to-backend integration is verified by the manual check above rather than by automated tests.
