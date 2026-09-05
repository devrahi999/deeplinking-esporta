#!/usr/bin/env python3
"""Black-box check of an app.esporta.site deployment.

    python3 scripts/check-site.py                          # https://app.esporta.site
    python3 scripts/check-site.py http://127.0.0.1:3200    # a local `next start`

Works with no configuration: it verifies the association files, the landing page,
and that every link route answers a real 404 for an id nothing can resolve.

Supply real ids to also check that live previews render, which is the part that
cannot be faked — set any of these in the environment:

    ESPORTA_POST_ID  ESPORTA_SHORT_ID  ESPORTA_PERSONAL_ID  ESPORTA_TEAM_ID

Exit code 0 means every check that ran passed.
"""

import json
import os
import re
import subprocess
import sys

DEAD_ID = "00000000-0000-0000-0000-000000000000"

GREEN, RED, YELLOW, RESET = "\033[32m", "\033[31m", "\033[33m", "\033[0m"

failures = 0
skipped = 0


def request(base, path):
    """(status, headers, body) for one GET. Redirects are NOT followed."""
    out = subprocess.run(
        ["curl", "-sS", "-m", "30", "-D", "-", f"{base}{path}"],
        capture_output=True,
        text=True,
    ).stdout
    # curl writes headers then a blank line; text mode may normalise CRLF.
    parts = re.split(r"\r?\n\r?\n", out, maxsplit=1)
    head, body = parts[0], (parts[1] if len(parts) > 1 else "")
    match = re.search(r"HTTP/[\d.]+ (\d{3})", head)
    headers = {}
    for line in head.splitlines()[1:]:
        if ":" in line:
            key, value = line.split(":", 1)
            headers[key.strip().lower()] = value.strip()
    return (int(match.group(1)) if match else 0), headers, body


def tag(body, prop):
    for pattern in (
        r'<meta[^>]+(?:property|name)="%s"[^>]+content="([^"]*)"',
        r'<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="%s"',
    ):
        match = re.search(pattern % re.escape(prop), body)
        if match:
            return match.group(1)
    return None


def canonical(body):
    match = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]*)"', body)
    return match.group(1) if match else None


def report(label, problems, detail=""):
    global failures
    if problems:
        failures += 1
        print(f"  {RED}FAIL{RESET}  {label}")
        for problem in problems:
            print(f"        {problem}")
    else:
        print(f"  {GREEN}PASS{RESET}  {label}{('  ' + detail) if detail else ''}")


def skip(label, why):
    global skipped
    skipped += 1
    print(f"  {YELLOW}SKIP{RESET}  {label}  ({why})")


def check_association_files(base):
    print("\n=== association files ===")
    for name in ("assetlinks.json", "apple-app-site-association"):
        path = f"/.well-known/{name}"
        status, headers, body = request(base, path)
        content_type = headers.get("content-type", "")
        problems = []
        if status != 200:
            problems.append(
                f"HTTP {status} — must be a direct 200 with no redirect hop"
                if status
                else "no response"
            )
        if not content_type.startswith("application/json"):
            problems.append(f"Content-Type is {content_type or 'unset'!r}, must be application/json")
        if "<html" in body.lower() or "<!doctype" in body.lower():
            problems.append("HTML was served — a catch-all rewrite is swallowing /.well-known/*")
        else:
            try:
                json.loads(body)
            except Exception as exc:
                problems.append(f"body is not valid JSON: {exc}")
        if "<REPLACE_WITH_REAL" in body:
            problems.append("published file still contains a placeholder")
        report(path, problems, f"{content_type}")


def check_dead_links(base):
    print("\n=== dead links must be a real 404 ===")
    for segment in ("p", "s", "pp", "op"):
        path = f"/{segment}/{DEAD_ID}"
        status, _, body = request(base, path)
        problems = []
        if status != 404:
            problems.append(f"HTTP {status} — an unresolvable id must answer 404, not {status}")
        if "noindex" not in (tag(body, "robots") or ""):
            problems.append("missing robots noindex")
        report(path, problems, "404 + noindex")

    status, _, _ = request(base, "/definitely-not-a-route")
    report(
        "/definitely-not-a-route",
        [] if status == 404 else [f"HTTP {status}, want 404"],
        "404",
    )


def check_landing(base):
    print("\n=== landing + robots ===")
    for path in ("/", "/robots.txt"):
        status, _, _ = request(base, path)
        report(path, [] if status == 200 else [f"HTTP {status}, want 200"], "200")


def check_preview(base, segment, resource_id, env_name, expect_type, expect_segment=None):
    label = f"/{segment}/{resource_id[:8]}…"
    if not resource_id:
        skip(label, f"set {env_name} to check this")
        return

    path = f"/{segment}/{resource_id}"
    status, _, body = request(base, path)
    problems = []
    if status != 200:
        problems.append(f"HTTP {status}, want 200")
    og_type = tag(body, "og:type")
    if og_type != expect_type:
        problems.append(f"og:type={og_type!r}, want {expect_type!r}")
    if not tag(body, "og:title"):
        problems.append("og:title missing — link previews will be blank")
    want_canonical = f"/{expect_segment or segment}/{resource_id}"
    seen = canonical(body)
    if not seen:
        problems.append("canonical link missing")
    elif not seen.endswith(want_canonical):
        problems.append(f"canonical ends {seen[-60:]!r}, want it to end {want_canonical!r}")
    report(label, problems, f"og:type={og_type} image={'yes' if tag(body, 'og:image') else 'no'}")


def main():
    base = (sys.argv[1] if len(sys.argv) > 1 else "https://app.esporta.site").rstrip("/")
    print(f"Checking {base}")

    status, _, _ = request(base, "/")
    if status == 0:
        print(
            f"\n  {YELLOW}WARN{RESET}  {base} is not reachable "
            "(domain not registered, or nothing deployed yet)."
        )
        return 1

    check_association_files(base)
    check_dead_links(base)
    check_landing(base)

    print("\n=== live previews ===")
    check_preview(base, "p", os.environ.get("ESPORTA_POST_ID", ""), "ESPORTA_POST_ID", "article")
    check_preview(base, "s", os.environ.get("ESPORTA_SHORT_ID", ""), "ESPORTA_SHORT_ID", "article")
    check_preview(
        base, "pp", os.environ.get("ESPORTA_PERSONAL_ID", ""), "ESPORTA_PERSONAL_ID", "profile"
    )
    check_preview(base, "op", os.environ.get("ESPORTA_TEAM_ID", ""), "ESPORTA_TEAM_ID", "profile")
    # The prefix is a hint: a team id under /pp must still render, with /op as its
    # canonical and the URL left exactly as it was shared.
    check_preview(
        base,
        "pp",
        os.environ.get("ESPORTA_TEAM_ID", ""),
        "ESPORTA_TEAM_ID",
        "profile",
        expect_segment="op",
    )

    print()
    if failures:
        print(f"{failures} check(s) FAILED.")
        return 1
    print("All checks passed." + (f" {skipped} skipped." if skipped else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
