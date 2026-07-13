/*!
 * AI事始(AIことはじめ) - lang-redirect.js
 *
 * 初回訪問時のみ navigator.language でja/enの等価ページへリダイレクトする。
 * 判定結果は aikotohajime.lang に保存され、以後は手動切替(言語セレクタ)が
 * 優先される(2回目以降の訪問では自動リダイレクトを行わない)。
 * 外部通信なし。他JS(storage.js の window.AIK)には依存しない。
 */
(function () {
  "use strict";
  var LANG_KEY = "aikotohajime.lang";

  // 現在ページの言語("ja" | "en")。theme.language 由来の html lang を参照
  function pageLang() {
    return (document.documentElement.lang || "ja").indexOf("en") === 0 ? "en" : "ja";
  }

  // 自分の <script src> からサイトルートの絶対URLを逆算(GitHub Pagesサブパス・localhost両対応)。
  // extra_javascript は言語によらずルートの1コピーを参照するため、src は常にサイトルート基準
  function siteRoot() {
    var s = document.querySelector('script[src*="assets/js/lang-redirect"]');
    return s ? s.src.replace(/assets\/js\/lang-redirect\.js.*$/, "") : null;
  }

  // 現在ページの他言語等価URL(パス・query・hash維持)。計算できなければ null
  function equivalentUrl(targetLang) {
    var root = siteRoot();
    if (!root || location.href.indexOf(root) !== 0) return null;
    var rest = location.href.slice(root.length);
    if (rest.indexOf("en/") === 0) rest = rest.slice(3); // 現在 en ページなら言語プレフィックスを除去
    return root + (targetLang === "en" ? "en/" : "") + rest;
  }

  function storedLang() {
    try { return window.localStorage.getItem(LANG_KEY); } catch (e) { return null; }
  }
  function storeLang(v) {
    try { window.localStorage.setItem(LANG_KEY, v); } catch (e) {}
  }

  // 言語セレクタ(a[hreflang])での手動切替を記憶(以後の自動リダイレクトはしない)
  document.addEventListener("click", function (evt) {
    var a = evt.target && evt.target.closest ? evt.target.closest("a[hreflang]") : null;
    if (a) storeLang((a.getAttribute("hreflang") || "").indexOf("en") === 0 ? "en" : "ja");
  });

  if (storedLang()) return; // 2回目以降の訪問では何もしない

  var preferred = (navigator.language || "ja").toLowerCase().indexOf("ja") === 0 ? "ja" : "en";
  storeLang(preferred); // リダイレクト前に保存(ループ防止)
  if (preferred !== pageLang()) {
    var url = equivalentUrl(preferred);
    if (url) location.replace(url);
  }
})();
