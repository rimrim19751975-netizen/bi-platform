#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/backend
npx prisma db push --skip-generate

echo "Starting services..."
node dist/index.js &
BACKEND_PID=$!

cd /app/frontend
node .next/standalone/server.js &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
