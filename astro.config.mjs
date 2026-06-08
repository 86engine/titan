import { defineConfig } from 'astro/config';
import purgecss from 'astro-purgecss';

export default defineConfig({
  site: 'https://titan-recycling.com',
  integrations: [
    purgecss({
      safelist: {
        standard: [
          /^swiper-pagination/,
          /^mfp-/,
          /^swiper-button/,
          /^swiper-scrollbar/,
          /^swiper-wrapper/,
          /^swiper-slide/,
          /^swiper/,
          /^rs-pagination/,
          /^rs-swiper/,
          /^popup/,
          /^modal/,
        ],
        deep: [
          /swiper/,
          /magnific/,
        ],
      },
    }),
  ],
});