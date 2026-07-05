---
title: 'Zettelkasten→ブログ→フィードバックのループをgiscusで閉じた'
description: '思いつき→fleeting note→permanent note→記事→読者FB→fleeting noteという知識のループを、仕組みとして完成させた。構成要素（vault、記事化パイプライン、ブログ、コメント欄）と、最後のピースだったgiscus導入の記録。'
pubDate: '2026-07-05'
tags: ['Zettelkasten', 'ブログ運営', '個人開発']
seeAlso: ['blog-axis-curious-driven-tester', 'ai-writing-thinking-ownership-workflow']
---

## 完成したループ

```text
自分の思いつき ──→ fleeting note → permanent note → 記事 → 読者のFB
                       ↑                                      │
                       └──────────────────────────────────────┘
```

Zettelkastenの本来の目的は出力です。ループの起点は自分の思いつきで、それがfleeting noteとして入り、permanent noteに結晶して、記事の素材になる。記事への読者の反応は、思いつきと並ぶ**もう1本の入力**としてfleeting noteに還流します。自分の頭の中だけで回していた円環に、外からの入力が合流して初めて一周です。

2025年5月に「このループが回っていない。ブログが無いのも問題」という課題ノートをvaultに書きました。今日、最後のピースだったコメント欄をブログに付けて、ループの全区間が仕組みとして揃いました。この記事は各構成要素の記録です。

## 構成要素

### 蓄積: Obsidian vault

fleeting note → permanent noteのZettelkasten運用。ここは以前から回っていました。記事の素材はすべてここに溜まります。

### 記事化: garden-harvest

vaultのpermanent noteを束ねて記事に圧縮するClaude Codeスキルです。AIに任せる範囲はprompt単位で毎回判断せず、workflow単位で固定しています ── 思考（ノート・主張・構成）は自分がvaultに書き、文面への圧縮はAI。この境界設計は[別記事](/ja/blog/ai-writing-thinking-ownership-workflow)に書きました。

### 配信: 自作ブログ

Astro製、man(7)風の静的サイト。既存プラットフォームでなく自作にした決め手は、vault→記事のパイプラインを自分の道具で自由に組めることです。ブログの軸をtopicでなくprocessに置いた話も[別記事](/ja/blog/blog-axis-curious-driven-tester)にあります。

### 還流: giscusコメント欄

今日付けた最後のピースです。記事を出しても読者の反応を受ける口が無く、還流の経路がゼロでした。各記事の末尾にコメント＋絵文字リアクション欄が付き、反応が来ればそれが思いつきと合流して新しいfleeting noteの種になります。

## giscus導入メモ

静的サイトにコメント機能を足すのにDB移行は要りません。giscusはGitHub Discussionsをバックエンドにするコメントウィジェットで、導入はscriptタグ1つです。

選定理由:

- コメントの実体はGitHubリポジトリのDiscussionsに保存される。埋め込みが死んでもデータは残る
- 追加の外部依存というより、既に依存しているGitHubへの相乗り
- コメントより敷居の低い絵文字リアクションが付いてくる
- 無料・トラッキング無し・広告無し

導入手順は3つ。リポジトリのDiscussions有効化 → giscus appインストール → 生成されたscriptタグをテンプレートに貼る。

実装で決めたこと:

- **カテゴリはAnnouncements型**。読者が直接Discussionを作れず、giscus経由のみになる（公式推奨）
- **日英記事でスレッドを共有**。このブログは全記事がja/en対で、mappingを`specific` + `term: <slug>`にすると同一slugの両locale版が1つのDiscussionを共有する
- **テーマは自作CSS**。giscusは`data-theme`に任意のCSS URLを渡せるので、サイトのパレットに合わせたmanページ風テーマ（等幅フォント・角丸なし・背景透過）を書いた。1つだけ罠があり、giscusはテーマCSSをCORSモードで取得するため、配信側に`Access-Control-Allow-Origin: https://giscus.app`ヘッダが必要

作業は環境構築からテーマ調整まで含めて半日でした。

## この記事について

この記事自体が上記パイプラインの産物です（素材はvaultのpermanent note 5本、構成と主張は自分、文面への圧縮はClaude）。そしてこの下に、今日付けたばかりのコメント欄があります。

事実として、FBはまだ1件もありません。もし読んでいる人がいたら、コメントでも絵文字リアクション1つでも残していってもらえると嬉しいです。それがこのループの最初の一周になります。
