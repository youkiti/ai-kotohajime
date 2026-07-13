/*!
 * AI事始(AIことはじめ) - storage.js
 *
 * localStorageへのクイズ合格状態の保存・読み出しを担う共通モジュール。
 * window.AIK として他のスクリプト(quiz.js / certificate.js)から利用される。
 *
 * 設計方針:
 * - サーバへは一切送信しない。保存先はこの端末のlocalStorageのみ。
 * - localStorageが使えない環境(プライベートブラウズ等)でも例外で
 *   ページ全体が壊れないよう、すべての読み書きをtry/catchで保護する。
 *   その場合は保存が効かないだけで、機能自体はそのセッション内で動作継続する
 *   (メモリ上のフォールバックストアを使用)。
 * - ES5〜ES2017程度の範囲で記述し、ビルド工程なしでそのまま配信する。
 */
(function () {
  "use strict";

  var STORAGE_PREFIX = "aikotohajime.quiz.";

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

  // 初級3領域の定義(領域キー: 表示名)
  var AREAS = {
    a: "生成AIのメカニズム",
    b: "対話的活用スキル",
    c: "倫理・安全・検証"
  };
  var AREA_KEYS = ["a", "b", "c"];

  function passedKey(area) {
    return STORAGE_PREFIX + area + ".passedAt";
  }

  // 指定領域の合格日時(ISO 8601文字列)。未合格ならnull。
  function passedAt(area) {
    if (!Object.prototype.hasOwnProperty.call(AREAS, area)) {
      return null;
    }
    var v = storageGet(passedKey(area));
    return v ? v : null;
  }

  // 指定領域が合格済みかどうか。area === "shokyu" の場合は3領域すべての合格(allPassed)を返す。
  function isPassed(area) {
    if (area === "shokyu") {
      return allPassed();
    }
    return !!passedAt(area);
  }

  // 指定領域を合格済みとして記録する。既に合格済みの場合は日時を上書きしない。
  function setPassed(area) {
    if (!Object.prototype.hasOwnProperty.call(AREAS, area)) {
      return;
    }
    if (passedAt(area)) {
      return;
    }
    var iso;
    try {
      iso = new Date().toISOString();
    } catch (e) {
      iso = "" + new Date().getTime();
    }
    storageSet(passedKey(area), iso);
  }

  // 初級3領域すべてが合格済みか
  function allPassed() {
    for (var i = 0; i < AREA_KEYS.length; i++) {
      if (!passedAt(AREA_KEYS[i])) {
        return false;
      }
    }
    return true;
  }

  // すべての合格記録を消去する
  function reset() {
    for (var i = 0; i < AREA_KEYS.length; i++) {
      storageRemove(passedKey(AREA_KEYS[i]));
    }
  }

  // ISO 8601文字列 -> 「2026年7月13日」形式。不正な値の場合は空文字を返す。
  function formatDate(iso) {
    if (!iso) {
      return "";
    }
    var d = new Date(iso);
    if (isNaN(d.getTime())) {
      return "";
    }
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
  }

  // 今日の日付を「2026年7月13日」形式で返す
  function todayString() {
    var d = new Date();
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

  window.AIK = {
    AREAS: AREAS,
    passedAt: passedAt,
    isPassed: isPassed,
    setPassed: setPassed,
    allPassed: allPassed,
    reset: reset,
    formatDate: formatDate,
    todayString: todayString,
    escapeHtml: escapeHtml
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
      var label = "領域" + area.toUpperCase() + "「" + AREAS[area] + "」";
      if (isPassed(area)) {
        li.textContent = "✅ " + label + ": 合格済み(" + formatDate(passedAt(area)) + ")";
        li.className = "aik-status-passed";
      } else {
        li.textContent = "⬜ " + label + ": 未合格";
        li.className = "aik-status-unpassed";
      }
      ul.appendChild(li);
    }

    var shokyuLi = document.createElement("li");
    if (allPassed()) {
      shokyuLi.textContent = "🎓 初級目録: 発行できます";
      shokyuLi.className = "aik-status-passed";
    } else {
      shokyuLi.textContent = "🔒 初級目録: 3領域すべての合格が必要です";
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
        var ok = window.confirm(
          "これまでのクイズ合格記録(領域A・B・Cの合否)をすべて消去します。この操作は取り消せません。よろしいですか?"
        );
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

  // 目録が別スクリプト(certificate.js)からlocalStorageを更新した直後にも
  // 取得状況表示を更新できるよう、合格イベントでも再描画する。
  document.addEventListener("aik:passed", renderAllStatus);
})();
