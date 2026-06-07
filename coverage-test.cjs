const puppeteer = require('puppeteer-core');
const fs = require('fs');

// 辅助函数：替代废弃的 waitForTimeout
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 所有语言前缀
const langs = ['', '/es', '/ru'];

// 每种页面类型取一个代表 URL
const pageTypes = [
  { name: '首页', urls: langs.map(l => `${l}/`) },
  { name: '产品列表', urls: langs.map(l => `${l}/metal-recycling-equipment/`) },
  { name: '产品详情', urls: langs.map(l => `${l}/metal-recycling-equipment/scrap-metal-shear/`) },
  { name: '应用列表', urls: langs.map(l => `${l}/metal-recycling/`) },
  { name: '应用详情', urls: langs.map(l => `${l}/metal-recycling/copper-recycling/`) },
  { name: '知识列表', urls: langs.map(l => `${l}/knowledge/`) },
  { name: '知识详情', urls: langs.map(l => `${l}/knowledge/briquetting/`) },
  { name: '新闻列表', urls: langs.map(l => `${l}/updates/`) },
  { name: '新闻详情', urls: langs.map(l => `${l}/updates/titan-at-international-aluminum-event/`) },
  { name: '下载中心', urls: langs.map(l => `${l}/downloads`) },
  { name: '关于我们', urls: langs.map(l => `${l}/about/`) },
  { name: '联系我们', urls: langs.map(l => `${l}/contact`) },
  { name: '隐私政策', urls: langs.map(l => `${l}/privacy-policy`) },
];

const BASE_URL = 'http://localhost:4321';

async function interactWithPage(page) {
  // 1. 滚动到页面底部，触发懒加载和滚动动画
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });

  // 2. 滚动回顶部
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(500);

  // 3. 点击所有手风琴
  const accordionSelectors = [
    '.accordion-title', '.accordion-header', '.accordion-button',
    '[data-toggle="collapse"]', '.collapsed', '.toggle-title',
    '.faq-question', '.panel-title a', '.vc_tta-title-text',
    '.eael-accordion-header', '.elementor-accordion-title',
  ];
  for (const sel of accordionSelectors) {
    const elements = await page.$$(sel);
    for (const el of elements) {
      try { await el.click(); await wait(300); } catch (e) {}
    }
  }

  // 4. 点击视频相关按钮
  const videoSelectors = [
    '[data-video]', '.video-btn', '.play-btn', '.play-button',
    '.video-trigger', '.video-popup', '.popup-video',
    'a[href*="youtube"]', 'a[href*="vimeo"]', 'a[href*="video"]',
    '.open-video', '.trigger-video',
  ];
  for (const sel of videoSelectors) {
    const elements = await page.$$(sel);
    for (const el of elements) {
      try { await el.click(); await wait(800); } catch (e) {}
      try {
        await page.click('.mfp-close, .close, .modal-close, .popup-close, [data-dismiss="modal"]');
        await wait(300);
      } catch (e) {}
    }
  }

  // 5. 点击弹窗触发按钮
  const modalSelectors = [
    '[data-toggle="modal"]', '[data-target]', '.modal-trigger',
    '.popup-trigger', '.open-modal', '.open-popup',
    '.elementor-button-link', '.vc_general', '.popmake-',
  ];
  for (const sel of modalSelectors) {
    const elements = await page.$$(sel);
    for (const el of elements) {
      try { await el.click(); await wait(500); } catch (e) {}
      try {
        await page.click('.mfp-close, .close, .modal-close, .popup-close, [data-dismiss="modal"]');
        await wait(300);
      } catch (e) {}
    }
  }

  // 6. 触发搜索框
  const searchSelectors = ['input[type="search"]', 'input[name="s"]', '.search-field', '.search-input'];
  for (const sel of searchSelectors) {
    try {
      await page.type(sel, 'test');
      await wait(300);
      await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.value = ''; }, sel);
    } catch (e) {}
  }

  // 7. 点击分页
  const paginationSelectors = ['.pagination a', '.page-numbers a', '.pager a', '.nav-links a', '[aria-label*="Page"]'];
  for (const sel of paginationSelectors) {
    const elements = await page.$$(sel);
    if (elements.length > 0) {
      try { await elements[0].click(); await wait(800); } catch (e) {}
      break;
    }
  }

  // 8. 触发语言切换
  const langSelectors = ['select', '.lang-select', '.language-select', '.wpml-ls', '.lang-switcher'];
  for (const sel of langSelectors) {
    try {
      const options = await page.$$eval(`${sel} option`, opts => opts.map(o => o.value));
      if (options.length > 1) {
        await page.select(sel, options[1]);
        await wait(500);
      }
    } catch (e) {}
  }

  // 9. 鼠标悬浮导航菜单
  const navSelectors = ['nav a', '.menu-item', '.nav-item', '.navbar-nav li', '.main-menu li'];
  for (const sel of navSelectors) {
    const elements = await page.$$(sel);
    for (const el of elements.slice(0, 20)) {
      try { await el.hover(); await wait(200); } catch (e) {}
    }
  }

  // 10. 点击回到顶部
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(500);
  const backToTopSelectors = ['.back-to-top', '.scroll-top', '.scrollup', '.go-top', '#back-to-top', '[aria-label="Back to top"]'];
  for (const sel of backToTopSelectors) {
    try { await page.click(sel); await wait(500); } catch (e) {}
  }

  // 11. 回到顶部
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(1000);
}

async function run() {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const allResults = [];

  try {
    for (const pageType of pageTypes) {
      for (const url of pageType.urls) {
        const fullUrl = `${BASE_URL}${url}`;
        console.log(`正在分析: ${fullUrl} (${pageType.name})`);

        const page = await browser.newPage();

        await Promise.all([
          page.coverage.startJSCoverage(),
          page.coverage.startCSSCoverage(),
        ]);

        try {
          await page.goto(fullUrl, { waitUntil: 'networkidle0', timeout: 30000 });
          await wait(1000);
          await interactWithPage(page);
        } catch (e) {
          console.log(`  ⚠️ 页面访问失败: ${e.message}`);
        }

        const [jsCoverage, cssCoverage] = await Promise.all([
          page.coverage.stopJSCoverage(),
          page.coverage.stopCSSCoverage(),
        ]);

        allResults.push({
          url: fullUrl,
          type: pageType.name,
          js: jsCoverage.map(entry => ({
            url: entry.url,
            totalBytes: entry.text.length,
            usedBytes: entry.ranges.reduce((acc, range) => acc + range.end - range.start, 0),
          })),
          css: cssCoverage.map(entry => ({
            url: entry.url,
            totalBytes: entry.text.length,
            usedBytes: entry.ranges.reduce((acc, range) => acc + range.end - range.start, 0),
          })),
        });

        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  // 生成汇总报告
  console.log('\n========== 汇总报告 ==========\n');

  const jsSummary = {};
  for (const result of allResults) {
    for (const entry of result.js) {
      if (!jsSummary[entry.url]) {
        jsSummary[entry.url] = { totalBytes: 0, usedBytes: 0, pages: [] };
      }
      if (entry.totalBytes > jsSummary[entry.url].totalBytes) {
        jsSummary[entry.url].totalBytes = entry.totalBytes;
      }
      jsSummary[entry.url].usedBytes = Math.max(jsSummary[entry.url].usedBytes, entry.usedBytes);
      jsSummary[entry.url].pages.push(result.url);
    }
  }

  const sorted = Object.entries(jsSummary).sort((a, b) => {
    const ratioA = a[1].usedBytes / a[1].totalBytes;
    const ratioB = b[1].usedBytes / b[1].totalBytes;
    return ratioA - ratioB;
  });

  console.log('JS 文件使用率（低 → 高）:\n');
  for (const [url, data] of sorted) {
    const ratio = ((data.usedBytes / data.totalBytes) * 100).toFixed(1);
    const totalKB = (data.totalBytes / 1024).toFixed(1);
    const bar = '█'.repeat(Math.round(ratio / 5)) + '░'.repeat(20 - Math.round(ratio / 5));
    const flag = ratio < 20 ? ' 🔴 可砍' : ratio < 50 ? ' 🟡 需评估' : ' 🟢 保留';

    const shortName = url.replace(/.*\//, '').substring(0, 60);
    console.log(`[${bar}] ${ratio}% | ${totalKB}KB | ${shortName}${flag}`);
  }

  fs.writeFileSync('coverage-report.json', JSON.stringify(allResults, null, 2));
  console.log('\n📄 详细报告已保存到 coverage-report.json');
}

run().catch(console.error);