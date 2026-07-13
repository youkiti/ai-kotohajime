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

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  var FONT_STACK =
    '"Yu Mincho","YuMincho","Hiragino Mincho ProN","Noto Serif JP","MS PMincho",serif';
  var COLOR_BG = "#f8f3e7";
  var COLOR_FRAME = "#4a3f2f";
  var COLOR_TEXT = "#2b2116";
  var COLOR_MUTED = "#7a6f5d";
  var COLOR_SEAL = "#b7282e";

  var DEFAULT_LOCKED_TEXT = "対象の領域クイズに合格すると発行できます。";

  function areaDisplayName(area) {
    if (AIK && AIK.AREAS && AIK.AREAS[area]) {
      return AIK.AREAS[area];
    }
    return area;
  }

  function areaLabel(area) {
    if (area === "shokyu") {
      return "初級 全領域(A・B・C)修了";
    }
    return "領域" + area.toUpperCase() + "「" + areaDisplayName(area) + "」修了";
  }

  function bodyText(area) {
    if (area === "shokyu") {
      return "上記の者は、AI事始における初級全領域(領域A・領域B・領域C)の確認クイズにすべて合格したことをここに記す。";
    }
    return (
      "上記の者は、AI事始における領域" +
      area.toUpperCase() +
      "「" +
      areaDisplayName(area) +
      "」の確認クイズに合格したことをここに記す。"
    );
  }

  function spacedTitle(area) {
    var base = area === "shokyu" ? "初級目録" : "目録";
    return base.split("").join("　");
  }

  function fileSafeSuffix(area) {
    return area === "shokyu" ? "shokyu" : area;
  }

  function certAltText(area) {
    return (area === "shokyu" ? "初級目録" : "領域" + area.toUpperCase() + "目録") + "のプレビュー画像";
  }

  function buildTweetText(area) {
    if (area === "shokyu") {
      return "「AI事始」で初級目録を取得しました! #AI事始";
    }
    return "「AI事始」で領域" + area.toUpperCase() + "「" + areaDisplayName(area) + "」の目録を取得しました! #AI事始";
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

    // 表題「目　録」/「初　級　目　録」
    ctx.textAlign = "center";
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = "bold 108px " + FONT_STACK;
    ctx.fillText(spacedTitle(area), 800, 230);

    // 領域名
    ctx.font = "42px " + FONT_STACK;
    ctx.fillText(areaLabel(area), 800, 320);

    // 氏名 + 「殿」(長い氏名でも枠内に収まるよう自動縮小)
    var nameText = (name || "") + "　殿";
    var nameFontSize = fitFontSize(ctx, nameText, 1350, 68, 30);
    ctx.font = "bold " + nameFontSize + "px " + FONT_STACK;
    ctx.fillStyle = COLOR_TEXT;
    ctx.fillText(nameText, 800, 450);

    // 本文(文字単位で折り返し)
    ctx.font = "32px " + FONT_STACK;
    ctx.fillStyle = COLOR_TEXT;
    var bodyLines = wrapTextByChar(ctx, bodyText(area), 1150);
    var bodyStartY = 560;
    var bodyLineHeight = 52;
    for (var i = 0; i < bodyLines.length; i++) {
      ctx.fillText(bodyLines[i], 800, bodyStartY + i * bodyLineHeight);
    }

    // フッター(発行日・サイト名): 左寄せにして落款(右下)と重ならないようにする
    ctx.textAlign = "left";
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = "26px " + FONT_STACK;
    ctx.fillText("発行日: " + (AIK ? AIK.todayString() : ""), 140, 750);
    ctx.fillText("AI事始 ― 医療者のための生成AI自習サイト ―", 140, 800);

    // 免責文言(小さく・グレー)
    ctx.font = "18px " + FONT_STACK;
    ctx.fillStyle = COLOR_MUTED;
    var disclaimerLines = wrapTextByChar(
      ctx,
      "本目録は自己学習の記録として本人が発行したものであり、公式な研修修了の証明ではありません。",
      1100
    );
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

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 56px " + FONT_STACK;
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
      errP.textContent = "目録の生成に失敗しました。ブラウザの設定をご確認のうえ、再度お試しください。";
      resultWrap.appendChild(errP);
      return;
    }

    var dataUrl;
    try {
      dataUrl = canvas.toDataURL("image/png");
    } catch (e) {
      var errP2 = document.createElement("p");
      errP2.className = "aik-cert-error";
      errP2.textContent = "画像の生成に失敗しました。";
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
    downloadLink.setAttribute("download", "ai-kotohajime-mokuroku-" + fileSafeSuffix(area) + ".png");
    downloadLink.textContent = "PNGをダウンロード";
    actions.appendChild(downloadLink);

    var tweetLink = document.createElement("a");
    tweetLink.className = "md-button";
    tweetLink.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(buildTweetText(area));
    tweetLink.target = "_blank";
    tweetLink.rel = "noopener noreferrer";
    tweetLink.textContent = "Xでポストする";
    actions.appendChild(tweetLink);

    var tweetHint = document.createElement("p");
    tweetHint.className = "aik-cert-hint";
    tweetHint.textContent =
      "文面のみ入力されます。ダウンロードした画像を投稿に添付してください。スマホでは共有から画像ごとシェアできます。";
    resultWrap.appendChild(tweetHint);

    // Web Share API (Level 2: ファイル共有) - 対応環境でのみ「共有」ボタンを追加する
    if (typeof canvas.toBlob === "function") {
      try {
        canvas.toBlob(function (blob) {
          if (!blob) {
            return;
          }
          try {
            var file = new File([blob], "ai-kotohajime-mokuroku-" + fileSafeSuffix(area) + ".png", {
              type: "image/png"
            });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              var shareBtn = document.createElement("button");
              shareBtn.type = "button";
              shareBtn.className = "md-button";
              shareBtn.textContent = "共有(スマホ等)";
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
    label.textContent = "お名前(ニックネーム可)";

    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "aik-cert-name-input";
    nameInput.placeholder = "例: 山田 太郎 / やまだ";
    nameInput.setAttribute("maxlength", "30");

    label.appendChild(document.createElement("br"));
    label.appendChild(nameInput);
    wrap.appendChild(label);

    var hint = document.createElement("p");
    hint.className = "aik-cert-hint";
    hint.textContent =
      "SNSで実名を出したくない場合はニックネームで発行できます。入力した名前はこの端末の外に送信されません。";
    wrap.appendChild(hint);

    var errorMsg = document.createElement("p");
    errorMsg.className = "aik-cert-error";
    errorMsg.setAttribute("hidden", "hidden");
    wrap.appendChild(errorMsg);

    var issueBtn = document.createElement("button");
    issueBtn.type = "button";
    issueBtn.className = "md-button md-button--primary";
    issueBtn.textContent = "目録を発行する";
    wrap.appendChild(issueBtn);

    var resultWrap = document.createElement("div");
    resultWrap.className = "aik-cert-result";
    resultWrap.setAttribute("hidden", "hidden");
    wrap.appendChild(resultWrap);

    issueBtn.addEventListener("click", function () {
      var name = nameInput.value.replace(/^\s+|\s+$/g, "");
      if (!name) {
        errorMsg.textContent = "お名前(ニックネーム可)を入力してください。";
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
