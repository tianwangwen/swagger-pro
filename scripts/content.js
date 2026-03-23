// Swagger Pro — 入口（重复注入防护、扩展消息）
(function() {
'use strict';

// 检查是否已经注入过
if (document.getElementById('swagger-pro-enhanced')) {
  return;
}

// 监听插件图标点击
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhanceSwagger') {
    enhanceSwaggerPage();
    sendResponse({ success: true });
  }
  return true;
});

})();
