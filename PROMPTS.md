# PROMPTS

Raw, unedited AI chat logs for this project, as the assignment asks. Nothing below summarises a conversation. Each entry gives only its date, the tool, what the session was for, and the raw log.

## Claude Code (Anthropic, Claude Opus 5.5, Claude desktop app)

Claude Code was the coding agent that worked in this repository. Every Claude Code session used for the project is listed below.

The raw logs are in [`prompts/`](prompts/), exactly as the Claude desktop app's session Export wrote them; only the zip files were renamed. Each zip holds:
- the whole conversation, including tool calls and their output, as JSON Lines (`transcript.jsonl`);
- the session's metadata;
- the browser screenshots taken during the session, where there were any.

| Date | What the session was for | Raw log | SHA-256 of the zip |
|---|---|---|---|
| 2026-10-24 | Session titled "Car Dealership Inventory System", run in a scratch workspace before this repository was created | [`2026-10-24-claude-code-first-session.zip`](prompts/2026-10-24-claude-code-first-session.zip) | `5d166cb0a7e96a1d` |
| 2026-10-24 to 2026-10-25 | Planning documents, then implementation, tests, debugging, screenshots and documentation (M0 to M11) | [`2026-10-24-to-25-claude-code-main-session.zip`](prompts/2026-10-24-to-25-claude-code-main-session.zip) | `37317882e30fc35a` |
| 2026-10-25 | Resuming the project for submission: status check, fresh-clone check, TDD history audit, the error-mapping refactor and these documents | [`2026-10-25-claude-code-submission-session.zip`](prompts/2026-10-25-claude-code-submission-session.zip) | `164459093f5141f7` |

The checksums are the first 16 hex digits of each zip's SHA-256. The last session was exported just before the commit that added it, so its log ends there.

**Secrets:** none were typed into these sessions. Before committing, each export was scanned for the project's real database passwords and JWT secret, which appear nowhere, and for common credential patterns. Nothing was redacted.

The logs do contain:
- my email address, which is already public as the commit author;
- expired test tokens;
- the passwords of two demo accounts that exist only in my local development database.

## ChatGPT (OpenAI)

I also used ChatGPT as a supplementary tool, outside this repository. Its role is described in the README's "My AI Usage" section. Those conversations are not included here.
