# CodeGuardian AI

Automated security review for GitHub pull requests.

CodeGuardian AI runs **Semgrep**, **Bandit**, and **Gitleaks** against the files changed in a pull request, normalizes the results, and can post a review comment back to the PR. This repository contains:

| Path | What it is |
| --- | --- |
| `backend/` | FastAPI service that talks to GitHub and runs the security scanners |
| `frontend/` | React + Vite + TypeScript dashboard and review workspace |
| `semgrep-test/` | Sample files used by the backend's scanner self-test endpoints |

---

## Features

- **Dashboard** with live backend/GitHub status, local review metrics, severity breakdown, scanner coverage, and recent reviews.
- **PR workspace** for analyzing any GitHub pull request by `owner`, `repository`, and PR number.
- **Review details** with scan summary, filterable findings, changed files, unified diffs, and source preview.
- **Local review history** that can be searched, filtered, reopened, and cleared.
- **Honest error handling** for unreachable backends, GitHub failures, timeouts, and unexpected API payloads.
- **Responsive dark UI** built with Tailwind CSS, accessible tabs/dialogs, and lazy-loaded routes.

---

## Prerequisites

### Backend

- **Python 3.11+** (the Docker image uses Python 3.13)
- **pip**
- Security scanners on `PATH` for real scans:
  - [Semgrep](https://semgrep.dev/docs/getting-started/)
  - [Bandit](https://bandit.readthedocs.io/)
  - [Gitleaks](https://github.com/gitleaks/gitleaks)
- A **GitHub personal access token** that can read the repositories you want to analyze (and comment on PRs if you use the webhook flow).
- A **GitHub webhook secret** (any strong random string) — the backend refuses to start without one.
- Optional: a **Groq API key** for AI explanations. Without it, scanner output is still returned/posted, but AI analysis is skipped.

### Frontend

- **Node.js 20.19+ or 22.12+** (required by Vite 8)
- **npm**

---

## 1. Start the backend

From the repository root:

```powershell
cd backend
python -m venv ..\venv
..\venv\Scripts\Activate.ps1        # Windows PowerShell
# source ../venv/bin/activate        # macOS / Linux
pip install -r requirements.txt
pip install semgrep bandit
```

Install Gitleaks separately and make sure `gitleaks` is available on `PATH` (see the [Gitleaks releases](https://github.com/gitleaks/gitleaks/releases)).

Create `backend/.env`:

```dotenv
GITHUB_TOKEN=ghp_your_token_here
GITHUB_WEBHOOK_SECRET=replace_with_a_long_random_string
GROQ_API_KEY=gsk_your_groq_key_here   # optional
```

Start FastAPI from the `backend/` directory:

```powershell
uvicorn main:app --reload --port 8000
```

- API: <http://localhost:8000>
- Interactive docs: <http://localhost:8000/docs>

> `main.py` imports `ai_analyzer` as a top-level module and loads `.env` from the current working directory, so run it **inside `backend/`**.

### Docker alternative

The backend `Dockerfile` installs Semgrep, Bandit, and Gitleaks for you:

```powershell
cd backend
docker build -t codeguardian-ai .
docker run --rm -p 8000:8000 --env-file .env codeguardian-ai
```

### Backend environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | Yes | PyGithub authentication. The app raises at startup if missing. |
| `GITHUB_WEBHOOK_SECRET` | Yes | HMAC key used to verify `X-Hub-Signature-256`. Startup fails if missing. |
| `GROQ_API_KEY` | No | Enables AI explanations for webhook-triggered scans. `/security` does not call Groq. |

---

## 2. Start the frontend

From the repository root, in a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env     # Windows PowerShell
# cp .env.example .env          # macOS / Linux
npm run dev
```

Open <http://localhost:5173>.

### Frontend environment variables

`frontend/.env`:

```dotenv
# Backend target used by the Vite dev/preview proxy
VITE_API_BASE_URL=http://localhost:8000

# Browser-facing API prefix. Keep /api when using the Vite proxy.
VITE_API_PATH=/api
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Where Vite forwards `/api/*`. This is a **build-time** value used by `vite.config.ts`. |
| `VITE_API_PATH` | `/api` | Axios base path in the browser. Set an absolute backend URL only if the backend has CORS enabled. |

The backend has **no CORS middleware**, so both `npm run dev` and `npm run preview` proxy `/api` to `VITE_API_BASE_URL`. Do not call the backend cross-origin from the browser without adding a proxy or CORS configuration.

### Production build

```powershell
cd frontend
npm run build      # TypeScript project build + Vite production bundle
npm run preview    # serves dist/ on http://localhost:4173 with the same proxy
```

For a real deployment, serve `frontend/dist/` behind the same origin as the API and reverse-proxy `/api/*` to FastAPI (rewriting away `/api`). If you cannot proxy, enable CORS on the backend and set `VITE_API_PATH` to the backend URL at build time.

---

## Using the app

1. Confirm **Backend online** in the top bar (polled from `/health` and `/github/test`).
2. Open **Workspace**, enter a repository owner, repository name, and PR number.
3. Review the PR preview, then select **Run security analysis**.
4. Inspect the result on the review page:
   - **Overview** — PR metadata, file/change counts, severity totals, scanner breakdown.
   - **Findings** — filter by severity, tool, or search; expand a finding for details and surrounding source.
   - **Changed files** — additions/deletions per file.
   - **Diff** — unified patches, loaded on demand.
   - **Review notes** — explicit scope and limitations.
5. Reopen past analyses from **Reviews** (stored in this browser only).

The analysis flow calls, in parallel/sequence:

1. `GET /github/pr/{owner}/{repo}/{pr}` and `.../files`
2. `GET .../security` (runs the scanners)

Diffs and source files are fetched lazily only when you open those tabs.

---

## API reference

All routes are exposed by `backend/main.py`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Service banner |
| `GET` | `/health` | `{"status": "healthy"}` |
| `GET` | `/github/test` | Verifies the GitHub token and returns the authenticated username |
| `GET` | `/github/pr/{owner}/{repo}/{pr}` | PR number, title, state, author, source/target branch |
| `GET` | `/github/pr/{owner}/{repo}/{pr}/files` | Changed files with status, additions, deletions, changes |
| `GET` | `/github/pr/{owner}/{repo}/{pr}/diff` | Per-file patches (`patch` may be `null`) |
| `GET` | `/github/pr/{owner}/{repo}/{pr}/content` | Full text content of changed files |
| `GET` | `/github/pr/{owner}/{repo}/{pr}/bandit` | Raw Bandit results for the PR |
| `GET` | `/github/pr/{owner}/{repo}/{pr}/security` | Normalized Semgrep + Bandit + Gitleaks findings |
| `POST` | `/webhook/github` | GitHub webhook; verifies HMAC and scans `opened`, `synchronize`, `reopened` PRs |
| `GET` | `/security/semgrep-test` | Semgrep self-test against `semgrep-test/` |
| `GET` | `/security/bandit-test` | Bandit self-test against `semgrep-test/` |

### Webhook flow

The webhook runs in a background task:

1. Scan changed files with Semgrep, Bandit, and Gitleaks.
2. Normalize all findings.
3. Send findings to Groq (if configured).
4. Post a single review comment to the PR with scanner evidence and AI explanations.

The `/security` endpoint returns **scanner findings only**. Groq analysis is currently webhook-only and is published to the GitHub PR comment, not returned to this frontend.

---

## Routes

| Route | Page |
| --- | --- |
| `/` | Dashboard |
| `/workspace` | New PR analysis |
| `/reviews` | Local review history |
| `/reviews/:owner/:repo/:prNumber` | Review details |
| `*` | Not found |

---

## Scope, data, and limitations

These are intentional and are surfaced in the UI:

- **GitHub PRs only.** The backend has no endpoint for pasting arbitrary code or analyzing a local snippet.
- **No server-side review history.** The backend does not expose stored reviews, so history lives in `localStorage` under `codeguardian.reviews.v1`. It is per-browser, capped at 50 entries, keeps only the latest analysis per PR, and is cleared with **Clear history**.
- **No authentication.** There is no login, OAuth, JWT, or user management. The backend's GitHub token is server-side.
- **No AI output in the UI.** Groq explanations are generated only during webhook processing and posted as PR comments; the frontend does not fabricate an AI review.
- **Scanner-dependent.** If Semgrep/Bandit/Gitleaks are missing or fail, `/security` reflects that; the UI shows the backend's response rather than inventing findings.
- **No CORS.** Browser requests rely on the Vite proxy (dev and preview) or an equivalent production reverse proxy.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Backend exits immediately | Set both `GITHUB_TOKEN` and `GITHUB_WEBHOOK_SECRET` in `backend/.env`. |
| App shows “Backend offline” | Start FastAPI on port 8000 and confirm `VITE_API_BASE_URL` matches. |
| `401 Bad credentials` | The GitHub token is invalid, expired, or lacks access to the repository. |
| Analysis hangs | Scanner runs on large PRs can take minutes. Check the FastAPI terminal for Semgrep/Bandit/Gitleaks errors. |
| CORS error in the browser | Use the Vite dev/preview server, or add a reverse proxy / CORS middleware for production. |
| Empty review history | History is stored per browser and per origin (`localhost:5173` vs `localhost:4173`). |
| Port already in use | Stop the existing process on `5173`, `4173`, or `8000`; all three ports are configured as strict. |

---

## Verification status

- `npm run build` completes with no TypeScript or bundling errors.
- Dashboard, workspace validation, error states, review details, filtering, diff/source tabs, local history, dialogs, and responsive layouts were smoke-tested against a running backend using seeded browser fixtures.
- A real end-to-end GitHub scan could not be executed in this environment because no valid `GITHUB_TOKEN` was available.
- Semgrep, Bandit, and Gitleaks were not installed locally, so actual scanner execution was not exercised outside Docker.
