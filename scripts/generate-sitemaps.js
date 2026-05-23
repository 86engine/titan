// scripts/generate-sitemaps.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wpData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'wp-data.json'), 'utf-8'));
const BASE = 'https://titan-recycling.com';

const LANGS = ['en', 'es', 'ru'];

// 各语言的页面 URL
const pages = {
  en: {
    static: [
      { url: '/', priority: '1.0' },
      { url: '/about', priority: '0.8' },
      { url: '/contact', priority: '0.7' },
      { url: '/downloads', priority: '0.6' },
      { url: '/privacy-policy', priority: '0.5' },
    ],
    lists: [
      { url: '/metal-recycling-equipment', priority: '0.9' },
      { url: '/metal-recycling', priority: '0.9' },
      { url: '/knowledge', priority: '0.8' },
      { url: '/knowledge/baling', priority: '0.7' },
      { url: '/knowledge/briquetting', priority: '0.7' },
      { url: '/knowledge/metal-shearing', priority: '0.7' },
      { url: '/knowledge/shredding', priority: '0.7' },
      { url: '/updates', priority: '0.8' },
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
    lists: [
      { url: '/es/equipos-reciclaje-metales', priority: '0.9' },
      { url: '/es/reciclaje-de-metales', priority: '0.9' },
      { url: '/es/conocimiento', priority: '0.8' },
      { url: '/es/conocimiento/embalaje', priority: '0.7' },
      { url: '/es/conocimiento/briqueteado', priority: '0.7' },
      { url: '/es/conocimiento/cizallado', priority: '0.7' },
      { url: '/es/conocimiento/trituracion', priority: '0.7' },
      { url: '/es/actualizaciones', priority: '0.8' },
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
    lists: [
      { url: '/ru/oborudovanie-dlya-pererabotki-metallov', priority: '0.9' },
      { url: '/ru/pererabotka-metalla', priority: '0.9' },
      { url: '/ru/znaniya', priority: '0.8' },
      { url: '/ru/znaniya/pressovanie-metalla', priority: '0.7' },
      { url: '/ru/znaniya/briketirovanie-metalla', priority: '0.7' },
      { url: '/ru/znaniya/rezka-metalla', priority: '0.7' },
      { url: '/ru/znaniya/droblenie-metalla', priority: '0.7' },
      { url: '/ru/obnovleniya', priority: '0.8' },
    ],
  },
};

// 从 wp-data 提取各语言详情页 URL
function getDetailUrls(items, buildUrl) {
  const urls = [];
  const seen = new Set();
  for (const item of items) {
    const cid = item.acf?.content_id;
    if (!cid || seen.has(cid)) continue;
    seen.add(cid);
    const url = buildUrl(item);
    if (url) urls.push(url);
  }
  return urls;
}

// 产品详情 en: /metal-recycling-equipment/{slug}
function productUrl(item, lang) {
  const t = item.translations?.[lang];
  if (!t?.slug) return null;
  const prefix = lang === 'en' ? '' : `/${lang}`;
  const listMap = { en: 'metal-recycling-equipment', es: 'equipos-reciclaje-metales', ru: 'oborudovanie-dlya-pererabotki-metallov' };
  return `${prefix}/${listMap[lang]}/${t.slug}`;
}

// 应用详情
function appUrl(item, lang) {
  const t = item.translations?.[lang];
  if (!t?.slug) return null;
  const prefix = lang === 'en' ? '' : `/${lang}`;
  const listMap = { en: 'metal-recycling', es: 'reciclaje-de-metales', ru: 'pererabotka-metalla' };
  return `${prefix}/${listMap[lang]}/${t.slug}`;
}

// 知识详情
const typeMap = {
  baling: { en: 'baling', es: 'embalaje', ru: 'pressovanie-metalla' },
  briquetting: { en: 'briquetting', es: 'briqueteado', ru: 'briketirovanie-metalla' },
  'metal-shearing': { en: 'metal-shearing', es: 'cizallado', ru: 'rezka-metalla' },
  shredding: { en: 'shredding', es: 'trituracion', ru: 'droblenie-metalla' },
};

function knowledgeUrl(item, lang) {
  const t = item.translations?.[lang];
  const kType = item.acf?.knowledge_type;
  if (!t?.slug || !kType) return null;
  const prefix = lang === 'en' ? '' : `/${lang}`;
  const listSlug = { en: 'knowledge', es: 'conocimiento', ru: 'znaniya' }[lang];
  const typeSlug = typeMap[kType]?.[lang];
  if (!typeSlug) return null;
  return `${prefix}/${listSlug}/${typeSlug}/${t.slug}`;
}

// 新闻详情
function updateUrl(item, lang) {
  const t = item.translations?.[lang];
  if (!t?.slug) return null;
  const prefix = lang === 'en' ? '' : `/${lang}`;
  const listMap = { en: 'updates', es: 'actualizaciones', ru: 'obnovleniya' };
  return `${prefix}/${listMap[lang]}/${t.slug}`;
}

// 各语言详情 URL
const detailUrls = {
  en: [
    ...getDetailUrls(wpData.products || [], (item) => productUrl(item, 'en')),
    ...getDetailUrls(wpData.applications || [], (item) => appUrl(item, 'en')),
    ...getDetailUrls(wpData.knowledge || [], (item) => knowledgeUrl(item, 'en')),
    ...getDetailUrls(wpData.posts || [], (item) => updateUrl(item, 'en')),
  ],
  es: [
    ...getDetailUrls(wpData.products || [], (item) => productUrl(item, 'es')),
    ...getDetailUrls(wpData.applications || [], (item) => appUrl(item, 'es')),
    ...getDetailUrls(wpData.knowledge || [], (item) => knowledgeUrl(item, 'es')),
    ...getDetailUrls(wpData.posts || [], (item) => updateUrl(item, 'es')),
  ],
  ru: [
    ...getDetailUrls(wpData.products || [], (item) => productUrl(item, 'ru')),
    ...getDetailUrls(wpData.applications || [], (item) => appUrl(item, 'ru')),
    ...getDetailUrls(wpData.knowledge || [], (item) => knowledgeUrl(item, 'ru')),
    ...getDetailUrls(wpData.posts || [], (item) => updateUrl(item, 'ru')),
  ],
};

// 生成单个语言 sitemap
function generateLangSitemap(lang) {
  const allUrls = [
    ...pages[lang].static,
    ...pages[lang].lists,
    ...detailUrls[lang].map(url => ({ url, priority: '0.8' })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(p => `  <url>
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
  fs.writeFileSync(path.join(outDir, `sitemap-${lang}.xml`), generateLangSitemap(lang));
  console.log(`✅ sitemap-${lang}.xml (${detailUrls[lang].length} detail pages)`);
}