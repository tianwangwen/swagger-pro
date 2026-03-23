'use strict';

// 分享链接生成与 hash 定位

function generateShareUrl(tag, operationId, apiGroupName) {
  if (!tag || !operationId) {
    return window.location.href;
  }
  
  const currentUrl = new URL(window.location.href);
  const pathname = currentUrl.pathname || '';
  const encodedTag = encodeURIComponent(tag);
  
  // 判断当前是否为第三方封装的 doc.html（如 Knife4j 等）
  // 约定：如果当前路径包含 doc.html，则使用三层结构：#/apiGroupName/tagName/methodName
  // 否则使用两层结构：#/tagName/methodName（不带 apiGroupName）
  const isDocHtml = pathname.endsWith('/doc.html') || pathname.endsWith('doc.html');
  
  let shareUrl;
  if (isDocHtml && apiGroupName) {
    const encodedApiGroupName = encodeURIComponent(apiGroupName);
    shareUrl = `${currentUrl.origin}${pathname}#/${encodedApiGroupName}/${encodedTag}/${operationId}`;
  } else {
    // 兼容原生 swagger-ui（如 swagger-ui.html）：只拼两层
    shareUrl = `${currentUrl.origin}${pathname}#/${encodedTag}/${operationId}`;
  }
  
  return shareUrl;
}
function handleShareUrl(allEndpoints) {
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) {
    return; // 没有hash或hash为空
  }

  const currentUrl = new URL(window.location.href);
  const pathname = currentUrl.pathname || '';
  const isDocHtml = pathname.endsWith('/doc.html') || pathname.endsWith('doc.html');

  // 去掉开头的 #，按 / 拆分
  const hashStr = hash.startsWith('#') ? hash.slice(1) : hash;
  const segments = hashStr.split('/').filter(Boolean);

  if (segments.length === 0) return;

  let apiGroupName;
  let tag;
  let operationId;
  let endpoint;

  if (isDocHtml) {
    // 第三方框架 (doc.html)，我们生成的是三段：
    // #/apiGroupName/tagName/operationId
    // 但有些框架会在初始化时把最后一段裁掉，变成：
    // #/apiGroupName/tagName
    if (segments.length >= 3) {
      apiGroupName = decodeURIComponent(segments[0]);
      tag = decodeURIComponent(segments[1]);
      operationId = decodeURIComponent(segments.slice(2).join('/'));

      endpoint = allEndpoints.find(ep =>
        ep.apiGroup === apiGroupName &&
        ep.tag === tag &&
        ep.operationId === operationId
      );
    } else if (segments.length === 2) {
      // 只有 apiGroupName 和 tagName，operationId 已经丢失
      // 这种场景下尽量退化为 “定位到该分组下的第一个接口”
      apiGroupName = decodeURIComponent(segments[0]);
      tag = decodeURIComponent(segments[1]);

      endpoint = allEndpoints.find(ep =>
        ep.apiGroup === apiGroupName &&
        ep.tag === tag
      );
    } else {
      return;
    }
  } else {
    // 原生 swagger-ui.html 等，使用两段：
    // #/tagName/operationId
    if (segments.length < 2) {
      return;
    }

    tag = decodeURIComponent(segments[0]);
    // 其余部分都认为是 operationId，避免意外的额外斜杠导致匹配失败
    operationId = decodeURIComponent(segments.slice(1).join('/'));

    endpoint = allEndpoints.find(ep =>
      ep.tag === tag && ep.operationId === operationId
    );
  }

  if (endpoint) {
    // 为了兼容大文档 + 分批渲染的情况，这里增加重试机制：
    // 等待对应卡片真正渲染到 DOM 后再滚动，最多重试一段时间。
    const regex = new RegExp('[.*+?^$()|[\\]\\\\]', 'g');
    const safePathId = endpoint.path.replace(regex, '-');
    const cardId = `api-${safePathId}-${endpoint.method}`;
    
    let attempts = 0;
    const maxAttempts = 50;     // 最多重试 50 次
    const interval = 200;       // 每次间隔 200ms，最多约 10 秒
    
    function tryScrollToEndpoint() {
      attempts++;
      const card = document.getElementById(cardId);
      
      if (card && window.scrollToEndpoint) {
        window.scrollToEndpoint(endpoint.path, endpoint.method, endpoint.tag);
      } else if (attempts < maxAttempts) {
        setTimeout(tryScrollToEndpoint, interval);
      }
    }
    
    // 先等页面初始渲染一小段时间，再开始轮询
    setTimeout(tryScrollToEndpoint, 100);
  }
}
