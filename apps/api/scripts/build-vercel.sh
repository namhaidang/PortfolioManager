#!/bin/sh
set -e

echo "=== Build starting ==="
echo "Working directory: $(pwd)"
echo "Node: $(node -v)"

echo "=== Running tsup ==="
npm run build

echo "=== Bundle built ==="
ls -la api/

echo "=== Setting up Build Output API ==="
mkdir -p .vercel/output/static .vercel/output/functions/api.func

cp api/index.js .vercel/output/functions/api.func/index.mjs

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

echo "=== Build Output API ready ==="
ls -laR .vercel/output/
echo "=== Done ==="
