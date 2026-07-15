#!/usr/bin/env bash
set -euo pipefail

# Navigate to the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Verifying / Starting PostgreSQL Test Container ==="
CONTAINER_NAME="skedulo-test-db"
PORT=5433

# Check if the container already exists
if [ "$(docker ps -a -q -f name=^/${CONTAINER_NAME}$)" ]; then
    echo "Container $CONTAINER_NAME exists. Ensuring it is running..."
    docker start "$CONTAINER_NAME"
else
    echo "Creating and starting new PostgreSQL container..."
    docker run --name "$CONTAINER_NAME" \
        -p "$PORT":5432 \
        -e POSTGRES_DB=skedulo \
        -e POSTGRES_USER=tam137 \
        -e POSTGRES_PASSWORD=1 \
        -d postgres:16
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec "$CONTAINER_NAME" pg_isready -U tam137 -d skedulo >/dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo " PostgreSQL is ready."

# Initialize / Reset database schema & seed data for workers
NUM_WORKERS=4
echo "Initializing/Resetting database schema for $NUM_WORKERS workers..."
for i in $(seq 0 $((NUM_WORKERS - 1))); do
    DB_NAME="skedulo_$i"
    echo "Setting up database $DB_NAME..."
    docker exec -i "$CONTAINER_NAME" psql -U tam137 -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" >/dev/null
    docker exec -i "$CONTAINER_NAME" psql -U tam137 -d postgres -c "CREATE DATABASE $DB_NAME;" >/dev/null
    docker exec -i "$CONTAINER_NAME" psql -U tam137 -d "$DB_NAME" < tests/setup-test-db.sql >/dev/null
done

# Start PHP Built-in server inside Docker
echo "=== Building & Starting PHP Test Container ==="
PHP_PORT=8000

# Kill any existing server on this port on host
if lsof -t -i:"$PHP_PORT" >/dev/null 2>&1; then
    echo "Killing existing process on port $PHP_PORT..."
    kill -9 $(lsof -t -i:"$PHP_PORT") || true
fi

# Remove existing container if it exists
docker rm -f skedulo-php-test-server >/dev/null 2>&1 || true

# Build PHP image only if it doesn't exist
if [ -z "$(docker images -q skedulo-php-test 2>/dev/null)" ]; then
    echo "Building PHP test image..."
    docker build -t skedulo-php-test -f tests/Dockerfile.test .
else
    echo "PHP test image already exists, skipping build."
fi

# Run PHP container on host network
docker run --name skedulo-php-test-server \
    --network host \
    -v "$(pwd)":/var/www/html \
    -d skedulo-php-test

# Wait for server to become responsive
echo "Waiting for PHP server to respond..."
until curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:"$PHP_PORT"/login.php | grep -E "200|302" >/dev/null; do
    echo -n "."
    sleep 0.5
done
echo " PHP server is running inside Docker."

# Run tests
echo "=== Running Playwright Tests ==="
EXIT_CODE=0
npx playwright test "$@" || EXIT_CODE=$?

# Teardown
echo "=== Cleaning Up ==="
echo "Stopping PHP Test Container..."
docker rm -f skedulo-php-test-server >/dev/null 2>&1 || true

exit "$EXIT_CODE"
