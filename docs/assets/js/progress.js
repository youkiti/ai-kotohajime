/*!
 * AI事始(AIことはじめ) - progress.js
 *
 * `[data-area-progress]` を持つ要素に、ユニットページ上部向けの
 * 軽量な進捗表示(1行)を描画する(Issue #10)。
 *
 * 表示方針:
 * - 領域A/B/Cのいずれにも進捗が一切ない場合は何も描画しない
 *   (初回訪問時の情報量を増やさない。要件定義書 §1.3「シンプルに保つ」に配慮)
 * - 一つでも進捗があれば、各領域の状態(✓修了/途中/未)を1行で表示し、
 *   末尾に目録ページへのリンクを添える。
 *
 * ページ側の契約:
 *   <div data-area-progress></div>
 *   ユニットページは directory URL 基準で ja=<root>/units/<x>/、
 *   en=<root>/en/units/<x>/ に生成されるため、相対パス "../../mokuroku/" は
 *   どちらの言語でもサイトルート(/ または /en/)配下の目録ページに解決される。
 *
 * window.AIK(storage.js)に依存。読み込み順は mkdocs.yml で
 * storage.js -> quiz.js -> exercise.js -> certificate.js -> progress.js に固定。
 * localStorageへの書き込み・サーバ送信は一切行わない(読み取りと描画のみ)。
 */
(function () {
  "use strict";

  // storage.js (読み込み順で先行)がwindow.AIKを定義する。ここで一度だけ束縛し、
  // 以後はこのローカル変数のみを参照する(bareなグローバル参照に依存しない)。
  var AIK = window.AIK || null;

  // ページの言語("ja" | "en")。AIKがあればそれに合わせ、無ければhtml lang属性を参照する。
  var LANG = AIK && AIK.lang ? AIK.lang : (document.documentElement.lang || "ja").indexOf("en") === 0 ? "en" : "ja";

  var AREA_KEYS = ["a", "b", "c"];

  // UI文字列(進捗行の文言)の言語別テーブル
  var I18N = {
    ja: {
      prefix: "学習の進捗: ",
      passed: function (area) {
        return "領域" + area.toUpperCase() + " ✓修了";
      },
      partial: function (area) {
        return "領域" + area.toUpperCase() + " 途中";
      },
      none: function (area) {
        return "領域" + area.toUpperCase() + " 未";
      },
      areaSep: " / ",
      linkSep: " — ",
      linkText: "くわしくは目録ページ"
    },
    en: {
      prefix: "Progress: ",
      passed: function (area) {
        return "Area " + area.toUpperCase() + " ✓ Done";
      },
      partial: function (area) {
        return "Area " + area.toUpperCase() + " In Progress";
      },
      none: function (area) {
        return "Area " + area.toUpperCase() + " Not Started";
      },
      areaSep: " / ",
      linkSep: " — ",
      linkText: "See Certificate Page"
    }
  };
  var T = I18N[LANG];

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  // 領域の状態を返す: "passed"(修了) | "partial"(クイズ合格/課題提出のいずれか一方のみ) | "none"(未着手)。
  // 修了判定・クイズ単体合否・課題提出はすべてstorage.jsの公開APIのみで判定する(進捗キーの直接参照はしない)。
  function areaState(area) {
    if (!AIK) {
      return "none";
    }
    if (AIK.isPassed(area)) {
      return "passed";
    }
    var quizDone = !!AIK.passedAt(area);
    var exerciseDone = AIK.requiresExercise(area) && !!AIK.exerciseSubmittedAt(area);
    if (quizDone || exerciseDone) {
      return "partial";
    }
    return "none";
  }

  function hasAnyProgress() {
    for (var i = 0; i < AREA_KEYS.length; i++) {
      if (areaState(AREA_KEYS[i]) !== "none") {
        return true;
      }
    }
    return false;
  }

  function renderProgress(container) {
    container.innerHTML = "";

    // 進捗が一つもない場合は何も描画しない(初回訪問時の情報量を増やさない)
    if (!AIK || !hasAnyProgress()) {
      return;
    }

    var p = document.createElement("p");
    p.className = "aik-area-progress";

    var prefixSpan = document.createElement("span");
    prefixSpan.className = "aik-area-progress-prefix";
    prefixSpan.textContent = T.prefix;
    p.appendChild(prefixSpan);

    for (var i = 0; i < AREA_KEYS.length; i++) {
      var area = AREA_KEYS[i];
      if (i > 0) {
        p.appendChild(document.createTextNode(T.areaSep));
      }
      var state = areaState(area);
      var span = document.createElement("span");
      span.className =
        state === "passed" ? "aik-status-passed" : state === "partial" ? "aik-status-partial" : "aik-status-unpassed";
      span.textContent =
        state === "passed" ? T.passed(area) : state === "partial" ? T.partial(area) : T.none(area);
      p.appendChild(span);
    }

    p.appendChild(document.createTextNode(T.linkSep));

    var link = document.createElement("a");
    link.className = "aik-area-progress-link";
    link.href = "../../mokuroku/";
    link.textContent = T.linkText;
    p.appendChild(link);

    container.appendChild(p);
  }

  function renderAll() {
    var containers = document.querySelectorAll("[data-area-progress]");
    for (var i = 0; i < containers.length; i++) {
      renderProgress(containers[i]);
    }
  }

  ready(renderAll);

  // クイズ合格・実践課題提出が同一ページ内で起きた直後にも反映されるよう、
  // 状態変化イベントで再描画する。
  document.addEventListener("aik:passed", renderAll);
})();
