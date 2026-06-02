export const LANGS = ['en', 'es', 'ru'] as const;
export type Lang = (typeof LANGS)[number];

export const STATIC_PAGES: Record<string, Record<Lang, string>> = {
  home: { en: '/', es: '/es/', ru: '/ru/' },
  contact: { en: '/contact', es: '/es/contacto', ru: '/ru/kontakty' },
  downloads: { en: '/downloads', es: '/es/descargas', ru: '/ru/zagruzki' },
  'privacy-policy': { en: '/privacy-policy', es: '/es/politica-de-privacidad', ru: '/ru/politika-konfidencialnosti' },
};

export function isStaticPage(contentId: string): boolean {
  return contentId in STATIC_PAGES;
}