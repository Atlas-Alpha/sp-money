#!/bin/bash
set -e

# Get bump type (major, minor, patch, or prerelease)
BUMP_TYPE=${1:-prerelease}

# Read current version from package.json
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)
echo "Current version: $CURRENT_VERSION"

# Bump version using npm (works with bun too)
npm version "$BUMP_TYPE" --no-git-tag-version

# Read new version
NEW_VERSION=$(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)
echo "New version: $NEW_VERSION"

# Create commit and tag
git add package.json
git commit -m "chore: release v$NEW_VERSION"
git tag "v$NEW_VERSION"

# Push commit and tag
git push
git push --tags

echo "✓ Released v$NEW_VERSION"
