/*!
 * AI事始(AIことはじめ) - external-links.js
 *
 * サイト内の全外部リンク(http/https かつ他ホスト)に target="_blank" と
 * rel="noopener" を一律付与する。Markdown側で個別に attr_list を付ける
 * 運用は追加漏れが起きやすいため、このJSがページ内のリンクを走査して
 * 機械的に補完する(新しいリンクを含む記事を書くだけで自動的に対象になる)。
 *
 * 実装方針:
 * - 外部通信なし。DOM走査と属性付与のみ。
 * - 対象は a[href] のうち、
 *     ・a.protocol が "http:" または "https:"(mailto: 等は対象外)
 *     ・a.host !== location.host(サイト内リンク・言語切替リンクは対象外。
 *       a要素のプロパティ経由で判定するため、mkdocs serve のlocalhostでも
 *       GitHub Pagesのサブパスでも host 比較がそのまま機能する)
 *   のもの。
 * - rel は既存値を保持したまま "noopener" を追記する(重複追加はしない)。
 * - window.AIK(storage.js)には依存しない、lang-redirect.js と同様の独立JS。
 * - 読み込み順の制約なし(extra_javascript の末尾に追加すればよい)。
 */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  // 1本のaを外部リンクとして処理してよいか判定する
  function isExternal(a) {
    return (a.protocol === "http:" || a.protocol === "https:") && a.host !== location.host;
  }

  // relに"noopener"を(重複なく)追記する。既存値は保持する
  function addNoopener(a) {
    var rel = (a.getAttribute("rel") || "").split(/\s+/).filter(function (v) {
      return v.length > 0;
    });
    if (rel.indexOf("noopener") === -1) {
      rel.push("noopener");
    }
    a.setAttribute("rel", rel.join(" "));
  }

  function applyToExternalLinks() {
    var anchors = document.querySelectorAll("a[href]");
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      if (isExternal(a)) {
        a.setAttribute("target", "_blank");
        addNoopener(a);
      }
    }
  }

  ready(applyToExternalLinks);
})();
