#!/bin/bash

set -e

BUILD_ENV=${ENVS:-production}

make ENVS="$BUILD_ENV" build push

if [ x"$BRANCH_NAME" == x"master" ] && [ x"$SEMAPHORE" == x"true" ]; then
  npm run doc
  git config user.email "semaphore@makeomatic.co"
  git config user.name "semaphore"
  touch ./docs/.nojekyll
  git add -f ./docs
  git commit -m "docs($SEMAPHORE_BUILD_NUMBER): updated remote public documentation"
  git push origin `git subtree split --prefix docs master`:refs/heads/gh-pages --force
fi
