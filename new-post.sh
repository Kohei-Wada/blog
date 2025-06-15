#!/bin/bash

template='./src/content/blog-template.md'
slug=$(date +%s%N | cut -c1-13)
new_post="./src/content/blog/$slug.md"

echo "Creating new post with slug: $slug"
cp  "$template" "$new_post"
echo "New post created: $new_post"
