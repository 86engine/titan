// src/lib/wordpress.js

// 构建 content_id → 各语言 URL 的索引
export function buildContentIndex(allPosts) {
  const index = {};
  for (const post of allPosts) {
    const cid = post.content_id;
    if (!cid) continue;
    if (!index[cid]) index[cid] = {};
    for (const [lang, trans] of Object.entries(post.translations || {})) {
      if (trans.url) {
        index[cid][lang] = trans.url;
      }
    }
  }
  return index;
}