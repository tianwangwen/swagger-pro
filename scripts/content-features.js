'use strict';

// 刷新、设置、收藏、全局搜索、侧栏交互

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
      if (typeof showToast === 'function') {
        showToast('已收藏接口');
      }
    }
  }
  
  // 移除收藏
  function removeFavorite(path, method) {
    const favorites = getFavorites();
    const filtered = favorites.filter(f => !(f.path === path && f.method === method));
    saveFavorites(filtered);
    updateFavoriteIcons();
    updateFavoritesDropdown();
    if (typeof showToast === 'function') {
      showToast('已取消收藏');
    }
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
          <span class="favorite-item-remove" data-tooltip="从收藏中移除">×</span>
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
  const sidebar = document.getElementById('sidebar');
  if (collapseBtn && sidebar) {
    collapseBtn.addEventListener('click', function() {
      if (sidebar.classList.contains('collapsed')) {
        // 展开：恢复保存的宽度
        const saved = localStorage.getItem('swagger-pro-sidebar-width');
        const w = saved ? Math.min(800, Math.max(200, parseInt(saved, 10))) : 300;
        sidebar.style.width = w + 'px';
      } else {
        // 折叠前保存当前宽度
        const w = sidebar.offsetWidth;
        if (w >= 200) localStorage.setItem('swagger-pro-sidebar-width', String(w));
      }
      sidebar.classList.toggle('collapsed');
    });
  }

  // 侧边栏拖拽调整宽度
  const resizeHandle = document.getElementById('sidebarResizeHandle');
  if (resizeHandle && sidebar) {
    const SIDEBAR_MIN = 200;
    const SIDEBAR_MAX = Math.min(800, Math.floor(window.innerWidth * 0.8));

    // 恢复上次保存的宽度（仅当未折叠时）
    if (!sidebar.classList.contains('collapsed')) {
      const saved = localStorage.getItem('swagger-pro-sidebar-width');
      if (saved) {
        const w = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, parseInt(saved, 10)));
        sidebar.style.width = w + 'px';
      }
    }

    resizeHandle.addEventListener('mousedown', function(e) {
      if (e.button !== 0 || sidebar.classList.contains('collapsed')) return;
      e.preventDefault();
      resizeHandle.classList.add('sidebar-resize-active');
      sidebar.classList.add('sidebar-resizing');
      document.body.classList.add('sidebar-resizing');

      const startX = e.clientX;
      const startWidth = sidebar.offsetWidth;

      function onMouseMove(e) {
        const dx = e.clientX - startX;
        let newWidth = startWidth + dx;
        newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, newWidth));
        sidebar.style.width = newWidth + 'px';
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        resizeHandle.classList.remove('sidebar-resize-active');
        sidebar.classList.remove('sidebar-resizing');
        document.body.classList.remove('sidebar-resizing');
        const w = sidebar.offsetWidth;
        if (w >= SIDEBAR_MIN) localStorage.setItem('swagger-pro-sidebar-width', String(w));
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }
  
}
