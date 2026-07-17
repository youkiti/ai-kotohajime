#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check_quiz_src.py — ビルド後 HTML の data-quiz-src 属性を検査するツール。

なぜソース Markdown ではなくビルド後 HTML を見るのか:
    mkdocs-static-i18n の suffix 方式では、`b1.md` に対する英語版は `b1.en.md` の
    「中身」が `/en/units/b1/index.html` として出力される仕組みになっている。
    data-quiz-src で参照する JSON パス自体は日英で同一の文字列(例:
    `../../assets/data/quiz-b1-selfcheck.json`)のまま書く運用だが、実際に
    配信されるファイルは `docs/assets/data/quiz-b1-selfcheck.en.json` の中身が
    ビルド時に `quiz-b1-selfcheck.json` という同名で /en/ 配下に配置されたもの
    (アセットの suffix 方式ローカライズ)である。
    そのため Markdown ソースだけを静的に見ても、英語版アセットの欠落や配置ミスは
    検出できない。実際にビルドされた HTML と、実際にビルドされた JSON の組み合わせを
    見て初めて「学習者のブラウザが実際に fetch するパスが存在し、JSON として読めるか」
    を検証できる。本スクリプトはその検査を行う。

使い方:
    python scripts/check_quiz_src.py <ビルド出力ディレクトリ>
    例: python scripts/check_quiz_src.py link-root/ai-kotohajime

検査内容(ビルド出力ディレクトリ配下の全 *.html を走査し、data-quiz-src 属性ごとに):
    1. http:/https:/data: 等のスキーム付き値は対象外としてスキップする
    2. 属性値を、その HTML ファイルの親ディレクトリ基準の相対パスとして解決する
    3. 解決先がビルド出力ディレクトリの外に脱出していないこと
    4. 解決先が通常ファイルとして実在すること
    5. そのファイルが JSON として parse できること

Python 標準ライブラリのみを使用する(pip依存なし)。属性抽出には html.parser.HTMLParser を
用い、正規表現によるタグ・属性の抜き出しは行わない(HTMLの入れ子・属性順序に頑健にするため)。

終了コード: 違反なし=0(検査件数を表示)、違反あり=1(違反を全件列挙)
"""

from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

# Windows のコンソールでも日本語出力が文字化けしないようにする(quiz_lint.py と同様)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


class QuizSrcExtractor(HTMLParser):
    """HTML中の全タグから data-quiz-src 属性の値を収集するパーサ。"""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.values: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._collect(attrs)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._collect(attrs)

    def _collect(self, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name == "data-quiz-src" and value:
                self.values.append(value)


def extract_quiz_src_values(html_path: Path) -> list[str]:
    """指定 HTML ファイルから data-quiz-src 属性値の一覧を抽出する。"""
    text = html_path.read_text(encoding="utf-8")
    parser = QuizSrcExtractor()
    parser.feed(text)
    parser.close()
    return parser.values


def has_scheme(value: str) -> bool:
    """http:/https:/data: 等のスキーム付き値かどうかを判定する(相対パス解決の対象外)。"""
    return bool(urlsplit(value).scheme)


def check_html_file(html_path: Path, build_root: Path) -> tuple[int, list[str]]:
    """1つの HTML ファイルを検査する。(検査件数, 違反メッセージのリスト) を返す。"""
    checked = 0
    violations: list[str] = []

    try:
        values = extract_quiz_src_values(html_path)
    except Exception as e:  # HTML自体が読めない場合も違反として報告する
        return 0, [f"{html_path}: HTMLを読み込めません: {e}"]

    base_dir = html_path.parent

    for value in values:
        if has_scheme(value):
            continue  # 外部URL・data URI等はこのスクリプトの対象外

        checked += 1
        label = f"{html_path} [data-quiz-src=\"{value}\"]"

        # クエリ文字列・フラグメントは通常付かない想定だが、念のため除去してから解決する
        path_part = urlsplit(value).path
        if not path_part:
            violations.append(f"{label}: パス部分が空です")
            continue

        resolved = (base_dir / path_part).resolve()

        try:
            resolved.relative_to(build_root)
        except ValueError:
            violations.append(
                f"{label}: 解決先 {resolved} がビルドルート {build_root} の外に脱出しています"
            )
            continue

        if not resolved.is_file():
            violations.append(f"{label}: 解決先 {resolved} にファイルが存在しません")
            continue

        try:
            raw = resolved.read_text(encoding="utf-8")
            json.loads(raw)
        except json.JSONDecodeError as e:
            violations.append(f"{label}: 解決先 {resolved} がJSONとして解析できません: {e}")
        except OSError as e:
            violations.append(f"{label}: 解決先 {resolved} を読み込めません: {e}")

    return checked, violations


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print("使い方: python scripts/check_quiz_src.py <ビルド出力ディレクトリ>", file=sys.stderr)
        return 1

    build_root = Path(argv[0]).resolve()
    if not build_root.is_dir():
        print(f"ビルド出力ディレクトリが見つかりません: {build_root}", file=sys.stderr)
        return 1

    total_checked = 0
    all_violations: list[str] = []

    for html_path in sorted(build_root.rglob("*.html")):
        checked, violations = check_html_file(html_path, build_root)
        total_checked += checked
        all_violations.extend(violations)

    if all_violations:
        print(f"data-quiz-src 検査: 違反 {len(all_violations)} 件を検出しました。")
        for v in all_violations:
            print(f"  - {v}")
        return 1

    print(f"data-quiz-src 検査: {total_checked} 件を検査し、違反はありませんでした。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
