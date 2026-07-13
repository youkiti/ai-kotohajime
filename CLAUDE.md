# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**AI事始(AIことはじめ)** — 医療者のための生成AI自習サイト。医療系教育者が「リンクを送るだけ」で、学習者(研修医・医学生等)が生成AIの使い方を自習し、AIフィードバックを受け、修了証(「目録」)を自己発行できる静的Webサイト。名称の由来は杉田玄白『蘭学事始』。

## 現在の状態

**モック実装済み(A・B・C領域が実動)。** 全ページの骨格があり、A領域(Unit A-1 本文・領域Aクイズ10問・目録)、B領域(Unit B-1/B-2 本文・領域Bクイズ5問・実践課題の提出・目録)、C領域(Unit C-1/C-2 本文・領域Cクイズ10問・目録)が動作する。Unit A-2 のみプレースホルダ。

正本ドキュメント(実装より優先。仕様変更はまずここに反映):
- `documents/AI事始-要件定義書-v0.9.md` — 要件・技術構成・MVP/モック定義・英語版(i18n)仕様(v0.8 以前は旧版)
- `documents/AI事始-初級コンピテンシー-v0.3.md` — 学習目標(A/B/C領域)とユニット構成(v0.2 は旧版)
- `documents/AI事始-参考資料-JSME-ICTシンポジウム-v0.2.md` — 外部参考資料の対応表の正本(リンクのみ掲載・転載禁止・確認日を記録。v0.1 は旧版)

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

- `<div data-quiz-src="../../assets/data/quiz-a.json" data-quiz-gate="a">` — クイズ描画(quiz.js)。`data-quiz-gate`(領域キー a/b/c)があると合格が記録される。無ければ自己チェック(合否なし)。パスは directory URL 基準の相対(units/quiz 配下からは `../../assets/...`)。`data-quiz-src` のパスは日英で同一のまま書く(suffix方式のアセットローカライズにより `/en/` ビルドでは自動的に対応する `.en.json` の中身が配置される)
- `<div data-exercise-gate="b" data-exercise-marker="【AI事始 講評】" data-exercise-minlength="100">` — 実践課題の提出UI(exercise.js)。検証はマーカー(固定見出し)を含む+最低文字数のテキスト存在確認のみ。**貼付テキストは保存せず提出日時のみ記録**。マーカー文字列は exercise.js の既定値 / ページの `data-exercise-marker` / `docs/feedback.md` の採点プロンプトが出力させる見出しの3点で同期させること(変更時は3箇所とも直す)。英語版は `[AI Kotohajime Feedback]`(一字一句固定)で、exercise.js(既定値)/ `quiz/b.en.md` の `data-exercise-marker` / `feedback.en.md` の採点プロンプトの3点同期が対になる。英語版の最低文字数は `data-exercise-minlength="200"`(日本語版は100のまま)
- `<div data-cert-area="a" data-cert-locked="...">` — 目録発行UI(certificate.js)。area は a/b/c/shokyu(初級目録=3領域修了で解錠)。未達時は locked 文言を表示
- `<div data-mokuroku-status>` / `<button data-reset-progress>` — 取得状況一覧/記録消去(storage.js)
- 修了状態: `window.AIK`(storage.js)が管理。localStorage キーは `aikotohajime.quiz.<area>.passedAt` と `aikotohajime.exercise.<area>.submittedAt`(いずれもISO日時)。**`AIK.isPassed(area)` は「クイズ合格 AND(実践課題必須領域なら)課題提出」の領域修了判定**で、クイズ単体の合否は `AIK.passedAt(area)`。実践課題を要する領域は storage.js の `EXERCISE_AREAS`(現在 b のみ)で定義。クイズ合格・課題提出のたびに CustomEvent `aik:passed` が発火し、同一ページの取得状況・目録UIが再描画される。これらの進捗キーは**日本語版・英語版で共有**する(言語別に分けない)
- クイズJSON: `docs/assets/data/quiz-*.json`。スキーマ `{title, passRatio, questions:[{q, choices[4], answer(正解index), explanation}]}`。問題数は A/C=10問・B=5問(合格ラインは `ceil(問題数×passRatio)` で自動計算)。C領域は `quiz-c.json` とページ側フックを足すだけで動く(JS変更不要)
- 多言語化(i18n): **mkdocs-static-i18n** の suffix 方式。`.en.md` / `.en.json` を原文の隣に置くと英語版になる(例: `b1.md` に対して `b1.en.md`)。日本語サイトはルート、英語ページは `/en/` 配下に生成され、未翻訳ページは日本語版で補完される(fallback_to_default)
- `.en.md` 内のサイト内リンクは**基底ファイル名**で書く(`b1.md` であって `b1.en.md` ではない。プラグインが言語別ビルド時に解決する)
- 言語設定: localStorage キー `aikotohajime.lang`(値は `ja`/`en`)。`lang-redirect.js` が初回訪問時のみ `navigator.language` で自動判定・リダイレクトし、以後は自動リダイレクトしない。ヘッダーの言語セレクタで手動切替すると同キーが上書きされる。`AIK.reset()`(storage.js)ではこのキーは消えない
- JS内のUI文字列は各ファイル内の `I18N = {ja, en}` テーブルで管理し、`document.documentElement.lang` で切替する
- 読み込み順は mkdocs.yml の extra_javascript で lang-redirect.js → storage.js → quiz.js → exercise.js → certificate.js(依存順。変えない。lang-redirect.js は AIK 非依存のため先頭)
- theme features に `navigation.instant` を追加しないこと(全JSがフルページロード前提の初期化のため、SPA的ページ遷移では描画されなくなる)
- 日本語ページ(md/json)を更新したら、隣の `.en.md` / `.en.json` も更新すること(保守原則3参照)

## 設計原則(全実装を拘束する制約)

要件定義書 §1.3 より:

1. **教員の手間を増やさない** — 教員の仕事は「リンクを送る」のみ
2. 学習者は体験〜フィードバック〜修了証発行まで一人で完結
3. 保守は運営者一人が **Markdown/JSON のテキスト編集だけ** で回る(AI指示文の正本 = `docs/feedback.md` の採点プロンプト。学習者が実際にコピーして使うものが正本そのものであり、外部サービスへの同期作業は存在しない)
4. **ログ収集ゼロ・サーバ送信ゼロ** — アクセス解析禁止。氏名・成績はどこにも送信しない。localStorage(端末内)のみ許可。非目標: ログイン・進捗管理・LMS・API連携チャット(§3)

## 確定済みの主要決定(再議論しない)

- クイズ: 四択・一括採点・8割以上で合格・再挑戦無制限。A/C領域=10問(8問合格)、B領域=シナリオ型5問(4問合格)
- 目録発行条件: A/C領域=クイズ合格のみ。**B領域=クイズ合格+実践課題の提出**(順序不問)。いずれもユニット閲覧不問
- B領域実践課題: 演習した対話履歴の最後に採点プロンプトを送って講評を受け、講評テキストをサイトに貼付して提出。検証はマーカー+文字数の存在確認のみで、偽装可能性は自己申告型として許容(要件定義書 §4.6)
- フィードバックAIは採点プロンプト単一方式(Gem版は v0.8 で廃止済み。復活させない)。基本は対話履歴の最後に送る、フォールバックは新規チャットに成果物ごと貼る
- 目録: Canvas→PNGのみ(jsPDF不採用)。氏名は自由入力(ニックネーム可)。SNS共有は Web Share API + X intent(文面のみ、画像は手動添付)の2段構え。個別画像のOGPはサーバが要るため不採用
- B領域は職種別(医師/看護/薬学)タブで題材のみ差し替え、構造・クイズ・採点プロンプトは共通
- 目録は公式な研修証憑ではない旨をサイトと目録画像の両方に明記
- 英語版(i18n): mkdocs-static-i18n の suffix 方式(`.en.md`/`.en.json`)。クイズ合格・課題提出の進捗は言語間で共有。ブラウザ言語による自動振り分けは初回訪問時のみ(判定後は `aikotohajime.lang` に従う)。英語版実践課題の最低文字数は200。目録は和風意匠を維持し文言のみ英語化(要件定義書 §4.8)

## ドキュメント規約

- documents/ のファイル名にバージョンを含める(例: `-v0.7.md`)。改訂時は新バージョンのファイルを作り、旧版は残す。冒頭の改訂履歴に変更点を追記
- 3文書は相互参照している。コンピテンシーや参考資料を変更したら要件定義書への影響を確認(逆も同様)
- 記述言語は日本語

## 未決事項(TBD凍結。勝手に決めない)

運営名義、監修体制、公開URL/リポジトリ所属、ライセンス最終確定(CC BY 4.0候補)、Phase 3(画像生成)スコープ — 要件定義書 §9。これらに関わる作業ではユーザーに確認する。サイト内では「TBD」「準備中」表記を維持。
