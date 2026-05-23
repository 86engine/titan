// src/data/knowledgeCategories.js
import wpData from './wp-data.json' with { type: 'json' };

export async function getKnowledgeCategory(lang = 'en', type) {
  const category = wpData.knowledgeSubCategories[type];
  if (!category) return {};
  const page = category[lang];
  if (!page) return {};

  const blocks = [];
  const suffixes = ['three', 'four', 'five', 'six'];

  for (const suffix of suffixes) {
    const titleKey = `knowledge_category_${suffix}_title`;
    const desKey = `knowledge_category_${suffix}_des`;
    const imgKey = `knowledge_category_${suffix}_img`;
    const bottomKey = `knowledge_category_${suffix}_des_bottom`;

    if (page.acf?.[titleKey] || page.acf?.[desKey] || page.acf?.[imgKey] || page.acf?.[bottomKey]) {
      blocks.push({
        title: page.acf[titleKey] || '',
        description: page.acf[desKey] || '',
        image: page.acf[imgKey] || '',
        bottomText: page.acf[bottomKey] || '',
      });
    }
  }

  return {
    pageTitle: page.acf?.knowledge_category_title,
    pageDescription: page.acf?.knowledge_category_des,
    pageKeywords: page.acf?.knowledge_category_keywords,
    pageH1: page.acf?.knowledge_category_title_h1,
    pageModuleOneTitle: page.acf?.knowledge_category_one_title,
    pageModuleOneDescription: page.acf?.knowledge_category_one_des,
    pageModuleTwoTitle: page.acf?.knowledge_category_two_title,
    pageModuleTwoDescription: page.acf?.knowledge_category_two_des,
    blocks,
    slug: page.slug,
    translations: page.translations,
  };
}