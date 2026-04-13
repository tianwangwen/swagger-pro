// Background script for Swagger UI enhancement
chrome.action.onClicked.addListener((tab) => {
  // 向当前标签页发送消息，触发增强功能
  chrome.tabs.sendMessage(tab.id, { action: 'enhanceSwagger' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      // 如果content script还没有加载，尝试重新加载页面
      chrome.tabs.reload(tab.id);
    }
  });
});

// 测试接口：在扩展上下文中 fetch，避免页面与接口域不一致时的 CORS 限制
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'SWAGGER_PRO_FETCH' && msg.payload) {
    const { url, method, headers, body } = msg.payload;
    const m = (method || 'GET').toUpperCase();
    const init = {
      method: m,
      headers: headers && typeof headers === 'object' ? { ...headers } : {},
      redirect: 'follow'
    };
    const noBody = m === 'GET' || m === 'HEAD';
    if (!noBody && body !== undefined && body !== null) {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    fetch(url, init)
      .then(async (res) => {
        const text = await res.text();
        const responseHeaders = {};
        try {
          res.headers.forEach((v, k) => {
            responseHeaders[k] = v;
          });
        } catch {
          /* ignore */
        }
        sendResponse({
          ok: true,
          status: res.status,
          statusText: res.statusText,
          responseHeaders,
          body: text
        });
      })
      .catch((err) => {
        sendResponse({
          ok: false,
          error: err && err.message ? err.message : String(err)
        });
      });
    return true;
  }
  return false;
});
