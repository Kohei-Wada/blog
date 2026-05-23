---
title: 'Scheduled Auto-Deploys to Netlify with GitHub Actions'
description: 'How to combine Netlify build hooks with GitHub Actions to set up scheduled, automatic deploys.'
pubDate: '2025-08-26'
tags: ['github-actions', 'netlify', 'automation', 'blog']
---

## Introduction

If you run a blog or portfolio on Netlify, you already know how nice it is that "every push to GitHub triggers a deploy automatically."
But what about when the data you pull from an external API or CMS gets updated? How do you keep the site fresh then? Are you maybe... redeploying by hand?
This post walks through one way to solve that: a scheduled auto-deploy setup that combines Netlify build hooks with GitHub Actions.

## Why do we need scheduled builds?

Even a "static" website doesn't always have static content.
For example, if your blog fetches a list of recent articles from an API, or your portfolio pulls the latest project info from somewhere external, the content keeps changing day to day even when the code doesn't.
In cases like these, what you want isn't a manual redeploy — it's a mechanism that automatically rebuilds and redeploys on a set schedule.
That's exactly what Netlify build hooks and GitHub's scheduled-run feature give you.

## Steps

### Step 1: Create a build hook in Netlify

First, generate a dedicated URL in Netlify that external systems can hit to trigger a deploy.

1. In the Netlify dashboard, select the target site.
2. Go to "Site settings" → "Build & deploy" → "Build hooks."
3. Click the "Add build hook" button.
4. Give it any name (e.g. `daily-rebuild`), pick the branch you want to deploy (usually `main`), and hit "Save."

Copy the generated URL. Be careful not to leak this URL — anyone with it can trigger a deploy.

### Step 2: Set up a scheduled job in GitHub Actions

Next, use GitHub Actions to create a workflow that hits the build hook URL on a schedule. Let's start with the bare minimum. This workflow uses a URL stored in GitHub Secrets to trigger a build at the time you specify.

A simple example (`daily-deploy.yml`):

```yaml
# name: このワークフローの名前を定義します。
name: Daily Netlify Build

# on: このワークフローがいつ実行されるかを定義します。
on:
  schedule:
    - cron: '0 15 * * *' # 毎日0:00 (JST) に実行
  workflow_dispatch: # 手動実行も可能にする

# jobs: 実行するジョブを定義します。
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Netlify Build Hook
        env:
          NETLIFY_URL: ${{ secrets.NETLIFY_BUILD_HOOK_URL }} # 環境変数に設定
        run: curl -X POST $NETLIFY_URL
```

That simple version has a few real-world problems.

### Problems

- Missing configuration: GitHub Secrets become invisible once set, so it's hard to tell whether they're actually configured. If `NETLIFY_BUILD_HOOK_URL` is unset, the job just fails.

- Network errors: A flaky network can cause the `curl` command to fail, and your deploy never gets triggered.

- Unintended deploys: Scheduled runs execute on the default branch, but if you change the repo settings — say, making a development branch the default — you can end up deploying something you didn't mean to. And the deploy still runs even when CI checks are failing.

### Fixes

- Env var check: At job time, verify that `NETLIFY_BUILD_HOOK_URL` is set; if it isn't, print an error and exit. (Honestly, this might be the most quietly useful one.)

- Retry logic: If `curl` fails, retry a few times to absorb temporary network hiccups.

- Run conditions: Use `if` and `needs` to scope things tightly so a deploy only runs on `main` _and_ only after the test job (`test.yml`) succeeds.

The code below addresses all of the above.
Save it under `.github/workflows/` — for example as `daily-deploy.yml`.

```yaml
name: 🏗️ Daily Build & Deploy

# on: このワークフローがいつ実行されるかを定義します。
on:
  # schedule: cron構文を使って定期実行スケジュールを設定します。
  # '0 15 * * *' はUTCで15:00、つまり日本時間(JST)の00:00を意味します。
  schedule:
    - cron: '0 15 * * *'
  # workflow_dispatch: GitHubのWeb UIから手動で実行できるようにします。
  workflow_dispatch:

# env: ワークフロー全体で利用する環境変数を定義します。
# secrets.NETLIFY_BUILD_HOOK_URLは、GitHubリポジトリのSecretsに設定する値です。
env:
  URL: ${{ secrets.NETLIFY_BUILD_HOOK_URL }}

# jobs: 実行するジョブを定義します。
jobs:
  # test: 最初にテストを実行するジョブ（任意）。
  test:
    name: 🧪 Run Tests
    # if: メインブランチにプッシュされた時のみ実行します。
    if: GitHub.ref == 'refs/heads/main'
    # uses: 既存のテスト用ワークフローを再利用します。
    uses: ./.GitHub/workflows/test.yml

  # deploy: Netlifyビルドをトリガーするジョブ。
  deploy:
    name: 🚀 Trigger Netlify Build
    # needs: testジョブが成功した場合にのみ実行します。
    needs: test
    # runs-on: ジョブを実行する仮想環境を指定します。
    runs-on: ubuntu-latest
    # if: ジョブの実行条件。テストが成功し、メインブランチでの実行であることを確認します。
    if: success() && GitHub.ref == 'refs/heads/main'

    # steps: ジョブで実行する一連のコマンドを定義します。
    steps:
      - name: 🔔 Trigger Netlify build hook
        # run: シェルコマンドを実行します。
        run: |
          # 環境変数URLが設定されているかチェックします。
          if [ -z "$URL" ]; then
            echo "❌ Error: NETLIFY_BUILD_HOOK_URL secret is not configured"
            echo "Please add the Netlify build hook URL to your repository secrets:"
            echo "1. Go to Settings → Secrets and variables → Actions"
            echo "2. Add a new secret named NETLIFY_BUILD_HOOK_URL"
            echo "3. Get the webhook URL from Netlify: Site settings → Build & deploy → Build hooks"
            exit 1
          fi

          # curlコマンドでビルドフックURLにPOSTリクエストを送信します。
          # --fail: HTTPエラー時に終了コードを返します。
          # --silent: 進捗状況を表示しません。
          # --show-error: エラーメッセージを表示します。
          # リトライ機能も実装されているため、一時的な通信エラーにも対応できます。
          MAX_RETRIES=3
          RETRY_COUNT=0
          while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            echo "Attempt $((RETRY_COUNT + 1)) of $MAX_RETRIES"
            if curl --fail --silent --show-error \
                    --request POST \
                    --header "Content-Type: application/JSON" \
                    --data '{}' \
                    "$URL"; then
              echo "✅ Successfully triggered Netlify build"
              exit 0
            else
              RETRY_COUNT=$((RETRY_COUNT + 1))
              if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                echo "⚠️ Build trigger failed, retrying in 10 seconds..."
                sleep 10
              fi
            fi
          done
          echo "❌ Failed to trigger build after $MAX_RETRIES attempts"
          exit 1
```

For reference, `.github/workflows/test.yml` looks like this. It runs the basics — static analysis, type checking, unit tests, and a build — as quality gates.

```yml
name: 🧪 Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_call:

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - name: 📚 Checkout
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🔍 Type check
        run: npm run typecheck

      - name: 🧹 Lint
        run: npm run lint

      - name: 🧪 Run tests
        run: npm run test:run

      - name: 🏗️ Build
        run: npm run build
```

### Step 3: Store the build hook URL in GitHub Secrets

For security reasons, you should never hard-code the build hook URL. Use GitHub Secrets to manage it safely.

1. Go to your GitHub repository.
2. Click "Settings" → "Secrets and variables" → "Actions."
3. Click the "New repository secret" button.
4. Set Name to `NETLIFY_BUILD_HOOK_URL`, paste the build hook URL you copied in Step 1 as the Secret value, and click "Add secret."

## In production

[I'm running this exact setup on my own blog](wada-dev.com): it pulls my latest repository activity (commits, project updates, and so on) from an API and reflects it on the portfolio page. My GitHub activity changes daily, so this auto-deploy setup keeps the blog showing an up-to-date GitHub Activity view at all times.

Since I put this in place, manual deploys have disappeared from my workflow. I just write code, push to GitHub, and by the next day my blog and portfolio are up to date automatically — pretty much the ideal setup.

## Wrapping up

Once you've finished these steps, your site will deploy itself every day at 0:00 JST. With this in place, content pulled from external APIs and updates made in your CMS stay fresh on their own. No more redeploying by hand.
GitHub Actions plus Netlify build hooks is a powerful combo that drastically streamlines site operations. Give it a try in your own projects.
