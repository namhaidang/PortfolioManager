#!/bin/sh
set -e

npm run build

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

echo "Build Output API structure ready"
ls -la .vercel/output/functions/api.func/
