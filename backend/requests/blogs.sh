#!/usr/bin/env bash

# Load .env file automatically if it exists in the current directory
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

BASE_URL=${BASE_URL}
TOKEN=${TOKEN}

case "$1" in
createBlog)
  curl -i -X POST "$BASE_URL/blog" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "My First Blog Post",
      "disc": "An introduction to my blog.",
      "content": "This is the full content of my first post.",
      "imageUrl": null,
      "publish": true
    }'
  ;;

updateBlog)
  BLOG_ID="$2"
  curl -i -X PUT "$BASE_URL/blog/$BLOG_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Updated Blog Title",
      "disc": "Updated description",
      "content": "Updated content here.",
      "imageUrl": null,
      "publish": true
    }'
  ;;

publish)
  BLOG_ID="$2"
  curl -i -X PATCH "$BASE_URL/blog/$BLOG_ID/publish" \
    -H "Authorization: Bearer $TOKEN"
  ;;

delete)
  BLOG_ID="$2"
  curl -i -X DELETE "$BASE_URL/blog/$BLOG_ID" \
    -H "Authorization: Bearer $TOKEN"
  ;;

getPublish)
  curl -i -X GET "$BASE_URL/blog"
  ;;

getPublishBySlug)
  SLUG="$2"
  curl -i -X GET "$BASE_URL/blog/$SLUG"
  ;;

getMine)
  curl -i -X GET "$BASE_URL/blog/mine" \
    -H "Authorization: Bearer $TOKEN"
  ;;

*)
  echo "Usage: bash blogs.sh {createBlog|updateBlog <id>|publish <id>|delete <id>|getPublish|getPublishBySlug <slug>|getMine}"
  exit 1
  ;;
esac
