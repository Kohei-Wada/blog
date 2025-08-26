---
title: 'GitHub ActionsでNetlifyを定期的に自動デプロイする方法'
description: ''
pubDate: '2025-08-26'
tags: ['github-actions', 'netlify', '自動化', 'blog']
---

## はじめに

GitHub ActionsでNetlifyを定期的に自動デプロイする方法ブログやポートフォリオをNetlifyで運用しているあなたへ。
「GitHubにコードをプッシュするたびに自動でデプロイされる」のは便利ですよね。
でも、外部APIやCMSから取得したデータが更新されたとき、どうやってサイトを最新の状態に保っていますか？もしかして、手動でデプロイし直したりしていませんか？
今回は、その悩みを解決する方法の１つとして、NetlifyのビルドフックとGitHub Actionsを連携した定期的な自動デプロイの仕組みを解説します。

## なぜ定期的なビルドが必要なのか？

静的なウェブサイトでも、コンテンツが常に静的とは限りません。
例えば、ブログでAPIから最新記事のリストを取得したり、ポートフォリオで最新のプロジェクト情報を外部から取得したりする場合、コードの変更がなくてもコンテンツは日々変わります。
このような場合、手動でデプロイし直すのではなく、決まった時間に自動でビルドとデプロイを繰り返す仕組みが必要です。
これを実現するのが、Netlifyのビルドフックと、GitHubの定期実行機能です。

## 手順

### ステップ1: Netlifyでビルドフックを作成する

まずは、外部からデプロイをトリガーするための専用URLをNetlifyで作成します。
Netlifyのダッシュボードで、対象のサイトを選択します。「Site settings」→「Build & deploy」→「Build hooks」へ移動します。「Add build hook」ボタンをクリックします。任意の名前（例: daily-rebuild）を入力し、デプロイしたいブランチ（通常はmain）を選択して「Save」します。生成されたURLをコピーしておきます。このURLは外部に漏れないように注意してください

### ステップ2: GitHub Actionsで定期実行ジョブを設定する

次に、GitHub Actionsを使って、先ほど作成したビルドフックURLに定期的にアクセスするワークフローを作成します。まずは、必要最低限のシンプルなコードを見てみましょう。このワークフローは、GitHub Secretsに設定したURLを使って、指定した時間にビルドをトリガーします。

シンプルなコード例 (daily-deploy.yml)

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

このシンプルなコードには、運用する上でいくつかの問題点がありました。

### 問題点

- 設定漏れ: GitHub Secretsは一度設定すると値が見えなくなるため、設定されたかどうかわかりにくくNetlify_BUILD_HOOK_URLが未設定だとジョブが失敗します。

- 通信エラー: ネットワークの不安定さによって、curlコマンドが失敗し、デプロイがトリガーされない可能性があります。

- 意図しないデプロイ: スケジュール実行はデフォルトブランチで行われますが、リポジトリの設定変更によって開発ブランチがデフォルトになるなど、意図せずデプロイが実行されてしまう可能性があります。また、CIのチェックが失敗している場合でもデプロイが試行されてしまいます。

### 対策

- 環境変数チェック: ジョブ実行時にNetlify_BUILD_HOOK_URLが設定されているか確認し、未設定の場合はエラーを出力して終了させます。（地味に一番便利かもしれない）

- リトライ機能: curlコマンドが失敗した場合、何度かリトライすることで一時的なネットワークの問題に対応します。

- 実行条件: mainブランチへのプッシュ時、かつテストジョブ（test.yml）が成功した場合のみデプロイが実行されるように、ifとneedsで条件を細かく設定します。

上のいろいろな問題を対策したのが以下コードになります。
.GitHub/workflows/ ディレクトリ配下に、例えば daily-deploy.yml というファイル名で保存してください。

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

ちなみに.GitHub/workflows/test.ymlは、以下のような内容になります。このワークフローは、静的解析、型チェック、ユニットテスト、ビルドといった基本的な品質チェックを実行します。

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

### ステップ3: ビルドフックURLをGitHubのSecretsに設定する

セキュリティのため、ビルドフックURLをコードに直接書き込むのは避けるべきです。GitHubのSecrets機能を使って安全に管理しましょう。

GitHubのリポジトリに移動します。「Settings」→「Secrets and variables」→「Actions」をクリックします。
「New repository secret」ボタンをクリックします。
Nameに Netlify_BUILD_HOOK_URL を、Secretにステップ1でコピーしたビルドフックURLを貼り付けて「Add secret」します。

## 運用例

[筆者は自身のブログ](wada-dev.com)でこの仕組みを実際に運用しており、APIを使って最新のリポジトリ活動（コミット履歴やプロジェクト更新など）を取得し、ポートフォリオページに反映させています。GitHubでの活動は日々変化するため、この自動デプロイ機能により、常に最新のGitHub Activityがブログに反映された状態を維持できています。

してからは手動でのデプロイ作業がなくなり、コードを書いてGitHubにプッシュするだけで、翌日にはブログのポートフォリオも自動的に最新状態になるという理想的な運用が実現できています。

## まとめ

この手順を完了すれば、あなたのウェブサイトは毎日0:00（日本時間）に自動でデプロイされるようになります。この設定により、外部APIから取得した情報や、CMSで更新されたコンテンツが常に最新の状態に保たれます。手動でデプロイし直す手間はもうありません。
GitHub ActionsとNetlifyビルドフックの組み合わせは、ウェブサイトの運用を劇的に効率化する強力なツールです。ぜひあなたのプロジェクトでも試してみてください。
