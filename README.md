# AI事始(AIことはじめ)

**医療者のための生成AI自習サイト** — 医療系教育者が「ここを見ておいて」とリンクを送るだけで、学習者(研修医・医学生・看護学生・薬学生など)が生成AIの実践的な使い方を自習し、AIからフィードバックを受け、修了証(「目録」)まで自分で発行できる静的Webサイトです。名称は杉田玄白『蘭学事始』に由来します。

## 🌐 公開サイト

**https://youkiti.github.io/ai-kotohajime/**

> **現在はモック版です(領域Aのみ実動)。** Unit A-1 の学習・領域Aクイズ(10問)・A領域目録の発行が実際に体験できます。領域B・Cはページ骨格のみです。

## 特徴

- **登録不要・ログ収集ゼロ** — バックエンドを持たない静的サイト(GitHub Pages)。アクセス解析なし。クイズの合格記録は学習者の端末内(localStorage)にのみ保存されます
- **自己完結の学習導線** — 教材を読む → 手元の生成AI(ChatGPT/Claude/Gemini/Copilot等)でプロンプトを試す → フィードバックAIに提出 → 領域クイズ(8割合格・再挑戦無制限) → 目録をブラウザ内で生成(Canvas → PNG)
- **教員の手間を増やさない** — 教員の仕事はリンクを送ることだけ。課題文テンプレートも[教員向けページ](https://youkiti.github.io/ai-kotohajime/for-teachers/)に用意
- **目録は公式な研修証憑ではありません** — 学習の動機づけと任意の修了報告のための自己発行ツールです

## リポジトリ構成

```
documents/   仕様の正本(要件定義書・初級コンピテンシー・参考資料対応表)
docs/        サイト本体(Markdown + 素のJS/CSS。ビルド工程なし)
  assets/js/     クイズエンジン・目録生成(Canvas PNG + Web Share API)・進捗管理
  assets/data/   クイズ設問(JSON)
mkdocs.yml   Material for MkDocs 設定
```

## 開発

```powershell
# 初回セットアップ
uv venv .venv
uv pip install --python .venv\Scripts\python.exe -r requirements.txt

# 開発サーバ(http://127.0.0.1:8000)
.venv\Scripts\mkdocs.exe serve

# ビルド検証
.venv\Scripts\mkdocs.exe build --strict
```

main ブランチへ push すると、GitHub Actions が自動でビルドして GitHub Pages に公開します(`.github/workflows/deploy.yml`)。

## 誤りの報告・要望

[GitHub Issues](https://github.com/youkiti/ai-kotohajime/issues) までお寄せください。PRも受け付けます(レビュー基準は今後 CONTRIBUTING.md に明文化予定)。

## ライセンス・運営

- ライセンス: TBD(CC BY 4.0 を検討中)
- 運営名義・監修体制: TBD(モック段階)
- 免責事項・プライバシー方針は[公開サイト](https://youkiti.github.io/ai-kotohajime/)に掲載しています
