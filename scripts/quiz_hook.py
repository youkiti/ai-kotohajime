#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
quiz_hook.py — Claude Code の PostToolUse hook(matcher: Edit|Write)用ラッパ。

クイズJSON(docs/assets/data/quiz-*.json)が編集された直後に quiz_lint.py を実行し、
違反があればガイドライン文書の要点とともに additionalContext として会話に注入する。

プロトコル:
    - stdin から PostToolUse hook のJSONペイロードを読む
    - tool_input.file_path が docs/assets/data/quiz-*.json に一致しなければ何も出力せず exit 0
    - 一致すれば quiz_lint.lint_file() を実行し、違反があれば
      {"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": "..."}}
      を stdout に出力して exit 0
    - 違反ゼロなら何も出力せず exit 0(修正ループのノイズ防止)
    - どんな異常が起きても exit 0(無音で終了)。exit 2 や stderr でのブロックはしない

将来課題: セッション状態の管理(session_id での初回判定等)は未実装。シンプルさを優先し、
毎回の Edit/Write 完了時に無条件で lint を実行する方式にとどめている。
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR_PARTS = ("docs", "assets", "data")
QUIZ_FILENAME_RE = re.compile(r"^quiz-.*\.json$")

GUIDELINE_PATH = REPO_ROOT / "documents" / "AI事始-作問ガイドライン.md"
HOOK_INJECT_START = "<!-- hook-inject:start -->"
HOOK_INJECT_END = "<!-- hook-inject:end -->"

INSTRUCTION_TEXT = (
    "上記の原則に沿って該当ファイルを自己点検し、違反を修正してください。"
    "修正後も同じチェックが走ります。"
)


def normalize_path(raw_path: str) -> Path:
    """絶対パス・`\\` 区切りの可能性があるパス文字列を正規化する。"""
    normalized = raw_path.replace("\\", "/")
    return Path(normalized)


def is_target_quiz_file(path: Path) -> bool:
    """docs/assets/data/quiz-*.json に一致するか判定する。"""
    parts = path.parts
    if len(parts) < len(DATA_DIR_PARTS) + 1:
        return False
    dir_parts = parts[-(len(DATA_DIR_PARTS) + 1):-1]
    if dir_parts != DATA_DIR_PARTS:
        return False
    filename = parts[-1]
    return bool(QUIZ_FILENAME_RE.match(filename))


def resolve_repo_path(path: Path) -> Path:
    """相対パスならリポジトリルート基準で解決を試みる(存在しなくてもそのまま返す)。"""
    if path.is_absolute():
        return path
    candidate = REPO_ROOT / path
    return candidate


def extract_hook_inject_section() -> str:
    """ガイドライン文書の hook-inject 区間の本文を抽出する。見つからなければ空文字を返す。"""
    try:
        text = GUIDELINE_PATH.read_text(encoding="utf-8")
    except OSError:
        return ""

    start = text.find(HOOK_INJECT_START)
    end = text.find(HOOK_INJECT_END)
    if start == -1 or end == -1 or end <= start:
        return ""

    return text[start + len(HOOK_INJECT_START):end].strip()


def build_additional_context(violations: list[str], target_path: Path) -> str:
    report_lines = [f"■ {target_path}"]
    report_lines.extend(f"  {v}" for v in violations)
    report = "\n".join(report_lines)

    guideline_excerpt = extract_hook_inject_section()

    sections = [
        "[quiz_lint] クイズ作問ガイドライン違反が検出されました。",
        report,
    ]
    if guideline_excerpt:
        sections.append(guideline_excerpt)
    sections.append(INSTRUCTION_TEXT)

    return "\n\n".join(sections)


def emit_additional_context(violations: list[str], target_path: Path) -> None:
    payload = {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": build_additional_context(violations, target_path),
        }
    }
    print(json.dumps(payload, ensure_ascii=False))


def main() -> int:
    try:
        raw_stdin = sys.stdin.read()
    except Exception:
        return 0

    try:
        payload = json.loads(raw_stdin)
    except (json.JSONDecodeError, TypeError):
        return 0

    if not isinstance(payload, dict):
        return 0

    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return 0

    file_path_raw = tool_input.get("file_path")
    if not isinstance(file_path_raw, str) or not file_path_raw:
        return 0

    try:
        normalized = normalize_path(file_path_raw)
    except Exception:
        return 0

    if not is_target_quiz_file(normalized):
        return 0

    # ここまで来たら対象クイズファイルの編集。quiz_lint を import して検査する。
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        import quiz_lint  # noqa: E402  (遅延import。対象外パスでは読み込まない)
    except Exception:
        return 0

    try:
        target_path = resolve_repo_path(normalized)
        violations = quiz_lint.lint_file(target_path)
    except Exception:
        return 0

    if not violations:
        return 0

    try:
        emit_additional_context(violations, normalized)
    except Exception:
        return 0

    return 0


if __name__ == "__main__":
    try:
        exit_code = main()
    except Exception:
        exit_code = 0
    raise SystemExit(exit_code)
