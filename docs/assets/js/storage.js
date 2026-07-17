/*!
 * AI事始(AIことはじめ) - storage.js
 *
 * localStorageへのクイズ合格状態・実践課題提出記録の保存・読み出しを担う
 * 共通モジュール。window.AIK として他のスクリプト(quiz.js / exercise.js /
 * certificate.js)から利用される。
 *
 * 設計方針:
 * - サーバへは一切送信しない。保存先はこの端末のlocalStorageのみ。
 *   保存するのは日時のみで、実践課題の貼り付けテキスト自体は保存しない。
 * - localStorageが使えない環境(プライベートブラウズ等)でも例外で
 *   ページ全体が壊れないよう、すべての読み書きをtry/catchで保護する。
 *   その場合は保存が効かないだけで、機能自体はそのセッション内で動作継続する
 *   (メモリ上のフォールバックストアを使用)。
 * - ES5〜ES2017程度の範囲で記述し、ビルド工程なしでそのまま配信する。
 */
(function () {
  "use strict";

  // ページの言語("ja" | "en")。html lang属性を参照する(lang-redirect.jsと同じ判定)。
  var LANG = (document.documentElement.lang || "ja").indexOf("en") === 0 ? "en" : "ja";

  var QUIZ_PREFIX = "aikotohajime.quiz.";
  var EXERCISE_PREFIX = "aikotohajime.exercise.";

  // localStorageが使えない場合のフォールバック(このタブ・セッション限り)
  var memoryStore = {};
  var memoryFallbackActive = false;

  function storageGet(key) {
    if (!memoryFallbackActive) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        memoryFallbackActive = true;
      }
    }
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
  }

  function storageSet(key, value) {
    if (!memoryFallbackActive) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        memoryFallbackActive = true;
      }
    }
    memoryStore[key] = value;
  }

  function storageRemove(key) {
    if (!memoryFallbackActive) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        memoryFallbackActive = true;
      }
    }
    delete memoryStore[key];
  }

  // 初級3領域の定義(領域キー: 表示名)。表示名のみ言語別で、キー(a/b/c)自体は
  // localStorageキーや領域判定に使うため言語によらず不変。
  var AREAS_JA = {
    a: "生成AIのメカニズム",
    b: "対話的活用スキル",
    c: "倫理・安全・検証"
  };
  var AREAS_EN = {
    a: "How Generative AI Works",
    b: "Interactive AI Skills",
    c: "Ethics, Safety, and Verification"
  };
  var AREAS = LANG === "en" ? AREAS_EN : AREAS_JA;
  var AREA_KEYS = ["a", "b", "c"];

  // 目録発行にクイズ合格に加えて実践課題の提出を要する領域(要件定義書 §4.6)
  var EXERCISE_AREAS = { b: true };

  // UI文字列(取得状況一覧・リセット確認)の言語別テーブル
  var I18N = {
    ja: {
      statusCompleted: function (label, date) {
        return "✅ " + label + ": 修了(クイズ合格 " + date + "・実践課題提出済み)";
      },
      statusPassed: function (label, date) {
        return "✅ " + label + ": 合格済み(" + date + ")";
      },
      statusQuizPassedPending: function (label) {
        return "🔶 " + label + ": クイズ合格済み・実践課題の提出待ち";
      },
      statusExerciseSubmittedPending: function (label) {
        return "🔶 " + label + ": 実践課題提出済み・クイズ合格待ち";
      },
      statusNotCompleted: function (label) {
        return "⬜ " + label + ": 未修了";
      },
      shokyuReady: "🎓 初級目録: 発行できます",
      shokyuLocked: "🔒 初級目録: 3領域すべての修了が必要です",
      resetConfirm:
        "これまでの記録(領域A・B・Cのクイズ合格と実践課題の提出)をすべて消去します。この操作は取り消せません。よろしいですか?"
    },
    en: {
      statusCompleted: function (label, date) {
        return "✅ " + label + ": Completed (quiz passed " + date + ", practical exercise submitted)";
      },
      statusPassed: function (label, date) {
        return "✅ " + label + ": Passed (" + date + ")";
      },
      statusQuizPassedPending: function (label) {
        return "🔶 " + label + ": Quiz passed — practical exercise submission pending";
      },
      statusExerciseSubmittedPending: function (label) {
        return "🔶 " + label + ": Practical exercise submitted — quiz pass pending";
      },
      statusNotCompleted: function (label) {
        return "⬜ " + label + ": Not completed";
      },
      shokyuReady: "🎓 Beginner Certificate: Ready to issue",
      shokyuLocked: "🔒 Beginner Certificate: Requires completion of all three areas",
      resetConfirm:
        "This will erase all of your records (quiz passes for Areas A, B, and C and the practical exercise submission). This cannot be undone. Continue?"
    }
  };
  var T = I18N[LANG];

  // 英語表記用の月名(Intlに依存せず配列で保持する)
  var MONTH_NAMES_EN = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  function passedKey(area) {
    return QUIZ_PREFIX + area + ".passedAt";
  }

  function exerciseKey(area) {
    return EXERCISE_PREFIX + area + ".submittedAt";
  }

  function nowIso() {
    var iso;
    try {
      iso = new Date().toISOString();
    } catch (e) {
      iso = "" + new Date().getTime();
    }
    return iso;
  }

  // 指定領域のクイズ合格日時(ISO 8601文字列)。未合格ならnull。
  function passedAt(area) {
    if (!Object.prototype.hasOwnProperty.call(AREAS, area)) {
      return null;
    }
    var v = storageGet(passedKey(area));
    return v ? v : null;
  }

  // 指定領域が実践課題を要するか
  function requiresExercise(area) {
    return !!EXERCISE_AREAS[area];
  }

  // 指定領域の実践課題提出日時(ISO 8601文字列)。未提出ならnull。
  function exerciseSubmittedAt(area) {
    if (!requiresExercise(area)) {
      return null;
    }
    var v = storageGet(exerciseKey(area));
    return v ? v : null;
  }

  // 指定領域の修了要件をすべて満たしたか(= 目録を発行できるか)。
  // クイズ合格に加え、実践課題を要する領域では提出も必要。
  // area === "shokyu" の場合は3領域すべての修了(allPassed)を返す。
  function isPassed(area) {
    if (area === "shokyu") {
      return allPassed();
    }
    if (!passedAt(area)) {
      return false;
    }
    if (requiresExercise(area) && !exerciseSubmittedAt(area)) {
      return false;
    }
    return true;
  }

  // 指定領域のクイズを合格済みとして記録する。既に合格済みの場合は日時を上書きしない。
  function setPassed(area) {
    if (!Object.prototype.hasOwnProperty.call(AREAS, area)) {
      return;
    }
    if (passedAt(area)) {
      return;
    }
    storageSet(passedKey(area), nowIso());
  }

  // 指定領域の実践課題を提出済みとして記録する。既に提出済みの場合は日時を上書きしない。
  // 貼り付けテキスト自体は受け取らない(保存しない)設計。
  function setExerciseSubmitted(area) {
    if (!requiresExercise(area)) {
      return;
    }
    if (exerciseSubmittedAt(area)) {
      return;
    }
    storageSet(exerciseKey(area), nowIso());
  }

  // 初級3領域すべてが修了済みか
  function allPassed() {
    for (var i = 0; i < AREA_KEYS.length; i++) {
      if (!isPassed(AREA_KEYS[i])) {
        return false;
      }
    }
    return true;
  }

  // すべての記録(クイズ合格・実践課題提出)を消去する
  function reset() {
    for (var i = 0; i < AREA_KEYS.length; i++) {
      storageRemove(passedKey(AREA_KEYS[i]));
      storageRemove(exerciseKey(AREA_KEYS[i]));
    }
  }

  // ISO 8601文字列 -> ja「2026年7月13日」/ en「July 13, 2026」形式。不正な値の場合は空文字を返す。
  function formatDate(iso) {
    if (!iso) {
      return "";
    }
    var d = new Date(iso);
    if (isNaN(d.getTime())) {
      return "";
    }
    if (LANG === "en") {
      return MONTH_NAMES_EN[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    }
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
  }

  // 今日の日付をja「2026年7月13日」/ en「July 13, 2026」形式で返す
  function todayString() {
    var d = new Date();
    if (LANG === "en") {
      return MONTH_NAMES_EN[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    }
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
  }

  // JSON等の外部データ由来の文字列をHTMLとして安全に挿入するためのエスケープ関数。
  // quiz.js / certificate.js から呼び出される想定(本ファイル自身は主にDOM APIで描画するため未使用箇所もある)。
  function escapeHtml(str) {
    if (str === null || str === undefined) {
      return "";
    }
    return String(str).replace(/[&<>"']/g, function (ch) {
      switch (ch) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return ch;
      }
    });
  }

  // 領域キー(a/b/c)から表示ラベルを組み立てる(取得状況一覧・quiz.js・certificate.jsで共用)。
  // ja: 「領域A「生成AIのメカニズム」」 / en: 「Area A: How Generative AI Works」
  // a/b/c以外(未知のキーやshokyu)は、そのままareaを返す(呼び出し側でshokyu等は個別対応)。
  function areaLabel(area) {
    if (!Object.prototype.hasOwnProperty.call(AREAS, area)) {
      return area;
    }
    if (LANG === "en") {
      return "Area " + area.toUpperCase() + ": " + AREAS[area];
    }
    return "領域" + area.toUpperCase() + "「" + AREAS[area] + "」";
  }

  window.AIK = {
    AREAS: AREAS,
    lang: LANG,
    passedAt: passedAt,
    isPassed: isPassed,
    setPassed: setPassed,
    requiresExercise: requiresExercise,
    exerciseSubmittedAt: exerciseSubmittedAt,
    setExerciseSubmitted: setExerciseSubmitted,
    allPassed: allPassed,
    reset: reset,
    formatDate: formatDate,
    todayString: todayString,
    escapeHtml: escapeHtml,
    areaLabel: areaLabel
  };

  // --- ここから画面描画(取得状況・消去ボタン) ---

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function renderMokurokuStatus(container) {
    var ul = document.createElement("ul");
    ul.className = "aik-mokuroku-status-list";

    for (var i = 0; i < AREA_KEYS.length; i++) {
      var area = AREA_KEYS[i];
      var li = document.createElement("li");
      var label = areaLabel(area);
      var quizDone = !!passedAt(area);
      var exerciseNeeded = requiresExercise(area);
      var exerciseDone = !!exerciseSubmittedAt(area);

      if (isPassed(area)) {
        li.textContent = exerciseNeeded
          ? T.statusCompleted(label, formatDate(passedAt(area)))
          : T.statusPassed(label, formatDate(passedAt(area)));
        li.className = "aik-status-passed";
      } else if (exerciseNeeded && (quizDone || exerciseDone)) {
        li.textContent = quizDone
          ? T.statusQuizPassedPending(label)
          : T.statusExerciseSubmittedPending(label);
        li.className = "aik-status-partial";
      } else {
        li.textContent = T.statusNotCompleted(label);
        li.className = "aik-status-unpassed";
      }
      ul.appendChild(li);
    }

    var shokyuLi = document.createElement("li");
    if (allPassed()) {
      shokyuLi.textContent = T.shokyuReady;
      shokyuLi.className = "aik-status-passed";
    } else {
      shokyuLi.textContent = T.shokyuLocked;
      shokyuLi.className = "aik-status-unpassed";
    }
    ul.appendChild(shokyuLi);

    container.innerHTML = "";
    container.appendChild(ul);
  }

  function renderAllStatus() {
    var containers = document.querySelectorAll("[data-mokuroku-status]");
    for (var i = 0; i < containers.length; i++) {
      renderMokurokuStatus(containers[i]);
    }
  }

  function wireResetButtons() {
    var buttons = document.querySelectorAll("[data-reset-progress]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function () {
        var ok = window.confirm(T.resetConfirm);
        if (!ok) {
          return;
        }
        reset();
        window.location.reload();
      });
    }
  }

  ready(function () {
    renderAllStatus();
    wireResetButtons();
  });

  // クイズ合格・実践課題提出が別スクリプト(quiz.js / exercise.js)から
  // localStorageを更新した直後にも取得状況表示を更新できるよう、
  // 状態変化イベントでも再描画する。
  document.addEventListener("aik:passed", renderAllStatus);
})();
