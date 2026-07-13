/*!
 * AI事始(AIことはじめ) - certificate.js
 *
 * `[data-cert-area]` を持つ要素に「目録」発行UIを描画する。
 * 領域クイズ合格(または初級目録なら3領域すべての合格)が確認できるまでは
 * ロック表示のみとし、合格後に氏名入力 -> Canvas描画 -> PNGプレビュー/
 * ダウンロード/共有のUIを出す。
 *
 * ページ側の契約:
 *   <div data-cert-area="a" data-cert-locked="〜すると発行できます。"></div>
 *   data-cert-area は a / b / c / shokyu。
 *
 * サーバ送信は一切行わない。氏名はCanvas描画にのみ使用し、
 * Xポスト用リンクにも氏名は含めない(意図的な設計判断)。
 */
(function () {
  "use strict";

  // storage.js (読み込み順で先行)がwindow.AIKを定義する。ここで一度だけ束縛し、
  // 以後はこのローカル変数のみを参照する(bareなグローバル参照に依存しない)。
  var AIK = window.AIK || null;

  // ページの言語("ja" | "en")。AIKがあればそれに合わせ、無ければhtml lang属性を参照する。
  var LANG = AIK && AIK.lang ? AIK.lang : (document.documentElement.lang || "ja").indexOf("en") === 0 ? "en" : "ja";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  // Canvas描画用フォントスタック。ja/enで書体を切り替える。
  // ただし落款(朱印)の「事」「始」の2文字は言語によらず常に和文フォントで描画する。
  var FONT_STACK_JA =
    '"Yu Mincho","YuMincho","Hiragino Mincho ProN","Noto Serif JP","MS PMincho",serif';
  var FONT_STACK_EN = 'Georgia,"Times New Roman","Palatino Linotype",serif';
  var FONT_STACK = LANG === "en" ? FONT_STACK_EN : FONT_STACK_JA;

  var COLOR_BG = "#f8f3e7";
  var COLOR_FRAME = "#4a3f2f";
  var COLOR_TEXT = "#2b2116";
  var COLOR_MUTED = "#7a6f5d";
  var COLOR_SEAL = "#b7282e";

  // UI文字列(発行フォーム・共有ボタン・Canvas上の定型文言)の言語別テーブル
  var I18N = {
    ja: {
      footerIssued: function (today) {
        return "発行日: " + today;
      },
      footerSite: "AI事始 ― 医療者のための生成AI自習サイト ―",
      disclaimer: "本目録は自己学習の記録として本人が発行したものであり、公式な研修修了の証明ではありません。",
      tweetShokyu: "「AI事始」で初級目録を取得しました! #AI事始",
      tweetArea: function (area, areaName) {
        return "「AI事始」で領域" + area + "「" + areaName + "」の目録を取得しました! #AI事始";
      },
      downloadBtn: "PNGをダウンロード",
      xBtn: "Xでポストする",
      xHint: "文面のみ入力されます。ダウンロードした画像を投稿に添付してください。スマホでは共有から画像ごとシェアできます。",
      shareBtn: "共有(スマホ等)",
      nameLabel: "お名前(ニックネーム可)",
      namePlaceholder: "例: 山田 太郎 / やまだ",
      nameHint: "SNSで実名を出したくない場合はニックネームで発行できます。入力した名前はこの端末の外に送信されません。",
      issueBtn: "目録を発行する",
      nameRequired: "お名前(ニックネーム可)を入力してください。",
      lockedDefault: "対象の領域クイズに合格すると発行できます。",
      genError: "目録の生成に失敗しました。ブラウザの設定をご確認のうえ、再度お試しください。",
      imgError: "画像の生成に失敗しました。",
      altShokyu: "初級目録のプレビュー画像",
      altArea: function (area) {
        return "領域" + area + "目録のプレビュー画像";
      }
    },
    en: {
      footerIssued: function (today) {
        return "Issued: " + today;
      },
      footerSite: "AI Kotohajime — A Self-Study Site on Generative AI for Healthcare Professionals",
      disclaimer:
        "This certificate is a self-issued record of self-study and does not constitute official proof of training completion.",
      tweetShokyu: "I earned the Beginner Certificate on AI Kotohajime! #AIKotohajime",
      tweetArea: function (area, areaName) {
        return "I earned the Area " + area + " “" + areaName + "” certificate on AI Kotohajime! #AIKotohajime";
      },
      downloadBtn: "Download PNG",
      xBtn: "Post on X",
      xHint:
        "Only the text is prefilled. Attach the downloaded image to your post. On mobile, you can share the image itself from “Share”.",
      shareBtn: "Share (mobile)",
      nameLabel: "Your name (nickname OK)",
      namePlaceholder: "e.g., Jane Smith / jane",
      nameHint:
        "If you prefer not to use your real name on social media, you can issue the certificate with a nickname. The name you enter never leaves this device.",
      issueBtn: "Issue Certificate",
      nameRequired: "Please enter your name (nickname OK).",
      lockedDefault: "Issued after you pass the corresponding area quiz.",
      genError: "Failed to generate the certificate. Check your browser settings and try again.",
      imgError: "Failed to generate the image.",
      altShokyu: "Preview of the Beginner Certificate",
      altArea: function (area) {
        return "Preview of the Area " + area + " certificate";
      }
    }
  };
  var T = I18N[LANG];

  var DEFAULT_LOCKED_TEXT = T.lockedDefault;

  function areaDisplayName(area) {
    if (AIK && AIK.AREAS && AIK.AREAS[area]) {
      return AIK.AREAS[area];
    }
    return area;
  }

  // 目録上の領域名行。ja は既存どおり「領域A「…」修了」/ shokyu「初級 全領域(A・B・C)修了」。
  // en は AIK.areaLabel() を活用し「Area A: …  — Completed」/ shokyu 専用文言。
  function areaLabel(area) {
    if (area === "shokyu") {
      return LANG === "en" ? "Beginner Level — All Areas (A, B, C) Completed" : "初級 全領域(A・B・C)修了";
    }
    var base =
      AIK && AIK.areaLabel
        ? AIK.areaLabel(area)
        : "領域" + area.toUpperCase() + "「" + areaDisplayName(area) + "」";
    return LANG === "en" ? base + " — Completed" : base + "修了";
  }

  function bodyText(area) {
    if (LANG === "en") {
      if (area === "shokyu") {
        return "This certifies that the above-named person has satisfied all completion requirements of the Beginner level (Areas A, B, and C) of AI Kotohajime.";
      }
      var baseEn =
        "This certifies that the above-named person has passed the Area " +
        area.toUpperCase() +
        " quiz (" +
        areaDisplayName(area) +
        ")";
      if (AIK && AIK.requiresExercise && AIK.requiresExercise(area)) {
        return baseEn + " and completed the practical exercise.";
      }
      return baseEn + ".";
    }
    if (area === "shokyu") {
      return "上記の者は、AI事始における初級全領域(領域A・領域B・領域C)の修了要件をすべて満たしたことをここに記す。";
    }
    var base =
      "上記の者は、AI事始における領域" +
      area.toUpperCase() +
      "「" +
      areaDisplayName(area) +
      "」の確認クイズに合格し";
    // 実践課題を要する領域(領域B)は、目録本文にも課題の修了を反映する
    if (AIK && AIK.requiresExercise && AIK.requiresExercise(area)) {
      return base + "、実践課題を修了したことをここに記す。";
    }
    return base + "たことをここに記す。";
  }

  // 表題文字列。ja は既存どおり全角空白で字間を空けた「目　録」/「初　級　目　録」。
  // en は字間処理をせず "CERTIFICATE" / "BEGINNER CERTIFICATE"。
  function spacedTitle(area) {
    if (LANG === "en") {
      return area === "shokyu" ? "BEGINNER CERTIFICATE" : "CERTIFICATE";
    }
    var base = area === "shokyu" ? "初級目録" : "目録";
    return base.split("").join("　");
  }

  function fileSafeSuffix(area) {
    return area === "shokyu" ? "shokyu" : area;
  }

  // ダウンロード/共有ファイル名。ja は既存どおり ai-kotohajime-mokuroku-<suffix>.png(不変)。
  function downloadFileName(area) {
    var prefix = LANG === "en" ? "ai-kotohajime-certificate-" : "ai-kotohajime-mokuroku-";
    return prefix + fileSafeSuffix(area) + ".png";
  }

  function certAltText(area) {
    if (area === "shokyu") {
      return T.altShokyu;
    }
    return T.altArea(area.toUpperCase());
  }

  function buildTweetText(area) {
    if (area === "shokyu") {
      return T.tweetShokyu;
    }
    return T.tweetArea(area.toUpperCase(), areaDisplayName(area));
  }

  // 文字単位で折り返して行配列を作る(日本語の単語区切りに依存しない簡易実装)
  function wrapTextByChar(ctx, text, maxWidth) {
    var lines = [];
    var current = "";
    for (var i = 0; i < text.length; i++) {
      var testLine = current + text.charAt(i);
      if (current !== "" && ctx.measureText(testLine).width > maxWidth) {
        lines.push(current);
        current = text.charAt(i);
      } else {
        current = testLine;
      }
    }
    if (current !== "") {
      lines.push(current);
    }
    return lines;
  }

  // 単語(空白)単位で折り返して行配列を作る(英文向け)。
  // 1語単体が maxWidth を超える場合は、その語だけ wrapTextByChar で文字単位に分割してフォールバックする。
  function wrapTextByWord(ctx, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var current = "";
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var testLine = current === "" ? word : current + " " + word;
      if (ctx.measureText(testLine).width > maxWidth) {
        if (current !== "") {
          lines.push(current);
          current = "";
        }
        if (ctx.measureText(word).width > maxWidth) {
          var subLines = wrapTextByChar(ctx, word, maxWidth);
          for (var j = 0; j < subLines.length - 1; j++) {
            lines.push(subLines[j]);
          }
          current = subLines.length ? subLines[subLines.length - 1] : "";
        } else {
          current = word;
        }
      } else {
        current = testLine;
      }
    }
    if (current !== "") {
      lines.push(current);
    }
    return lines;
  }

  // 指定の最大幅に収まるまでフォントサイズを縮小する(長い氏名対策)
  function fitFontSize(ctx, text, maxWidth, baseSize, minSize) {
    var size = baseSize;
    ctx.font = "bold " + size + "px " + FONT_STACK;
    while (size > minSize && ctx.measureText(text).width > maxWidth) {
      size -= 2;
      ctx.font = "bold " + size + "px " + FONT_STACK;
    }
    return size;
  }

  function drawCertificate(area, name) {
    var canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1000;
    var ctx = canvas.getContext("2d");

    // 背景(生成りの地)
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 二重枠: 太い外枠
    ctx.strokeStyle = COLOR_FRAME;
    ctx.lineWidth = 18;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // 二重枠: 細い内枠
    ctx.lineWidth = 4;
    ctx.strokeRect(64, 64, canvas.width - 128, canvas.height - 128);

    // 表題「目　録」/「初　級　目　録」(en: "CERTIFICATE" / "BEGINNER CERTIFICATE")
    ctx.textAlign = "center";
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = (LANG === "en" ? "bold 96px " : "bold 108px ") + FONT_STACK;
    ctx.fillText(spacedTitle(area), 800, 230);

    // 領域名
    ctx.font = "42px " + FONT_STACK;
    ctx.fillText(areaLabel(area), 800, 320);

    // 氏名(ja: 「殿」付き / en: 氏名のみ)。長い氏名でも枠内に収まるよう自動縮小
    var nameText = LANG === "en" ? name || "" : (name || "") + "　殿";
    var nameFontSize = fitFontSize(ctx, nameText, 1350, 68, 30);
    ctx.font = "bold " + nameFontSize + "px " + FONT_STACK;
    ctx.fillStyle = COLOR_TEXT;
    ctx.fillText(nameText, 800, 450);

    // 本文(ja: 文字単位 / en: 単語単位で折り返し)
    ctx.font = "32px " + FONT_STACK;
    ctx.fillStyle = COLOR_TEXT;
    var wrapFn = LANG === "en" ? wrapTextByWord : wrapTextByChar;
    var bodyLines = wrapFn(ctx, bodyText(area), 1150);
    var bodyStartY = 560;
    var bodyLineHeight = 52;
    for (var i = 0; i < bodyLines.length; i++) {
      ctx.fillText(bodyLines[i], 800, bodyStartY + i * bodyLineHeight);
    }

    // フッター(発行日・サイト名): 左寄せにして落款(右下)と重ならないようにする
    ctx.textAlign = "left";
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = "26px " + FONT_STACK;
    ctx.fillText(T.footerIssued(AIK ? AIK.todayString() : ""), 140, 750);
    ctx.fillText(T.footerSite, 140, 800);

    // 免責文言(小さく・グレー)
    ctx.font = "18px " + FONT_STACK;
    ctx.fillStyle = COLOR_MUTED;
    var disclaimerLines = wrapFn(ctx, T.disclaimer, 1100);
    for (var d = 0; d < disclaimerLines.length; d++) {
      ctx.fillText(disclaimerLines[d], 140, 850 + d * 26);
    }

    // 落款(右下、朱色の正方形に白抜き文字)
    var sealX = 1310;
    var sealY = 740;
    var sealSize = 150;
    ctx.fillStyle = COLOR_SEAL;
    ctx.fillRect(sealX, sealY, sealSize, sealSize);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.strokeRect(sealX + 10, sealY + 10, sealSize - 20, sealSize - 20);

    // 「事」「始」の2文字は言語によらず常に和文フォントで描画する
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 56px " + FONT_STACK_JA;
    ctx.fillText("事", sealX + sealSize / 2, sealY + sealSize / 2 - 8);
    ctx.fillText("始", sealX + sealSize / 2, sealY + sealSize / 2 + 62);

    return canvas;
  }

  function issueCertificate(area, name, resultWrap) {
    resultWrap.innerHTML = "";
    resultWrap.removeAttribute("hidden");

    var canvas;
    try {
      canvas = drawCertificate(area, name);
    } catch (e) {
      var errP = document.createElement("p");
      errP.className = "aik-cert-error";
      errP.textContent = T.genError;
      resultWrap.appendChild(errP);
      return;
    }

    var dataUrl;
    try {
      dataUrl = canvas.toDataURL("image/png");
    } catch (e) {
      var errP2 = document.createElement("p");
      errP2.className = "aik-cert-error";
      errP2.textContent = T.imgError;
      resultWrap.appendChild(errP2);
      return;
    }

    var img = document.createElement("img");
    img.className = "aik-cert-preview";
    img.src = dataUrl;
    img.alt = certAltText(area);
    resultWrap.appendChild(img);

    var actions = document.createElement("div");
    actions.className = "aik-cert-actions";
    resultWrap.appendChild(actions);

    var downloadLink = document.createElement("a");
    downloadLink.className = "md-button";
    downloadLink.href = dataUrl;
    downloadLink.setAttribute("download", downloadFileName(area));
    downloadLink.textContent = T.downloadBtn;
    actions.appendChild(downloadLink);

    var tweetLink = document.createElement("a");
    tweetLink.className = "md-button";
    tweetLink.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(buildTweetText(area));
    tweetLink.target = "_blank";
    tweetLink.rel = "noopener noreferrer";
    tweetLink.textContent = T.xBtn;
    actions.appendChild(tweetLink);

    var tweetHint = document.createElement("p");
    tweetHint.className = "aik-cert-hint";
    tweetHint.textContent = T.xHint;
    resultWrap.appendChild(tweetHint);

    // Web Share API (Level 2: ファイル共有) - 対応環境でのみ「共有」ボタンを追加する
    if (typeof canvas.toBlob === "function") {
      try {
        canvas.toBlob(function (blob) {
          if (!blob) {
            return;
          }
          try {
            var file = new File([blob], downloadFileName(area), {
              type: "image/png"
            });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              var shareBtn = document.createElement("button");
              shareBtn.type = "button";
              shareBtn.className = "md-button";
              shareBtn.textContent = T.shareBtn;
              shareBtn.addEventListener("click", function () {
                navigator
                  .share({
                    files: [file],
                    text: buildTweetText(area)
                  })
                  .catch(function () {
                    // ユーザーによるキャンセル等。エラー表示はせず静かに戻る。
                  });
              });
              actions.insertBefore(shareBtn, tweetLink);
            }
          } catch (e) {
            // File API 非対応、またはcanShare判定に失敗。共有ボタンなしで続行。
          }
        }, "image/png");
      } catch (e) {
        // toBlob非対応環境。ダウンロード/Xポストのみ提供する。
      }
    }
  }

  function buildIssueUI(container, area) {
    var wrap = document.createElement("div");
    wrap.className = "aik-cert-issue";

    var label = document.createElement("label");
    label.className = "aik-cert-name-label";
    label.textContent = T.nameLabel;

    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "aik-cert-name-input";
    nameInput.placeholder = T.namePlaceholder;
    nameInput.setAttribute("maxlength", "30");

    label.appendChild(document.createElement("br"));
    label.appendChild(nameInput);
    wrap.appendChild(label);

    var hint = document.createElement("p");
    hint.className = "aik-cert-hint";
    hint.textContent = T.nameHint;
    wrap.appendChild(hint);

    var errorMsg = document.createElement("p");
    errorMsg.className = "aik-cert-error";
    errorMsg.setAttribute("hidden", "hidden");
    wrap.appendChild(errorMsg);

    var issueBtn = document.createElement("button");
    issueBtn.type = "button";
    issueBtn.className = "md-button md-button--primary";
    issueBtn.textContent = T.issueBtn;
    wrap.appendChild(issueBtn);

    var resultWrap = document.createElement("div");
    resultWrap.className = "aik-cert-result";
    resultWrap.setAttribute("hidden", "hidden");
    wrap.appendChild(resultWrap);

    issueBtn.addEventListener("click", function () {
      var name = nameInput.value.replace(/^\s+|\s+$/g, "");
      if (!name) {
        errorMsg.textContent = T.nameRequired;
        errorMsg.removeAttribute("hidden");
        nameInput.focus();
        return;
      }
      errorMsg.setAttribute("hidden", "hidden");
      issueCertificate(area, name, resultWrap);
    });

    container.appendChild(wrap);
  }

  function renderCertBlock(container) {
    var area = container.getAttribute("data-cert-area");
    if (!area) {
      return;
    }
    var lockedText = container.getAttribute("data-cert-locked") || DEFAULT_LOCKED_TEXT;

    var passed = AIK ? AIK.isPassed(area) : false;

    // 解錠済みUIが構築済みなら作り直さない(再合格イベントで入力済みの
    // 氏名や発行済みプレビューを消してしまわないため)
    if (passed && container.getAttribute("data-cert-state") === "unlocked") {
      return;
    }
    container.setAttribute("data-cert-state", passed ? "unlocked" : "locked");

    container.innerHTML = "";

    if (!passed) {
      var lockedP = document.createElement("p");
      lockedP.className = "aik-cert-locked";
      lockedP.textContent = "🔒 " + lockedText;
      container.appendChild(lockedP);
      return;
    }

    buildIssueUI(container, area);
  }

  function renderAll() {
    var containers = document.querySelectorAll("[data-cert-area]");
    for (var i = 0; i < containers.length; i++) {
      renderCertBlock(containers[i]);
    }
  }

  ready(renderAll);

  // クイズ合格イベントで再描画する。合格した領域、および初級目録(shokyu)の
  // 判定に影響しうるブロックのみを対象にし、無関係な既発行プレビューを
  // 誤って消さないようにする。
  document.addEventListener("aik:passed", function (evt) {
    var passedArea = evt && evt.detail ? evt.detail.area : null;
    var containers = document.querySelectorAll("[data-cert-area]");
    for (var i = 0; i < containers.length; i++) {
      var area = containers[i].getAttribute("data-cert-area");
      if (area === passedArea || area === "shokyu") {
        renderCertBlock(containers[i]);
      }
    }
  });
})();
