import { defineConfig } from 'astro/config';
import purgecss from 'astro-purgecss';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://titan-recycling.com',

  integrations: [
    purgecss(),
  ],

  adapter: cloudflare(),
});