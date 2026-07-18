# AI事始 作問ガイドライン v0.3

作成日: 2026-07-14
ステータス: 確定(v0.3)

## 改訂履歴
- v0.3 (2026-07-18): 機械チェックに L3(選択肢長の最長/最短比 1.5 超で違反)を追加し、§2.1 の「最長/最短比1.5倍以内」を lint で検査するようにした
- v0.2: §5「出典と検証状況」を新設。準拠先として名前だけ挙げていた NBME Item-Writing Guide(2024年10月版)と Haladyna, Downing & Rodriguez (2002) について、書誌情報・URL・原文引用を明記し、§2 の各原則との対応を照合した(照合日 2026-07-17)。あわせて、数値閾値(1.5倍・40%・0.8〜1.3 等)が外部出典のない本プロジェクト独自基準であること、Haladyna は公式版でなく第三者ホストのPDFコピーで照合したことを明示。原則・閾値そのものの変更はない
- v0.1: 新規作成。Issue #2「クイズ選択肢の testwiseness cue 解消」対応。既存クイズ全40問に「正答肢が最長」「断定語・婉曲表現の偏り」「正答肢だけの網羅列挙構造」という、内容を知らなくても正答を推測できる手がかり(testwiseness cue)が系統的に存在することが判明したため、作問原則を正本文書化し、機械チェック(lint)・Claude Code hook による自動チェックの基準とする。

---

## 1. 目的と適用範囲

本文書は、AI事始の四択クイズ・自己チェック(`docs/assets/data/quiz-*.json` の全ファイル。日本語版・英語版とも)を作成・改訂する際に従うべき作問原則の**正本**である。NBME Item-Writing Guide および Haladyna らの多肢選択問題(MCQ)作成原則に準拠する(書誌情報・原文引用・照合状況は §5)。

対象は本番クイズ(領域A・C=10問、領域B=5問)・自己チェック(3問、合否は記録しないが同じ品質基準を適用)のすべてであり、合否判定の有無にかかわらず同一の原則を適用する。

本文書の「機械チェックの閾値」節は `scripts/quiz_lint.py` の実装と一字一句整合させる。閾値を変更する場合は、本文書と lint の両方を同時に改訂すること。

---

## 2. 原則

### 2.1 長さの統一

全選択肢を同程度の長さ・詳しさにする。目安は**最長/最短比 1.5倍以内**。正答肢が最長になる問題は、ファイル全体の**40%以下**に抑える(正答肢の長さで見分けられてしまうため)。

**悪い例**(正答肢だけ長く説明的):
- ア. AIが疲れているから
- イ. AIの出力には確率的なゆらぎ(サンプリング)があり、同じ入力でも次に来る語の選ばれ方が毎回わずかに変わるため、表現や語順が変化しうる(正答)
- ウ. サーバーが故障しているから
- エ. 質問者が違うから

**良い例**(誤答肢に具体性を足し、正答肢は簡潔化):
- ア. AIの処理が一時的に混み合っているため、出力の質が落ちている
- イ. AIの出力には確率的なゆらぎがあり、表現が変わることがある(正答)
- ウ. 直前の会話内容をAIが取りこぼし、別の話題として処理している
- エ. 質問の送信時刻によって、AIの応答モードが自動的に切り替わっている

### 2.2 断定語・婉曲表現の対称性

「必ず」「一切」「すべて」等の断定語を使うなら、正答肢・誤答肢の双方に同程度の頻度で使う。「〜うる」「〜ことがある」等の婉曲表現を正答肢専用にしない。

**悪い例**(断定語が誤答肢に集中、婉曲表現は正答肢だけ):
- ア. バイアスは必ず学習データの偏りだけが原因である
- イ. 最新のAIでは技術的にバイアスは完全に解消されている
- ウ. 学習データの偏りが出力に反映されることがあるため、内容を踏まえて解釈する必要がある(正答)
- エ. バイアスは常に画像生成AIだけの問題である

**良い例**(正答肢も言い切り調にし、誤答肢にも断定語を配分):
- ア. バイアスは学習データの偏りのみが原因であり、他の要因は一切関与しない
- イ. 最新のAIでは技術的にバイアスは完全に解消されている
- ウ. 学習データの偏りが出力に反映されるため、内容を踏まえて解釈する必要がある(正答)
- エ. バイアスは画像生成AIに特有の問題であり、文章生成AIでは生じない

### 2.3 構造の均質性

列挙構造((1)(2)(3)式)・括弧補足・文末表現(体言止め/です・ます等)を全選択肢で揃える。正答肢だけが網羅列挙構造を持たないようにする。

**悪い例**(正答肢だけ列挙構造):
- ア. 文字数の確認のみでよい
- イ. 誤字脱字の確認のみでよい
- ウ. (1)事実確認、(2)対象者への適合、(3)有害性の有無、の3点を検証する(正答)
- エ. AI自身に確認させればよい

**良い例**(正答肢を散文化して構造を揃える):
- ア. 文字数と誤字脱字だけを確認すればよい
- イ. 生成にかかった時間と使用したAI名だけを記録すればよい
- ウ. 添付文書との整合、対象読者に伝わる表現か、誤解を招く記載がないかを確認する(正答)
- エ. AI自身に「正確か」と尋ね、その回答を根拠とする

### 2.4 もっともらしい誤答

誤答肢は学習者が実際に持ちがちな誤解(ミスコンセプション)に基づいて作る。荒唐無稽な捨て肢を置かない。ただし**専門家が読めば明確に誤りと判定でき、正答が一意である**ことを損なわない。

**悪い例**(荒唐無稽な誤答):
- ア. AIが患者に直接電話をかけて説明してしまうため
- イ. AIの回答速度が遅くなるため
- ウ. 入力内容が事業者のサーバーへ送信され、学習や品質改善に利用されうるため(正答)
- エ. AIが機嫌を損ねて不正確な回答を返すため

**良い例**(実際にありがちな誤解に基づく誤答):
- ア. 院内のパソコンから入力すれば外部送信にはあたらないため
- イ. 氏名だけを伏せれば残りの情報はそのまま入力してよいため
- ウ. 入力内容が事業者のサーバーへ送信され、学習や品質改善に利用されうるため(正答)
- エ. 利用者が少ない時間帯に入力すれば、記録が残らず安全であるため

### 2.5 正答位置の分散

ファイル全体で `answer` インデックス(0〜3)が偏らないようにする。特定の位置(例: 常に2番目)に正答が集中すると、内容を読まずに位置だけで正答率が上がってしまう。

**悪い例**: 10問中6問で `answer` が同じインデックス(例: すべて2)。
**良い例**: 10問の `answer` が `[0,2,1,3,0,1,2,3,1,0]` のように分散し、各インデックスが最低1回は出現する。

### 2.6 消去法耐性(cover-the-options)

選択肢を隠して問題文だけを読んでも、何を問われているかが分かる(=解答の方向性を自分で構成できる)ことを確認する。問題文(幹)が選択肢に依存せず自立していること。

**悪い例**(選択肢がないと何を問われているか分からない): 「次のうち正しいものはどれか。」
**良い例**(幹だけで論点が分かる): 「生成AIの出力が毎回同じ文章にならない理由として最も適切なのはどれか。」

### 2.7 正答の一意性と解説の整合

選択肢の文言を改修するときは、正答の内容的正しさを維持し、`explanation`(解説)を新しい選択肢の文言と食い違わないよう同時に更新する。解説が改修前の選択肢の言い回しを引きずっていないか、改修のたびに確認する。

---

## 3. 機械チェック(lint)の閾値

`scripts/quiz_lint.py` が自動検査する項目と閾値は以下の通り。**本節が正本、lint は実装**であり、閾値を変える場合は両方を同時に改訂する。

言語判定: ファイル名が `.en.json` で終われば英語、それ以外は日本語。

### S. スキーマ検査(エラー扱い、他の検査より優先表示)
JSONとしてパース可能か。トップレベルに `title`(str)・`passRatio`(数値)・`questions`(list)があるか。各問題に `q`(str)・`choices`(要素4のstrリスト)・`answer`(int 0〜3)・`explanation`(str)があるか。

### L1. 正答肢最長の割合(ファイル単位)
正答肢が**厳密に最長**(他のどの選択肢よりも文字数が多い)である問題数が `max(1, floor(0.4 × 問題数))` を超えたら違反(10問→4問、5問→2問、3問→1問)。

### L2. 正答肢長の比(問題単位)
`len(正答肢) / mean(len(各選択肢))` が **0.8〜1.3** の範囲外なら違反。文字数は `len(str)` で数える(日英とも)。

### L3. 選択肢長の最長/最短比(問題単位)
`max(len(選択肢)) / min(len(選択肢))` が **1.5** を超えたら違反。文字数は `len(str)` で数える(日英とも)。§2.1「最長/最短比1.5倍以内」に対応する。

### W. 断定語・婉曲表現の偏り(ファイル単位)
- 日本語の断定語: `必ず / 一切 / すべて / 全て / 絶対 / 常に / 決して / 完全に / 例外なく / のみ`(単純部分文字列マッチ)
- 日本語の婉曲表現: `ことがある / 場合がある / 可能性 / かもしれない / おそれ / 傾向`
- 英語の断定語(単語境界・大文字小文字無視の正規表現): `always / never / only / all / every / none / completely / entirely / guaranteed?`
- 英語の婉曲表現: `may / might / can / could / sometimes / often / possible / possibly / tends? / likely`
- 違反条件(いずれかを満たせば違反、ファイル単位):
  - 断定語の延べ出現が誤答肢に3回以上 **かつ** 正答肢に0回
  - 婉曲表現の延べ出現が正答肢に3回以上 **かつ** 誤答肢に0回

### P. 正答位置の分散(ファイル単位)
- 問題数8以上: 0〜3の各インデックスが最低1回出現し、かつ最頻インデックスの出現数が `ceil(0.4 × 問題数)` 以下
- 問題数8未満: 最頻インデックスの出現数が `ceil(0.6 × 問題数)` 以下(5問→3、3問→2)

lint は違反なしで終了コード0、違反ありで終了コード1を返す。実行方法:

```bash
python scripts/quiz_lint.py                              # docs/assets/data/quiz-*.json 全件
python scripts/quiz_lint.py docs/assets/data/quiz-a.json  # 指定ファイルのみ
```

クイズJSONを Claude Code の Edit/Write で編集すると、`scripts/quiz_hook.py`(PostToolUse hook)が自動で lint を実行し、違反があれば結果を会話に注入する。

---

## 4. 定性チェックリスト(lint では測れない項目)

機械チェックだけでは判定できない項目。改修のたびに人手で確認する。

- [ ] 誤答肢はもっともらしいか(実際にありがちな誤解に基づいているか。荒唐無稽でないか)
- [ ] それでいて誤答肢は専門家が読めば明確に誤りと判定できるか(正答とまぎらわしくなっていないか)
- [ ] 正答は一意か(複数の選択肢が正答になりうる余地がないか)
- [ ] cover-the-options: 選択肢を隠して問題文だけ読んでも解答の方向性を構成できるか
- [ ] 解説(explanation)は選択肢の現在の文言と整合しているか(改修前の言い回しへの言及が残っていないか)
- [ ] 日本語版と英語版は、選択肢の順序・正答位置・内容が同期しているか(該当する場合)

---

## 5. 出典と検証状況

### 5.1 出典(準拠する外部文書)

1. **NBME Item-Writing Guide** — National Board of Medical Examiners『NBME Item-Writing Guide: Constructing Written Test Questions for the Health Sciences』2024年10月版
   - 案内ページ: https://www.nbme.org/educators/item-writing-guide
   - PDF(公式): https://info.nbme.org/rs/552-QHC-046/images/NBME_Item-Writing-Guide.pdf
   - 照合状況: **照合済み**。2026-07-17 に公式PDF(全94ページ)を取得し、§5.2 の引用箇所を原文で確認した
2. **Haladyna らのMCQ作成原則** — Haladyna, T. M., Downing, S. M., & Rodriguez, M. C. (2002). A review of multiple-choice item-writing guidelines for classroom assessment. *Applied Measurement in Education*, 15(3), 309–334. https://doi.org/10.1207/S15324818AME1503_5
   - 照合状況: **一部未検証**。公式版(Taylor & Francis)は有料のため取得していない。照合は大学サイト掲載のPDFコピー(https://site.ufvjm.edu.br/fammuc/files/2016/05/item-writing-guidelines.pdf、2026-07-17 取得)で行い、書誌事項(著者・誌名・巻号・掲載ページ 309–334)が本文1ページ目の記載と一致することは確認したが、**このコピーが公式版と完全に同一である保証はない**

本ガイドラインが対策対象とする testwiseness cue の枠組みは、NBMEガイド第3章の "Flaws That Cue the Testwise Examinee" に対応する。

### 5.2 原則と出典の対応(原文引用)

引用はすべて §5.1 のPDFから逐語で抜粋した。ページ番号はPDF内の印刷ページ。Haladyna の番号は同論文 Table 1「A Revised Taxonomy of Multiple-Choice (MC) Item-Writing Guidelines」(31項目)の項目番号。

**§2.1 長さの統一**
- NBME 第3章 "Correct Option Stands Out"(p.23): "the correct answer, option A, is longer than the other options ... This flaw can be avoided by reviewing the entire option set for length, ensuring the level of detail is consistent across options"
- NBME 欠陥一覧表(p.25): "Correct answer stands out → Revise options to equal length. Remove language used for teaching points and rationales."
- Haladyna 24: "Keep the length of choices about equal."

**§2.2 断定語・婉曲表現の対称性**
- NBME 欠陥一覧表(p.25): "Absolute terms (“always,” “never”) in options → Eliminate absolute terms."
- NBME 第2章(p.14): "Avoid imprecise phrases such as “is associated with” or “is useful for” or “is important”; words that provide cueing such as “may” or “could be”; and vague terms such as “usually” or “frequently.”"
- Haladyna 28a(「正答への手がかりを避ける」の下位項目): "Specific determiners including always, never, completely, and absolutely."
- **注意(独自適応)**: 原典はいずれも断定語・曖昧語の「削除」を推奨している。本ガイドライン §2.2 の「使うなら正答肢・誤答肢の双方に配分する」という対称化方式は、教育的文脈で削除しきれない場合に向けた本プロジェクト独自の運用であり、原典に対応する記述はない。

**§2.3 構造の均質性**
- NBME Rule 4(p.33): "All options should be homogeneous and plausible to avoid cueing to the correct option."
- NBME(p.34): "Maintaining a consistent focus and parallel format among the answer options results in homogeneity"
- NBME 欠陥一覧表(p.25): "Nonparallel options → Edit options to be parallel in grammatical form and structure."
- Haladyna 23: "Keep choices homogeneous in content and grammatical structure."

**§2.4 もっともらしい誤答**
- NBME Rule 4 "Plausibility"(p.34): "the distractors should be plausible enough to entice test-takers who do not know the correct answer. Otherwise, test-takers can arrive at the correct answer by eliminating distractors based on their improbability"
- Haladyna 29・30: "Make all distractors plausible." / "Use typical errors of students to write your distractors."
- Haladyna 28f(避けるべき手がかりの例): "Blatantly absurd, ridiculous options."

**§2.5 正答位置の分散**
- Haladyna 20: "Vary the location of the right answer according to the number of choices."
- **注意**: NBME 2024年版には正答位置の分散に直接対応する規則を見つけられなかった(全文のキーワード検索で確認。見落としの可能性はある)。本原則の出典は Haladyna のみ。

**§2.6 消去法耐性(cover-the-options)**
- NBME "“Cover-the-Options” Rule"(p.13): "If a lead-in is properly focused, a test-taker should usually be able to read the vignette and lead-in, cover the options, and guess the correct answer without seeing the option set."
- NBME 第5章(p.34): "Ideally, after reading the vignette and the lead-in, a test-taker should be able to answer the item without seeing the options."
- Haladyna 15: "Include the central idea in the stem instead of the choices."

**§2.7 正答の一意性と解説の整合**
- Haladyna 19: "Make sure that only one of these choices is the right answer."
- NBME(p.34): "The correct answer should always be the “most” correct of the answer options"
- **注意(独自)**: 「選択肢の改修と同時に explanation を更新する」は本プロジェクトのクイズJSONスキーマに固有の保守規則であり、外部出典はない。

### 5.3 未検証事項・独自基準の明示

以下は外部出典による裏付けが**ない**、または検証できていない。

1. **数値閾値はすべて本プロジェクト独自**。§2.1 の「最長/最短比1.5倍以内」「正答肢最長40%以下」、§3 の L1(`max(1, floor(0.4×問題数))`)・L2(0.8〜1.3)・W(3回以上かつ0回)・P(0.4/0.6)は、NBME・Haladyna のいずれにも存在しない。原典は "about equal" / "equal length" と述べるのみで数値基準を示しておらず、これらは lint で機械判定するために便宜的に定めた値である。実証研究による妥当性検証は行っていない。
2. **断定語・婉曲表現の語彙リスト**(§3 W 節の「必ず/一切/…」「always/never/…」等)も独自に選定したもの。Haladyna 28a が例示する specific determiners は always, never, completely, absolutely の4語のみ。
3. **§2.2 の対称化方式**は原典の「削除」推奨からの独自適応(§5.2 の注意参照)。
4. **Haladyna (2002) は公式版との照合が未了**(§5.1 参照)。
5. 照合はいずれも 2026-07-17 時点。NBMEガイドは改版されるため(照合したのは2024年10月版)、将来参照する際は最新版を確認すること。

---

<!-- hook-inject:start -->
## 作問ガイドライン 要点(hookが自動注入する凝縮版)

このセクションは `scripts/quiz_hook.py` が lint 違反検出時に自動で読み込み、会話に注入する。編集する場合は40行程度以内に収めること。

### 原則(詳細は本文書 §2)
1. **長さの統一**: 全選択肢を同程度の長さに。最長/最短比1.5倍以内。正答肢が最長の問題はファイル全体の40%以下
2. **断定語・婉曲表現の対称性**: 「必ず/一切/すべて」等の断定語、「〜うる/〜ことがある」等の婉曲表現を、正答・誤答どちらかに偏らせない
3. **構造の均質性**: 列挙構造((1)(2)(3)式)・文末表現を全選択肢で揃える。正答肢だけ網羅列挙にしない
4. **もっともらしい誤答**: 誤答は学習者が実際に持ちがちな誤解に基づく。荒唐無稽な捨て肢にしない。ただし専門家が読めば明確に誤りと分かり、正答は一意に保つ
5. **正答位置の分散**: ファイル全体で `answer`(0〜3)が偏らないようにする
6. **消去法耐性**: 選択肢を隠して問題文だけで論点が分かるか確認する
7. **正答の一意性と解説の整合**: 選択肢を変えたら `explanation` も新しい文言に合わせて必ず更新する

### 定性チェックリスト(改修のたびに確認)
- [ ] 誤答はもっともらしいか、かつ専門家には明確に誤りと分かるか
- [ ] 正答は一意か
- [ ] cover-the-options: 問題文だけで論点が分かるか
- [ ] 解説は選択肢の現在の文言と整合しているか
- [ ] 日本語版・英語版が同期しているか(該当する場合)

### 機械チェックの閾値(詳細は本文書 §3)
- L1 正答肢最長: ファイル内で正答肢が厳密最長の問題が `max(1, floor(0.4×問題数))` 超で違反
- L2 正答肢長の比: `len(正答肢)/mean(各選択肢の長さ)` が0.8〜1.3の範囲外で違反(問題単位)
- L3 選択肢長の比: `max(選択肢長)/min(選択肢長)` が1.5超で違反(問題単位)
- W 断定語・婉曲表現: 断定語が誤答肢に3回以上かつ正答肢に0回、または婉曲表現が正答肢に3回以上かつ誤答肢に0回で違反
- P 正答位置の分散: 8問以上は各インデックス1回以上出現かつ最頻 `ceil(0.4×問題数)` 以下、8問未満は最頻 `ceil(0.6×問題数)` 以下
<!-- hook-inject:end -->
