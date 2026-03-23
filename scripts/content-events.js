'use strict';

// 内容区事件：卡片展开、复制路径、Tab、枚举等

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
          if (typeof showToast === 'function') {
            showToast('已复制接口地址');
          }
          
          setTimeout(() => {
            this.textContent = originalText;
            this.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('复制失败:', err);
          if (typeof showToast === 'function') {
            showToast('复制失败，已尝试兼容方案');
          }
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
      if (typeof showToast === 'function') {
        showToast('已复制接口地址');
      }
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      if (typeof showToast === 'function') {
        showToast('复制失败，请手动复制');
      } else {
        alert('复制失败，请手动复制');
      }
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
  
  // 收藏、设置、刷新在内容渲染完成后统一初始化，避免重复绑定事件
}
