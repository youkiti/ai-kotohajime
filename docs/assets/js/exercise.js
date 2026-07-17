/*!
 * AI事始(AIことはじめ) - exercise.js
 *
 * `[data-exercise-gate]` を持つ要素に、実践課題(AIの講評テキスト)の
 * 提出UIを描画する。要件定義書 §4.6。
 *
 * ページ側の契約:
 *   <div data-exercise-gate="b"
 *        data-exercise-marker="【AI事始 講評】"
 *        data-exercise-minlength="100"></div>
 *   - data-exercise-marker: 貼り付けテキストに含まれるべき固定見出し。
 *     docs/feedback.md の採点プロンプトが出力させる見出しと一致させること。
 *     省略時は既定値(下記 DEFAULT_MARKER)を使う。
 *   - data-exercise-minlength: 最低文字数。省略時は100。
 *
 * 検証は「見出しを含む」「最低文字数以上」のテキスト存在確認のみ。
 * 貼り付けテキストは保存も送信もせず、提出日時だけを window.AIK
 * (storage.js)経由でlocalStorageに記録する。
 * 提出時は CustomEvent `aik:passed` を発火し、同一ページの取得状況・
 * 目録UI(storage.js / certificate.js)を再描画させる。
 */
(function () {
  "use strict";

  // storage.js (読み込み順で先行)がwindow.AIKを定義する。ここで一度だけ束縛し、
  // 以後はこのローカル変数のみを参照する(bareなグローバル参照に依存しない)。
  var AIK = window.AIK || null;

  // ページの言語("ja" | "en")。AIKがあればそれに合わせ、無ければhtml lang属性を参照する。
  var LANG = AIK && AIK.lang ? AIK.lang : (document.documentElement.lang || "ja").indexOf("en") === 0 ? "en" : "ja";

  var DEFAULT_MARKER = LANG === "en" ? "[AI Kotohajime Feedback]" : "【AI事始 講評】";
  var DEFAULT_MINLENGTH = 100;

  // UI文字列(フォーム・エラー・提出済み表示)の言語別テーブル
  var I18N = {
    ja: {
      emptyError: "講評テキストを貼り付けてください。",
      markerMissing: function (marker) {
        return (
          "見出し「" + marker + "」が見つかりません。AIの講評を、1行目の見出しを含めて全文コピーして貼り付けてください。"
        );
      },
      tooShort: "テキストが短すぎるようです。講評の全文(見出しから改善版プロンプトの提案まで)を貼り付けてください。",
      submitted: function (date, nextStep) {
        return (
          "✅ 実践課題は提出済みです(" +
          date +
          ")。" +
          nextStep +
          " あなたのブラウザ内に保存されているのは提出日時だけで、貼り付けた講評テキストはどこにも保存されていません。"
        );
      },
      nextStepPending: "領域クイズの合格もそろうと、目録を発行できます。",
      nextStepReady: "下の「目録の発行」に進んでください。",
      label: "AIの講評を貼り付けてください",
      placeholder: function (marker) {
        return marker + " で始まる講評の全文を、ここに貼り付けます。";
      },
      hint:
        "貼り付けたテキストは、見出しと文字数の確認にのみ使われます。サーバーへ送信されることも、どこかに保存されることもありません。提出日時だけが、あなたのブラウザ内(localStorage)に保存されます。",
      submitBtn: "課題を提出する"
    },
    en: {
      emptyError: "Please paste the feedback text.",
      markerMissing: function (marker) {
        return (
          "The heading “" +
          marker +
          "” was not found. Copy the AI’s feedback in full, including the heading on the first line, and paste it here."
        );
      },
      tooShort: "The text seems too short. Paste the full feedback, from the heading through the suggested improved prompt.",
      submitted: function (date, nextStep) {
        return (
          "✅ Practical exercise submitted (" +
          date +
          "). " +
          nextStep +
          " Only the submission timestamp is stored in your browser; the pasted feedback text is not saved anywhere."
        );
      },
      nextStepPending: "Once you also pass the area quiz, you can issue the certificate.",
      nextStepReady: "Continue to “Issue Certificate” below.",
      label: "Paste the AI’s feedback here",
      placeholder: function (marker) {
        return "Paste the full feedback that begins with " + marker + " here.";
      },
      hint:
        "The pasted text is used only to check for the heading and the length. It is never sent to any server; only the submission timestamp is stored in your browser (localStorage).",
      submitBtn: "Submit the exercise"
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

  function el(tag, opts) {
    var e = document.createElement(tag);
    if (opts) {
      if (opts.className) {
        e.className = opts.className;
      }
      if (opts.text !== undefined) {
        e.textContent = opts.text;
      }
    }
    return e;
  }

  function nextStepText(area) {
    if (AIK && AIK.passedAt(area)) {
      return T.nextStepReady;
    }
    return T.nextStepPending;
  }

  function renderSubmitted(container, area) {
    container.setAttribute("data-exercise-state", "submitted");
    container.innerHTML = "";
    var date = AIK ? AIK.formatDate(AIK.exerciseSubmittedAt(area)) : "";
    container.appendChild(
      el("p", {
        className: "aik-exercise-submitted",
        text: T.submitted(date, nextStepText(area))
      })
    );
  }

  function renderForm(container, area, marker, minLength) {
    container.setAttribute("data-exercise-state", "editing");
    container.innerHTML = "";

    var wrap = el("div", { className: "aik-exercise" });

    var label = el("label", { className: "aik-exercise-label", text: T.label });
    var textarea = document.createElement("textarea");
    textarea.className = "aik-exercise-textarea";
    textarea.setAttribute("rows", "10");
    textarea.placeholder = T.placeholder(marker);
    label.appendChild(document.createElement("br"));
    label.appendChild(textarea);
    wrap.appendChild(label);

    var hint = el("p", {
      className: "aik-exercise-hint",
      text: T.hint
    });
    wrap.appendChild(hint);

    var errorMsg = el("p", { className: "aik-exercise-error" });
    errorMsg.setAttribute("hidden", "hidden");
    wrap.appendChild(errorMsg);

    var submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "md-button md-button--primary";
    submitBtn.textContent = T.submitBtn;
    wrap.appendChild(submitBtn);

    function showError(text) {
      errorMsg.textContent = "⚠ " + text;
      errorMsg.removeAttribute("hidden");
    }

    submitBtn.addEventListener("click", function () {
      var text = textarea.value.replace(/^\s+|\s+$/g, "");

      if (!text) {
        showError(T.emptyError);
        return;
      }
      if (text.indexOf(marker) === -1) {
        showError(T.markerMissing(marker));
        return;
      }
      if (text.length < minLength) {
        showError(T.tooShort);
        return;
      }

      errorMsg.setAttribute("hidden", "hidden");

      if (AIK) {
        AIK.setExerciseSubmitted(area);
      }
      renderSubmitted(container, area);
      try {
        document.dispatchEvent(new CustomEvent("aik:passed", { detail: { area: area } }));
      } catch (e) {
        // 古いブラウザでCustomEventのコンストラクタが使えない場合は静かに諦める
      }
    });

    container.appendChild(wrap);
  }

  function renderBlock(container) {
    var area = container.getAttribute("data-exercise-gate");
    if (!area) {
      return;
    }
    if (!AIK || !AIK.requiresExercise(area)) {
      return;
    }

    var marker = container.getAttribute("data-exercise-marker") || DEFAULT_MARKER;
    var minLength = parseInt(container.getAttribute("data-exercise-minlength"), 10);
    if (isNaN(minLength) || minLength < 1) {
      minLength = DEFAULT_MINLENGTH;
    }

    if (AIK.exerciseSubmittedAt(area)) {
      renderSubmitted(container, area);
    } else {
      renderForm(container, area, marker, minLength);
    }
  }

  ready(function () {
    var containers = document.querySelectorAll("[data-exercise-gate]");
    for (var i = 0; i < containers.length; i++) {
      renderBlock(containers[i]);
    }
  });

  // 同一ページでクイズに合格した場合、提出済み表示の案内文
  // (「クイズの合格もそろうと〜」)を最新の状態に更新する。
  // 入力途中のフォームを消さないよう、提出済み状態のブロックだけを再描画する。
  document.addEventListener("aik:passed", function (evt) {
    var passedArea = evt && evt.detail ? evt.detail.area : null;
    var containers = document.querySelectorAll("[data-exercise-gate]");
    for (var i = 0; i < containers.length; i++) {
      var container = containers[i];
      if (
        container.getAttribute("data-exercise-gate") === passedArea &&
        container.getAttribute("data-exercise-state") === "submitted"
      ) {
        renderSubmitted(container, passedArea);
      }
    }
  });
})();
