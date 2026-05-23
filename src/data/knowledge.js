// src/data/knowledge.js
import wpData from './wp-data.json' with { type: 'json' };

const LIST_SLUGS = {
  en: 'knowledge',
  es: 'conocimiento',
  ru: 'znaniya',
};

const TYPE_SLUGS = {
  baling:          { en: 'baling', es: 'embalaje', ru: 'pressovanie-metalla' },
  briquetting:     { en: 'briquetting', es: 'briqueteado', ru: 'briketirovanie-metalla' },
  'metal-shearing': { en: 'metal-shearing', es: 'cizallado', ru: 'rezka-metalla' },
  shredding:       { en: 'shredding', es: 'trituracion', ru: 'droblenie-metalla' },
};

const KNOWLEDGE_BY_CONTENT_ID = new Map();
for (const knowledge of wpData.knowledge) {
  const contentId = knowledge.acf?.content_id;
  if (!contentId) continue;
  const group = KNOWLEDGE_BY_CONTENT_ID.get(contentId) || {};
  group[knowledge.lang] = knowledge;
  KNOWLEDGE_BY_CONTENT_ID.set(contentId, group);
}

function buildBlocks(acf) {
  if (!acf) return [];
  const blocks = [];
  const suffixes = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
  for (const suffix of suffixes) {
    const titleKey = `knowledge_${suffix}_title`;
    if (!acf[titleKey]) continue;
    const block = { title: acf[titleKey] };
    switch (suffix) {
      case 'one': case 'two': case 'three': case 'four': case 'five': case 'six': case 'seven': case 'eleven':
        block.type = 'standard';
        block.topText = acf[`knowledge_${suffix}_des_top`] || '';
        block.middleText = acf[`knowledge_${suffix}_des_middle`] || '';
        block.image = acf[`knowledge_${suffix}_img`] || '';
        block.bottomText = acf[`knowledge_${suffix}_des_bottom`] || '';
        break;
      case 'eight':
        block.type = 'video';
        block.topText = acf[`knowledge_${suffix}_des_top`] || '';
        block.videoImg = acf['knowledge_video_img'] || '';
        block.video = acf[`knowledge_${suffix}_video`] || '';
        block.middleText = acf[`knowledge_${suffix}_des_middle`] || '';
        block.bottomText = acf[`knowledge_${suffix}_des_bottom`] || '';
        break;
      case 'nine':
        block.type = 'carousel';
        block.topText = acf[`knowledge_${suffix}_des_top`] || '';
        block.images = acf[`knowledge_${suffix}_img`] || [];
        block.bottomText = acf[`knowledge_${suffix}_des_bottom`] || '';
        break;
      case 'ten':
        block.type = 'faq';
        block.faqs = acf[`knowledge_${suffix}_faq`] || [];
        break;
    }
    blocks.push(block);
  }
  return blocks;
}

export async function getKnowledge(lang = 'en') {
  const items = wpData.knowledge.filter(k => k.lang === lang);
  return items.map(knowledge => {
    const kType = knowledge.acf?.knowledge_type;
    const translations = {};
    const relatedKnowledge = KNOWLEDGE_BY_CONTENT_ID.get(knowledge.acf?.content_id) || {};

    for (const [l, listSlug] of Object.entries(LIST_SLUGS)) {
      const translatedKnowledge = relatedKnowledge[l];
      const translatedType = translatedKnowledge?.acf?.knowledge_type || kType;
      const typeSlug = TYPE_SLUGS[translatedType]?.[l];
      if (!translatedKnowledge?.slug || !typeSlug) continue;
      const prefix = l === 'en' ? '' : `/${l}`;
      translations[l] = {
        slug: translatedKnowledge.slug,
        url: `${prefix}/${listSlug}/${typeSlug}/${translatedKnowledge.slug}`,
      };
    }

    return {
      content_id: knowledge.acf?.content_id,
      id: knowledge.slug,
      knowledgeType: kType,
      pageTitle: knowledge.acf?.knowledge_page_title,
      pageKeywords: knowledge.acf?.knowledge_page_keywords,
      pageDescription: knowledge.acf?.knowledge_page_des,
      pageBackground: knowledge.acf?.knowledge_bg_img,
      pageH1: knowledge.acf?.knowledge_h1,
      knowledgeName: knowledge.acf?.knowledge_name,
      knowledgeListDescription: knowledge.acf?.knowledge_category_overview,
      knowledgeOverview: knowledge.acf?.knowledge_overview,
      knowledgeListImage: knowledge.acf?.knowledge_category_img,
      knowledgeImage: knowledge.acf?.knowledge_img,
      link: knowledge.link,
      acf: knowledge.acf,
      translations,
      blocks: buildBlocks(knowledge.acf)
    };
  });
}
