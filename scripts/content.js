// Swagger Pro 插件
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
      showLoading('正在获取 Swagger 配置...');

      let allApis = [];

      // 1. 先尝试获取 v2 版本的 swagger-resources
      try {
        const resourcesResponse = await fetch(`${baseUrl}/swagger-resources`);
        if (resourcesResponse.ok) {
          const resources = await resourcesResponse.json();
          if (resources && resources.length > 0) {
            updateLoading();
            // 2. 获取所有group的API文档
            for (let i = 0; i < resources.length; i++) {
              const resource = resources[i];
              updateLoading();
              try {
                const apiUrl = resource.url.startsWith('http') 
                  ? resource.url 
                  : `${baseUrl}${resource.url}`;
                const apiResponse = await fetch(apiUrl);
                if (apiResponse.ok) {
                  const apiData = await apiResponse.json();
                  allApis.push({
                    name: resource.name,
                    data: apiData,
                    isV3: false
                  });
                }
              } catch (error) {
                console.error(`获取 ${resource.name} 的API文档失败:`, error);
              }
            }
          }
        } else {
          console.log('v2 swagger-resources 返回状态码:', resourcesResponse.status);
        }
      } catch (error) {
        console.log('v2 版本获取失败，尝试 v3 版本:', error);
      }

      // 3. 如果 v2 失败或没有获取到数据，尝试获取 v3 版本
      if (allApis.length === 0) {
        try {
          updateLoading();
          const configResponse = await fetch(`${baseUrl}/v3/api-docs/swagger-config`);
          if (configResponse.ok) {
            const config = await configResponse.json();
            if (config && config.urls && config.urls.length > 0) {
              updateLoading();
              // 获取所有 API 组的文档
              for (let i = 0; i < config.urls.length; i++) {
                const urlItem = config.urls[i];
                updateLoading();
                try {
                  let apiUrl;
                  if (urlItem.url.startsWith('http')) {
                    // 完整的 HTTP URL
                    apiUrl = urlItem.url;
                  } else if (urlItem.url.startsWith('/')) {
                    // 绝对路径，直接使用 origin + url
                    apiUrl = currentUrl.origin + urlItem.url;
                  } else {
                    // 相对路径，使用 baseUrl + url
                    apiUrl = `${baseUrl}/${urlItem.url}`;
                  }
                  const apiResponse = await fetch(apiUrl);
                  if (apiResponse.ok) {
                    const apiData = await apiResponse.json();
                    allApis.push({
                      name: urlItem.name,
                      data: apiData,
                      isV3: true
                    });
                  }
                } catch (error) {
                  console.error(`获取 ${urlItem.name} 的API文档失败:`, error);
                }
              }
            }
          } else {
            console.log('v3 swagger-config 返回状态码:', configResponse.status);
          }
        } catch (error) {
          console.error('v3 版本获取失败:', error);
        }
      }

      if (allApis.length === 0) {
        throw new Error('无法获取任何 Swagger 资源（v2 和 v3 都失败）');
      }

      // 4. 解析和渲染数据
      updateLoading();
      // 使用 setTimeout 让浏览器有机会更新 UI
      await new Promise(resolve => setTimeout(resolve, 0));
      
      replacePageContent(allApis, baseUrl);

    } catch (error) {
      console.error('增强Swagger页面失败:', error);
      alert('处理失败: ' + error.message);
      hideLoading();
    }
  }

  // 显示加载提示
  function showLoading(message) {
    let loader = document.getElementById('swagger-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'swagger-loader';
      loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: #f8fafc;
        font-size: 18px;
      `;
      document.body.appendChild(loader);
    }
    
    loader.innerHTML = `
      <div style="margin-bottom: 20px;">
        <div style="width: 50px; height: 50px; border: 4px solid rgba(255, 255, 255, 0.2); border-top-color: #60a5fa; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
      <div style="font-size: 16px; color: #cbd5e1;">${message}</div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  // 更新加载提示
  function updateLoading(message) {
    const loader = document.getElementById('swagger-loader');
    if (!loader) return;
    // 如果未传 message，则保持原文案不变，避免显示 "undefined"
    if (typeof message !== 'string' || !message) return;
    const messageDiv = loader.querySelector('div:last-child');
    if (messageDiv) {
      messageDiv.textContent = message;
    }
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
            padding: 0 44px 0 45px;
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
            pointer-events: none;
        }
        .search-clear-btn {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
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
            pointer-events: none;
        }
        .search-clear-btn.visible {
            opacity: 1;
            pointer-events: auto;
        }
        .search-clear-btn:hover {
            color: var(--text-primary);
            background: var(--bg-tertiary);
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
            transition: transform 0.2s, border-color 0.2s;
        }
        .controller-group.expanded .controller-icon {
            transform: rotate(45deg);
        }
        .controller-group.has-favorites .controller-icon {
            border-right-color: var(--accent-orange);
            border-bottom-color: var(--accent-orange);
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
        .content-loading {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            font-size: 14px;
            gap: 12px;
        }
        .content-loading-spinner {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid rgba(148, 163, 184, 0.4);
            border-top-color: #e5e7eb;
            animation: spin 0.8s linear infinite;
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
        .share-icon {
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
            margin-left: 8px;
            flex-shrink: 0;
        }
        .api-card-header:hover .share-icon {
            opacity: 1;
        }
        .share-icon:hover {
            color: var(--accent-blue);
            background: var(--bg-tertiary);
        }
        .share-icon.copied {
            color: var(--accent-green);
            opacity: 1;
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
        .settings-btn {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 18px;
            color: var(--text-secondary);
        }
        .settings-btn:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border-color: var(--accent-blue);
        }
        .refresh-btn {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 18px;
            color: var(--text-secondary);
        }
        .refresh-btn:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border-color: var(--accent-green);
        }
        .refresh-btn.refreshing {
            animation: rotate 1s linear infinite;
        }
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .settings-modal {
            display: none;
            position: fixed;
            top: 200px;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            align-items: center;
            justify-content: center;
        }
        .settings-modal.active {
            display: flex;
        }
        .settings-modal-content {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .settings-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);
        }
        .settings-modal-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
        }
        .settings-modal-close {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 18px;
            transition: all 0.2s;
        }
        .settings-modal-close:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
        .settings-modal-body {
            padding: 24px;
        }
        .settings-item {
            margin-bottom: 20px;
        }
        .settings-item label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
        }
        .settings-item input {
            width: 100%;
            height: 40px;
            padding: 0 12px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-primary);
            font-size: 14px;
            transition: all 0.2s;
            box-sizing: border-box;
        }
        .settings-item input:focus {
            outline: none;
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .settings-item-desc {
            margin-top: 8px;
            font-size: 12px;
            color: var(--text-secondary);
            line-height: 1.5;
        }
        .settings-modal-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            padding: 20px 24px;
            border-top: 1px solid var(--border-color);
        }
        .settings-btn-save,
        .settings-btn-cancel {
            height: 36px;
            padding: 0 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid var(--border-color);
        }
        .settings-btn-save {
            background: var(--accent-blue);
            color: white;
            border-color: var(--accent-blue);
        }
        .settings-btn-save:hover {
            background: #3b82f6;
            border-color: #3b82f6;
        }
        .settings-btn-cancel {
            background: var(--bg-secondary);
            color: var(--text-primary);
        }
        .settings-btn-cancel:hover {
            background: var(--bg-tertiary);
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
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .param-expand-icon {
            width: 16px;
            height: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 3px;
            transition: all 0.2s;
            color: var(--text-secondary);
            font-size: 12px;
            flex-shrink: 0;
            user-select: none;
        }
        .param-expand-icon:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
        .param-expand-icon.collapsed {
            transform: rotate(-90deg);
        }
        .param-nested-content {
            display: block;
        }
        .param-nested-content.collapsed {
            display: none;
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
            <div class="logo"><img src="${logoUrl}" alt="Swagger Pro Logo"></div>
            <div class="brand-text">
                <h1>Swagger Pro</h1>
                <span>API Documentation</span>
            </div>
        </div>
        <div class="search-container">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-box" placeholder="搜索接口地址、描述或参数... (Ctrl + K)" id="globalSearch">
            <span class="search-clear-btn" id="searchClearBtn" title="清空搜索">✕</span>
            <div class="search-results" id="searchResults"></div>
        </div>
        <div class="header-actions">
            <div class="favorites-container">
                <button class="favorites-btn" id="favoritesBtn" title="查看收藏的接口">⭐</button>
                <div class="favorites-dropdown" id="favoritesDropdown"></div>
            </div>
            <button class="settings-btn" id="settingsBtn" title="设置">⚙️</button>
            <button class="refresh-btn" id="refreshBtn" title="刷新接口数据">🔄</button>
        </div>
        <div class="settings-modal" id="settingsModal">
            <div class="settings-modal-content">
                <div class="settings-modal-header">
                    <h3>设置</h3>
                    <button class="settings-modal-close" id="settingsModalClose">✕</button>
                </div>
                <div class="settings-modal-body">
                    <div class="settings-item">
                        <label for="baseUrlInput">Base URL</label>
                        <input type="text" id="baseUrlInput" placeholder="/api/ddsadmin" />
                        <div class="settings-item-desc">设置后，复制接口地址时会自动加上此Base URL</div>
                    </div>
                </div>
                <div class="settings-modal-footer">
                    <button class="settings-btn-save" id="settingsBtnSave">保存</button>
                    <button class="settings-btn-cancel" id="settingsBtnCancel">取消</button>
                </div>
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
  
  // 生成分享链接
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
  
  // 解析分享链接并跳转到对应接口
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
  
  // 渲染Swagger内容
  function renderSwaggerContent(allApis, baseUrl) {
    updateLoading();
    
    // 右侧区域先显示一个局部 loading，避免在解析数据时长时间空白
    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="content-loading">
          <div class="content-loading-spinner"></div>
          <div>正在解析并渲染接口列表，请稍候...</div>
        </div>
      `;
    }
    
    // 使用异步切片，让上面的 loading 有机会先渲染到屏幕上
    setTimeout(() => {
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
      
      // 计算总接口数，用于显示进度
      let totalEndpoints = 0;
      allApis.forEach(apiGroup => {
        const paths = apiGroup.data.paths || {};
        Object.keys(paths).forEach(path => {
          totalEndpoints += Object.keys(paths[path]).length;
        });
      });
      
      let processedEndpoints = 0;
      
      allApis.forEach(apiGroup => {
        const paths = apiGroup.data.paths || {};
        const isV3 = apiGroup.isV3 || false;
        
        // 获取 definitions 或 components.schemas
        const definitions = isV3 
          ? (apiGroup.data.components?.schemas || {})
          : (apiGroup.data.definitions || {});
        
        Object.keys(paths).forEach(path => {
          const methods = paths[path];
          Object.keys(methods).forEach(method => {
            const endpoint = methods[method];
            const tags = endpoint.tags || ['未分类'];
            const tag = tags[0];
            
            if (!apiMap.has(tag)) {
              apiMap.set(tag, []);
            }
            
            // 处理 v3 的 requestBody 和 v2 的 parameters
            let parameters = endpoint.parameters || [];
            let bodyParam = null;
            
            if (isV3 && endpoint.requestBody) {
              // v3 使用 requestBody
              const content = endpoint.requestBody.content || {};
              const jsonContent = content['application/json'] || content['*/*'] || Object.values(content)[0];
              if (jsonContent && jsonContent.schema) {
                bodyParam = {
                  in: 'body',
                  schema: jsonContent.schema,
                  required: endpoint.requestBody.required || false
                };
              }
            } else {
              // v2 使用 parameters 中的 body
              bodyParam = parameters.find(p => p.in === 'body');
            }
            
            // 处理 v3 的响应结构
            let responses = endpoint.responses || {};
            if (isV3 && responses) {
              // v3 的响应在 content 中
              const processedResponses = {};
              Object.keys(responses).forEach(statusCode => {
                const response = responses[statusCode];
                if (response.content) {
                  const jsonContent = response.content['application/json'] 
                    || response.content['*/*'] 
                    || Object.values(response.content)[0];
                  if (jsonContent && jsonContent.schema) {
                    processedResponses[statusCode] = {
                      description: response.description || '',
                      schema: jsonContent.schema
                    };
                  } else {
                    processedResponses[statusCode] = response;
                  }
                } else {
                  processedResponses[statusCode] = response;
                }
              });
              responses = processedResponses;
            }
            
            const endpointData = {
              path: path,
              method: method.toUpperCase(),
              summary: endpoint.summary || '',
              description: endpoint.description || '',
              parameters: parameters,
              bodyParam: bodyParam,
              responses: responses,
              operationId: endpoint.operationId || '',
              tag: tag,
              apiGroup: apiGroup.name,
              definitions: definitions, // 统一使用 definitions 字段名，但内容可能是 components.schemas
              isV3: isV3
            };
            
            apiMap.get(tag).push(endpointData);
            allEndpoints.push(endpointData);
            
            processedEndpoints++;
            // 每处理 50 个接口更新一次进度
            if (processedEndpoints % 50 === 0) {
              updateLoading();
            }
          });
        });
      });
      
      updateLoading();
      // 渲染侧边栏
      renderSidebar(apiMap, tagDescriptionMap);
      
      updateLoading();
      // 渲染内容区（分批渲染，避免阻塞）
      renderContent(allApis, apiMap, baseUrl);
      
      // 初始化搜索功能
      initSearch(allEndpoints);
      
      // 初始化交互功能
      initInteractions();
      
      // 处理分享链接（延迟执行，确保页面已渲染）
      setTimeout(() => {
        handleShareUrl(allEndpoints);
      }, 1000);
    }, 0);
  }

  // 渲染侧边栏
  function renderSidebar(apiMap, tagDescriptionMap) {
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
      const description = tagDescriptionMap.get(tag) || '';
      
      // 检查该controller-group下是否有被收藏的接口
      const hasFavorites = endpoints.some(ep => isFavorited(ep.path, ep.method));
      const hasFavoritesClass = hasFavorites ? 'has-favorites' : '';
      
      html += `
        <div class="controller-group ${hasFavoritesClass}" data-tag="${escapeHtml(tag)}">
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
    
    // 构建完整的baseUrl（只用于显示，不用于复制）
    // 注意：复制按钮会从 localStorage 获取 baseUrl，所以这里不需要传递
    const fullBaseUrl = host ? basePath : baseUrl;
    
    // 但是，如果 baseUrl 包含域名（http:// 或 https://），则只使用路径部分
    // 因为复制按钮应该只复制路径，而不是完整 URL
    let displayBaseUrl = fullBaseUrl;
    try {
      if (fullBaseUrl && (fullBaseUrl.startsWith('http://') || fullBaseUrl.startsWith('https://'))) {
        const urlObj = new URL(fullBaseUrl);
        displayBaseUrl = urlObj.pathname;
      }
    } catch (e) {
      // 如果解析失败，使用原始值
      displayBaseUrl = fullBaseUrl;
    }
    
    // 清空内容区
    contentArea.innerHTML = '';
    
    // 收集所有需要渲染的 section
    const sectionsToRender = [];
    apiMap.forEach((endpoints, tag) => {
      sectionsToRender.push({ tag, endpoints });
    });
    
    // 分批渲染，避免阻塞 UI
    const batchSize = 5; // 每批渲染 5 个 section
    let currentIndex = 0;
    const fragment = document.createDocumentFragment();
    
    function renderBatch() {
      const endIndex = Math.min(currentIndex + batchSize, sectionsToRender.length);
      
      for (let i = currentIndex; i < endIndex; i++) {
        const { tag, endpoints } = sectionsToRender[i];
        
        // 创建 section 元素
        const section = document.createElement('div');
        section.className = 'api-section';
        section.setAttribute('data-tag', tag);
        
        // 创建标题
        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = tag;
        section.appendChild(title);
        
        // 使用 DOM 操作逐个添加卡片
        endpoints.forEach(ep => {
          const cardHtml = renderApiCard(ep, displayBaseUrl);
          
          // 使用临时容器解析 HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = cardHtml;
          
          // 将解析后的元素添加到 section
          while (tempDiv.firstChild) {
            section.appendChild(tempDiv.firstChild);
          }
        });
        
        // 添加到 DocumentFragment
        fragment.appendChild(section);
      }
      
      currentIndex = endIndex;
      
      // 如果还有未处理的 section，继续处理
      if (currentIndex < sectionsToRender.length) {
        // 每批渲染后更新一次进度
        if (currentIndex % (batchSize * 2) === 0) {
          updateLoading();
        }
        // 使用 requestAnimationFrame 继续渲染，避免阻塞 UI
        requestAnimationFrame(renderBatch);
      } else {
        // 所有 section 都已添加到 fragment，一次性添加到 DOM
        contentArea.appendChild(fragment);
        updateLoading();
        // 绑定事件
        bindContentEvents(contentArea);
        // 隐藏加载提示
        setTimeout(() => {
          hideLoading();
        }, 100);
      }
    }
    
    // 开始第一批渲染
    renderBatch();
  }
  
  // 绑定内容区的事件（提取为独立函数，避免重复绑定）
  function bindContentEvents(contentArea) {
    // 绑定卡片点击事件
    contentArea.querySelectorAll('.api-card').forEach(card => {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.api-details')) return;
        if (e.target.closest('.copy-path-btn')) return; // 不阻止复制按钮的点击
        if (e.target.closest('.favorite-icon')) return; // 不阻止收藏按钮的点击
        if (e.target.closest('.share-icon')) return; // 不阻止分享按钮的点击
        
        const isExpanding = !this.classList.contains('expanded');
        
        // 切换展开/收起状态
        this.classList.toggle('expanded');
        
        // 如果正在展开，懒加载详情内容
        if (isExpanding) {
          const apiDetails = this.querySelector('.api-details');
          if (apiDetails) {
            apiDetails.style.display = 'block';
            // 立即渲染详情，不使用 setTimeout，避免需要点击两次
            renderApiCardDetails(this);
          }
        } else {
          // 收起时隐藏详情
          const apiDetails = this.querySelector('.api-details');
          if (apiDetails) {
            apiDetails.style.display = 'none';
          }
        }
        
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
        
        // 如果 path 已经是完整的 URL（包含 http:// 或 https://），直接使用
        let fullPath = path;
        if (path.startsWith('http://') || path.startsWith('https://')) {
          // 已经是完整 URL，直接复制
        } else {
          // 获取保存的baseUrl
          function getBaseUrl() {
            try {
              return localStorage.getItem('swagger-baseUrl') || '';
            } catch (e) {
              return '';
            }
          }
          
          // 构建完整的路径（加上baseUrl）
          const baseUrl = getBaseUrl().trim();
          if (baseUrl) {
            const normalizedBaseUrl = baseUrl.replace(/\/+$/, ''); // 移除末尾的斜杠
            const normalizedPath = path.replace(/^\/+/, '/'); // 确保路径以单个斜杠开头
            // 如果 baseUrl 只是斜杠，则只使用路径
            if (normalizedBaseUrl && normalizedBaseUrl !== '/') {
              fullPath = normalizedBaseUrl + normalizedPath;
            } else {
              fullPath = normalizedPath;
            }
          } else {
            // 没有设置 baseUrl，只复制路径
            fullPath = path;
          }
        }
        
        // 复制到剪贴板
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(fullPath).then(() => {
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
            fallbackCopy(fullPath, this);
          });
        } else {
          // 降级方案：使用传统方法
          fallbackCopy(fullPath, this);
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
    
    // 绑定协议表格展开/收起事件（使用事件委托，支持动态生成的元素）
    contentArea.addEventListener('click', function(e) {
      if (e.target.closest('.param-expand-icon')) {
        const icon = e.target.closest('.param-expand-icon');
        e.stopPropagation();
        const expandId = icon.getAttribute('data-expand-id');
        if (!expandId) return;
        
        const nestedContent = document.getElementById(expandId);
        if (!nestedContent) return;
        
        // 切换展开/收起状态
        const isCollapsed = nestedContent.classList.contains('collapsed');
        if (isCollapsed) {
          nestedContent.classList.remove('collapsed');
          icon.classList.remove('collapsed');
        } else {
          nestedContent.classList.add('collapsed');
          icon.classList.add('collapsed');
        }
      }
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
    
    // 降级复制方案（枚举）- 暴露到全局作用域，供懒加载的详情使用
    window.fallbackCopyEnum = function(text, btn) {
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
    };
    
    // 注意：initFavorites、initSettings、initRefresh 已经在 initInteractions 中初始化
    // 这里不需要重复初始化，避免重复绑定事件
  }
  
  // 初始化刷新功能
  function initRefresh() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (!refreshBtn) return;
    
    refreshBtn.addEventListener('click', function() {
      // 添加旋转动画
      refreshBtn.classList.add('refreshing');
      
      // 重新加载页面数据
      enhanceSwaggerPage().finally(() => {
        // 移除旋转动画
        setTimeout(() => {
          refreshBtn.classList.remove('refreshing');
        }, 500);
      });
    });
  }
  
  // 初始化设置功能
  function initSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const settingsModalClose = document.getElementById('settingsModalClose');
    const settingsBtnSave = document.getElementById('settingsBtnSave');
    const settingsBtnCancel = document.getElementById('settingsBtnCancel');
    const baseUrlInput = document.getElementById('baseUrlInput');
    
    if (!settingsBtn || !settingsModal) return;
    
    // 获取保存的baseUrl
    function getBaseUrl() {
      try {
        return localStorage.getItem('swagger-baseUrl') || '';
      } catch (e) {
        return '';
      }
    }
    
    // 保存baseUrl
    function saveBaseUrl(baseUrl) {
      try {
        localStorage.setItem('swagger-baseUrl', baseUrl);
      } catch (e) {
        console.error('保存baseUrl失败:', e);
      }
    }
    
    // 打开设置弹窗
    function openSettings() {
      if (baseUrlInput) {
        baseUrlInput.value = getBaseUrl();
      }
      settingsModal.classList.add('active');
    }
    
    // 关闭设置弹窗
    function closeSettings() {
      settingsModal.classList.remove('active');
    }
    
    // 保存设置
    function saveSettings() {
      if (baseUrlInput) {
        const baseUrl = baseUrlInput.value.trim();
        saveBaseUrl(baseUrl);
        console.log('保存baseUrl:', baseUrl);
        closeSettings();
        // 提示保存成功
        const originalText = settingsBtnSave.textContent;
        settingsBtnSave.textContent = '已保存';
        setTimeout(() => {
          settingsBtnSave.textContent = originalText;
        }, 1000);
      }
    }
    
    // 绑定事件
    settingsBtn.addEventListener('click', openSettings);
    if (settingsModalClose) {
      settingsModalClose.addEventListener('click', closeSettings);
    }
    if (settingsBtnSave) {
      settingsBtnSave.addEventListener('click', saveSettings);
    }
    if (settingsBtnCancel) {
      settingsBtnCancel.addEventListener('click', closeSettings);
    }
    
    // 点击弹窗外部关闭
    settingsModal.addEventListener('click', function(e) {
      if (e.target === settingsModal) {
        closeSettings();
      }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && settingsModal.classList.contains('active')) {
        closeSettings();
      }
    });
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
      
      // 更新controller-group的标识
      updateControllerGroupFavorites();
    }
    
    // 更新controller-group的收藏标识
    function updateControllerGroupFavorites() {
      document.querySelectorAll('.controller-group').forEach(group => {
        const tag = group.getAttribute('data-tag');
        if (!tag) return;
        
        // 检查该group下是否有收藏的接口
        const endpointItems = group.querySelectorAll('.endpoint-item');
        let hasFavorites = false;
        
        endpointItems.forEach(item => {
          const path = item.getAttribute('data-path');
          const method = item.getAttribute('data-method');
          if (isFavorited(path, method)) {
            hasFavorites = true;
          }
        });
        
        // 更新has-favorites类
        if (hasFavorites) {
          group.classList.add('has-favorites');
        } else {
          group.classList.remove('has-favorites');
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
    
    // 绑定收藏图标点击事件（使用命名函数，避免重复绑定）
    // 先移除旧的事件监听器（如果存在）
    if (window.favoriteIconClickHandler) {
      document.removeEventListener('click', window.favoriteIconClickHandler);
    }
    
    window.favoriteIconClickHandler = function(e) {
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
    };
    
    document.addEventListener('click', window.favoriteIconClickHandler);
    
    // 处理分享按钮点击
    // 先移除旧的事件监听器（如果存在）
    if (window.shareIconClickHandler) {
      document.removeEventListener('click', window.shareIconClickHandler);
    }
    
    window.shareIconClickHandler = function(e) {
      if (e.target.closest('.share-icon')) {
        const icon = e.target.closest('.share-icon');
        const path = icon.getAttribute('data-path');
        const method = icon.getAttribute('data-method');
        const tag = icon.getAttribute('data-tag');
        const operationId = icon.getAttribute('data-operation-id');
        const apiGroupName = icon.getAttribute('data-api-group');
        
        e.stopPropagation(); // 阻止触发卡片展开
        
        // 生成分享链接
        const shareUrl = generateShareUrl(tag, operationId, apiGroupName);
        
        // 复制到剪贴板
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            const originalText = icon.textContent;
            icon.textContent = '✓';
            icon.classList.add('copied');
            
            setTimeout(() => {
              icon.textContent = originalText;
              icon.classList.remove('copied');
            }, 2000);
          }).catch(err => {
            console.error('复制失败:', err);
            fallbackCopyShare(shareUrl, icon);
          });
        } else {
          fallbackCopyShare(shareUrl, icon);
        }
      }
    };
    
    document.addEventListener('click', window.shareIconClickHandler);
    
    // 降级复制方案（分享链接）
    function fallbackCopyShare(text, btn) {
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
  
  // 渲染API卡片（优化：懒加载详情部分）
  function renderApiCard(endpoint, baseUrl) {
    // 转义路径中的特殊字符用于ID
    const regex = new RegExp('[.*+?^$()|[\\]\\\\]', 'g');
    const safePathId = endpoint.path.replace(regex, '-');
    const cardId = `api-${safePathId}-${endpoint.method}`;
    
    // 注意：这里不再构建 fullPath，因为复制按钮会在点击时根据 baseUrl 设置来拼接
    // 这样可以避免 v3 版本中 baseUrl 可能包含域名的问题
    
    // 将 endpoint 数据存储在 data 属性中，用于懒加载
    const endpointData = JSON.stringify({
      path: endpoint.path,
      method: endpoint.method,
      tag: endpoint.tag || '',
      summary: endpoint.summary || '',
      description: endpoint.description || '',
      parameters: endpoint.parameters || [],
      bodyParam: endpoint.bodyParam || null,
      responses: endpoint.responses || {},
      definitions: endpoint.definitions || {},
      operationId: endpoint.operationId || '',
      apiGroup: endpoint.apiGroup || ''
    });
    
    return `
      <div class="api-card" id="${cardId}" data-path="${escapeHtml(endpoint.path)}" data-method="${endpoint.method}" data-tag="${escapeHtml(endpoint.tag || '')}" data-endpoint='${escapeHtml(endpointData)}'>
        <div class="api-card-header">
          <span class="http-method method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
          <span class="api-path">
            ${escapeHtml(endpoint.path)}
            <span class="copy-path-btn" data-path="${escapeHtml(endpoint.path)}" title="复制接口地址">📄</span>
            <span class="api-summary">${escapeHtml(endpoint.summary || '')}</span>
          </span>
          <span class="favorite-icon" data-path="${escapeHtml(endpoint.path)}" data-method="${endpoint.method}" data-tag="${escapeHtml(endpoint.tag || '')}" title="收藏接口">⭐</span>
          <span class="share-icon" data-path="${escapeHtml(endpoint.path)}" data-method="${endpoint.method}" data-tag="${escapeHtml(endpoint.tag || '')}" data-operation-id="${escapeHtml(endpoint.operationId || '')}" data-api-group="${escapeHtml(endpoint.apiGroup || '')}" title="分享接口">🔗</span>
          <span class="expand-icon">▼</span>
        </div>
        <div class="api-details" style="display: none;">
          <div class="details-content">
            <!-- 详情内容将在展开时懒加载 -->
            <div class="loading-placeholder" style="padding: 20px; text-align: center; color: var(--text-secondary);">加载中...</div>
          </div>
        </div>
      </div>
    `;
  }
  
  // 懒加载渲染 API 卡片详情
  function renderApiCardDetails(cardElement) {
    const detailsContent = cardElement.querySelector('.details-content');
    if (!detailsContent) return;
    
    // 检查是否已经渲染过（检查是否有 detail-section 且不是 loading-placeholder）
    const existingSection = detailsContent.querySelector('.detail-section');
    const hasPlaceholder = detailsContent.querySelector('.loading-placeholder');
    
    // 如果已经有内容且不是占位符，说明已经渲染过，直接返回
    if (existingSection && !hasPlaceholder) {
      return;
    }
    
    // 从 data 属性获取 endpoint 数据
    const endpointDataStr = cardElement.getAttribute('data-endpoint');
    if (!endpointDataStr) return;
    
    try {
      const endpoint = JSON.parse(endpointDataStr);
      const cardId = cardElement.id;
      const params = endpoint.parameters || [];
      const bodyParam = endpoint.bodyParam || null;
      
      // 清空占位符
      detailsContent.innerHTML = '';
      
      // 渲染详情内容
      if (endpoint.description) {
        detailsContent.innerHTML += `
          <div class="detail-section">
            <div class="detail-label">接口描述</div>
            <p style="color: var(--text-secondary); line-height: 1.6;">${escapeHtml(endpoint.description)}</p>
          </div>
        `;
      }
      
      if (params.length > 0 || bodyParam) {
        detailsContent.innerHTML += `
          <div class="detail-section">
            <div class="detail-label">请求参数</div>
            ${renderRequestParams(params, bodyParam, endpoint.definitions, cardId)}
          </div>
        `;
      }
      
      if (Object.keys(endpoint.responses).length > 0) {
        detailsContent.innerHTML += `
          <div class="detail-section">
            <div class="detail-label">响应示例</div>
            ${renderResponseExample(endpoint.responses, endpoint.definitions, cardId)}
          </div>
        `;
      }
      
      // 绑定标签页切换事件
      detailsContent.querySelectorAll('.code-tab').forEach(tab => {
        tab.addEventListener('click', function() {
          const tabName = this.getAttribute('data-tab');
          const codeBlock = this.closest('.code-block');
          if (!codeBlock) return;
          
          // 切换标签
          codeBlock.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
          codeBlock.querySelectorAll('.code-content').forEach(c => c.classList.remove('active'));
          
          this.classList.add('active');
          // 使用 getElementById 而不是 querySelector，避免路径中的斜杠导致选择器错误
          const targetContent = document.getElementById(tabName);
          if (targetContent) {
            targetContent.classList.add('active');
          }
        });
      });
      
      // 绑定协议表格的展开/收起事件
      detailsContent.querySelectorAll('.param-expand-icon').forEach(icon => {
        icon.addEventListener('click', function(e) {
          e.stopPropagation();
          const expandId = this.getAttribute('data-expand-id');
          const nestedContent = document.getElementById(expandId);
          if (nestedContent) {
            const isExpanded = nestedContent.style.display !== 'none';
            nestedContent.style.display = isExpanded ? 'none' : 'block';
            this.textContent = isExpanded ? '▶' : '▼';
          }
        });
      });
      
      // 绑定枚举复制按钮事件（懒加载的详情需要单独绑定）
      detailsContent.querySelectorAll('.enum-copy-btn').forEach(btn => {
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
              if (window.fallbackCopyEnum) {
                window.fallbackCopyEnum(decodedText, this);
              }
            });
          } else {
            if (window.fallbackCopyEnum) {
              window.fallbackCopyEnum(decodedText, this);
            }
          }
        });
      });
    } catch (error) {
      console.error('渲染卡片详情失败:', error);
      detailsContent.innerHTML = '<div style="padding: 20px; color: var(--text-error);">加载失败</div>';
    }
  }
  
  // 检测描述中是否包含枚举值
  function hasEnumInDescription(description) {
    // 严格类型检查
    if (!description) return false;
    if (typeof description !== 'string') return false;
    
    // 限制字符串长度，避免处理过长的字符串
    if (description.length > 1000) return false;
    
    // 排除日期格式
    if (description.includes('yyyy-MM-dd') || description.includes('yyyy-mm-dd')) return false;
    
    try {
      // 匹配格式：描述 枚举1:值1 枚举2:值2 或 枚举1：值1 枚举2：值2
      // 至少需要两个枚举项（用空格分隔，每个枚举项包含冒号）
      // 或者只有一个枚举项但前面有描述
      // 使用更安全的正则表达式，避免回溯问题
      const enumPattern = /[\w\u4e00-\u9fa5]+[：:][\w\u4e00-\u9fa5\d]+/;
      
      // 使用简单的字符串搜索，避免复杂的正则表达式回溯问题
      // 检查是否包含 "xxx:yyy" 或 "xxx：yyy" 格式
      // 使用 indexOf 而不是 match，更安全
      const hasColon = description.includes(':') || description.includes('：');
      if (!hasColon) return false;
      
      // 简单检查：至少找到一个有效的 "字符:字符" 模式
      // 限制检查范围，避免处理过长字符串
      const checkLength = Math.min(description.length, 200);
      const checkStr = description.substring(0, checkLength);
      
      // 使用简单的正则表达式，但限制匹配次数
      const simplePattern = /[\w\u4e00-\u9fa5]+[：:][\w\u4e00-\u9fa5\d]+/;
      return simplePattern.test(checkStr);
    } catch (error) {
      console.error('hasEnumInDescription error:', error);
      return false;
    }
  }
  
  // 解析枚举值
  function parseEnumValues(description) {
    if (!description || typeof description !== 'string') return null;
    
    // 限制字符串长度，避免处理过长的字符串
    if (description.length > 500) {
      description = description.substring(0, 500);
    }
    
    try {
      // 匹配所有 "value:label" 或 "value：label" 格式的枚举项
      // 根据用户示例：function:函数 tag:标签，格式是 value:label
      // value和label可以是中文、英文、数字
      const enumPattern = /([\w\u4e00-\u9fa5\d]+)[：:]([\w\u4e00-\u9fa5\d]+)/g;
      
      // 使用更安全的方式处理匹配，避免使用展开运算符导致堆栈溢出
      const result = [];
      let match;
      let matchCount = 0;
      const maxMatches = 50; // 最多匹配50次，避免过多匹配
      
      // 重置正则表达式的 lastIndex，确保从头开始匹配
      enumPattern.lastIndex = 0;
      
      while ((match = enumPattern.exec(description)) !== null && matchCount < maxMatches) {
        const value = match[1]; // 冒号前面的是value
        const label = match[2]; // 冒号后面的是label
        
        // 判断value是否为纯数字
        const numValue = /^\d+$/.test(value) ? parseInt(value, 10) : value;
        result.push({ label, value: numValue });
        
        matchCount++;
        
        // 防止无限循环：如果匹配位置没有前进，跳出循环
        if (enumPattern.lastIndex === match.index) {
          enumPattern.lastIndex++;
        }
      }
      
      return result.length > 0 ? result : null;
    } catch (error) {
      console.error('parseEnumValues error:', error);
      return null;
    }
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
    // 确保 description 是字符串类型
    if (!description || typeof description !== 'string') {
      return '';
    }
    
    // 限制字符串长度
    if (description.length > 1000) {
      return '';
    }
    
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
    
    // 处理$ref引用（兼容 v2 和 v3）
    if (schema.$ref) {
      // v2: #/definitions/ModelName
      // v3: #/components/schemas/ModelName
      const refPath = schema.$ref.split('/');
      const refName = refPath[refPath.length - 1];
      
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
    
    // 处理$ref引用（兼容 v2 和 v3）
    if (schema.$ref) {
      // v2: #/definitions/ModelName
      // v3: #/components/schemas/ModelName
      const refPath = schema.$ref.split('/');
      const refName = refPath[refPath.length - 1];
      
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
    // 限制递归深度，避免堆栈溢出
    const MAX_DEPTH = 10;
    if (level > MAX_DEPTH) {
      return '<div style="color: var(--text-secondary); padding: 8px;">[递归深度超过限制]</div>';
    }
    
    if (!schema) return '<div>无定义</div>';
    
    // 处理$ref引用（兼容 v2 和 v3）
    if (schema.$ref) {
      // v2: #/definitions/ModelName
      // v3: #/components/schemas/ModelName
      const refPath = schema.$ref.split('/');
      const refName = refPath[refPath.length - 1];
      
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
      
      // 限制处理的属性数量，避免处理过多属性导致性能问题
      const maxProps = 100;
      const propKeys = Object.keys(props).slice(0, maxProps);
      
      let html = '<table class="params-table">';
      html += '<thead><tr><th>字段名</th><th>描述</th><th>类型</th><th>必填</th></tr></thead>';
      html += '<tbody>';
      
      propKeys.forEach(key => {
        const prop = props[key];
        const isRequired = required.includes(key);
        const propType = getSchemaType(prop, definitions);
        
        // 判断是否有嵌套内容
        const newVisited = new Set(visited);
        let nestedHtml = '';
        let hasNested = false;
        
        if (prop.type === 'object' && prop.properties) {
          // 检查是否已经访问过相同的对象结构（通过检查是否有相同的属性键）
          // 使用简单的启发式方法：如果属性数量相同且前几个键相同，可能是循环引用
          const propKeys = Object.keys(prop.properties || {});
          if (propKeys.length > 0 && level < MAX_DEPTH) {
            nestedHtml = renderSchemaProtocol(prop, definitions, newVisited, level + 1);
            hasNested = true;
          }
        } else if (prop.type === 'array' && prop.items) {
          if (prop.items.type === 'object' || prop.items.properties || prop.items.$ref) {
            if (level < MAX_DEPTH) {
              nestedHtml = `
                ${renderSchemaProtocol(prop.items, definitions, newVisited, level + 1)}
              `;
              hasNested = true;
            }
          }
        } else if (prop.$ref) {
          const refName = prop.$ref.split('/').pop();
          if (!newVisited.has(refName)) {
            const refSchema = definitions[refName];
            if (refSchema && level < MAX_DEPTH) {
              nestedHtml = renderSchemaProtocol(refSchema, definitions, newVisited, level + 1);
              hasNested = true;
            }
          } else {
            nestedHtml = '<div style="color: var(--text-secondary); padding: 8px;">[循环引用: ' + escapeHtml(refName) + ']</div>';
            hasNested = true;
          }
        }
        
        // 生成唯一ID用于展开/收起
        const expandId = `param-expand-${level}-${key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        html += `
          <tr>
            <td>
              <span class="param-name">
                ${hasNested ? `<span class="param-expand-icon" data-expand-id="${expandId}" title="展开/收起">▼</span>` : '<span style="width: 16px; display: inline-block;"></span>'}
                ${escapeHtml(key)}
              </span>
            </td>
            <td class="param-desc">
              <span class="param-desc-text">${escapeHtml(prop.description || '')}</span>
              ${renderEnumCopyButton(typeof prop.description === 'string' ? prop.description : '')}
            </td>
            <td>${escapeHtml(propType)}</td>
            <td>${isRequired ? '<span>● 必填</span>' : '选填'}</td>
          </tr>
        `;
        
        if (nestedHtml) {
          html += `
            <tr>
              <td colspan="4" style="padding: 0; border-top: none;">
                <div class="param-nested-content" id="${expandId}" style="padding: 12px 20px; background: rgba(15, 23, 42, 0.5); border-left: 2px solid var(--border-color);">
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
  
  // 初始化搜索功能
  function initSearch(allEndpoints) {
    const searchInput = document.getElementById('globalSearch');
    const searchResults = document.getElementById('searchResults');
    const searchClearBtn = document.getElementById('searchClearBtn');
    
    if (!searchInput || !searchResults) return;
    
    // 更新清空按钮的显示状态
    function updateClearButton() {
      if (searchClearBtn) {
        if (searchInput.value.trim().length > 0) {
          searchClearBtn.classList.add('visible');
        } else {
          searchClearBtn.classList.remove('visible');
        }
      }
    }
    
    // 清空搜索内容
    function clearSearch() {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        updateClearButton();
        // 触发input事件以更新搜索结果
        searchInput.dispatchEvent(new Event('input'));
      }
    }
    
    // 绑定清空按钮点击事件
    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        clearSearch();
      });
    }
    
    // 初始化清空按钮状态
    updateClearButton();
    
    searchInput.addEventListener('input', (e) => {
      updateClearButton();
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
        // 如果卡片未展开，先展开并加载详情
        if (!card.classList.contains('expanded')) {
          card.classList.add('expanded');
          const apiDetails = card.querySelector('.api-details');
          if (apiDetails) {
            apiDetails.style.display = 'block';
            // 立即渲染详情
            renderApiCardDetails(card);
          }
        }
        
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
        
        // 如果卡片未展开，展开并加载详情
        if (!card.classList.contains('expanded')) {
          card.classList.add('expanded');
          const apiDetails = card.querySelector('.api-details');
          if (apiDetails) {
            apiDetails.style.display = 'block';
            // 立即渲染详情
            renderApiCardDetails(card);
          }
        }
        
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
    
    // 初始化收藏、设置和刷新功能
    initFavorites();
    initSettings();
    initRefresh();
  }

  // 检测Swagger页面并自动激活（可选）
  // 如果需要自动激活，取消下面的注释
  /*
  if (isSwaggerPage()) {
    // 可以在这里添加自动激活逻辑
  }
  */
})();
