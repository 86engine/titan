// src/data/updates.js
import wpData from './wp-data.json' with { type: 'json' };

const LIST_SLUGS = {
  en: 'updates',
  es: 'actualizaciones',
  ru: 'obnovleniya',
};

const UPDATES_BY_CONTENT_ID = new Map();
for (const update of wpData.posts) {
  const contentId = update.acf?.content_id;
  if (!contentId) continue;
  const group = UPDATES_BY_CONTENT_ID.get(contentId) || {};
  group[update.lang] = update;
  UPDATES_BY_CONTENT_ID.set(contentId, group);
}

export async function getUpdates(lang = 'en') {
  const items = wpData.posts.filter(p => p.lang === lang);
  return items.map(update => {
    const translations = {};
    const relatedUpdates = UPDATES_BY_CONTENT_ID.get(update.acf?.content_id) || {};

    for (const [l, listSlug] of Object.entries(LIST_SLUGS)) {
      const translatedUpdate = relatedUpdates[l];
      if (!translatedUpdate?.slug) continue;
      const prefix = l === 'en' ? '' : `/${l}`;
      translations[l] = {
        slug: translatedUpdate.slug,
        url: `${prefix}/${listSlug}/${translatedUpdate.slug}`,
      };
    }

    return {
      content_id: update.acf?.content_id,
      id: update.slug,
      category: update.category_list?.[0]?.name || '',
      author: update._embedded?.author?.[0]?.name || 'TITAN',
      title: update.title?.rendered || '',
      content: update.content?.rendered || '',
      summary: update.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
      image: update.featured_image?.url || '',
      date: update.modified,
      pageTitle: update.acf?.news_page_title || '',
      pageKeywords: update.acf?.news_page_keywords || '',
      pageDescription: update.acf?.news_page_des || '',
      pageH1: update.acf?.news_page_h1 || '',
      link: update.link,
      acf: update.acf,
      translations,
    };
  });
}

export async function getUpdateCategories(lang = 'en') {
  const page = wpData.updatesCategory[lang];
  if (!page) return {};

  return {
    pageTitle: page.acf?.newslist_page_title || page.title?.rendered || '',
    pageDescription: page.acf?.newslist_page_des || '',
    pageKeywords: page.acf?.newslist_page_keywords || '',
    translations: page.translations,
  };
}
