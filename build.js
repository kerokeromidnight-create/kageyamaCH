#!/usr/bin/env node
/**
 * build.js — masaCH 記事ビルダー
 *
 * 使い方:
 *   node build.js
 *
 * articles-src/*.md を読み込んで:
 *   1. article-XXX.html を生成・更新
 *   2. index.html の最新3件カードを更新
 *   3. articles.html の全記事カードを更新
 *
 * npm install 不要（Node.js 標準ライブラリのみ使用）
 */

const fs   = require('fs');
const path = require('path');

// ── 設定 ────────────────────────────────────────────────────────────────

const SRC_DIR   = path.join(__dirname, 'articles-src');
const OUT_DIR   = __dirname;
const INDEX_HTML    = path.join(OUT_DIR, 'index.html');
const ARTICLES_HTML = path.join(OUT_DIR, 'articles.html');

const MEMBER_DISPLAY = {
  masashi:  'カレハ',
  masaharu: 'ルハさま',
  masaaki:  'キアさま',
};

const MEMBER_BIO = {
  masashi:  'ドラゴンクエストが大好きな40歳。RPGをじっくり遊ぶスタイル。最近は子供と一緒にスプラトゥーンもやっているが、エイムが壊滅的に悪い。',
  masaharu: '15歳。Minecraftなどの創作系のゲームが得意で、スマブラなどの格闘ゲームも好き。勝ったときのドヤ顔がすごい。',
  masaaki:  '10歳。フォートナイトとスプラトゥーンが得意で、動きの速さは年齢を感じさせない。負けるとすぐイライラするが、次の日にはケロッとしている。',
};

// ── フロントマター解析 ────────────────────────────────────────────────────

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon === -1) return;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    meta[key] = val;
  });

  return { meta, body: match[2].trim() };
}

// ── Markdown → HTML 変換 ─────────────────────────────────────────────────

function mdToHtml(md) {
  const lines  = md.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 空行
    if (line.trim() === '') { i++; continue; }

    // h2
    if (line.startsWith('## ')) {
      result.push(`<h2>${escape(line.slice(3))}</h2>`);
      i++; continue;
    }

    // h3
    if (line.startsWith('### ')) {
      result.push(`<h3>${escape(line.slice(4))}</h3>`);
      i++; continue;
    }

    // blockquote
    if (line.startsWith('> ')) {
      result.push(`<blockquote>${escape(line.slice(2))}</blockquote>`);
      i++; continue;
    }

    // SCORE: 特殊ブロック
    if (line.startsWith('SCORE:')) {
      result.push(`<div class="score">${escape(line.slice(6).trim())}</div>`);
      i++; continue;
    }

    // 通常段落
    result.push(`<p>${inlineFormat(escape(line))}</p>`);
    i++;
  }

  return result.join('\n        ');
}

function escape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(str) {
  // **bold**
  str = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // *italic*
  str = str.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return str;
}

// ── 日付フォーマット ─────────────────────────────────────────────────────

function fmtDateDot(iso) {
  // "2024-12-15" → "2024.12.15"
  const [y, m, d] = iso.split('-');
  return `${y}.${m.padStart(2,'0')}.${d.padStart(2,'0')}`;
}

// ── スクリーンショット HTML ───────────────────────────────────────────────

function screenshotBlock(val) {
  if (val) {
    return `<img src="images/${val}" alt="スクショ" loading="lazy">`;
  }
  return `<div class="screenshot-placeholder"><span>📸 スクショ</span></div>`;
}

function cardImageBlock(meta) {
  const ss = meta.screenshot;
  if (ss) {
    return `<img src="images/${ss}" alt="${escape(meta.title)}" loading="lazy">`;
  }
  return `<div class="screenshot-placeholder"><span>📸 スクショ</span></div>`;
}

// ── article-XXX.html 生成 ─────────────────────────────────────────────────

function buildArticleHtml(meta, body, allArticles) {
  const author      = meta.author;
  const displayName = MEMBER_DISPLAY[author] || author;
  const bio         = MEMBER_BIO[author]     || '';
  const memberClass = `member--${author}`;

  const ss1 = screenshotBlock(meta.screenshot);

  // 前後記事ナビ
  const prevArticle = meta.prev ? allArticles.find(a => a.meta.id === meta.prev) : null;
  const nextArticle = meta.next ? allArticles.find(a => a.meta.id === meta.next) : null;

  const prevNav = prevArticle
    ? `<a href="${prevArticle.meta.id}.html" class="article-nav__item article-nav__item--prev">
          <span class="article-nav__label">← 前の記事</span>
          <span class="article-nav__title">${escape(prevArticle.meta.title)}</span>
        </a>`
    : `<div class="article-nav__item">
          <span class="article-nav__label">← 前の記事</span>
          <span class="article-nav__title" style="color: var(--muted);">なし</span>
        </div>`;

  const nextNav = nextArticle
    ? `<a href="${nextArticle.meta.id}.html" class="article-nav__item article-nav__item--next">
          <span class="article-nav__label">次の記事 →</span>
          <span class="article-nav__title">${escape(nextArticle.meta.title)}</span>
        </a>`
    : `<div class="article-nav__item">
          <span class="article-nav__label">次の記事 →</span>
          <span class="article-nav__title" style="color: var(--muted);">なし</span>
        </div>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(meta.title)} — masaCH</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="page-wrapper ${memberClass}">

  <header class="site-header">
    <div class="header-inner">
      <a href="index.html" class="site-logo">masaCH</a>
      <button class="nav-toggle" aria-label="メニューを開く" aria-expanded="false" id="navToggle">
        <span></span><span></span><span></span>
      </button>
      <nav class="main-nav" id="mainNav">
        <a href="index.html">トップ</a>
        <a href="articles.html">記事一覧</a>
        <a href="members.html">メンバー</a>
      </nav>
    </div>
  </header>

  <main class="main-content">
    <div class="container">

      <header class="article-header">
        <div class="card__tag">${escape(meta.tag)}</div>
        <h1 class="article__title">${escape(meta.title)}</h1>
      </header>

      <div class="article-byline ${memberClass}">
        <div class="avatar-circle sm ${memberClass}"><img src="images/${author}.png" alt="${displayName}"></div>
        <span class="article-byline__name">${displayName}</span>
        <time class="article-byline__date" datetime="${meta.date}">${fmtDateDot(meta.date)}</time>
      </div>

      <div class="article-body">
        ${body}
      </div>

      <section class="screenshots">
        <div class="screenshots__grid">
          ${ss1}
        </div>
      </section>

      <div class="author-card ${memberClass}">
        <div class="avatar-circle lg ${memberClass}"><img src="images/${author}.png" alt="${displayName}"></div>
        <div class="author-card__info">
          <div class="author-card__handle">${displayName}</div>
          <p class="author-card__bio">${escape(bio)}</p>
          <a href="members.html" class="author-card__link">プロフィールを見る →</a>
        </div>
      </div>

      <nav class="article-nav" aria-label="記事ナビゲーション">
        ${prevNav}
        ${nextNav}
      </nav>

    </div>
  </main>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-logo">masaCH</div>
      <nav class="footer-links">
        <a href="index.html">トップ</a>
        <a href="articles.html">記事一覧</a>
        <a href="members.html">メンバー</a>
      </nav>
      <p class="footer-copy">&copy; 2025 masaCH. All rights reserved.</p>
    </div>
  </footer>

  <script src="js/main.js"></script>
</body>
</html>
`;
}

// ── カード HTML（index / articles 共通） ──────────────────────────────────

function buildCardHtml(meta, headingTag = 'h3', indent = '          ') {
  const author      = meta.author;
  const displayName = MEMBER_DISPLAY[author] || author;
  const memberClass = `member--${author}`;
  const cardImage   = cardImageBlock(meta);

  return `${indent}<article class="card ${memberClass}" data-member="${author}">
${indent}  <div class="card__image">
${indent}    ${cardImage}
${indent}  </div>
${indent}  <div class="card__body">
${indent}    <div class="card__tag">${escape(meta.tag)}</div>
${indent}    <${headingTag} class="card__title">${escape(meta.title)}</${headingTag}>
${indent}    <div class="card__meta">
${indent}      <img class="avatar-img sm" src="images/${author}.png" alt="${displayName}">
${indent}      <span class="card__author">${displayName}</span>
${indent}      <time class="card__date" datetime="${meta.date}">${fmtDateDot(meta.date)}</time>
${indent}    </div>
${indent}  </div>
${indent}  <a href="${meta.id}.html" class="card__link">続きを読む →</a>
${indent}</article>`;
}

// ── HTML 内のマーカー区間を置換 ───────────────────────────────────────────

function replaceMarkerSection(html, newContent) {
  const START = '<!-- ARTICLES_START -->';
  const END   = '<!-- ARTICLES_END -->';
  const si = html.indexOf(START);
  const ei = html.indexOf(END);
  if (si === -1 || ei === -1) throw new Error('マーカーが見つかりません (ARTICLES_START / ARTICLES_END)');
  return html.slice(0, si) + START + '\n' + newContent + '\n          ' + END + html.slice(ei + END.length);
}

// ── メイン処理 ────────────────────────────────────────────────────────────

function main() {
  // 1. articles-src/*.md を読み込む
  const mdFiles = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.md'))
    .sort(); // article-001.md, article-002.md, ...

  if (mdFiles.length === 0) {
    console.log('⚠  articles-src/ に .md ファイルが見つかりません。');
    return;
  }

  // 全記事パース（前後ナビ解決のため先に全部読む）
  const allArticles = mdFiles.map(file => {
    const raw  = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const html = mdToHtml(body);
    return { meta, html };
  });

  // 2. 各記事の HTML ファイルを生成
  for (const article of allArticles) {
    const { meta, html } = article;
    const outPath = path.join(OUT_DIR, `${meta.id}.html`);
    const fileContent = buildArticleHtml(meta, html, allArticles);
    fs.writeFileSync(outPath, fileContent, 'utf8');
    console.log(`✅ ${meta.id}.html を生成しました`);
  }

  // 3. 日付降順でソート（新しい記事が先）
  const sorted = [...allArticles].sort((a, b) =>
    b.meta.date.localeCompare(a.meta.date)
  );

  // 4. index.html — 最新3件を更新
  const indexCards = sorted.slice(0, 3)
    .map(a => buildCardHtml(a.meta, 'h3', '          '))
    .join('\n\n');

  let indexHtml = fs.readFileSync(INDEX_HTML, 'utf8');
  indexHtml = replaceMarkerSection(indexHtml, indexCards);
  fs.writeFileSync(INDEX_HTML, indexHtml, 'utf8');
  console.log('✅ index.html のカードを更新しました');

  // 5. articles.html — 全記事を更新
  const allCards = sorted
    .map(a => buildCardHtml(a.meta, 'h2', '        '))
    .join('\n\n');

  let articlesHtml = fs.readFileSync(ARTICLES_HTML, 'utf8');
  articlesHtml = replaceMarkerSection(articlesHtml, allCards);
  fs.writeFileSync(ARTICLES_HTML, articlesHtml, 'utf8');
  console.log('✅ articles.html のカードを更新しました');

  console.log('\n🎉 ビルド完了！');
}

main();
