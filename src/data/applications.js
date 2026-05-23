// src/data/applications.js
import wpData from './wp-data.json' with { type: 'json' };

const LIST_SLUGS = {
  en: 'metal-recycling',
  es: 'reciclaje-de-metales',
  ru: 'pererabotka-metalla',
};

function buildBlocks(acf) {
  if (!acf) return [];
  const blocks = [];
  const suffixes = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
  for (const suffix of suffixes) {
    const titleKey = `application_${suffix}_title`;
    if (!acf[titleKey]) continue;
    const block = { title: acf[titleKey] };
    switch (suffix) {
      case 'one': case 'two': case 'three': case 'four': case 'five': case 'six': case 'seven': case 'eleven':
        block.type = 'standard';
        block.topText = acf[`application_${suffix}_des_top`] || '';
        block.middleText = acf[`application_${suffix}_des_middle`] || '';
        block.image = acf[`application_${suffix}_img`] || '';
        block.bottomText = acf[`application_${suffix}_des_bottom`] || '';
        break;
      case 'eight':
        block.type = 'video';
        block.topText = acf[`application_${suffix}_des_top`] || '';
        block.videoImg = acf['application_video_img'] || '';
        block.video = acf[`application_${suffix}_video`] || '';
        block.middleText = acf[`application_${suffix}_des_middle`] || '';
        block.bottomText = acf[`application_${suffix}_des_bottom`] || '';
        break;
      case 'nine':
        block.type = 'carousel';
        block.topText = acf[`application_${suffix}_des_top`] || '';
        block.images = acf[`application_${suffix}_img`] || [];
        block.bottomText = acf[`application_${suffix}_des_bottom`] || '';
        break;
      case 'ten':
        block.type = 'faq';
        block.faqs = acf[`application_${suffix}_faq`] || [];
        break;
    }
    blocks.push(block);
  }
  return blocks;
}

export async function getApplications(lang = 'en') {
  const items = wpData.applications.filter(a => a.lang === lang);
  return items.map(app => {
    const translations = {};
    for (const [l, trans] of Object.entries(app.translations || {})) {
      const prefix = l === 'en' ? '' : `/${l}`;
      const listSlug = LIST_SLUGS[l];
      translations[l] = {
        ...trans,
        url: trans.slug ? `${prefix}/${listSlug}/${trans.slug}` : '#',
      };
    }

    return {
      content_id: app.acf?.content_id,
      id: app.slug,
      pageTitle: app.acf?.application_page_title,
      pageKeywords: app.acf?.application_page_keywords,
      pageDescription: app.acf?.application_page_des,
      pageBackground: app.acf?.application_bg_img,
      pageH1: app.acf?.application_h1,
      applicationName: app.acf?.application_name,
      applicationListDescription: app.acf?.application_category_overview,
      applicationOverview: app.acf?.application_overview,
      applicationListImage: app.acf?.application_category_img,
      applicationImage: app.acf?.application_img,
      link: app.link,
      acf: app.acf,
      translations,
      blocks: buildBlocks(app.acf)
    };
  });
}