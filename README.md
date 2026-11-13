# CodeGuardian AI

Automated security review for GitHub pull requests.

CodeGuardian AI runs **Semgrep**, **Bandit**, and **Gitleaks** against the files changed in a pull request, normalizes the results, and can post a review comment back to the PR. This repository contains:

| Path | What it is |
| --- | --- |
| `backend/` | FastAPI service that talks to GitHub and runs the security scanners |
| `frontend/` | React + Vite + TypeScript dashboard and review workspace |
| `semgrep-test/` | Sample files used by the backend's scanner self-test endpoints |

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


