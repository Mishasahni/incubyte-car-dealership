# PROMPTS

How AI was used to build this project, session by session, with the prompts that drove the work.

This file has two kinds of content, and they are kept apart:

- **Readable extracts (this file).** Prepared by Claude Code from the raw logs for reviewers, then checked by me.
  - Text in quote blocks (`>`) is copied from my own messages. Long briefs are shortened, marked "…", with the full text in the raw log. Line breaks and Markdown formatting may be normalised.
  - Anything in square brackets inside a quote, like `[my email]`, replaces a detail I left out.
  - Everything outside quote blocks is a summary written for this file, not a transcript.
- **Raw evidence: the original session exports** in [`prompts/`](prompts/). These are exactly as the Claude desktop app's session Export wrote them; only the zip files were renamed. Each zip holds the full conversation as JSON Lines (`transcript.jsonl`, including every tool call and its output), the session's metadata, and any browser screenshots from the session.

All times are IST (UTC+5:30).

## Sessions and raw exports

Every Claude Code session used for the project:

| # | Session | When | Raw export | SHA-256 (first 16 hex digits) |
|---|---|---|---|---|
| 1 | **First look at the brief**, titled "Car Dealership Inventory System"; scratch workspace, before the repository existed | 24 Oct, 15:44–15:45 | [`2026-10-24-claude-code-first-session.zip`](prompts/2026-10-24-claude-code-first-session.zip) | `5d166cb0a7e96a1d` |
| 2 | **Main build session**, titled "Car Dealership Inventory System planning": planning, environment, M1–M9 | 24 Oct 21:49 – 25 Oct 18:52 | [`2026-10-24-to-25-claude-code-main-session.zip`](prompts/2026-10-24-to-25-claude-code-main-session.zip) | `37317882e30fc35a` |
| 3 | **Submission session**, titled "Car Dealership Inventory System resume": review, redesigns, demo access, documentation | 25 Oct 18:58 – 23:59 | partial export to 19:29: [`2026-10-25-claude-code-submission-session.zip`](prompts/2026-10-25-claude-code-submission-session.zip) | `164459093f5141f7` |
| | | | full export to 23:59: [`2026-10-25-claude-code-submission-session-full.zip`](prompts/2026-10-25-claude-code-submission-session-full.zip) | `1b390c43c7883dd1` |
| 4 | **Project setup**: running the app and checking my account's role | 25 Oct, 19:28–19:46 | [`2026-10-25-claude-code-project-setup-session.zip`](prompts/2026-10-25-claude-code-project-setup-session.zip) | `24d466b60a37fbe7` |

Notes on the exports:

- **Session 2's last turn was cut short.** Its metadata records that its final turn, at 18:52, ended early with an API safeguard error.
- **Session 3 was exported twice.** The partial export stops at 19:29 and was published first, so it's kept unchanged. The full export, taken at 23:59, contains every record of the partial one unchanged, as its first 736 of 3,122 records, plus everything after.
  - Read the full export for session 3.
  - The rewrite of this file and the credential reset on 26 Oct, after 23:59, aren't in any archive.
- **Session 4 ran alongside session 3**, in the same repository folder, while session 3 was paused.

To read a raw log, unzip it and open `transcript.jsonl`; each line is one event. My messages are the `"type": "user"` entries that aren't tool results.

## Stage 1 — Initial planning and requirements

**Session 1, 24 Oct, 15:44.**
- My only message was the pasted kata brief, which is the assignment's own text, not reproduced here.
- Claude Code replied with a suggested way of working before any code was written: I make the decisions, Claude Code builds, and I check.

**Session 2, 24 Oct, 21:49.** I gave the stack and asked for three planning documents:

> Build the Car Dealership Inventory System described in the attached assignment for the Incubyte Software Craftsperson Apprenticeship. Read the complete assignment carefully and treat it as the source of truth. … Backend: Python with FastAPI · Database: PostgreSQL · ORM: SQLAlchemy · Authentication: JWT and secure password hashing · Frontend: React, TypeScript, Vite, and Tailwind CSS … Evaluate this stack against the assignment and document any significant concerns or alternatives. … Initial task: create three planning documents

Claude Code drafted `docs/REQUIREMENTS.md`, `docs/TEST_PLAN.md` and `docs/DEVELOPMENT_PLAN.md`. I then set the permission model:

> Revise the Existing Planning Documents … Only admins can add vehicles (`POST /api/vehicles`), update vehicles (`PUT /api/vehicles/:id`), delete vehicles (`DELETE /api/vehicles/:id`), and restock vehicles (`POST /api/vehicles/:id/restock`). … Public registration must always create a regular user, never an admin. … Document admin-only add/update as our chosen interpretation of the frontend requirements.

And how AI use must be recorded:

> For D-19: I used ChatGPT primarily to help formulate and refine implementation prompts and to discuss project planning. I used Claude Code to revise the planning documents and will use it for implementation. … Do not include unrelated personal chatter, fabricate logs, or represent summaries as unedited transcripts. … For D-18, use the exact commit-trailer format required by the assignment, with two blank lines before the trailer.

## Stage 2 — Environment setup and debugging

**Session 2, 24–25 Oct.** I had forgotten the PostgreSQL superuser password. The recovery was done one approved step at a time, and I typed every password and ran every privileged command myself:

> The PostgreSQL connection to localhost:5432 is responding, but password authentication failed for the `postgres` user on two attempts. I have not changed anything. … Do not modify `pg_hba.conf`, reset passwords, or change existing roles/databases without explaining the proposed steps and getting my approval. Do not ask me to share passwords.

> I approve Step 1 only: back up `/Library/PostgreSQL/18/data/pg_hba.conf` and verify the backup matches the original byte for byte. Do not edit or reload the active configuration yet. Show me the exact commands and results, then stop for my approval before Step 2.

> Yes, proceed with Step 6. Restore `pg_hba.conf` from the verified backup, reload PostgreSQL, and verify the restored file matches the backup byte for byte. Do not change any passwords or touch unrelated databases. Stop after verification and show me the results before Step 7.

The first commit and push came before that:

> Yes: create the .gitignore, make the first commit with that message, verify the trailer format, show me the summary and no-secrets check, then push to origin main.

## Stage 3 — Backend implementation with test-driven development (M1–M6)

**Session 2, 25 Oct, 01:22–18:07.** Each milestone started from a short instruction, and each red and green step was committed separately:

> Start M1: backend scaffold, dependencies, settings, init_db, test harness with the _test guard, and a smoke test. Show me before committing.

> Start M2: User and Vehicle models with constraints, using genuine red-green TDD with a commit for each red and green step. Show me before pushing.

> Start M3 with genuine red-green TDD and a commit per step: security core (UT-SEC), register/login schemas, service and routes (API-AUTH). Show me before pushing.

> Before pushing M3 or resetting the development database, please verify whether the `users` and `vehicles` tables in `car_dealership` contain any data. Do not drop, recreate, or modify any tables yet. Confirm the exact M3 commit range and that the 37 tests pass on the committed code. Then report the findings and wait for my approval.

> Start M4 with genuine red-green TDD and a commit per step: GET /api/vehicles with the auth guard, require_admin driven by POST /api/vehicles, and the create_admin CLI (ADM-01 to 05). Show me before pushing.

**The co-author address correction.** During M4 I noticed GitHub crediting a stranger:

> The GitHub repository Contributors section shows “ai Andrey Sitnik” alongside my account. The latest commit displays “Mishasahni and ai”. … Please investigate the actual commit metadata and GitHub attribution. Do not modify files, create commits, rewrite history, force-push, or change the remote yet.

> Option A: keep the 29 pushed commits as they are, fix the trailer on the 11 unpushed M4 commits before pushing, and use the official vendor addresses from now on. Show me the exact commands first.

**M5:**

> Approved. Proceed with M5 using the proposed plan and all three recommendations: 1. Move the shared `admin_headers` and `user_headers` fixtures into `tests/api/conftest.py` in a separate `refactor:` commit. Run the full suite before and after, confirming it passes both times. 2. Include API-SRCH-11 literal `%` and `_` matching in the search cycle … Write the failing tests first … Run them and verify they fail for the expected reason … Commit the genuine red stage.

**M6, purchase safety under concurrency.** The concurrency test (CT-01) had to fail reliably before the atomic fix was written:

> Approved: use Option A for CT-01 (simple read-then-write first, prove the oversell with CT-01, then the atomic UPDATE), leave restock uncapped and note it, and start M6 cycle 1. Stop if CT-01 doesn't fail reliably.

> Approved: change CT-01 so each thread opens its connection before the barrier, confirm the red is 20/20, commit red, then implement the atomic UPDATE and confirm green over 20+ runs. Continue with the remaining M6 cycles after that.

## Stage 4 — Frontend and UI work

**First frontend, M7–M9 (session 2, 25 Oct, 18:26).**

> M7–M9 Frontend — Deadline 22:00 IST
>
> Execute the approved plan in order. Prioritise a working, tested submission over optional polish. … Start with a failing CORS test; observe red before implementation. … Implement a typed API client, AuthContext, ProtectedRoute, login and registration connected to the real backend.

> Approved: build the inventory as proposed (table on tablet and desktop, stacked rows on phone, side panel for add/edit, dialogs for restock and delete, INR prices). Proceed with M8 and M9 TDD.

**Project setup (session 4, 25 Oct, 19:28).** I started the app and found my own account showing the buyer view:

> Check whether the currently logged-in account in the local dealership app is an admin or regular buyer. Verify the user's role from the database or existing auth implementation without exposing passwords, tokens or secrets. Also tell me how the UI should differ for admin versus buyer.

> I know I'm logged in. I want to know whether MY CURRENT ACCOUNT is admin or buyer, and why the UI is showing the buyer view. Verify the role returned by the backend for my account and compare it with AuthContext's stored role. Don't just explain the intended UI. Diagnose the actual mismatch and tell me the smallest fix, if one is needed. Do not change the database or promote the account without asking me first.

> Yes, promote [my email] to admin with the create_admin script.

**Separate buyer and admin experiences (session 3, 25 Oct, 19:57).** The first UI was one dark table for both roles. I asked for a redesign from a reference image:

> right now the frontend system is horrible,completely overhaul it … Implement separate, role-aware experiences for Buyer and Admin. Both can view, search, filter, and purchase vehicles, but their layouts, navigation, priorities, and available actions must reflect their roles. Use the authenticated role returned by the existing backend. Do not infer roles from email addresses or allow users to select their own role.

Claude Code drew both layouts on a design canvas first, and I approved them before any code changed:

> Approved. Build both layouts as proposed, including the illustration fallback, /admin route guard and in-stock filter.

**Masar Auto sign-in and registration (session 3, 25 Oct, 23:05).**

> Redesign Login & Registration — Masar Auto
>
> Redesign the existing Login and Registration pages for the Car Dealership Inventory System using the two attached images as the primary design references. This is a visual and UX redesign of the existing authentication flow, not a backend rewrite. … Do not reproduce Mercedes branding, text, logo, or its exact styling. … Important: Use the actual Masar Auto image I attached …

**Demo access for evaluators (session 3, 25 Oct, 23:15).**

> Task: Add a Secure, Evaluator-Friendly Demo Access Experience … The existing Login page, Registration page, Buyer dashboard, and Admin dashboard are approved. Do not redesign, restyle, replace, or otherwise change their existing UI or behaviour. Your task is to make it easy for an evaluator to discover and experience both the Buyer and Admin roles, with minimal friction and no security compromise.

## Stage 5 — Testing, review and security checks

**Resuming for submission (session 3, 25 Oct, 18:58).**

> Resume the existing Car Dealership Inventory System project from its current repository state. First inspect `git status`, current branch, and recent commits. Preserve all existing work; do not reset, rewrite history, or push. … Do not inspect or print full AI transcript exports or secrets.

**Auditing the TDD history (19:18).**

> Audit the existing Git history and implementation for genuine Red → Green → Refactor TDD cycles across M1–M9. Identify concrete examples of each phase, especially refactoring after tests passed. Do not fabricate evidence or rewrite history. Report any cycles where refactoring is missing or cannot be verified, and whether any action is necessary before submission.

The audit replayed every red commit and found refactoring under-represented. I then approved one genuine refactor:

> Yes: make the route error-mapping refactor as its own commit with the full suite green before and after, correct the README refactoring wording, and sync package-lock.json. Show me before committing.

**Auditing the AI-use evidence (23:43).** This audit found sessions missing from this file and old demo passwords in the published logs:

> Audit the AI-use evidence in the current repository. Do not modify any files yet. 1. Verify that every ZIP linked in root PROMPTS.md exists in the public repository and can be downloaded. 2. Inspect each ZIP archive and confirm it contains the original, unedited Claude Code session export …

> First disable the two older local demo accounts (demo.admin@dealership.com and demo.buyer@dealership.com) by resetting their passwords to random values, without printing them. Show me the plan before running anything.

## Stage 6 — Documentation and submission preparation

**Session 3, 25 Oct.**

How the two AI tools would be documented:

> Regarding the ChatGPT links: I used ChatGPT as supplementary assistance for planning, clarifying concepts, and reviewing parts of the workflow. Claude Code was the primary coding agent working directly in this repository. I don't think separate ChatGPT share links are necessary for `PROMPTS.md` unless the assignment explicitly requires evidence from every AI tool used. Please document Claude Code's actual session exports accurately, and keep the README's `My AI Usage` section transparent about both tools and their respective roles.

The README's "Reflection" is my own text, pasted in at 23:31 and added unchanged. Then:

> read me needs to be updated with the new updated frontend , fix it

Completing this file (23:54):

> I need you to audit and properly complete the AI-prompt documentation for this repository before submission. … Do not assume which sessions are missing. Inspect the repository, available session exports, Git history, and any locally available original Claude Code session data to establish the facts.

Every push to GitHub was a separate, explicit instruction, for example:

> Yes, push the 15 commits on main to origin now (normal push, no force).

## Credentials in the logs

No secret values appear in this file. I typed no secrets into these chats. The raw exports were scanned for:
- the project's real database passwords and JWT secret;
- the current demo-account passwords;
- API keys and other access tokens;
- database URLs with passwords.

**Not found anywhere:** none of those appear in any export. The only database URL with a password is a deliberately fake example.

**Found, and no longer usable:**
- **Expired test tokens** (session 2). They expired by 03:40 on 25 Oct, and none was signed with the real local JWT secret.
- **Passwords of two older local demo accounts**, `demo.admin@dealership.com` (an admin) and `demo.buyer@dealership.com` (sessions 2 and 3).
- **Passwords of two local test accounts**, `ui-check-admin@example.com` (an admin) and `ui-check-buyer@example.com`, typed during browser checks (full export of session 3).

All four accounts exist only in my local development database, which has never been deployed or shared.

On 26 Oct, before the full export was added, those four accounts' passwords were reset to random values, which nobody knows:
- it was one transaction, using the app's own Argon2 hashing;
- every exposed password was then checked against the stored hashes and through the real login API, and all were refused (HTTP 401);
- the accounts and their roles are unchanged.

A password reset doesn't revoke tokens already issued; the app checks only a token's signature and its 60-minute expiry. The last time any of these accounts was used was 25 Oct at 23:09, so every token that could have been issued to them had expired before the export was added.

**Also present:** my email address, already public as the commit author.

Nothing in any export has been redacted or edited.

## ChatGPT (OpenAI)

I also used ChatGPT, as a supplementary tool outside this repository:
- planning;
- clarifying concepts;
- reviewing parts of the workflow;
- refining some of the prompts I gave Claude Code.

Its role is described in the README's "My AI Usage" section. **Its conversations are not included here.** It is credited as a co-author only on the first commit, the planning documents.
