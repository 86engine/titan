// scripts/generate-sitemaps.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wpData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'wp-data.json'), 'utf-8'));
const BASE = 'https://titan-recycling.com';

const LANGS = ['en', 'es', 'ru'];

// 各语言的页面 URL — 和改造后的 getPageURL 一致
const pages = {
  en: {
    static: [
      { url: '/', priority: '1.0' },
      { url: '/about', priority: '0.8' },
      { url: '/contact', priority: '0.7' },
      { url: '/downloads', priority: '0.6' },
      { url: '/privacy-policy', priority: '0.5' },
    ],
  },
  es: {
    static: [
      { url: '/es/', priority: '1.0' },
      { url: '/es/sobre-nosotros', priority: '0.8' },
      { url: '/es/contacto', priority: '0.7' },
      { url: '/es/descargas', priority: '0.6' },
      { url: '/es/politica-de-privacidad', priority: '0.5' },
    ],
  },
  ru: {
    static: [
      { url: '/ru/', priority: '1.0' },
      { url: '/ru/o-kompanii', priority: '0.8' },
      { url: '/ru/kontakty', priority: '0.7' },
      { url: '/ru/zagruzki', priority: '0.6' },
      { url: '/ru/politika-konfidencialnosti', priority: '0.5' },
    ],
  },
};

// 从 wp-data 中提取列表页的 translations[lang].link，转为本地路径
function getListUrls(dataKey, lang) {
  const urls = [];
  const seen = new Set();
  const category = wpData[dataKey];
  if (!category) return urls;

  for (const page of Object.values(category)) {
    const link = page.translations?.[lang]?.link;
    if (!link) continue;
    try {
      const pathname = new URL(link).pathname;
      if (!seen.has(pathname)) {
        seen.add(pathname);
        urls.push(pathname);
      }
    } catch {}
  }
  return urls;
}

// 从 wp-data 中提取详情页的 translations[lang].link
function getDetailUrls(dataKey, lang) {
  const urls = [];
  const seen = new Set();
  const items = wpData[dataKey];
  if (!items) return urls;

  for (const item of items) {
    if (item.lang !== lang) continue;
    const link = item.translations?.[lang]?.link || item.link;
    if (!link) continue;
    try {
      const pathname = new URL(link).pathname;
      if (!seen.has(pathname)) {
        seen.add(pathname);
        urls.push(pathname);
      }
    } catch {}
  }
  return urls;
}

// 收集各语言所有 URL
function collectURLs(lang) {
  const listUrls = [
    ...getListUrls('productCategories', lang),
    ...getListUrls('applicationCategories', lang),
    ...getListUrls('knowledgeParentCategory', lang),
  ];

  // 子知识分类
  if (wpData.knowledgeSubCategories) {
    for (const sub of Object.values(wpData.knowledgeSubCategories)) {
      const page = sub[lang];
      if (page?.translations?.[lang]?.link) {
        try {
          listUrls.push(new URL(page.translations[lang].link).pathname);
        } catch {}
      }
    }
  }

  // 新闻列表
  const updatesPage = wpData.updatesCategory?.[lang];
  if (updatesPage?.translations?.[lang]?.link) {
    try {
      listUrls.push(new URL(updatesPage.translations[lang].link).pathname);
    } catch {}
  }

  const detailUrls = [
    ...getDetailUrls('products', lang),
    ...getDetailUrls('applications', lang),
    ...getDetailUrls('knowledge', lang),
    ...getDetailUrls('posts', lang),
  ];

  return { listUrls, detailUrls };
}

// 生成单个语言 sitemap
function generateLangSitemap(lang) {
  const { listUrls, detailUrls } = collectURLs(lang);

  const allUrls = [
    ...pages[lang].static,
    ...listUrls.map(url => ({ url, priority: '0.8' })),
    ...detailUrls.map(url => ({ url, priority: '0.7' })),
  ];

  // 去重
  const seen = new Set();
  const unique = allUrls.filter(u => {
    if (seen.has(u.url)) return false;
    seen.add(u.url);
    return true;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique.map(p => `  <url>
    <loc>${BASE}${p.url}</loc>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

// 生成 sitemap index
function generateIndex() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE}/sitemap-en.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE}/sitemap-es.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE}/sitemap-ru.xml</loc>
  </sitemap>
</sitemapindex>`;
}

// 写入文件
const outDir = path.join(__dirname, '..', 'public');

fs.writeFileSync(path.join(outDir, 'sitemap.xml'), generateIndex());
console.log('✅ sitemap.xml (index)');

for (const lang of LANGS) {
  const { listUrls, detailUrls } = collectURLs(lang);
  fs.writeFileSync(path.join(outDir, `sitemap-${lang}.xml`), generateLangSitemap(lang));
  console.log(`✅ sitemap-${lang}.xml (${listUrls.length} lists + ${detailUrls.length} details)`);
}