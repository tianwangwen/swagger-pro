'use strict';

// 拉取 Swagger v2 / v3 文档

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
            const url = resource.url || resource.location
            try {
              const apiUrl = url.startsWith('http') 
                ? url 
                : `${baseUrl}${url}`;
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
