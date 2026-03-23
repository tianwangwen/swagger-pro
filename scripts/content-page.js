'use strict';

// 替换 document、组装页面壳并触发渲染

function replacePageContent(allApis, baseUrl) {
  // 创建标记
  const marker = document.createElement('div');
  marker.id = 'swagger-pro-enhanced';
  
  // 清空body并添加标记
  document.body.innerHTML = '';
  document.body.appendChild(marker);
  
  // 清空head，只保留必要的meta
  document.head.innerHTML = '';
  
  // 添加meta标签
  const charset = document.createElement('meta');
  charset.setAttribute('charset', 'UTF-8');
  document.head.appendChild(charset);
  
  const viewport = document.createElement('meta');
  viewport.setAttribute('name', 'viewport');
  viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
  document.head.appendChild(viewport);
  
  // 设置标题
  const apiInfo = allApis[0]?.data?.info || {};
  document.title = `${apiInfo.title || 'Swagger API'} - Swagger Pro`;
  
  // 注入样式
  injectStyles();
  
  // 创建页面结构
  createPageStructure(apiInfo, baseUrl);
  
  // 执行渲染
  setTimeout(() => {
    // 在这里只启动渲染，不隐藏 loading，
    // 等右侧内容真正渲染完成后再在 renderContent 中调用 hideLoading，
    // 避免 content-area 长时间空白。
    executeRender(allApis, baseUrl);
  }, 50);
}
function createPageStructure(apiInfo, baseUrl) {
  // 创建header
  const header = document.createElement('header');
  header.className = 'global-header';
  header.innerHTML = getHeaderHTMLContent(apiInfo, baseUrl);
  document.body.appendChild(header);
  
  // 创建主容器
  const mainContainer = document.createElement('div');
  mainContainer.className = 'main-container';
  mainContainer.innerHTML = getMainContainerHTMLContent();
  document.body.appendChild(mainContainer);
}
