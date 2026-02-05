// Beautify Swagger UI 插件
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

  // 增强Swagger页面
  async function enhanceSwaggerPage() {
    try {
      // 获取当前页面的基础URL
      const currentUrl = new URL(window.location.href);
      const baseUrl = currentUrl.origin + currentUrl.pathname.replace(/\/[^/]*$/, '');
      
      // 显示加载提示
      showLoading();

      // 1. 获取swagger-resources
      const resourcesResponse = await fetch(`${baseUrl}/swagger-resources`);
      if (!resourcesResponse.ok) {
        throw new Error('无法获取 Swagger 资源');
      }
      const resources = await resourcesResponse.json();

      if (!resources || resources.length === 0) {
        throw new Error('未找到 Swagger 资源');
      }

      // 2. 获取所有group的API文档
      const allApis = [];
      for (const resource of resources) {
        try {
          const apiUrl = resource.url.startsWith('http') 
            ? resource.url 
            : `${baseUrl}${resource.url}`;
          const apiResponse = await fetch(apiUrl);
          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            allApis.push({
              name: resource.name,
              data: apiData
            });
          }
        } catch (error) {
          console.error(`获取 ${resource.name} 的API文档失败:`, error);
        }
      }

      if (allApis.length === 0) {
        throw new Error('无法获取任何API文档');
      }

      // 3. 替换页面内容
      replacePageContent(allApis, baseUrl);

    } catch (error) {
      console.error('增强Swagger页面失败:', error);
      alert('处理失败: ' + error.message);
      hideLoading();
    }
  }

  // 显示加载提示
  function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'swagger-loader';
    loader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      color: #f8fafc;
      font-size: 18px;
    `;
    loader.textContent = '正在加载 Swagger 文档...';
    document.body.appendChild(loader);
  }

  // 隐藏加载提示
  function hideLoading() {
    const loader = document.getElementById('swagger-loader');
    if (loader) loader.remove();
  }

  // 替换页面内容
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
    document.title = `${apiInfo.title || 'Swagger API'} - BSUI`;
    
    // 注入样式
    injectStyles();
    
    // 创建页面结构
    createPageStructure(apiInfo, baseUrl);
    
    // 执行渲染
    setTimeout(() => {
      executeRender(allApis, baseUrl);
      hideLoading();
    }, 50);
  }

  // 注入样式
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = getStylesContent();
    document.head.appendChild(style);
  }
  
  // 创建页面结构
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

  // HTML转义
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 获取样式内容（作为字符串）
  function getStylesContent() {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --bg-tertiary: #334155;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent-blue: #3b82f6;
            --accent-green: #10b981;
            --accent-orange: #f59e0b;
            --accent-red: #ef4444;
            --accent-purple: #8b5cf6;
            --border-color: #334155;
            --hover-bg: #2563eb;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            overflow-x: hidden;
        }
        .global-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 70px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            padding: 0 24px;
            z-index: 1000;
            gap: 20px;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 200px;
        }
        .logo {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .brand-text h1 {
            font-size: 18px;
            font-weight: 700;
            background: linear-gradient(to right, var(--text-primary), var(--accent-blue));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .brand-text span {
            font-size: 12px;
            color: var(--text-secondary);
        }
        .search-container {
            flex: 1;
            max-width: 600px;
            position: relative;
        }
        .search-box {
            width: 100%;
            height: 44px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 0 20px 0 45px;
            color: var(--text-primary);
            font-size: 15px;
            transition: all 0.3s ease;
        }
        .search-box:focus {
            outline: none;
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            background: var(--bg-tertiary);
        }
        .search-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
        }
        .search-results {
            position: absolute;
            top: 55px;
            left: 0;
            right: 0;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
            box-shadow: var(--shadow-lg);
            z-index: 1001;
        }
        .search-results.active {
            display: block;
            animation: slideDown 0.2s ease;
        }
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .result-item {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
            cursor: pointer;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .result-item:hover {
            background: var(--bg-tertiary);
        }
        .result-method {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .method-get { background: rgba(59, 130, 246, 0.2); color: var(--accent-blue); }
        .method-post { background: rgba(16, 185, 129, 0.2); color: var(--accent-green); }
        .method-put { background: rgba(245, 158, 11, 0.2); color: var(--accent-orange); }
        .method-delete { background: rgba(239, 68, 68, 0.2); color: var(--accent-red); }
        .method-patch { background: rgba(139, 92, 246, 0.2); color: var(--accent-purple); }
        .result-path {
            display: inline-block;
            width: 320px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
            color: var(--text-primary);
        }
        .result-desc {
            font-size: 12px;
            color: var(--text-secondary);
            margin-left: auto;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .main-container {
            display: flex;
            min-height: 100vh;
            padding-top: 70px;
        }
        .sidebar {
            width: 300px;
            background: var(--bg-secondary);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            transition: width 0.3s ease;
            height: calc(100vh - 70px);
            overflow-y: auto;
        }
        .sidebar.collapsed {
            width: 60px;
        }
        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .sidebar-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-secondary);
            font-weight: 600;
        }
        .collapse-btn {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s;
        }
        .collapse-btn:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
        .nav-tree {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
        }
        .controller-group {
            margin-bottom: 8px;
        }
        .controller-header {
            padding: 10px 12px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.2s;
            user-select: none;
        }
        .controller-header:hover {
            background: var(--bg-tertiary);
        }
        .controller-header.active {
            background: rgba(59, 130, 246, 0.15);
        }
        .controller-icon {
            width: 8px;
            height: 8px;
            border-right: 2px solid var(--text-secondary);
            border-bottom: 2px solid var(--text-secondary);
            transform: rotate(-45deg);
            transition: transform 0.2s;
        }
        .controller-group.expanded .controller-icon {
            transform: rotate(45deg);
        }
        .controller-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex: 1;
        }
        .controller-name-main {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
        }
        .controller-name-desc {
            font-size: 11px;
            font-weight: 400;
            color: var(--text-secondary);
            line-height: 1.3;
        }
        .controller-count {
            margin-left: auto;
            background: var(--bg-tertiary);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            color: var(--text-secondary);
        }
        .endpoints-list {
            margin-left: 20px;
            border-left: 2px solid var(--border-color);
            max-height: 0;
            overflow: hidden;
        }
        .controller-group.expanded .endpoints-list {
            max-height: none;
        }
        .endpoint-item {
            padding: 8px 12px;
            margin: 4px 0 4px 12px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            transition: all 0.2s;
            position: relative;
        }
        .endpoint-item::before {
            content: '';
            position: absolute;
            left: -14px;
            top: 50%;
            width: 8px;
            height: 2px;
            background: var(--border-color);
        }
        .endpoint-item:hover {
            background: var(--bg-tertiary);
        }
        .endpoint-item.active {
            background: rgba(59, 130, 246, 0.2);
        }
        .endpoint-item.favorited {
            border-left: 3px solid var(--accent-orange);
            padding-left: 9px;
        }
        .endpoint-item-favorite-icon {
            font-size: 12px;
            color: var(--accent-orange);
            margin-right: 4px;
            flex-shrink: 0;
        }
        .endpoint-method {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .endpoint-path {
            color: var(--text-secondary);
            font-family: monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .content-area {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            background: var(--bg-primary);
            height: calc(100vh - 70px);
            overflow-y: auto;
        }
        .content-header {
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid var(--border-color);
        }
        .api-title {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 8px;
            background: linear-gradient(to right, #fff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .api-desc {
            color: var(--text-secondary);
            font-size: 16px;
            line-height: 1.6;
        }
        .api-meta {
            display: flex;
            gap: 20px;
            margin-top: 16px;
            flex-wrap: wrap;
        }
        .meta-tag {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: var(--bg-secondary);
            border-radius: 20px;
            font-size: 13px;
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
        }
        .api-section {
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .section-title::before {
            content: '';
            width: 4px;
            height: 24px;
            background: var(--accent-blue);
            border-radius: 2px;
        }
        .api-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            margin-bottom: 16px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        .api-card:hover {
            box-shadow: 0 0 0 1px #476391;
        }
        .api-card-header {
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            cursor: pointer;
            background: linear-gradient(to right, rgba(59, 130, 246, 0.05), transparent);
        }
        .http-method {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            min-width: 70px;
            text-align: center;
        }
        .method-get { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
        .method-post { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .method-put { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .method-delete { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .method-patch { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
        .api-path {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 16px;
            color: var(--text-primary);
            font-weight: 600;
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .copy-path-btn {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s;
            opacity: 0.6;
            color: var(--text-secondary);
            font-size: 14px;
            flex-shrink: 0;
        }
        .copy-path-btn:hover {
            opacity: 1;
            background: var(--bg-tertiary);
            color: var(--accent-blue);
        }
        .copy-path-btn.copied {
            color: var(--accent-green);
            opacity: 1;
        }
        .api-summary {
            color: var(--text-secondary);
            font-size: 14px;
            margin-right: 20px;
        }
        .favorite-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s;
            opacity: 0;
            color: var(--text-secondary);
            font-size: 14px;
            flex-shrink: 0;
        }
        .api-card-header:hover .favorite-icon {
            opacity: 1;
        }
        .favorite-icon:hover {
            color: var(--accent-orange);
            background: var(--bg-tertiary);
        }
        .favorite-icon.favorited {
            opacity: 1;
            color: var(--accent-orange);
        }
        .api-card.favorited {
            border-left: 3px solid var(--accent-orange);
        }
        .expand-icon {
            color: var(--text-secondary);
            transition: transform 0.3s;
        }
        .api-card.expanded .expand-icon {
            transform: rotate(180deg);
        }
        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .favorites-container {
            position: relative;
        }
        .favorites-btn {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
            font-size: 18px;
        }
        .favorites-btn:hover {
            background: var(--bg-tertiary);
            color: var(--accent-orange);
            border-color: var(--accent-orange);
        }
        .favorites-dropdown {
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            width: 800px;
            max-height: 1000px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            display: none;
            overflow-y: auto;
            z-index: 1001;
        }
        .favorites-dropdown.active {
            display: block;
            animation: slideDownCenter 0.2s ease;
        }
        @keyframes slideDownCenter {
            from { 
                opacity: 0; 
                transform: translateX(-50%) translateY(-10px); 
            }
            to { 
                opacity: 1; 
                transform: translateX(-50%) translateY(0); 
            }
        }
        .favorites-dropdown.empty {
            padding: 40px 20px;
            text-align: center;
        }
        .favorite-empty-text {
            color: var(--text-secondary);
            font-size: 14px;
        }
        .favorite-item {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
            cursor: pointer;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .favorite-item:hover {
            background: var(--bg-tertiary);
        }
        .favorite-item-method {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .favorite-item-path {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
            color: var(--text-primary);
            flex: 1;
        }
        .favorite-item-desc {
            font-size: 12px;
            color: var(--text-secondary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 150px;
        }
        .favorite-item-remove {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
            opacity: 0;
        }
        .favorite-item:hover .favorite-item-remove {
            opacity: 1;
        }
        .favorite-item-remove:hover {
            background: var(--accent-red);
            color: white;
        }
        .api-details {
            max-height: 0;
            overflow: hidden;
            border-top: 1px solid var(--border-color);
        }
        .api-card.expanded .api-details {
            max-height: none;
        }
        .details-content {
            padding: 24px;
        }
        .detail-section {
            margin-bottom: 28px;
        }
        .detail-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-secondary);
            margin-bottom: 12px;
            font-weight: 600;
        }
        .params-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        .params-table th {
            text-align: left;
            padding: 12px;
            color: var(--text-secondary);
            font-weight: 600;
            border-bottom: 1px solid var(--border-color);
            font-size: 12px;
            text-transform: uppercase;
        }
        .params-table td {
            padding: 16px 12px;
            border-bottom: 1px solid var(--border-color);
            line-height: 18px;
        }
        .param-name {
            font-family: monospace;
            color: var(--accent-blue);
            font-weight: 600;
        }
        .param-type {
            color: var(--accent-orange);
            font-size: 12px;
            background: rgba(245, 158, 11, 0.1);
            padding: 2px 8px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 4px;
        }
        .param-required {
            color: var(--accent-red);
            font-size: 11px;
            margin-left: 8px;
        }
        .param-desc {
            color: var(--text-secondary);
            line-height: 16px;
            position: relative;
            gap: 8px;
            vertical-align: top;
            margin: 0;
            padding: 0;
        }
        .param-desc-text {
            flex: 1;
            min-width: 0;
            line-height: 16px;
        }
        .enum-copy-btn {
            display: inline-block;
            width: 20px;
            height: 18px;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s;
            opacity: 0.6;
            color: var(--text-secondary);
            font-size: 12px;
            flex-shrink: 0;
            background: var(--bg-tertiary);
            border: 1px solid var(--border-color);
            text-align: center;
        }
        .enum-copy-btn:hover {
            opacity: 1;
            background: var(--bg-primary);
            color: var(--accent-blue);
            border-color: var(--accent-blue);
        }
        .enum-copy-btn.copied {
            color: var(--accent-green);
            opacity: 1;
        }
        .code-block {
            background: #0d1117;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #30363d;
        }
        .code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #161b22;
            border-bottom: 1px solid #30363d;
        }
        .code-tabs {
            display: flex;
            gap: 4px;
        }
        .code-tab {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            color: var(--text-secondary);
            transition: all 0.2s;
            background: transparent;
            border: none;
        }
        .code-tab:hover {
            background: rgba(59, 130, 246, 0.1);
            color: var(--text-primary);
        }
        .code-tab.active {
            background: var(--accent-blue);
            color: white;
        }
        .code-content-wrapper {
            position: relative;
        }
        .code-content {
            padding: 20px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
            line-height: 1;
            overflow-x: auto;
            color: #e6edf3;
            display: none;
        }
        .code-content.active {
            display: block;
        }
        .code-content pre {
            margin: 0;
            padding: 0;
            font-family: inherit;
            font-size: inherit;
            line-height: 1.6;
            color: inherit;
            white-space: pre-wrap;
            word-wrap: break-word;
            display: block;
        }
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: var(--bg-primary);
        }
        ::-webkit-scrollbar-thumb {
            background: var(--bg-tertiary);
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }
    `;
  }

  // 获取Header HTML内容
  function getHeaderHTMLContent(apiInfo, baseUrl) {
    const logoUrl = chrome.runtime.getURL('images/logo.png');
    return `
        <div class="logo-section">
            <div class="logo"><img src="${logoUrl}" alt="BSUI Logo"></div>
            <div class="brand-text">
                <h1>BSUI</h1>
                <span>API Documentation</span>
            </div>
        </div>
        <div class="search-container">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-box" placeholder="搜索接口地址、描述或参数... (Ctrl + K)" id="globalSearch">
            <div class="search-results" id="searchResults"></div>
        </div>
        <div class="header-actions">
            <div class="favorites-container">
                <button class="favorites-btn" id="favoritesBtn" title="查看收藏的接口">⭐</button>
                <div class="favorites-dropdown" id="favoritesDropdown"></div>
            </div>
        </div>
    `;
  }

  // 获取主容器HTML内容
  function getMainContainerHTMLContent() {
    return `
        <aside class="sidebar" id="sidebar">
            <nav class="nav-tree" id="navTree"></nav>
        </aside>
        <main class="content-area" id="contentArea"></main>
    `;
  }

  // 执行渲染逻辑
  function executeRender(allApis, baseUrl) {
    // 直接执行渲染逻辑，不使用内联脚本
    renderSwaggerContent(allApis, baseUrl);
  }
  
  // 渲染Swagger内容
  function renderSwaggerContent(allApis, baseUrl) {
    // 解析所有API数据
    const apiMap = new Map(); // tag -> endpoints[]
    const tagDescriptionMap = new Map(); // tag -> description
    const allEndpoints = [];
    
    // 首先收集所有tags的description
    allApis.forEach(apiGroup => {
      const tags = apiGroup.data.tags || [];
      tags.forEach(tag => {
        if (tag.name && tag.description) {
          tagDescriptionMap.set(tag.name, tag.description);
        }
      });
    });
    
    allApis.forEach(apiGroup => {
      console.log('apiGroup ->', apiGroup)
      const paths = apiGroup.data.paths || {};
      Object.keys(paths).forEach(path => {
        const methods = paths[path];
        Object.keys(methods).forEach(method => {
          const endpoint = methods[method];
          const tags = endpoint.tags || ['未分类'];
          console.log('tags ->', tags)
          const tag = tags[0];
          
          if (!apiMap.has(tag)) {
            apiMap.set(tag, []);
          }
          
          const endpointData = {
            path: path,
            method: method.toUpperCase(),
            summary: endpoint.summary || '',
            description: endpoint.description || '',
            parameters: endpoint.parameters || [],
            responses: endpoint.responses || {},
            operationId: endpoint.operationId || '',
            tag: tag,
            apiGroup: apiGroup.name,
            definitions: apiGroup.data.definitions || {} // 添加definitions引用
          };
          
          apiMap.get(tag).push(endpointData);
          allEndpoints.push(endpointData);
        });
      });
    });
    
    // 渲染侧边栏
    renderSidebar(apiMap, tagDescriptionMap);
    
    // 渲染内容区
    renderContent(allApis, apiMap, baseUrl);
    
    // 初始化搜索功能
    initSearch(allEndpoints);
    
    // 初始化交互功能
    initInteractions();
  }

  // 渲染侧边栏
  function renderSidebar(apiMap, tagDescriptionMap) {
    console.log('apiMap ->', apiMap)
    const navTree = document.getElementById('navTree');
    if (!navTree) return;
    
    // 获取收藏列表用于检查
    function getFavorites() {
      try {
        const favorites = localStorage.getItem('swagger-favorites');
        return favorites ? JSON.parse(favorites) : [];
      } catch (e) {
        return [];
      }
    }
    
    function isFavorited(path, method) {
      const favorites = getFavorites();
      return favorites.some(f => f.path === path && f.method === method);
    }
    
    let html = '';
    apiMap.forEach((endpoints, tag) => {
      console.log('endpoints ->', endpoints, tag)
      const description = tagDescriptionMap.get(tag) || '';
      html += `
        <div class="controller-group" data-tag="${escapeHtml(tag)}">
          <div class="controller-header" data-tag="${escapeHtml(tag)}">
            <span class="controller-icon"></span>
            <span class="controller-name">
              <div class="controller-name-main">${escapeHtml(tag)}</div>
              ${description ? `<div class="controller-name-desc">${escapeHtml(description)}</div>` : ''}
            </span>
            <span class="controller-count">${endpoints.length}</span>
          </div>
          <div class="endpoints-list">
            ${endpoints.map(ep => {
              const favorited = isFavorited(ep.path, ep.method);
              return `
              <div class="endpoint-item ${favorited ? 'favorited' : ''}" data-path="${escapeHtml(ep.path)}" data-method="${ep.method}">
                <span class="endpoint-method method-${ep.method.toLowerCase()}">${ep.method}</span>
                <span class="endpoint-path" title="${escapeHtml(ep.path)}">${escapeHtml(ep.path)}</span>
              </div>
            `;
            }).join('')}
          </div>
        </div>
      `;
    });
    
    navTree.innerHTML = html;
    
    // 默认展开第一个
    const firstGroup = navTree.querySelector('.controller-group');
    if (firstGroup) {
      firstGroup.classList.add('expanded');
      firstGroup.querySelector('.controller-header').classList.add('active');
    }
    
    // 绑定点击事件
    navTree.querySelectorAll('.controller-header').forEach(header => {
      header.addEventListener('click', function() {
        const group = this.parentElement;
        group.classList.toggle('expanded');
        
        document.querySelectorAll('.controller-header').forEach(h => {
          h.classList.remove('active');
        });
        this.classList.add('active');
      });
    });
    
    navTree.querySelectorAll('.endpoint-item').forEach(item => {
      item.addEventListener('click', function() {
        const path = this.getAttribute('data-path');
        const method = this.getAttribute('data-method');
        // 从controller-group获取tag
        const controllerGroup = this.closest('.controller-group');
        const tag = controllerGroup ? controllerGroup.getAttribute('data-tag') : null;
        scrollToEndpoint(path, method, tag);
      });
    });
  }
  
  // 渲染内容区
  function renderContent(allApis, apiMap, baseUrl) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    const apiInfo = allApis[0]?.data?.info || {};
    const host = allApis[0]?.data?.host || '';
    const basePath = allApis[0]?.data?.basePath || '';
    
    // 构建完整的baseUrl
    const fullBaseUrl = host ? basePath : baseUrl;
    
    let html = ``;
    
    // 按tag分组渲染
    apiMap.forEach((endpoints, tag) => {
      html += `
        <div class="api-section" data-tag="${escapeHtml(tag)}">
          <h2 class="section-title">${escapeHtml(tag)}</h2>
          ${endpoints.map(ep => renderApiCard(ep, fullBaseUrl)).join('')}
        </div>
      `;
    });
    
    contentArea.innerHTML = html;
    
    // 绑定卡片点击事件
    contentArea.querySelectorAll('.api-card').forEach(card => {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.api-details')) return;
        if (e.target.closest('.copy-path-btn')) return; // 不阻止复制按钮的点击
        if (e.target.closest('.favorite-icon')) return; // 不阻止收藏按钮的点击
        
        // 切换展开/收起状态
        this.classList.toggle('expanded');
        
        // 更新左侧菜单选中状态
        const path = this.getAttribute('data-path');
        const method = this.getAttribute('data-method');
        const tag = this.getAttribute('data-tag');
        
        if (path && method && window.updateSidebarState) {
          window.updateSidebarState(path, method, tag);
        }
      });
    });
    
    // 绑定复制按钮事件
    contentArea.querySelectorAll('.copy-path-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation(); // 阻止事件冒泡，避免触发卡片展开/收起
        
        const path = this.getAttribute('data-path');
        if (!path) return;
        
        // 复制到剪贴板
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(path).then(() => {
            // 复制成功反馈
            const originalText = this.textContent;
            this.textContent = '✓';
            this.classList.add('copied');
            
            setTimeout(() => {
              this.textContent = originalText;
              this.classList.remove('copied');
            }, 2000);
          }).catch(err => {
            console.error('复制失败:', err);
            // 降级方案：使用传统方法
            fallbackCopy(path, this);
          });
        } else {
          // 降级方案：使用传统方法
          fallbackCopy(path, this);
        }
      });
    });
    
    // 降级复制方案
    function fallbackCopy(text, btn) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        // 复制成功反馈
        const originalText = btn.textContent;
        btn.textContent = '✓';
        btn.classList.add('copied');
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
      }
      
      document.body.removeChild(textArea);
    }
    
    // 绑定标签页切换事件
    contentArea.querySelectorAll('.code-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        const codeBlock = this.closest('.code-block');
        
        // 切换标签状态
        codeBlock.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // 切换内容显示
        codeBlock.querySelectorAll('.code-content').forEach(content => {
          content.classList.remove('active');
        });
        const targetContent = document.getElementById(tabId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
    
    // 绑定枚举复制按钮事件
    contentArea.querySelectorAll('.enum-copy-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        const enumData = this.getAttribute('data-enum');
        if (!enumData) return;
        
        // 解码HTML实体
        const textArea = document.createElement('textarea');
        textArea.innerHTML = enumData;
        const decodedText = textArea.value;
        
        // 复制到剪贴板
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(decodedText).then(() => {
            const originalText = this.textContent;
            this.textContent = '✓';
            this.classList.add('copied');
            
            setTimeout(() => {
              this.textContent = originalText;
              this.classList.remove('copied');
            }, 2000);
          }).catch(err => {
            console.error('复制失败:', err);
            fallbackCopyEnum(decodedText, this);
          });
        } else {
          fallbackCopyEnum(decodedText, this);
        }
      });
    });
    
    // 降级复制方案（枚举）
    function fallbackCopyEnum(text, btn) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        const originalText = btn.textContent;
        btn.textContent = '✓';
        btn.classList.add('copied');
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
      }
      
      document.body.removeChild(textArea);
    }
    
    // 初始化收藏功能
    initFavorites();
  }
  
  // 收藏功能管理
  function initFavorites() {
    // 获取收藏列表
    function getFavorites() {
      try {
        const favorites = localStorage.getItem('swagger-favorites');
        return favorites ? JSON.parse(favorites) : [];
      } catch (e) {
        return [];
      }
    }
    
    // 保存收藏列表
    function saveFavorites(favorites) {
      try {
        localStorage.setItem('swagger-favorites', JSON.stringify(favorites));
      } catch (e) {
        console.error('保存收藏失败:', e);
      }
    }
    
    // 检查是否已收藏
    function isFavorited(path, method) {
      const favorites = getFavorites();
      return favorites.some(f => f.path === path && f.method === method);
    }
    
    // 添加收藏
    function addFavorite(path, method, tag, summary) {
      const favorites = getFavorites();
      if (!isFavorited(path, method)) {
        favorites.push({ path, method, tag, summary });
        saveFavorites(favorites);
        updateFavoriteIcons();
        updateFavoritesDropdown();
      }
    }
    
    // 移除收藏
    function removeFavorite(path, method) {
      const favorites = getFavorites();
      const filtered = favorites.filter(f => !(f.path === path && f.method === method));
      saveFavorites(filtered);
      updateFavoriteIcons();
      updateFavoritesDropdown();
    }
    
    // 更新收藏图标状态
    function updateFavoriteIcons() {
      document.querySelectorAll('.favorite-icon').forEach(icon => {
        const path = icon.getAttribute('data-path');
        const method = icon.getAttribute('data-method');
        const card = icon.closest('.api-card');
        
        if (isFavorited(path, method)) {
          icon.classList.add('favorited');
          icon.textContent = '⭐';
          if (card) {
            card.classList.add('favorited');
          }
        } else {
          icon.classList.remove('favorited');
          icon.textContent = '☆';
          if (card) {
            card.classList.remove('favorited');
          }
        }
      });
      
      // 同步更新左侧菜单的收藏标识
      updateSidebarFavoriteIcons();
    }
    
    // 更新左侧菜单的收藏标识
    function updateSidebarFavoriteIcons() {
      document.querySelectorAll('.endpoint-item').forEach(item => {
        const path = item.getAttribute('data-path');
        const method = item.getAttribute('data-method');
        
        if (isFavorited(path, method)) {
          item.classList.add('favorited');
        } else {
          item.classList.remove('favorited');
        }
      });
    }
    
    // 更新收藏下拉列表
    function updateFavoritesDropdown() {
      const dropdown = document.getElementById('favoritesDropdown');
      if (!dropdown) return;
      
      const favorites = getFavorites();
      
      if (favorites.length === 0) {
        dropdown.classList.add('empty');
        dropdown.innerHTML = '<div class="favorite-empty-text">暂无收藏的接口</div>';
        return;
      }
      
      dropdown.classList.remove('empty');
      dropdown.innerHTML = favorites.map(fav => {
        return `
          <div class="favorite-item" data-path="${escapeHtml(fav.path)}" data-method="${fav.method}" data-tag="${escapeHtml(fav.tag || '')}">
            <span class="favorite-item-method method-${fav.method.toLowerCase()}">${fav.method}</span>
            <span class="favorite-item-path">${escapeHtml(fav.path)}</span>
            <span class="favorite-item-desc">${escapeHtml(fav.summary || '')}</span>
            <span class="favorite-item-remove" title="取消收藏">×</span>
          </div>
        `;
      }).join('');
      
      // 绑定收藏项点击事件
      dropdown.querySelectorAll('.favorite-item').forEach(item => {
        const removeBtn = item.querySelector('.favorite-item-remove');
        const path = item.getAttribute('data-path');
        const method = item.getAttribute('data-method');
        const tag = item.getAttribute('data-tag');
        
        // 点击项跳转
        item.addEventListener('click', function(e) {
          if (e.target === removeBtn) return;
          scrollToEndpoint(path, method, tag);
          dropdown.classList.remove('active');
        });
        
        // 点击删除按钮
        removeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          removeFavorite(path, method);
        });
      });
    }
    
    // 绑定收藏图标点击事件
    document.addEventListener('click', function(e) {
      if (e.target.closest('.favorite-icon')) {
        const icon = e.target.closest('.favorite-icon');
        const path = icon.getAttribute('data-path');
        const method = icon.getAttribute('data-method');
        const tag = icon.getAttribute('data-tag');
        const card = icon.closest('.api-card');
        const summary = card ? card.querySelector('.api-summary')?.textContent || '' : '';
        
        e.stopPropagation(); // 阻止触发卡片展开
        
        if (isFavorited(path, method)) {
          removeFavorite(path, method);
        } else {
          addFavorite(path, method, tag, summary);
        }
      }
    });
    
    // 绑定收藏按钮点击事件
    const favoritesBtn = document.getElementById('favoritesBtn');
    const favoritesDropdown = document.getElementById('favoritesDropdown');
    
    if (favoritesBtn && favoritesDropdown) {
      favoritesBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        favoritesDropdown.classList.toggle('active');
        updateFavoritesDropdown();
      });
      
      // 点击外部关闭下拉
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.favorites-container')) {
          favoritesDropdown.classList.remove('active');
        }
      });
    }
    
    // 初始化时更新状态
    updateFavoriteIcons();
    updateFavoritesDropdown();
  }
  
  // 渲染API卡片
  function renderApiCard(endpoint, baseUrl) {
    const params = endpoint.parameters || [];
    const bodyParam = params.find(p => p.in === 'body');
    
    // 转义路径中的特殊字符用于ID
    const regex = new RegExp('[.*+?^$()|[\\]\\\\]', 'g');
    const safePathId = endpoint.path.replace(regex, '-');
    const cardId = `api-${safePathId}-${endpoint.method}`;
    
    // 构建完整的接口地址，避免双斜杠
    let fullPath = endpoint.path;
    if (baseUrl) {
      const normalizedBaseUrl = baseUrl.replace(/\/+$/, ''); // 移除末尾的斜杠
      const normalizedPath = endpoint.path.replace(/^\/+/, '/'); // 确保路径以单个斜杠开头
      // 如果 baseUrl 只是斜杠，则只使用路径
      if (normalizedBaseUrl && normalizedBaseUrl !== '/') {
        fullPath = normalizedBaseUrl + normalizedPath;
      } else {
        fullPath = normalizedPath;
      }
    }
    
    return `
      <div class="api-card" id="${cardId}" data-path="${escapeHtml(endpoint.path)}" data-method="${endpoint.method}" data-tag="${escapeHtml(endpoint.tag || '')}">
        <div class="api-card-header">
          <span class="http-method method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
          <span class="api-path">
            ${escapeHtml(endpoint.path)}
            <span class="copy-path-btn" data-path="${escapeHtml(fullPath)}" title="复制接口地址">📄</span>
            <span class="api-summary">${escapeHtml(endpoint.summary || '')}</span>
          </span>
          <span class="favorite-icon" data-path="${escapeHtml(endpoint.path)}" data-method="${endpoint.method}" data-tag="${escapeHtml(endpoint.tag || '')}" title="收藏接口">⭐</span>
          <span class="expand-icon">▼</span>
        </div>
        <div class="api-details">
          <div class="details-content">
            ${endpoint.description ? `
              <div class="detail-section">
                <div class="detail-label">接口描述</div>
                <p style="color: var(--text-secondary); line-height: 1.6;">${escapeHtml(endpoint.description)}</p>
              </div>
            ` : ''}
            
            ${params.length > 0 ? `
              <div class="detail-section">
                <div class="detail-label">请求参数</div>
                ${renderRequestParams(params, bodyParam, endpoint.definitions, cardId)}
              </div>
            ` : ''}
            
            ${Object.keys(endpoint.responses).length > 0 ? `
              <div class="detail-section">
                <div class="detail-label">响应示例</div>
                ${renderResponseExample(endpoint.responses, endpoint.definitions, cardId)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  // 检测描述中是否包含枚举值
  function hasEnumInDescription(description) {
    if (!description || description.includes('yyyy-MM-dd HH:mm:ss') || description.includes('yyyy-mm-dd hh:mm:ss')) return false;
    // 匹配格式：描述 枚举1:值1 枚举2:值2 或 枚举1：值1 枚举2：值2
    // 至少需要两个枚举项（用空格分隔，每个枚举项包含冒号）
    // 或者只有一个枚举项但前面有描述
    const enumPattern = /[\w\u4e00-\u9fa5]+[：:][\w\u4e00-\u9fa5\d]+/;
    const matches = description.match(new RegExp(enumPattern, 'g'));
    return matches && matches.length >= 1;
  }
  
  // 解析枚举值
  function parseEnumValues(description) {
    if (!description) return null;
    
    // 匹配所有 "value:label" 或 "value：label" 格式的枚举项
    // 根据用户示例：function:函数 tag:标签，格式是 value:label
    // value和label可以是中文、英文、数字
    const enumPattern = /([\w\u4e00-\u9fa5\d]+)[：:]([\w\u4e00-\u9fa5\d]+)/g;
    const matches = [...description.matchAll(enumPattern)];
    
    if (matches.length === 0) return null;
    
    const result = [];
    for (const match of matches) {
      const value = match[1]; // 冒号前面的是value
      const label = match[2]; // 冒号后面的是label
      // 判断value是否为纯数字
      const numValue = /^\d+$/.test(value) ? parseInt(value, 10) : value;
      result.push({ label, value: numValue });
    }
    
    return result.length > 0 ? result : null;
  }
  
  // 转换枚举值为前端格式
  function formatEnumForFrontend(enums) {
    if (!enums || enums.length === 0) return '';
    
    const items = enums.map(e => {
      const valueStr = typeof e.value === 'number' ? e.value : `"${e.value}"`;
      return `  { "label": "${e.label}", "value": ${valueStr} }`;
    });
    
    return `[\n${items.join(',\n')}\n]`;
  }
  
  // 渲染枚举复制按钮
  function renderEnumCopyButton(description) {
    if (!hasEnumInDescription(description)) {
      return '';
    }
    
    const enums = parseEnumValues(description);
    if (!enums || enums.length === 0) {
      return '';
    }
    
    const formattedEnum = formatEnumForFrontend(enums);
    // 转义HTML特殊字符，但保留换行符
    const encodedEnum = formattedEnum
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    return `<span class="enum-copy-btn" data-enum="${encodedEnum}" title="复制枚举值">📋</span>`;
  }
  
  // 渲染请求参数（带示例和协议标签）
  function renderRequestParams(params, bodyParam, definitions, cardId) {
    const queryParams = params.filter(p => p.in === 'query');
    const pathParams = params.filter(p => p.in === 'path');
    const headerParams = params.filter(p => p.in === 'header');
    
    let html = '';
    
    // 如果有body参数，显示示例和协议标签
    if (bodyParam && bodyParam.schema) {
      const paramId = `${cardId}-request`;
      html += `
        <div class="code-block">
          <div class="code-header">
            <div class="code-tabs">
              <span class="code-tab active" data-tab="example-${paramId}">示例</span>
              <span class="code-tab" data-tab="schema-${paramId}">协议</span>
            </div>
          </div>
          <div class="code-content-wrapper">
            <div class="code-content active" id="example-${paramId}"><pre>${formatJsonExample(bodyParam.schema, definitions)}</pre></div>
            <div class="code-content" id="schema-${paramId}">
              ${renderSchemaProtocol(bodyParam.schema, definitions)}
            </div>
          </div>
        </div>
      `;
    }
    
    // 显示其他参数（query, path, header）
    if (queryParams.length > 0 || pathParams.length > 0 || headerParams.length > 0) {
      html += `
        <table class="params-table">
          <thead>
            <tr>
              <th>参数名</th>
              <th>描述</th>
              <th>类型</th>
              <th>位置</th>
              <th>必填</th>
            </tr>
          </thead>
          <tbody>
            ${[...pathParams, ...queryParams, ...headerParams].map(p => `
              <tr>
                <td>
                  <span class="param-name">${escapeHtml(p.name || '')}</span>
                </td>
                <td class="param-desc">
                  <span class="param-desc-text">${escapeHtml(p.description || '')}</span>
                  ${renderEnumCopyButton(p.description || '')}
                </td>
                <td>${escapeHtml(getParamType(p))}</td>
                <td><span class="param-type">${escapeHtml(p.in || '')}</span></td>
                <td>${p.required ? '<span>● 必填</span>' : '选填'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    return html;
  }
  
  // 渲染响应示例（带示例和协议标签）
  function renderResponseExample(responses, definitions, cardId) {
    const responseId = `${cardId}-response`;
    const successResponse = responses['200'] || responses['201'] || Object.values(responses)[0];
    
    if (!successResponse || !successResponse.schema) {
      return '<div class="code-content">无响应体定义</div>';
    }
    
    return `
      <div class="code-block">
        <div class="code-header">
          <div class="code-tabs">
            <span class="code-tab active" data-tab="example-${responseId}">示例</span>
            <span class="code-tab" data-tab="schema-${responseId}">协议</span>
          </div>
        </div>
        <div class="code-content-wrapper">
          <div class="code-content active" id="example-${responseId}">
            <pre>${formatJsonExample(successResponse.schema, definitions)}</pre>
          </div>
          <div class="code-content" id="schema-${responseId}">
            ${renderSchemaProtocol(successResponse.schema, definitions)}
          </div>
        </div>
      </div>
    `;
  }
  
  // 格式化JSON示例
  function formatJsonExample(schema, definitions, visited = new Set()) {
    if (!schema) return '{}';
    
    // 处理$ref引用
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      if (visited.has(refName)) {
        return '{}'; // 避免循环引用
      }
      visited.add(refName);
      const refSchema = definitions[refName];
      if (refSchema) {
        const example = buildExampleValue(refSchema, definitions, visited);
        return JSON.stringify(example, null, 2);
      }
      return '{}';
    }
    
    const example = buildExampleValue(schema, definitions, visited);
    return JSON.stringify(example, null, 2);
  }
  
  // 构建示例值对象
  function buildExampleValue(schema, definitions, visited = new Set()) {
    if (!schema) return {};
    
    // 处理$ref引用
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      if (visited.has(refName)) {
        return {}; // 避免循环引用
      }
      visited.add(refName);
      const refSchema = definitions[refName];
      if (refSchema) {
        return buildExampleValue(refSchema, definitions, visited);
      }
      return {};
    }
    
    // 处理数组
    if (schema.type === 'array') {
      if (schema.items) {
        const itemExample = buildExampleValue(schema.items, definitions, visited);
        return [itemExample];
      }
      return [];
    }
    
    // 处理对象
    if (schema.type === 'object' || schema.properties) {
      const props = schema.properties || {};
      const result = {};
      
      Object.keys(props).forEach(key => {
        const prop = props[key];
        
        if (prop.example !== undefined) {
          result[key] = prop.example;
        } else if (prop.type === 'string') {
          result[key] = prop.description || 'string';
        } else if (prop.type === 'integer' || prop.type === 'number') {
          result[key] = prop.example !== undefined ? prop.example : (prop.type === 'integer' ? 0 : 0.0);
        } else if (prop.type === 'boolean') {
          result[key] = prop.example !== undefined ? prop.example : false;
        } else if (prop.type === 'array') {
          if (prop.items) {
            const itemExample = buildExampleValue(prop.items, definitions, visited);
            result[key] = [itemExample];
          } else {
            result[key] = [];
          }
        } else if (prop.type === 'object' || prop.properties) {
          result[key] = buildExampleValue(prop, definitions, visited);
        } else if (prop.$ref) {
          result[key] = buildExampleValue(prop, definitions, visited);
        } else {
          result[key] = null;
        }
      });
      
      return result;
    }
    
    // 处理基本类型
    if (schema.example !== undefined) {
      return schema.example;
    }
    
    if (schema.type === 'string') {
      return schema.description || 'string';
    } else if (schema.type === 'integer') {
      return schema.example !== undefined ? schema.example : 0;
    } else if (schema.type === 'number') {
      return schema.example !== undefined ? schema.example : 0.0;
    } else if (schema.type === 'boolean') {
      return schema.example !== undefined ? schema.example : false;
    }
    
    return {};
  }
  
  // 渲染协议（字段、类型、描述）
  function renderSchemaProtocol(schema, definitions, visited = new Set(), level = 0) {
    if (!schema) return '<div>无定义</div>';
    
    // 处理$ref引用
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      if (visited.has(refName)) {
        return '<div style="color: var(--text-secondary); padding: 8px;">[循环引用: ' + escapeHtml(refName) + ']</div>';
      }
      const newVisited = new Set(visited);
      newVisited.add(refName);
      const refSchema = definitions[refName];
      if (refSchema) {
        return renderSchemaProtocol(refSchema, definitions, newVisited, level);
      }
      return '<div>未找到定义: ' + escapeHtml(refName) + '</div>';
    }
    
    // 处理数组
    if (schema.type === 'array') {
      if (schema.items) {
        return `
          <div style="margin: 12px 0;">
            <div style="color: var(--text-secondary); margin-bottom: 8px; font-size: 12px;">数组元素类型: ${escapeHtml(getSchemaType(schema.items, definitions))}</div>
            ${renderSchemaProtocol(schema.items, definitions, visited, level + 1)}
          </div>
        `;
      }
      return '<div style="color: var(--text-secondary);">数组 []</div>';
    }
    
    // 处理对象
    if (schema.type === 'object' || schema.properties) {
      const props = schema.properties || {};
      const required = schema.required || [];
      
      if (Object.keys(props).length === 0) {
        return '<div style="color: var(--text-secondary);">空对象</div>';
      }
      
      let html = '<table class="params-table">';
      html += '<thead><tr><th>字段名</th><th>描述</th><th>类型</th><th>必填</th></tr></thead>';
      html += '<tbody>';
      
      Object.keys(props).forEach(key => {
        const prop = props[key];
        const isRequired = required.includes(key);
        const propType = getSchemaType(prop, definitions);
        
        html += `
          <tr>
            <td>
              <span class="param-name">${escapeHtml(key)}</span>
            </td>
            <td class="param-desc">
              <span class="param-desc-text">${escapeHtml(prop.description || '')}</span>
              ${renderEnumCopyButton(prop.description || '')}
            </td>
            <td>${escapeHtml(propType)}</td>
            <td>${isRequired ? '<span>● 必填</span>' : '选填'}</td>
          </tr>
        `;
        
        // 如果是嵌套对象或数组，递归显示
        const newVisited = new Set(visited);
        let nestedHtml = '';
        
        if (prop.type === 'object' && prop.properties) {
          nestedHtml = renderSchemaProtocol(prop, definitions, newVisited, level + 1);
        } else if (prop.type === 'array' && prop.items) {
          if (prop.items.type === 'object' || prop.items.properties || prop.items.$ref) {
            nestedHtml = `
              ${renderSchemaProtocol(prop.items, definitions, newVisited, level + 1)}
            `;
          }
        } else if (prop.$ref) {
          const refName = prop.$ref.split('/').pop();
          if (!newVisited.has(refName)) {
            const refSchema = definitions[refName];
            if (refSchema) {
              nestedHtml = renderSchemaProtocol(refSchema, definitions, newVisited, level + 1);
            }
          } else {
            nestedHtml = '<div style="color: var(--text-secondary); padding: 8px;">[循环引用: ' + escapeHtml(refName) + ']</div>';
          }
        }
        
        if (nestedHtml) {
          html += `
            <tr>
              <td colspan="4" style="padding: 0; border-top: none;">
                <div style="padding: 12px 20px; background: rgba(15, 23, 42, 0.5); border-left: 2px solid var(--border-color);">
                  ${nestedHtml}
                </div>
              </td>
            </tr>
          `;
        }
      });
      
      html += '</tbody></table>';
      return html;
    }
    
    // 基本类型
    return `<div style="color: var(--text-secondary); padding: 8px;">类型: ${escapeHtml(getSchemaType(schema, definitions))}</div>`;
  }
  
  // 获取Schema类型
  function getSchemaType(schema, definitions) {
    if (!schema) return 'unknown';
    
    if (schema.$ref) {
      return schema.$ref.split('/').pop();
    }
    
    if (schema.type === 'array') {
      if (schema.items) {
        return `Array<${getSchemaType(schema.items, definitions)}>`;
      }
      return 'Array';
    }
    
    if (schema.type === 'object' || schema.properties) {
      return 'Object';
    }
    
    return schema.type || 'string';
  }
  
  // 获取参数类型
  function getParamType(param) {
    if (param.schema) {
      if (param.schema.type) return param.schema.type;
      if (param.schema.$ref) return param.schema.$ref.split('/').pop();
    }
    if (param.type) return param.type;
    return 'string';
  }
  
  // 格式化响应
  function formatResponses(responses) {
    const codes = Object.keys(responses);
    if (codes.length === 0) return 'No response defined';
    
    let result = '';
    codes.forEach(code => {
      const response = responses[code];
      result += `${code}: ${response.description || 'OK'}\n`;
      if (response.schema) {
        result += `Schema: ${JSON.stringify(response.schema, null, 2)}\n\n`;
      }
    });
    
    return result || 'No response body defined';
  }
  
  // 初始化搜索功能
  function initSearch(allEndpoints) {
    const searchInput = document.getElementById('globalSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      
      if (query.length === 0) {
        searchResults.classList.remove('active');
        return;
      }
      
      const results = allEndpoints.filter(ep => {
        return ep.path.toLowerCase().includes(query) ||
               ep.summary.toLowerCase().includes(query) ||
               ep.description.toLowerCase().includes(query) ||
               ep.method.toLowerCase().includes(query);
      }).slice(0, 10);
      
      if (results.length > 0) {
        searchResults.innerHTML = results.map(ep => `
          <div class="result-item" data-path="${escapeHtml(ep.path)}" data-method="${ep.method}" data-tag="${escapeHtml(ep.tag || '')}">
            <span class="result-method method-${ep.method.toLowerCase()}">${ep.method}</span>
            <span class="result-path">${escapeHtml(ep.path)}</span>
            <span class="result-desc">${escapeHtml(ep.summary || '')}</span>
          </div>
        `).join('');
        
        // 绑定搜索结果点击事件
        searchResults.querySelectorAll('.result-item').forEach(item => {
          item.addEventListener('click', function() {
            const path = this.getAttribute('data-path');
            const method = this.getAttribute('data-method');
            const tag = this.getAttribute('data-tag');
            scrollToEndpoint(path, method, tag);
          });
        });
        
        searchResults.classList.add('active');
      } else {
        searchResults.innerHTML = '<div class="result-item" style="color: var(--text-secondary);">未找到匹配的接口</div>';
        searchResults.classList.add('active');
      }
    });
    
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length > 0) {
        searchResults.classList.add('active');
      }
    });
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        searchResults.classList.remove('active');
      }
    });
    
    // 快捷键 Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }
  
  // 初始化交互功能
  function initInteractions() {
    // 滚动到指定接口（固定0.3秒动画）
    window.scrollToEndpoint = function(path, method, tag) {
      // 转义路径中的特殊字符用于ID（与renderApiCard中的逻辑一致）
      const regex = new RegExp('[.*+?^$()|[\\]\\\\]', 'g');
      const safePathId = path.replace(regex, '-');
      const cardId = `api-${safePathId}-${method}`;
      const card = document.getElementById(cardId);
      if (card) {
        // 获取滚动容器（content-area）
        const contentArea = document.getElementById('contentArea');
        if (!contentArea) return;
        
        // 计算目标位置（元素相对于滚动容器的位置，显示在顶部）
        const containerRect = contentArea.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const currentScrollTop = contentArea.scrollTop;
        const cardOffsetTop = card.offsetTop;
        
        // 目标位置：让卡片显示在容器顶部，留一些间距（20px）
        const targetScrollTop = cardOffsetTop - 86;
        
        // 开始滚动动画
        const startScrollTop = currentScrollTop;
        const distance = targetScrollTop - startScrollTop;
        const duration = 300; // 固定300ms
        const startTime = performance.now();
        
        // 缓动函数（ease-out）
        function easeOutCubic(t) {
          return 1 - Math.pow(1 - t, 3);
        }
        
        function animateScroll(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutCubic(progress);
          
          contentArea.scrollTop = startScrollTop + (distance * easedProgress);
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          } else {
            // 动画完成，确保精确位置
            contentArea.scrollTop = targetScrollTop;
          }
        }
        
        requestAnimationFrame(animateScroll);
        
        card.classList.add('expanded');
        
        // 更新左侧菜单状态
        updateSidebarState(path, method, tag);
        
        // 关闭搜索结果
        document.getElementById('searchResults')?.classList.remove('active');
      }
    };
    
    // 更新左侧菜单状态（展开对应目录并选中接口）
    window.updateSidebarState = function(path, method, tag) {
      if (!tag) {
        // 如果没有提供tag，尝试从endpoint-item中找到
        const endpointItems = document.querySelectorAll('.endpoint-item');
        for (const item of endpointItems) {
          if (item.getAttribute('data-path') === path && item.getAttribute('data-method') === method) {
            const controllerGroup = item.closest('.controller-group');
            if (controllerGroup) {
              tag = controllerGroup.getAttribute('data-tag');
              break;
            }
          }
        }
      }
      
      if (tag) {
        // 找到对应的controller-group并展开
        const controllerGroups = document.querySelectorAll('.controller-group');
        for (const group of controllerGroups) {
          if (group.getAttribute('data-tag') === tag) {
            // 展开该组
            group.classList.add('expanded');
            
            // 激活controller-header
            const controllerHeader = group.querySelector('.controller-header');
            if (controllerHeader) {
              document.querySelectorAll('.controller-header').forEach(h => {
                h.classList.remove('active');
              });
              controllerHeader.classList.add('active');
            }
            break;
          }
        }
      }
      
      // 更新endpoint-item的active状态
      document.querySelectorAll('.endpoint-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-path') === path && item.getAttribute('data-method') === method) {
          item.classList.add('active');
          
          // 滚动到该item（如果它在侧边栏中不可见）
          const navTree = document.getElementById('navTree');
          if (navTree) {
            const itemRect = item.getBoundingClientRect();
            const navTreeRect = navTree.getBoundingClientRect();
            
            // 如果item不在可见区域内，滚动到它
            if (itemRect.top < navTreeRect.top || itemRect.bottom > navTreeRect.bottom) {
              item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      });
    };
    
    // 切换侧边栏
    const collapseBtn = document.getElementById('collapseBtn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
      });
    }
  }

  // 检测Swagger页面并自动激活（可选）
  // 如果需要自动激活，取消下面的注释
  /*
  if (isSwaggerPage()) {
    // 可以在这里添加自动激活逻辑
  }
  */
})();
