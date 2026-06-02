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
    knowledgeTaxonomies: [],
  };

  const typeMap = {
    products: 'product',
    applications: 'application',
    knowledge: 'knowledge',
    posts: 'posts',
  };

  // 1. 产品/应用/知识/新闻详情
  for (const lang of LANGS) {
    console.log(`  获取 ${lang} 数据...`);
    for (const [key, wpType] of Object.entries(typeMap)) {
      try {
        const items = await fetchJSON(`${BASE}/${wpType}?lang=${lang}&per_page=100`);
        wpData[key].push(...items);
        console.log(`    ${wpType}: ${items.length} 条`);
      } catch (err) {
        console.warn(`    ⚠️ 跳过 ${wpType}: ${err.message}`);
      }
    }
  }

  // 2. 产品分类页
  const productCatIds = { en: 1230, es: 1879, ru: 1881 };
  for (const [lang, id] of Object.entries(productCatIds)) {
    console.log(`  获取产品分类页 ${lang}...`);
    wpData.productCategories[lang] = await fetchPage(id, lang);
  }

  // 3. 应用分类页
  const appCatIds = { en: 1247, es: 2004, ru: 2006 };
  for (const [lang, id] of Object.entries(appCatIds)) {
    console.log(`  获取应用分类页 ${lang}...`);
    wpData.applicationCategories[lang] = await fetchPage(id, lang);
  }

  // 4. 知识父列表
  const knowledgeParentIds = { en: 3003, es: 3005, ru: 3007 };
  for (const [lang, id] of Object.entries(knowledgeParentIds)) {
    console.log(`  获取知识列表页 ${lang}...`);
    wpData.knowledgeParentCategory[lang] = await fetchPage(id, lang);
  }

  // 5. 知识子分类
  const subTypes = ['briquetting', 'baling', 'metal-shearing', 'shredding'];
  const subIds = {
      briquetting: { en: 1668, es: 2116, ru: 2118 },
      baling: { en: 1670, es: 2132, ru: 2134 },
      'metal-shearing': { en: 1672, es: 3165, ru: 3168 },
      shredding: { en: 1674, es: 2139, ru: 2141 },
  };
  for (const type of subTypes) {
    wpData.knowledgeSubCategories[type] = {};
    for (const [lang, id] of Object.entries(subIds[type])) {
      console.log(`  获取知识子分类 ${type} ${lang}...`);
      wpData.knowledgeSubCategories[type][lang] = await fetchPage(id, lang);
    }
  }

  // 6. 新闻列表
  const updatesIds = { en: 3141, es: 3143, ru: 3145 };
  for (const [lang, id] of Object.entries(updatesIds)) {
    console.log(`  获取新闻列表页 ${lang}...`);
    wpData.updatesCategory[lang] = await fetchPage(id, lang);
  }

  // 7. 关于页
  const aboutIds = { en: 1787, es: 1840, ru: 1843 };
  for (const [lang, id] of Object.entries(aboutIds)) {
    console.log(`  获取关于页 ${lang}...`);
    wpData.aboutPages[lang] = await fetchPage(id, lang);
  }

  // 8. 知识分类 taxonomy
  console.log('  获取知识分类 taxonomy...');
  for (const lang of LANGS) {
    try {
      const items = await fetchJSON(`${BASE}/metal-recycling-knowledge?lang=${lang}&per_page=50`);
      wpData.knowledgeTaxonomies.push(...items);
      console.log(`    metal-recycling-knowledge ${lang}: ${items.length} 条`);
    } catch (err) {
      console.warn(`    ⚠️ 跳过 metal-recycling-knowledge ${lang}: ${err.message}`);
    }
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