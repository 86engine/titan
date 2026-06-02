// src/data/site.js
import wpData from './wp-data.json' with { type: 'json' };
import { LANGS, STATIC_PAGES, isStaticPage } from '../config/site';

const isDev = import.meta.env.DEV;
const WP_DOMAIN = 'https://wp.titan-recycling.com';
const LOCAL_DOMAIN = 'http://localhost:4321';

export function localizeURL(url) {
  if (!url) return url;
  if (url.startsWith(WP_DOMAIN)) {
    if (isDev) {
      return url.replace(WP_DOMAIN, LOCAL_DOMAIN);
    }
    // 生产构建时替换为实际域名
    return url.replace(WP_DOMAIN, 'https://titan-recycling.com');
  }
  return url;
}

const translationIndex = new Map();

function extractLink(translationsObj, lang) {
  const t = translationsObj?.[lang];
  if (!t) return null;
  return t.link || null;
}

function addToIndex(item) {
  const contentId = item.acf?.content_id;
  if (!contentId || !item.translations) return;

  if (!translationIndex.has(contentId)) {
    translationIndex.set(contentId, {});
  }
  const indexEntry = translationIndex.get(contentId);
  for (const lang of LANGS) {
    const link = extractLink(item.translations, lang);
    if (link) {
      indexEntry[lang] = { link: localizeURL(link) };
    }
  }
}

// 1-4. 数组类型
if (wpData.products) { for (const item of wpData.products) addToIndex(item); }
if (wpData.applications) { for (const item of wpData.applications) addToIndex(item); }
if (wpData.knowledge) { for (const item of wpData.knowledge) addToIndex(item); }
if (wpData.posts) { for (const item of wpData.posts) addToIndex(item); }

// 5-9. 对象类型
if (wpData.productCategories) { for (const page of Object.values(wpData.productCategories)) addToIndex(page); }
if (wpData.applicationCategories) { for (const page of Object.values(wpData.applicationCategories)) addToIndex(page); }
if (wpData.knowledgeParentCategory) { for (const page of Object.values(wpData.knowledgeParentCategory)) addToIndex(page); }
if (wpData.knowledgeSubCategories) {
  for (const sub of Object.values(wpData.knowledgeSubCategories)) {
    for (const page of Object.values(sub)) addToIndex(page);
  }
}
if (wpData.updatesCategory) { for (const page of Object.values(wpData.updatesCategory)) addToIndex(page); }
if (wpData.aboutPages) { for (const page of Object.values(wpData.aboutPages)) addToIndex(page); }

// ========== 子分类映射 ==========
const subCategoryNameMap = new Map();
const subCategoryKnowledgeMap = new Map();

function buildSubCategoryMaps() {
  if (!wpData.knowledgeTaxonomies || !wpData.knowledgeSubCategories) return;

  const slugToSubContentId = {};
  for (const pages of Object.values(wpData.knowledgeSubCategories)) {
    const enPage = pages.en;
    if (enPage?.acf?.content_id && enPage.slug) {
      slugToSubContentId[enPage.slug] = enPage.acf.content_id;
    }
  }

  const taxonomyIdToEnId = {};
  for (const term of wpData.knowledgeTaxonomies) {
    if (term.translations?.en) {
      taxonomyIdToEnId[term.id] = term.translations.en;
    } else {
      taxonomyIdToEnId[term.id] = term.id;
    }
  }

  const enTaxonomyIdToSlug = {};
  for (const term of wpData.knowledgeTaxonomies) {
    if (term.lang === 'en') {
      enTaxonomyIdToSlug[term.id] = term.slug;
    }
  }

  const taxonomyByNameMap = {};
  for (const term of wpData.knowledgeTaxonomies) {
    const enId = taxonomyIdToEnId[term.id] || term.id;
    const enSlug = enTaxonomyIdToSlug[enId];
    if (!enSlug) continue;
    const subContentId = slugToSubContentId[enSlug];
    if (!subContentId) continue;
    if (!taxonomyByNameMap[subContentId]) taxonomyByNameMap[subContentId] = {};
    taxonomyByNameMap[subContentId][term.lang] = term.name;
  }
  for (const [subContentId, names] of Object.entries(taxonomyByNameMap)) {
    subCategoryNameMap.set(subContentId, names);
  }

  const enKnowledge = wpData.knowledge.filter(k => k.lang === 'en');
  for (const item of enKnowledge) {
    const contentId = item.acf?.content_id;
    if (!contentId) continue;
    const taxonomyIds = item['metal-recycling-knowledge'];
    if (!taxonomyIds || !Array.isArray(taxonomyIds)) continue;
    for (const taxId of taxonomyIds) {
      const enId = taxonomyIdToEnId[taxId] || taxId;
      const enSlug = enTaxonomyIdToSlug[enId];
      if (!enSlug) continue;
      const subContentId = slugToSubContentId[enSlug];
      if (subContentId) {
        if (!subCategoryKnowledgeMap.has(subContentId)) {
          subCategoryKnowledgeMap.set(subContentId, []);
        }
        subCategoryKnowledgeMap.get(subContentId).push(contentId);
      }
    }
  }
}
buildSubCategoryMaps();

export function getKnowledgeIdsBySubCategory(subContentId) {
  return subCategoryKnowledgeMap.get(subContentId) || [];
}

export function getSubCategoryName(subContentId, lang) {
  const names = subCategoryNameMap.get(subContentId);
  if (!names) return subContentId.replace('knowledgeList-', '').replace(/\b\w/g, c => c.toUpperCase());
  return names[lang] || names.en || subContentId;
}

export function getSubKnowledgeList() {
  if (!wpData.knowledgeSubCategories) return [];
  const contentIds = new Set();
  for (const sub of Object.values(wpData.knowledgeSubCategories)) {
    for (const page of Object.values(sub)) {
      const contentId = page.acf?.content_id;
      if (contentId) contentIds.add(contentId);
    }
  }
  return [...contentIds].map(contentId => ({ contentId }));
}

// ========== 公共函数 ==========

export function getTranslationsByContentId(contentId) {
  return translationIndex.get(contentId) || null;
}

export function getPageURL(contentId, lang) {
  if (isStaticPage(contentId)) {
    return STATIC_PAGES[contentId][lang] || '/';
  }
  const translations = getTranslationsByContentId(contentId);
  if (translations?.[lang]?.link) {
    return translations[lang].link;
  }
  console.error(`getPageURL: content_id="${contentId}" not found`);
  return STATIC_PAGES.home[lang] || '/';
}

export function buildBreadcrumb(lang, items) {
  const homeLabel = { en: 'Home', es: 'Inicio', ru: 'Главная' };
  const homeUrl = STATIC_PAGES.home[lang];
  return [{ label: homeLabel[lang] || 'Home', href: homeUrl }, ...items];
}