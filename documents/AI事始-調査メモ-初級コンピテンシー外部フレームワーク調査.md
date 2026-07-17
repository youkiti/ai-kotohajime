# AI事始 調査メモ 初級コンピテンシー外部フレームワーク調査 v0.1

作成日: 2026-07-17
ステータス: 調査メモ(**正本ではない**。`AI事始-初級コンピテンシー.md` 改訂の検討材料)

## 改訂履歴
- v0.1: 新規作成。医療者向け生成AI初級コンピテンシー(現行A/B/C 3領域11項目)に対する国内外フレームワークとの差分調査。

---

## 0. 本メモの位置づけと作成方法

- **一次調査**: OpenAI codex CLI(0.144.1、Web検索有効)に現行A/B/C 11項目を提示し、国内外のフレームワーク・ガイドライン・レビューとの差分を調査させた(2026-07-17)
- **二次検証**: 一次調査が挙げた出典について、Claude Code が各URLを実際に取得し、実在・発行元・年・該当記述を確認のうえ逐語引用を抽出した(2026-07-17)。§2 の引用はすべて実際に取得したページ/PDFからの逐語抜粋(出典明記のうえ必要最小限の範囲)であり、取得・確認できなかった点は §5「検証の限界」に明示した
- §3〜§4 の「不足」「推奨」の分析・順位付けはAIによるものであり、コンピテンシー文書(正本)への反映は**未決定**。採否は運営者が判断する

## 1. 要旨

現行のA(仕組み)・B(対話スキル)・C(倫理・安全・検証)は、国内外の主要フレームワークと照らして骨格は妥当。一方、複数の資料で繰り返し重視されているのに現行11項目では独立した到達目標になっていないものとして、以下の5点が挙がった(優先順)。

1. **適用判断** — AIを使ってよい課題/補助に限る課題/使うべきでない課題を、誤りの影響から区別する
2. **組織規程・承認済み環境の確認** — 施設の規程・承認済みツール・データ利用設定を確認する(匿名化すれば任意の外部サービスに入力してよい、とは限らない)
3. **引用・根拠・鮮度の検証の具体化** — 架空引用・旧版ガイドライン・薬剤情報を実在する原典・最新版で独立に確認する(C4の具体化)
4. **自動化バイアス・過信・依存の回避** — 流暢な出力ほど誤りを見落とすこと、全工程委任による技能低下
5. **利用開示・記録・最終責任** — 提出先の規則に応じた開示・記録と、成果物の最終責任が利用者にあること

## 2. 出典一覧(URL・検証状況・逐語引用)

検証日はすべて 2026-07-17。「確認済み」= URLが生存し、発行元・題名・年と下記引用を取得内容で確認したもの。

### 2.1 国際機関・欧州

**[1] WHO『Ethics and governance of artificial intelligence for health: Guidance on large multi-modal models』**(公表 2024-01-18)
- URL(書誌): https://www.who.int/publications/i/item/9789240084759 / codex提示URL(生存): https://www.who.int/publications/b/70584
- 検証: 題名・発行元は確認済み。**本文PDFは未精読**(引用は[3]の公式ニュースリリースから)。書誌ページの表示日付は 2025-03-25 で、公表日(2024-01-18、[3]で確認)と異なる点に留意

**[2] WHO ニュース「WHO calls for safe and ethical AI for health」**(2023-05-16)
- URL: https://www.who.int/news/item/16-05-2023-who-calls-for-safe-and-ethical-ai-for-health
- 検証: 確認済み
- 引用: "LLMs generate responses that can appear authoritative and plausible to an end user; however, these responses may be completely incorrect or contain serious errors, especially for health-related responses" / "LLMs may not protect sensitive data (including health data) that a user provides to an application to generate a response"

**[3] WHO ニュース「WHO releases AI ethics and governance guidance for large multi-modal models」**(2024-01-18)
- URL: https://www.who.int/tokelau/news/detail-global/18-01-2024-who-releases-ai-ethics-and-governance-guidance-for-large-multi-modal-models(国事務所ミラー。内容はグローバル共通)
- 検証: 確認済み
- 引用: "LMMs can also encourage 'automation bias' by health care professionals and patients, whereby errors are overlooked that would otherwise have been identified or difficult choices are improperly delegated to a LMM."

**[4] UNESCO『Guidance for generative AI in education and research』**(2023-09-07)
- URL: https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research(「education-research」表記の変種URLは**404**)
- 検証: 確認済み(ランディングページ)。ただし「human agency」「academic integrity」「過度の依存の回避」の各論点はランディングページでは逐語確認できず、**本文PDFは未照合**
- 引用: "The absence of national regulations on GenAI in most countries leaves the data privacy of users unprotected and educational institutions largely unprepared to validate the tools."

**[5] UNESCO『AI competency framework for students』**(2024-08-08)
- URL: https://www.unesco.org/en/articles/ai-competency-framework-students
- 検証: 確認済み(ランディングページ。「human-centred mindset」の語自体はページ取得分では逐語未確認)
- 引用: "the publication emphasizes critical judgement of AI solutions, awareness of citizenship responsibilities in the AI era ... foundational AI knowledge for lifelong learning, and inclusive, sustainable AI design."

**[6] EU AI Act(Regulation (EU) 2024/1689)第4条 AI literacy・前文20**
- URL: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-4 / https://ai-act-service-desk.ec.europa.eu/en/ai-act/recital-20
- 検証: 確認済み(条文逐語一致)
- 引用(第4条): "Providers and deployers of AI systems shall take measures to ensure, to their best extent, a sufficient level of AI literacy of their staff ... taking into account their technical knowledge, experience, education and training and the context the AI systems are to be used in, and considering the persons or groups of persons on whom the AI systems are to be used."

**[7] 欧州委員会「AI Literacy - Questions & Answers」**(最終更新 2025-11-19)
- URL: https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers
- 検証: 確認済み
- 引用: "'AI literacy' means skills, knowledge and understanding that allow providers, deployers and affected persons ... to make an informed deployment of AI systems, as well as to gain awareness about the opportunities and risks of AI"

### 2.2 英国・米国

**[8] NHS(旧HEE)『Artificial Intelligence (AI) and Digital Healthcare Technologies Capability framework』**(2023-02-21公開)
- URL: https://digital-transformation.hee.nhs.uk/support-for-organisations/research-and-publications/dart-ed/horizon-scanning/ai-and-digital-healthcare-technologies
- 検証: 確認済み
- 引用: "its domains include: digital implementation, digital health for patients and the public, ethical, legal, and regulatory considerations, human factors, health data management, artificial intelligence."

**[9] NHS Learning Hub「Artificial Intelligence catalogue」**(2023–)
- URL: https://learninghub.nhs.uk/catalogue/ai/about?nodeId=7311
- 検証: 確認済み
- 引用: "All resources are free to access and have been approved by a panel of AI in healthcare experts."(推奨領域として "Ethical, legal and regulatory considerations in AI" / "Managing Health Data: ethics, privacy, security and data bias" を列挙)

**[10] AAMC『Principles for the Responsible Use of Artificial Intelligence in and for Medical Education』Version 2.0**(2025-07-31)
- URL: https://www.aamc.org/about-us/mission-areas/medical-education/principles-ai-use
- 検証: 確認済み
- 引用: "Human judgment remains essential in determining the appropriate use and implementation of these tools." / "All learners need equal opportunities to realize the benefits of AI tools in their education."

**[11] AAMC「Artificial Intelligence Competencies Across the Learning Continuum」**(策定中)
- URL: https://www.aamc.org/about-us/medical-education/ai-competencies
- 検証: 確認済み。全米版コンピテンシーは**策定中**であり最終報告は2026年秋予定
- 引用: "The AAMC is developing a national set of competencies in AI designed to be relevant for undergraduate, graduate, and continuing medical education." / "Target release of the final report is fall 2026."

**[12] AMA プレスリリース「AMA adopts policy to advance AI literacy in medical education」**(2025-11-18)
- URL: https://www.ama-assn.org/press-center/ama-press-releases/ama-adopts-policy-advance-ai-literacy-medical-education
- 検証: 確認済み
- 引用: "The AMA will develop and disseminate model AI learning objectives and curricular toolkits to guide foundational education on the use of AI in clinical practice."

**[13] AAMC掲載「AI-Enhanced Medical Education Content Creation Framework」**(最終更新 2025-10)
- URL: https://www.aamc.org/about-us/mission-areas/medical-education/advancing-ai-resource-collection/ai-enhanced-medical-education-content-creation-framework-systematic-tool-selection-and
- 検証: 確認済み
- 引用: "The six-step iterative process (goal - format - deployment - sources - AI tools - workflow) with continuous human validation enables medical educators to create high-quality educational content efficiently."

### 2.3 日本

**[14] 文部科学省「医学教育モデル・コア・カリキュラム(令和4年度改訂版)」**(2022)
- URL: https://www.mext.go.jp/content/20230718-mxt_igaku-000030966_9.pdf
- 検証: 確認済み(PDF 293ページを取得・抽出)
- 引用: 「IT-01: 情報・科学技術に向き合うための倫理観とルール　医学研究・医療等の場面で、情報科学技術を取り扱う際に必要な倫理観・デジタルプロフェッショナリズム及び基本的原則を理解する。」 / 「IT-01-02-01 電子カルテをはじめとする医療情報の管理・保管の原則について理解し、関連する規制(法律、倫理基準、個人情報保護のための規定等)を遵守できる。」(いずれもp.50)

**[15] 文部科学省 事務連絡「大学・高専における生成AIの教学面の取扱いについて(周知)」**(令和5年7月13日)
- URL(公表ページ): https://www.mext.go.jp/b_menu/houdou/2023/mext_01260.html / 引用の実体は本文PDF: https://www.mext.go.jp/content/20230714-mxt_senmon01-000030762_1.pdf
- 検証: 確認済み(本文PDFを取得・抽出)
- 引用: 「大学・高専における学修は学生が主体的に学ぶことが本質であり、生成AIの出力をそのまま用いるなど学生自らの手によらずにレポート等の成果物を作成することは…一般に不適切と考えられること」 / 「生成AIへの入力を通じ、機密情報や個人情報等が意図せず流出・漏洩する可能性等があるため…安易に生成AIに入力することは避けることが必要」

**[16] 昭和医科大学「生成AI使用ガイドライン」**(発行日は本文に明記なし。PDFメタデータの作成日 2026-04-28)
- URL: https://www.showa-u.ac.jp/albums/abm.php?d=7263&f=abm00069513.pdf&n=SHOWA_genAI_guideline.pdf
- 検証: 確認済み(PDF 4ページを取得・抽出)
- 引用: 「生成AI活用に際しては、利用目的、利用箇所、データの出所や由来、処理プロセス、リスクを明確化し、これらを適切に説明可能であることを求めます。」(2.2 透明性と説明責任) / 非推奨行為として「機密情報(特許出願前情報やパスワード等)を入力すること」「AI単独による診断や治療方針の決定」(3.2)

**[17] 名古屋大学医学部・大学院医学系研究科・医学部附属病院「生成AIの利活用に関する方針通知」**(令和8年4月1日)
- URL: https://www.med.nagoya-u.ac.jp/medical_J/news/pdf/61600cece537a449357070b393c6aaaf6be662f6.pdf
- 検証: 確認済み(PDF 4ページを取得・抽出。正式名称は「方針」ではなく「方針**通知**」)
- 引用: 「人による最終確認(Human-in-the-Loop)と閉域・準拠環境(学内・病院の安全なネットワークや規程に沿ったクラウド)を原則とします」(p.1) / 「透明性と記録:利用したツール名・バージョン、目的・利用箇所・利用日時を記録し、必要に応じて明示(論文・報告書はMethodsや謝辞に記載)」(p.2)

**[18] 日本病院薬剤師会「病院薬剤師向け生成AI利活用ガイダンス(2026年2月18日版)」**(公表: 日病薬発第2025-230号、令和8年3月31日)
- URL(公表ページ): https://www.jshp.or.jp/activity/guideline/20260331.html / 本体PDF: https://www.jshp.or.jp/activity/guideline/20260331.pdf
- 検証: 確認済み(公表ページのHTML原文で逐語確認。本体PDFの全文は未精読)
- 引用: 「AIを『判断を代替するもの』ではなく『判断を支援する参考ツール』と位置づけているため、最終判断行為そのものは対象外としました。」 / 「本ガイダンスは『医療機関として管理可能な環境下での利用』を前提としているため対象外としました。」

**[19] 笠井大・清水郁夫ほか「医学生向け生成AI使用ガイドライン作成の試み―生成AIに関する教員グループワークプロダクトの内容分析―」『医学教育』57(2): 75–83**(2026、日本医学教育学会)
- URL: https://www.jstage.jst.go.jp/article/mededjapan/57/2/57_75/_pdf
- 検証: 確認済み(PDF 10ページ全文を取得)
- 引用(表1): 「⑤ 依存回避・適切な使用(5) 作業の全工程をAIに任せない(G6-7)、レポートは自分の言葉で書く、生成AIは参考にしてもよいが頼りすぎない(G11-14)」 / 「⑥ AI非依存型の学習併用(2) 生成AI以外の方法でも学習をする(併用する)(G6-8)」

### 2.4 レビュー論文

**[20] Pupic N, Ghaffari-zadeh A, ほか「An evidence-based approach to artificial intelligence education for medical students: A systematic review」PLOS Digital Health**(2023)
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC10681314/
- 検証: 確認済み。※一次調査(codex)は筆頭著者を「Ghaffarizadeh」と誤記していた(実際は第2著者。筆頭は Pupic)
- 引用: "Nine studies discuss the need for a fundamental understanding of AI ethics to improve the adoption of AI in medicine and ensure its safe use."

**[21] Tolentino R, ほか「Curriculum Frameworks and Educational Programs in AI for Medical Students, Residents, and Practicing Physicians: Scoping Review」JMIR Medical Education**(2024)
- URL: https://mededu.jmir.org/2024/1/e54793/(本文照合はPMCミラー https://pmc.ncbi.nlm.nih.gov/articles/PMC11294785/ で実施)
- 検証: 確認済み
- 引用: "There were no papers that referenced a framework, pedagogy, or learning theory that guided the existence of the educational program."

**[22] Singla R, ほか「Developing a Canadian artificial intelligence medical curriculum using a Delphi study」npj Digital Medicine**(2024)
- URL: https://www.nature.com/articles/s41746-024-01307-1
- 検証: 確認済み
- 引用: "identified key curricular components across ethics, law, theory, application, communication, collaboration, and quality improvement."

**[23] Hunt VM, ほか「What the AI era doctor should know: a scoping review of proposed artificial intelligence competencies for medical education」npj Digital Medicine**(2026)
- URL: https://www.nature.com/articles/s41746-026-02761-9(※一次調査が提示したURLは末尾に `_reference.pdf` が付いた不正な形式だったため修正)
- 検証: 確認済み(抄録相当の範囲)。**本文全文は未取得**
- 引用: "Of 4071 records identified, 54 studies from 22 countries met inclusion criteria." / "taxonomy comprising seven domains (AI ethics; AI law and regulation; AI professionalism in healthcare; clinical applications of AI; critical appraisal of AI output; research and innovation in AI; theory and foundations of AI) spanning 37 competencies"

## 3. 現行A/B/Cとのギャップ(codex分析を検証済み出典で裏づけたもの)

| 外部資料で共通する領域 | 現行での対応 | 評価 | 主な出典 |
|---|---|---|---|
| AIの基礎原理・限界 | A1〜A4 | 強い | [22][23] |
| 反復対話・コンテキスト付与 | B1〜B3 | 強い | [13] |
| ハルシネーション | A3, C4 | 強い | [2] |
| 個人情報・著作権・バイアス | C1〜C3 | 強い | [2][15] |
| 人間による監督 | C4 | 概念はあるが自動化バイアス・過信が弱い | [3][17] |
| 適切な利用目的・利用境界(適用判断) | なし | **不足** | [1][7][18] |
| 組織規程・承認済みツール・環境 | なし | **不足** | [14][17][18] |
| 利用開示・記録・最終責任 | C2/C4に暗黙的 | **不足** | [10][16][17] |
| 引用・根拠・鮮度の一次資料検証 | C4に一部 | 弱い | [2][13][23] |
| 学術的誠実性・AI依存の回避 | C2に一部 | 弱い | [4][15][19] |
| 患者・学習者への説明 | なし | 不足(初級では周辺業務中心のため優先度低) | [8][10] |
| 公平なアクセス・デジタル格差 | C3に近い | 弱い(中級向き) | [5][10] |
| 偽情報・セキュリティ | なし | 不足(初級では「出所確認」まで) | [2][3] |
| 導入後の監視・インシデント報告 | なし | 不足(中級向き) | [10][8] |
| 環境負荷・持続可能性 | なし | 不足(中級向き) | [5] |

## 4. 初級に追加する価値が高い項目(トップ5、codex提案+出典検証済み)

1. **適用判断**: 目的・対象者・誤りの影響を踏まえ、生成AIを使ってよい課題/補助に限る課題/使うべきでない課題を区別できる(出典: [1][7][18])
2. **組織規程・承認済み環境の確認**: 業務で使う前に、所属組織の規程・承認済みツール・入力可能な情報・データ利用設定を確認できる(出典: [14][17][18])
3. **根拠・引用・鮮度の検証**: AIが示した事実・引用・ガイドライン・薬剤情報を、実在する原典と最新版で独立に確認できる(C4の具体化。出典: [2][13][23])
4. **自動化バイアスと依存の回避**: 流暢な出力を過信しやすいことを説明でき、自分の暫定判断・チェックリスト・AIを使わない練習を組み合わせられる(出典: [3][19])
5. **利用開示・記録・責任**: 提出先・所属の規則に従いAI利用の目的・箇所・ツールを記録/開示し、最終責任は利用者にあると説明できる(出典: [10][16][17])

このほか一次調査は D1〜D15 の15項目を挙げた(機密情報の拡張=C1拡張、ツール選択=B4新設、学術的誠実性=C2拡張、出力の変動性、偽情報・なりすまし、公平性、患者への説明、インシデント報告、環境負荷など)。

## 5. 検証の限界(できていないこと)

1. 検証は「URLの実在・発行元・年・引用箇所の存在」の確認であり、**各文書の全文精読や内容妥当性の学術的評価ではない**
2. [1] WHO LMMガイダンスと[18] 日病薬ガイダンスの**本体PDFは未精読**(引用は公式ニュース/公表ページから)。[4][5] UNESCOも本文PDF未照合で、「human agency」「academic integrity」「human-centred mindset」等の語はランディングページでは逐語確認できていない
3. [23] Hunt et al. の「automation bias」への言及は取得できた範囲(抄録相当)では確認できなかった(本文にある可能性はあるが未検証)
4. 一次調査(codex)の出力には誤りがあった(筆頭著者の誤記[20]、不正URL[23]、404の変種URL[4]、文書正式名称の不正確さ[17][18][19])。本メモでは修正済みだが、**同種の誤りが他に残存している可能性**は否定できない
5. 検証日は 2026-07-17。URLの生存・文書の版は変わりうる(特に[11] AAMCコンピテンシーは2026年秋に最終報告予定であり、公表後に本調査の結論を見直すべき)
6. 一次調査の全文(D1〜D15の詳細)はリポジトリには収載せず、本メモには要点のみ反映した(全文は本メモ導入PRの説明欄に添付)

## 6. 反映案(未決・提案のみ)

一次調査の提案は「新領域Dの増設ではなくC領域の再編」: C1を機密情報・組織規程まで拡張/C2を著作権+学術的誠実性+開示に整理/C4の検証観点を原典照合まで具体化/C5(適用判断)・C6(自動化バイアス・依存)・C7(開示・記録・責任)を新設/B4(ツール選択)を追加/総量調整としてA2(拡散モデル)を必修から任意へ移す案。

**注意**: これらは`AI事始-初級コンピテンシー.md`(正本)の確定済み決定(A/B/C構成、クイズ仕様等)に関わるため、本メモをもって自動的に反映しない。反映する場合は正本側で改訂履歴を立てて別途決定する。
