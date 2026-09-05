#!/usr/bin/env bash
# Checks the association files in this repository — structure, required values,
# and whether anything is still a placeholder. Runs entirely offline.
#
#   bash verify.sh
#
# For the deployed site (HTTP status, content types, fallback routes, 404s), use
# the companion checker, which needs a reachable host:
#
#   python3 scripts/check-site.py https://app.esporta.site
#
# Exit code 0 means the files are correct AND ready to publish.

set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WELL_KNOWN="$DIR/public/.well-known"
FAIL=0
TODO=0

pass() { printf '  \033[32mPASS\033[0m  %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; FAIL=1; }
# Not yet filled in — expected before publishing, a blocker at publish time.
todo() { printf '  \033[33mTODO\033[0m  %s\n' "$1"; TODO=1; }

echo
echo "=== association files in public/.well-known ==="

for f in assetlinks.json apple-app-site-association; do
  p="$WELL_KNOWN/$f"
  if [ ! -f "$p" ]; then
    fail "$f is missing from public/.well-known/"
    continue
  fi
  if python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$p" 2>/dev/null; then
    pass "$f is valid JSON"
  else
    fail "$f is NOT valid JSON"
  fi
  if grep -q '<REPLACE_WITH_REAL' "$p"; then
    todo "$f still contains a placeholder — fill it in before publishing (see DEEPLINK_EXTERNAL_SETUP.md §5/§6)"
  else
    pass "$f has no unreplaced placeholder"
  fi
done

# iOS reads the extension-less name only.
if [ -f "$WELL_KNOWN/apple-app-site-association.json" ]; then
  fail "apple-app-site-association.json exists — iOS reads the extension-less name only"
fi

# Next.js copies public/ to the deployment root verbatim; anywhere else and these
# files are not served at /.well-known/.
if [ -d "$DIR/.well-known" ]; then
  fail ".well-known/ exists at the project root — it must live under public/ to be served"
fi

python3 - "$WELL_KNOWN" <<'PY'
import json, os, re, sys
wk = sys.argv[1]
ok, bad = [], []

try:
    al = json.load(open(os.path.join(wk, "assetlinks.json")))
    t = al[0]["target"]
    (ok if "delegate_permission/common.handle_all_urls" in al[0]["relation"] else bad)\
        .append("assetlinks relation is handle_all_urls")
    (ok if t["namespace"] == "android_app" else bad).append("assetlinks namespace is android_app")
    (ok if t["package_name"] == "com.esporta.esporta" else bad)\
        .append("assetlinks package_name is com.esporta.esporta")
    fps = t["sha256_cert_fingerprints"]
    (ok if isinstance(fps, list) and fps else bad).append("assetlinks has >=1 fingerprint")
    for fp in fps:
        if fp.startswith("<"):
            continue
        (ok if re.fullmatch(r"(?:[0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}", fp) else bad)\
            .append("fingerprint format (32 colon-separated hex bytes): %s..." % fp[:14])
except Exception as e:
    bad.append("assetlinks.json structure unreadable: %s" % e)

try:
    aasa = json.load(open(os.path.join(wk, "apple-app-site-association")))
    d = aasa["applinks"]["details"][0]
    appid = d["appIDs"][0]
    (ok if appid.endswith(".com.esporta.esporta") else bad)\
        .append("appID ends with .com.esporta.esporta")
    team = appid.split(".")[0]
    if not team.startswith("<"):
        (ok if re.fullmatch(r"[A-Z0-9]{10}", team) else bad)\
            .append("Team ID is 10 uppercase alphanumerics: %s" % team)
    paths = [c.get("/") for c in d["components"]]
    (ok if paths == ["/p/*", "/s/*", "/pp/*", "/op/*"] else bad)\
        .append("components are exactly /p/* /s/* /pp/* /op/*  (got %s)" % paths)
    (ok if "/*" not in paths else bad).append("does not claim the whole domain")
except Exception as e:
    bad.append("apple-app-site-association structure unreadable: %s" % e)

for m in ok:  print("  \033[32mPASS\033[0m  %s" % m)
for m in bad: print("  \033[31mFAIL\033[0m  %s" % m)
sys.exit(1 if bad else 0)
PY
[ $? -ne 0 ] && FAIL=1

echo
echo "=== the four link routes exist as real routes ==="
for seg in p s pp op; do
  if [ -f "$DIR/src/app/$seg/[id]/page.tsx" ]; then
    pass "src/app/$seg/[id]/page.tsx"
  else
    fail "src/app/$seg/[id]/page.tsx is missing — /$seg/* would 404 in a browser"
  fi
done
if [ -f "$DIR/src/app/not-found.tsx" ]; then
  pass "src/app/not-found.tsx (real 404 for dead links)"
else
  fail "src/app/not-found.tsx is missing"
fi

echo
if [ "$FAIL" -ne 0 ]; then
  echo "Structure checks FAILED — see DEEPLINK_EXTERNAL_SETUP.md."
elif [ "$TODO" -ne 0 ]; then
  echo "Structure OK. Placeholders still to fill in before publishing."
else
  echo "Files are correct and ready to publish."
  echo "Next: python3 scripts/check-site.py https://app.esporta.site"
fi
exit $(( FAIL + TODO ))
