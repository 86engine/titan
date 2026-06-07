import { defineConfig } from 'astro/config';
import purgecss from 'astro-purgecss';

export default defineConfig({
  site: 'https://titan-recycling.com',
  integrations: [
    purgecss(),
  ],
});