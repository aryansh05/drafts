#!/usr/bin/env bash

# Load .env file automatically if it exists in the current directory
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

BASE_URL=${BASE_URL}

# Use environment variables from .env, falling back to defaults if not set
TEST_NAME=${TEST_NAME}
TEST_EMAIL=${TEST_EMAIL}
TEST_PASSWORD=${TEST_PASSWORD}

case "$1" in
register)
  curl -i -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
  ;;

login)
  curl -i -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
  ;;

*)
  echo "Usage: bash requests.sh {register|login}"
  exit 1
  ;;
esac
