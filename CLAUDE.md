# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**AI事始(AIことはじめ)** — 医療者のための生成AI自習サイト。医療系教育者が「リンクを送るだけ」で、学習者(研修医・医学生等)が生成AIの使い方を自習し、AIフィードバックを受け、修了証(「目録」)を自己発行できる静的Webサイト。名称の由来は杉田玄白『蘭学事始』。

## 現在の状態

**モック実装済み(A領域のみ実動)。** 全ページの骨格があり、Unit A-1 本文・領域Aクイズ(10問)・A領域目録の発行/共有が動作する。B/C領域・他ユニットはプレースホルダ。git 未初期化・未公開。

正本ドキュメント(実装より優先。仕様変更はまずここに反映):
- `documents/AI事始-要件定義書-v0.7.md` — 要件・技術構成・MVP/モック定義(v0.6 は旧版)
- `documents/AI事始-初級コンピテンシー-v0.2.md` — 学習目標(A/B/C領域)とユニット構成
- `documents/AI事始-参考資料-JSME-ICTシンポジウム-v0.1.md` — 外部参考資料の対応表の正本(リンクのみ掲載・転載禁止・確認日を記録)

## コマンド

```powershell
# 開発サーバ(http://127.0.0.1:8000、変更を自動反映)
.venv\Scripts\mkdocs.exe serve

# ビルド検証(必ず --strict で。警告=エラー扱い)
.venv\Scripts\mkdocs.exe build --strict

# 依存関係の再構築
uv venv .venv; uv pip install --python .venv\Scripts\python.exe -r requirements.txt
```

テストスイートはない。動作確認は `mkdocs serve` でクイズ→合格→目録発行の導線を手で通す(fetch を使うため `file://` 直開きでは動かない)。

## アーキテクチャ

Material for MkDocs + 素のJS(ビルド工程なし・外部ライブラリ/CDN/外部通信ゼロ)。**ページ(md)とJSはデータ属性で疎結合**になっており、この契約を崩さないこと:

- `<div data-quiz-src="../../assets/data/quiz-a.json" data-quiz-gate="a">` — クイズ描画(quiz.js)。`data-quiz-gate`(領域キー a/b/c)があると合格が記録される。無ければ自己チェック(合否なし)。パスは directory URL 基準の相対(units/quiz 配下からは `../../assets/...`)
- `<div data-cert-area="a" data-cert-locked="...">` — 目録発行UI(certificate.js)。area は a/b/c/shokyu(初級目録=3領域合格で解錠)。未合格時は locked 文言を表示
- `<div data-mokuroku-status>` / `<button data-reset-progress>` — 取得状況一覧/記録消去(storage.js)
- 合格状態: `window.AIK`(storage.js)が管理。localStorage キー `aikotohajime.quiz.<area>.passedAt`(ISO日時)。クイズ合格時に CustomEvent `aik:passed` が発火し、同一ページの目録UIが再描画される
- クイズJSON: `docs/assets/data/quiz-*.json`。スキーマ `{title, passRatio, questions:[{q, choices[4], answer(正解index), explanation}]}`。B/C領域は `quiz-b.json`/`quiz-c.json` とページ側フックを足すだけで動く(JS変更不要)
- 読み込み順は mkdocs.yml の extra_javascript で storage.js → quiz.js → certificate.js(依存順。変えない)

## 設計原則(全実装を拘束する制約)

要件定義書 §1.3 より:

1. **教員の手間を増やさない** — 教員の仕事は「リンクを送る」のみ
2. 学習者は体験〜フィードバック〜修了証発行まで一人で完結
3. 保守は運営者一人が **Markdown/JSON のテキスト編集だけ** で回る(AI指示文の正本もリポジトリ内 md = `docs/feedback.md`。Gemへは手動同期し同期日を記録)
4. **ログ収集ゼロ・サーバ送信ゼロ** — アクセス解析禁止。氏名・成績はどこにも送信しない。localStorage(端末内)のみ許可。非目標: ログイン・進捗管理・LMS・API連携チャット(§3)

## 確定済みの主要決定(再議論しない)

- クイズ: 領域ごと10問四択・一括採点・8問以上で合格・再挑戦無制限。発行条件はクイズ合格のみ(ユニット閲覧不問)
- 目録: Canvas→PNGのみ(jsPDF不採用)。氏名は自由入力(ニックネーム可)。SNS共有は Web Share API + X intent(文面のみ、画像は手動添付)の2段構え。個別画像のOGPはサーバが要るため不採用
- B領域は職種別(医師/看護/薬学)タブで題材のみ差し替え、構造・クイズは共通
- 目録は公式な研修証憑ではない旨をサイトと目録画像の両方に明記

## ドキュメント規約

- documents/ のファイル名にバージョンを含める(例: `-v0.7.md`)。改訂時は新バージョンのファイルを作り、旧版は残す。冒頭の改訂履歴に変更点を追記
- 3文書は相互参照している。コンピテンシーや参考資料を変更したら要件定義書への影響を確認(逆も同様)
- 記述言語は日本語

## 未決事項(TBD凍結。勝手に決めない)

運営名義、監修体制、公開URL/リポジトリ所属、ライセンス最終確定(CC BY 4.0候補)、Gem終了時の代替手順、Phase 3(画像生成)スコープ — 要件定義書 §9。これらに関わる作業ではユーザーに確認する。サイト内では「TBD」「準備中」表記を維持。
