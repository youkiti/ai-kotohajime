/*!
 * AI事始(AIことはじめ) - quiz.js
 *
 * `[data-quiz-src]` を持つ要素にクイズJSONを読み込んで描画し、一括採点する。
 *
 * ページ側の契約:
 *   <div data-quiz-src="../../assets/data/quiz-a.json" data-quiz-gate="a"></div>
 *   - data-quiz-gate が無い場合は自己チェック(合否表示はするが合格保存はしない)
 *
 * 実装方針:
 * - 外部ライブラリなし。fetchはサイト内JSONのみ。
 * - 描画はDOM API(createElement/textContent)で行い、JSON由来の文字列が
 *   HTMLとして解釈されないようにする(= HTMLエスケープ要件を満たす)。
 * - window.AIK(storage.js)に依存。読み込み順は mkdocs.yml で
 *   storage.js -> quiz.js -> certificate.js に固定されている。
 */
(function () {
  "use strict";

  // storage.js (読み込み順で先行)がwindow.AIKを定義する。ここで一度だけ束縛し、
  // 以後はこのローカル変数のみを参照する(bareなグローバル参照に依存しない)。
  var AIK = window.AIK || null;

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

  function renderMessage(container, className, text) {
    container.innerHTML = "";
    container.appendChild(el("p", { className: className, text: text }));
  }

  var quizInstanceCounter = 0;

  function spacedList(nums) {
    return nums
      .map(function (n) {
        return "問" + n;
      })
      .join("、");
  }

  function areaLabelFor(gate) {
    if (!AIK || !AIK.AREAS || !AIK.AREAS[gate]) {
      return gate;
    }
    return "領域" + gate.toUpperCase() + "「" + AIK.AREAS[gate] + "」";
  }

  function buildQuiz(container, data, gate) {
    var instanceId = "aikquiz" + quizInstanceCounter++;
    var questions = data.questions;
    var passRatio = typeof data.passRatio === "number" && data.passRatio > 0 ? data.passRatio : 0.8;

    container.innerHTML = "";

    // 既に合格済みの領域クイズには、上部に注記を出す(クイズ自体は再挑戦可能なまま残す)。
    // 実践課題を要する領域では、クイズ合格済みでも課題が未提出なら次の一歩を案内する。
    if (gate && AIK && AIK.passedAt(gate)) {
      var noteText;
      if (AIK.isPassed(gate)) {
        noteText =
          "✅ この領域は合格済みです(" +
          AIK.formatDate(AIK.passedAt(gate)) +
          ")。目録は下の「目録の発行」から何度でも発行できます。";
      } else {
        noteText =
          "✅ クイズは合格済みです(" +
          AIK.formatDate(AIK.passedAt(gate)) +
          ")。目録の発行には、下の「実践課題の提出」も必要です。";
      }
      var note = el("p", { className: "aik-quiz-passed-note", text: noteText });
      container.appendChild(note);
    }

    if (data.title) {
      var titleP = el("p", { className: "aik-quiz-title" });
      var strong = document.createElement("strong");
      strong.textContent = data.title;
      titleP.appendChild(strong);
      container.appendChild(titleP);
    }

    var form = el("form", { className: "aik-quiz-form" });
    form.setAttribute("novalidate", "novalidate");

    var entries = []; // { fieldset, feedback, question }

    for (var i = 0; i < questions.length; i++) {
      (function (q, idx) {
        var fieldset = el("fieldset", { className: "aik-quiz-question" });
        var legend = el("legend", { text: "問" + (idx + 1) + ". " + q.q });
        fieldset.appendChild(legend);

        var choicesWrap = el("div", { className: "aik-quiz-choices" });
        for (var c = 0; c < q.choices.length; c++) {
          var label = el("label", { className: "aik-quiz-choice" });
          var input = document.createElement("input");
          input.type = "radio";
          input.name = instanceId + "-q" + idx;
          input.value = String(c);
          label.appendChild(input);
          var span = el("span", { text: q.choices[c] });
          label.appendChild(span);
          choicesWrap.appendChild(label);
        }
        fieldset.appendChild(choicesWrap);

        var feedback = el("div", { className: "aik-quiz-feedback" });
        feedback.setAttribute("hidden", "hidden");
        fieldset.appendChild(feedback);

        form.appendChild(fieldset);
        entries.push({ fieldset: fieldset, feedback: feedback, question: q, index: idx });
      })(questions[i], i);
    }

    var warning = el("p", { className: "aik-quiz-warning" });
    warning.setAttribute("hidden", "hidden");
    form.appendChild(warning);

    var submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "md-button md-button--primary";
    submitBtn.textContent = "採点する";
    form.appendChild(submitBtn);

    var summary = el("div", { className: "aik-quiz-summary" });
    summary.setAttribute("hidden", "hidden");
    form.appendChild(summary);

    submitBtn.addEventListener("click", function () {
      gradeQuiz(instanceId, entries, form, warning, summary, passRatio, gate);
    });

    container.appendChild(form);
  }

  function gradeQuiz(instanceId, entries, form, warning, summary, passRatio, gate) {
    var unanswered = [];
    var answers = [];

    for (var i = 0; i < entries.length; i++) {
      var name = instanceId + "-q" + entries[i].index;
      var checked = form.querySelector('input[name="' + name + '"]:checked');
      if (checked) {
        answers.push(parseInt(checked.value, 10));
      } else {
        answers.push(null);
        unanswered.push(entries[i].index + 1);
      }
    }

    if (unanswered.length > 0) {
      warning.textContent = "⚠ 未回答の問題があります: " + spacedList(unanswered);
      warning.removeAttribute("hidden");
      summary.setAttribute("hidden", "hidden");
      return;
    }
    warning.setAttribute("hidden", "hidden");

    var correctCount = 0;

    for (i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var q = entry.question;
      var isCorrect = answers[i] === q.answer;
      if (isCorrect) {
        correctCount++;
      }

      entry.feedback.innerHTML = "";
      entry.feedback.removeAttribute("hidden");

      if (isCorrect) {
        entry.fieldset.className = "aik-quiz-question aik-quiz-question--correct";
        entry.feedback.appendChild(el("p", { className: "aik-quiz-feedback-header", text: "✅ 正解" }));
      } else {
        entry.fieldset.className = "aik-quiz-question aik-quiz-question--incorrect";
        var correctText = q.choices[q.answer];
        entry.feedback.appendChild(
          el("p", {
            className: "aik-quiz-feedback-header",
            text: "❌ 不正解(正解: " + correctText + ")"
          })
        );
      }

      if (q.explanation) {
        entry.feedback.appendChild(
          el("p", { className: "aik-quiz-explanation", text: "解説: " + q.explanation })
        );
      }
    }

    var passLine = Math.ceil(entries.length * passRatio);
    var passed = correctCount >= passLine;

    summary.innerHTML = "";
    summary.removeAttribute("hidden");
    summary.appendChild(
      el("p", {
        className: "aik-quiz-score",
        // 自己チェック(gateなし)は合否を持たないため合格ラインを表示しない
        text: gate
          ? "正答数: " + correctCount + " / " + entries.length + "問(合格ライン: " + passLine + "問以上)"
          : "正答数: " + correctCount + " / " + entries.length + "問"
      })
    );

    if (gate) {
      var resultP = el("p", { className: "aik-quiz-result-message" });
      if (passed) {
        resultP.className += " aik-quiz-result-message--pass";
        var exercisePending =
          AIK && AIK.requiresExercise(gate) && !AIK.exerciseSubmittedAt(gate);
        resultP.textContent = exercisePending
          ? "🎉 合格です! 目録の発行には実践課題の提出も必要です。下の「実践課題の提出」に進んでください。"
          : "🎉 合格です! 下の「目録の発行」に進んでください。";
        if (AIK) {
          AIK.setPassed(gate);
          try {
            document.dispatchEvent(new CustomEvent("aik:passed", { detail: { area: gate } }));
          } catch (e) {
            // 古いブラウザでCustomEventのコンストラクタが使えない場合は静かに諦める
          }
        }
      } else {
        resultP.className += " aik-quiz-result-message--fail";
        var needed = passLine - correctCount;
        resultP.textContent = "合格まであと" + needed + "問。解説を読んでもう一度挑戦しましょう(回数無制限)。";
      }
      summary.appendChild(resultP);
    }
  }

  function loadQuiz(container) {
    var src = container.getAttribute("data-quiz-src");
    var gate = container.getAttribute("data-quiz-gate") || null;
    if (!src) {
      return;
    }

    if (typeof fetch !== "function") {
      renderMessage(
        container,
        "aik-quiz-error",
        "⚠ お使いのブラウザは対応していないため、クイズを表示できません。ブラウザを最新の状態に更新してください。"
      );
      return;
    }

    renderMessage(container, "aik-quiz-loading", "クイズを読み込んでいます…");

    fetch(src)
      .then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.questions || !data.questions.length) {
          throw new Error("empty-quiz-data");
        }
        buildQuiz(container, data, gate);
      })
      .catch(function () {
        var label = gate ? areaLabelFor(gate) + "の" : "";
        renderMessage(
          container,
          "aik-quiz-error",
          "⚠ " + label + "クイズの読み込みに失敗しました。ページを再読み込みするか、しばらく経ってから再度お試しください。"
        );
      });
  }

  ready(function () {
    var containers = document.querySelectorAll("[data-quiz-src]");
    for (var i = 0; i < containers.length; i++) {
      loadQuiz(containers[i]);
    }
  });
})();
