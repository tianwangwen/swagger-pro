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
