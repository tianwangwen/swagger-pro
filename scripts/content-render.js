'use strict';

// 主渲染流程：解析 Swagger、侧栏、内容区分批渲染

function executeRender(allApis, baseUrl) {
  // 直接执行渲染逻辑，不使用内联脚本
  renderSwaggerContent(allApis, baseUrl);
}
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
              <span class="endpoint-path-summary-wrap">
                <span class="endpoint-path">${escapeHtml(ep.path)}</span>
                ${ep.summary ? `<span class="endpoint-summary">${escapeHtml(ep.summary)}</span>` : ''}
              </span>
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
      // 内容渲染完成后，再初始化收藏、设置和刷新，保证元素已存在
      if (typeof initSwaggerProTestApi === 'function') {
        initSwaggerProTestApi();
      }
      if (typeof initFavorites === 'function') {
        initFavorites();
      }
      if (typeof initSettings === 'function') {
        initSettings();
      }
      if (typeof initRefresh === 'function') {
        initRefresh();
      }
      // 隐藏加载提示
      setTimeout(() => {
        hideLoading();
      }, 100);
    }
  }
  
  // 开始第一批渲染
  renderBatch();
}
