#!/bin/sh
set -e

echo "=== Build starting ==="
echo "Working directory: $(pwd)"

echo "=== Running tsup ==="
npm run build
echo "=== Bundle built ($(wc -c < api/index.js) bytes) ==="

echo "=== Setting up Build Output API ==="
mkdir -p .vercel/output/static .vercel/output/functions/api.func

mv api/index.js .vercel/output/functions/api.func/index.mjs

cat > .vercel/output/functions/api.func/.vc-config.json <<'EOF'
{
  "runtime": "nodejs20.x",
  "handler": "index.mjs",
  "launcherType": "Nodejs"
}
EOF

cat > .vercel/output/config.json <<'EOF'
{
  "version": 3,
  "routes": [
    { "src": "/(.*)", "dest": "/api" }
  ]
}
EOF

# Remove directories that would trigger Vercel's @vercel/node auto-detection
rm -rf api src

echo "=== Build Output API ready ==="
ls -laR .vercel/output/
echo "=== Remaining project files ==="
ls -la
echo "=== Done ==="
