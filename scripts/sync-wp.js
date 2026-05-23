// scripts/sync-wp.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://wp.titan-recycling.com/wp-json/wp/v2';
const LANGS = ['en', 'es', 'ru'];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${url} (${res.status})`);
  const data = await res.json();
  return data.list || data;
}

async function fetchPage(id, lang) {
  const url = `${BASE}/pages/${id}?lang=${lang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${url} (${res.status})`);
  return res.json();
}

async function main() {
  console.log('🔄 开始同步 WordPress 数据...');
  const wpData = {
    products: [],
    applications: [],
    knowledge: [],
    posts: [],
    productCategories: {},
    applicationCategories: {},
    knowledgeParentCategory: {},
    knowledgeSubCategories: {},
    updatesCategory: {},
    aboutPages: {},
  };

  // 1. 产品/应用/知识/新闻详情
  for (const lang of LANGS) {
    console.log(`  获取 ${lang} 数据...`);
    for (const type of ['product', 'application', 'knowledge', 'posts']) {
      const items = await fetchJSON(`${BASE}/${type}?lang=${lang}&per_page=100`);
      if (type === 'product') wpData.products.push(...items);
      else if (type === 'application') wpData.applications.push(...items);
      else if (type === 'knowledge') wpData.knowledge.push(...items);
      else if (type === 'posts') wpData.posts.push(...items);
    }
  }

  // 2. 产品分类页
  const productCatIds = { en: 1230, es: 1879, ru: 1881 };
  for (const [lang, id] of Object.entries(productCatIds)) {
    wpData.productCategories[lang] = await fetchPage(id, lang);
  }

  // 3. 应用分类页
  const appCatIds = { en: 1247, es: 2004, ru: 2006 };
  for (const [lang, id] of Object.entries(appCatIds)) {
    wpData.applicationCategories[lang] = await fetchPage(id, lang);
  }

  // 4. 知识父列表
  const knowledgeParentIds = { en: 3003, es: 3005, ru: 3007 };
  for (const [lang, id] of Object.entries(knowledgeParentIds)) {
    wpData.knowledgeParentCategory[lang] = await fetchPage(id, lang);
  }

  // 5. 知识子列表
  const subTypes = {
    'metal-shearing': { en: 1672, es: 3165, ru: 3168 },
    baling: { en: 1670, es: 2132, ru: 2134 },
    briquetting: { en: 1668, es: 2116, ru: 2118 },
    shredding: { en: 1674, es: 2139, ru: 2141 },
  };
  for (const [type, ids] of Object.entries(subTypes)) {
    wpData.knowledgeSubCategories[type] = {};
    for (const [lang, id] of Object.entries(ids)) {
      wpData.knowledgeSubCategories[type][lang] = await fetchPage(id, lang);
    }
  }

  // 6. 新闻列表
  const updatesIds = { en: 3141, es: 3143, ru: 3145 };
  for (const [lang, id] of Object.entries(updatesIds)) {
    wpData.updatesCategory[lang] = await fetchPage(id, lang);
  }

  // 7. 关于页
  const aboutIds = { en: 1787, es: 1840, ru: 1843 };
  for (const [lang, id] of Object.entries(aboutIds)) {
    wpData.aboutPages[lang] = await fetchPage(id, lang);
  }

  // 写入文件
  const outPath = path.join(__dirname, '..', 'src', 'data', 'wp-data.json');
  fs.writeFileSync(outPath, JSON.stringify(wpData, null, 2));
  console.log(`✅ 同步完成 → src/data/wp-data.json`);
}

main().catch(err => {
  console.error('❌ 同步失败:', err);
  process.exit(1);
});