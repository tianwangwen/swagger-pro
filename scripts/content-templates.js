'use strict';

// HTML 转义、页头与主布局模板字符串

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
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
function getMainContainerHTMLContent() {
  return `
      <aside class="sidebar" id="sidebar">
          <nav class="nav-tree" id="navTree"></nav>
          <div class="sidebar-resize-handle" id="sidebarResizeHandle" title="拖拽调整宽度"></div>
      </aside>
      <main class="content-area" id="contentArea"></main>
  `;
}
