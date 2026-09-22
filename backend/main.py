import os
import hmac
import hashlib
import subprocess
import json
import tempfile

from fastapi import FastAPI, HTTPException, Request
from dotenv import load_dotenv
from github import Github



load_dotenv()

app = FastAPI(
    title="CodeGuardian AI",
    description="AI-powered automated code review system",
    version="1.0.0"
)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")

if not GITHUB_TOKEN:
    raise RuntimeError("GITHUB_TOKEN is not configured")

if not GITHUB_WEBHOOK_SECRET:
    raise RuntimeError("GITHUB_WEBHOOK_SECRET is not configured")


github = Github(GITHUB_TOKEN)


@app.get("/")
def root():
    return {
        "message": "CodeGuardian AI Backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/github/test")
def github_test():

    try:
        user = github.get_user()

        return {
            "status": "success",
            "github_username": user.login
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.get("/github/pr/{owner}/{repo}/{pr_number}")
def get_pull_request(owner: str, repo: str, pr_number: int):

    try:
        repository = github.get_repo(f"{owner}/{repo}")
        pull_request = repository.get_pull(pr_number)

        return {
            "number": pull_request.number,
            "title": pull_request.title,
            "state": pull_request.state,
            "author": pull_request.user.login,
            "source_branch": pull_request.head.ref,
            "target_branch": pull_request.base.ref
        }
    except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=str(e)
            )

@app.get("/github/pr/{owner}/{repo}/{pr_number}/files")
def get_changed_files(owner: str, repo: str, pr_number: int):

    try:
        repository = github.get_repo(f"{owner}/{repo}")
        pull_request = repository.get_pull(pr_number)

        files = []

        for file in pull_request.get_files():
            files.append({
                "filename": file.filename,
                "status": file.status,
                "additions": file.additions,
                "deletions": file.deletions,
                "changes": file.changes
            })

        return {
            "pr_number": pr_number,
            "total_files": len(files),
            "files": files
        }

    

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/github/pr/{owner}/{repo}/{pr_number}/diff")
def get_pull_request_diff(owner: str, repo: str, pr_number: int):

    try:
        repository = github.get_repo(f"{owner}/{repo}")
        pull_request = repository.get_pull(pr_number)

        files = []

        for file in pull_request.get_files():
            files.append({
                "filename": file.filename,
                "status": file.status,
                "patch": file.patch
            })

        return {
            "pr_number": pr_number,
            "total_files": len(files),
            "files": files
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
@app.post("/webhook/github")
async def github_webhook(request: Request):

    payload = await request.body()

    signature = request.headers.get("X-Hub-Signature-256")

    if not signature:
        raise HTTPException(
            status_code=401,
            detail="Missing GitHub signature"
        )

    expected_signature = "sha256=" + hmac.new(
        GITHUB_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(
            status_code=401,
            detail="Invalid GitHub signature"
        )

    return {
        "status": "success",
        "message": "Valid GitHub webhook received"
    }

@app.get("/github/pr/{owner}/{repo}/{pr_number}/content")
def get_pr_file_content(owner: str, repo: str, pr_number: int):

    try:
        repository = github.get_repo(f"{owner}/{repo}")
        pull_request = repository.get_pull(pr_number)

        files = []

        for file in pull_request.get_files():

            file_content = repository.get_contents(
                file.filename,
                ref=pull_request.head.sha
            )

            content = file_content.decoded_content.decode("utf-8")

            files.append({
                "filename": file.filename,
                "status": file.status,
                "language": detect_language(file.filename),
                "content": content
                })

        return {
            "pr_number": pr_number,
            "total_files": len(files),
            "files": files
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

def detect_language(filename: str):

    extension = filename.lower().split(".")[-1]

    languages = {
        "py": "Python",
        "js": "JavaScript",
        "ts": "TypeScript",
        "java": "Java",
        "cpp": "C++",
        "c": "C",
        "go": "Go",
        "rs": "Rust",
        "php": "PHP",
        "rb": "Ruby",
        "cs": "C#",
        "html": "HTML",
        "css": "CSS",
        "json": "JSON",
        "yaml": "YAML",
        "yml": "YAML",
        "md": "Markdown"
    }

    return languages.get(extension, "Unknown")

def run_semgrep(folder_path: str):

    try:
        result = subprocess.run(
            [
                "semgrep",
                "--config=auto",
                "--json",
                folder_path
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )

        return json.loads(result.stdout)

    except Exception as e:
        raise RuntimeError(f"Semgrep scan failed: {str(e)}")

@app.get("/security/semgrep-test")
def semgrep_test():

    try:
        results = run_semgrep("semgrep-test")

        return {
            "status": "success",
            "results": results
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

def scan_github_pr_with_semgrep(owner: str, repo: str, pr_number: int):

    repository = github.get_repo(f"{owner}/{repo}")
    pull_request = repository.get_pull(pr_number)

    with tempfile.TemporaryDirectory() as temp_dir:

        for file in pull_request.get_files():

            if not file.patch:
                continue

            try:
                file_content = repository.get_contents(
                    file.filename,
                    ref=pull_request.head.sha
                )

                content = file_content.decoded_content.decode("utf-8")

                file_path = os.path.join(
                    temp_dir,
                    file.filename
                )

                os.makedirs(
                    os.path.dirname(file_path),
                    exist_ok=True
                )

                with open(
                    file_path,
                    "w",
                    encoding="utf-8"
                ) as output_file:

                    output_file.write(content)

            except Exception as e:
                print(
                    f"Could not download {file.filename}: {e}"
                )

        return run_semgrep(temp_dir)

def scan_github_pr_with_bandit(owner: str, repo: str, pr_number: int):

    repository = github.get_repo(f"{owner}/{repo}")
    pull_request = repository.get_pull(pr_number)

    with tempfile.TemporaryDirectory() as temp_dir:

        for file in pull_request.get_files():

            if not file.patch:
                continue

            # Bandit only works with Python files
            if not file.filename.lower().endswith(".py"):
                continue

            try:
                file_content = repository.get_contents(
                    file.filename,
                    ref=pull_request.head.sha
                )

                content = file_content.decoded_content.decode("utf-8")

                file_path = os.path.join(
                    temp_dir,
                    file.filename
                )

                os.makedirs(
                    os.path.dirname(file_path),
                    exist_ok=True
                )

                with open(
                    file_path,
                    "w",
                    encoding="utf-8"
                ) as output_file:

                    output_file.write(content)

            except Exception as e:
                print(
                    f"Could not download {file.filename}: {e}"
                )

        return run_bandit(temp_dir)


    
def normalize_semgrep_results(semgrep_data):

    findings = []

    for result in semgrep_data.get("results", []):

        metadata = result.get("extra", {}).get("metadata", {})
        message = result.get("extra", {}).get("message", "")

        cwe = metadata.get("cwe", [])

        if isinstance(cwe, list) and cwe:
            cwe = cwe[0]
        else:
            cwe = None

        vulnerability_class = metadata.get(
            "vulnerability_class",
            []
        )

        if isinstance(vulnerability_class, list) and vulnerability_class:
            title = vulnerability_class[0]
        else:
            title = result.get("check_id", "Unknown Issue")

        severity = result.get(
            "extra", {}
        ).get("severity", "INFO")

        # Convert Semgrep severity to our standard severity
        severity_map = {
            "ERROR": "HIGH",
            "WARNING": "MEDIUM",
            "INFO": "LOW"
        }

        findings.append({
            "tool": "Semgrep",
            "file": os.path.basename(result.get("path", "")),
            "line": result.get("start", {}).get("line"),
            "severity": severity_map.get(
                severity,
                "LOW"
            ),
            "category": metadata.get(
                "category",
                "security"
            ),
            "title": title,
            "message": message,
            "cwe": cwe
        })

    return findings

def normalize_bandit_results(bandit_data):

    findings = []

    for result in bandit_data.get("results", []):

        severity = result.get(
            "issue_severity",
            "LOW"
        ).upper()

        severity_map = {
            "HIGH": "HIGH",
            "MEDIUM": "MEDIUM",
            "LOW": "LOW"
        }

        cwe_data = result.get("issue_cwe", {})
        cwe_id = cwe_data.get("id")

        findings.append({
            "tool": "Bandit",
            "file": os.path.basename(result.get("filename", "")),
            "line": result.get("line_number"),
            "severity": severity_map.get(
                severity,
                "LOW"
            ),
            "category": "security",
            "title": result.get(
                "test_name",
                "Security Issue"
            ),
            "message": result.get(
                "issue_text",
                ""
            ),
            "cwe": f"CWE-{cwe_id}" if cwe_id else None,
            "rule_id": result.get("test_id"),
            "confidence": result.get(
                "issue_confidence"
            )
        })

    return findings

def normalize_gitleaks_results(gitleaks_data):
    findings = []

    for result in gitleaks_data:
        findings.append({
            "tool": "Gitleaks",
            "file": os.path.basename(
                result.get("File", "")
            ),
            "line": result.get("StartLine"),
            "severity": "HIGH",
            "category": "secret",
            "title": result.get(
                "RuleID",
                "Secret Detected"
            ),
            "message": result.get(
                "Description",
                "Potential secret detected"
            ),
            "cwe": None,
            "rule_id": result.get("RuleID"),
            "secret": result.get("Secret", "")
        })

    return findings

def run_bandit(folder_path: str):

    try:
        result = subprocess.run(
            [
                "bandit",
                "-r",
                folder_path,
                "-f",
                "json"
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )

        return json.loads(result.stdout)

    except Exception as e:
        raise RuntimeError(
            f"Bandit scan failed: {str(e)}"
        )

def run_gitleaks(folder_path: str):
    try:
        result = subprocess.run(
            [
                r"C:\Users\Lenovo\bin\gitleaks.exe",
                "dir",
                folder_path,
                "--report-format",
                "json",
                "--report-path",
                os.path.join(folder_path, "gitleaks-report.json"),
                "--no-banner"
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )

        report_path = os.path.join(
            folder_path,
            "gitleaks-report.json"
        )

        if os.path.exists(report_path):
            with open(report_path, "r", encoding="utf-8") as f:
                return json.load(f)

        return []

    except Exception as e:
        raise RuntimeError(
            f"Gitleaks scan failed: {str(e)}"
        )



@app.get("/security/bandit-test")
def bandit_test():

    try:

        results = run_bandit("semgrep-test")

        return {
            "status": "success",
            "scanner": "Bandit",
            "results": results
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
@app.get("/github/pr/{owner}/{repo}/{pr_number}/bandit")
def scan_pr_bandit(owner: str, repo: str, pr_number: int):

    try:

        results = scan_github_pr_with_bandit(
            owner,
            repo,
            pr_number
        )

        findings = normalize_bandit_results(results)

        return {
            "status": "success",
            "pr_number": pr_number,
            "findings_count": len(findings),
            "findings": findings
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
def scan_github_pr_with_gitleaks(owner: str, repo: str, pr_number: int):
    repository = github.get_repo(f"{owner}/{repo}")
    pull_request = repository.get_pull(pr_number)

    with tempfile.TemporaryDirectory() as temp_dir:

        for file in pull_request.get_files():
            if not file.patch:
                continue

            try:
                file_content = repository.get_contents(
                    file.filename,
                    ref=pull_request.head.sha
                )

                content = file_content.decoded_content.decode("utf-8")

                file_path = os.path.join(
                    temp_dir,
                    file.filename
                )

                os.makedirs(
                    os.path.dirname(file_path),
                    exist_ok=True
                )

                with open(
                    file_path,
                    "w",
                    encoding="utf-8"
                ) as output_file:
                    output_file.write(content)

            except Exception as e:
                print(
                    f"Could not download {file.filename}: {e}"
                )

        return run_gitleaks(temp_dir)
    
@app.get("/github/pr/{owner}/{repo}/{pr_number}/security")
def scan_pr_security(owner: str, repo: str, pr_number: int):
    try:
        semgrep_results = scan_github_pr_with_semgrep(
            owner, repo, pr_number
        )
        semgrep_findings = normalize_semgrep_results(
            semgrep_results
        )

        bandit_results = scan_github_pr_with_bandit(
            owner, repo, pr_number
        )
        bandit_findings = normalize_bandit_results(
            bandit_results
        )

        gitleaks_results = scan_github_pr_with_gitleaks(
            owner, repo, pr_number
        )
        gitleaks_findings = normalize_gitleaks_results(
            gitleaks_results
        )

        findings = (
            semgrep_findings
            + bandit_findings
            + gitleaks_findings
        )

        return {
            "status": "success",
            "pr_number": pr_number,
            "total_findings": len(findings),
            "findings": findings
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )