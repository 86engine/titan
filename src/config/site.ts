export const LANGS = ['en', 'es', 'ru'] as const;
export type Lang = (typeof LANGS)[number];

export const STATIC_PAGES: Record<string, Record<Lang, string>> = {
  home: { en: '/', es: '/es/', ru: '/ru/' },
  about: { en: '/about', es: '/es/sobre-nosotros', ru: '/ru/o-kompanii' },
  contact: { en: '/contact', es: '/es/contacto', ru: '/ru/kontakty' },
  downloads: { en: '/downloads', es: '/es/descargas', ru: '/ru/zagruzki' },
  privacy: { en: '/privacy-policy', es: '/es/politica-de-privacidad', ru: '/ru/politika-konfidencialnosti' },
  knowledge: { en: '/knowledge', es: '/es/conocimiento', ru: '/ru/znaniya' },
  updates: { en: '/updates', es: '/es/actualizaciones', ru: '/ru/obnovleniya' },
};