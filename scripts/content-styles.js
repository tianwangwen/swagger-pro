'use strict';

// 注入 CSS（getStylesContent 体积较大）

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = getStylesContent();
  document.head.appendChild(style);
}
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
          --sp-tooltip-bg: #303133;
          --sp-tooltip-color: #ffffff;
      }
      .sp-tooltip-popper {
          position: fixed;
          z-index: 2147483646;
          max-width: min(320px, calc(100vw - 16px));
          padding: 8px 12px;
          background: var(--sp-tooltip-bg);
          color: var(--sp-tooltip-color);
          font-size: 12px;
          line-height: 1.5;
          font-weight: 400;
          border-radius: 4px;
          box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.24);
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.1s ease, visibility 0.1s ease;
          word-break: break-word;
          text-align: left;
      }
      .sp-tooltip-popper--visible {
          opacity: 1;
          visibility: visible;
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
          min-width: 200px;
          max-width: 80vw;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          height: calc(100vh - 70px);
          overflow-y: auto;
          position: relative;
          flex-shrink: 0;
      }
      .sidebar.sidebar-resizing {
          transition: none;
      }
      .sidebar.collapsed {
          width: 60px;
          min-width: 60px;
      }
      .sidebar.collapsed .sidebar-resize-handle {
          display: none;
      }
      .sidebar-resize-handle {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          cursor: col-resize;
          z-index: 10;
          user-select: none;
          -webkit-user-select: none;
      }
      .sidebar-resize-handle::after {
          content: '';
          position: absolute;
          right: 2px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 40px;
          background: var(--border-color);
          border-radius: 1px;
          opacity: 0;
          transition: opacity 0.2s;
      }
      .sidebar-resize-handle:hover::after,
      .sidebar-resize-handle.sidebar-resize-active::after {
          opacity: 1;
          background: var(--accent-blue);
      }
      body.sidebar-resizing {
          cursor: col-resize;
          user-select: none;
      }
      body.sidebar-resizing * {
          cursor: col-resize !important;
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
          flex-shrink: 0;
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
          align-items: center;
          gap: 4px;
          flex: 1;
          overflow: hidden;
          text-overflow:ellipsis;
          white-space: nowrap;
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
          color: rgba(255, 255, 255, 0.8);
          font-family: monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
          max-width: 100%;
      }
      .endpoint-path-summary-wrap {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
      }
      .endpoint-path-summary-wrap .endpoint-path {
          flex: 0 1 auto;
          min-width: 0;
      }
      .endpoint-summary {
          color: #94a3b8;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
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
          overflow: visible;
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
          min-width: 0;
          overflow: visible;
      }
      .api-path-text {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
      }
      .copy-path-btn,
      .copy-protocol-btn,
      .api-test-btn {
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
      .copy-path-btn:hover,
      .copy-protocol-btn:hover,
      .api-test-btn:hover {
          opacity: 1;
          background: var(--bg-tertiary);
          color: var(--accent-blue);
      }
      .api-test-btn:hover {
          color: var(--accent-green);
      }
      .copy-path-btn.copied,
      .copy-protocol-btn.copied {
          color: var(--accent-green);
          opacity: 1;
      }
      .api-summary {
          color: var(--text-secondary);
          font-size: 14px;
          margin-right: 20px;
          min-width: 0;
          flex: 0 1 auto;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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
          max-width: 560px;
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
      .settings-item-desc code {
          font-size: 11px;
          padding: 1px 4px;
          border-radius: 4px;
          background: var(--bg-tertiary);
          color: var(--accent-blue);
      }
      .custom-headers-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
      }
      .custom-header-row {
          display: grid;
          grid-template-columns: 1fr 1fr 32px;
          gap: 8px;
          align-items: center;
      }
      .custom-header-row input {
          width: 100%;
          height: 36px;
          padding: 0 10px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 13px;
          box-sizing: border-box;
      }
      .custom-header-row input:focus {
          outline: none;
          border-color: var(--accent-blue);
      }
      .custom-header-remove {
          width: 32px;
          height: 32px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
      }
      .custom-header-remove:hover {
          background: var(--bg-tertiary);
          color: var(--accent-red);
      }
      .custom-headers-add-btn {
          margin-top: 10px;
          height: 34px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px dashed var(--border-color);
          background: transparent;
          color: var(--accent-blue);
          font-size: 13px;
          cursor: pointer;
      }
      .custom-headers-add-btn:hover {
          border-color: var(--accent-blue);
          background: rgba(59, 130, 246, 0.08);
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
      .sp-test-modal {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 10002;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
      }
      .sp-test-modal.active {
          display: flex;
      }
      .sp-test-modal__backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
      }
      .sp-test-modal__panel {
          position: relative;
          width: 100%;
          max-width: 720px;
          max-height: min(90vh, 900px);
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
      }
      .sp-test-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
      }
      .sp-test-modal__header--compact {
          gap: 12px;
      }
      .sp-test-modal__title {
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          color: var(--text-primary);
      }
      .sp-test-modal__close {
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 16px;
          cursor: pointer;
      }
      .sp-test-modal__close:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
      }
      .sp-test-modal__body {
          padding: 16px 20px 20px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
      }
      .sp-test-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 14px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
      }
      .sp-test-panels {
          min-height: 240px;
      }
      .sp-test-tab {
          height: 30px;
          padding: 0 12px;
          border: 1px solid transparent;
          border-radius: 7px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
      }
      .sp-test-tab:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
      }
      .sp-test-tab.active {
          border-color: var(--accent-blue);
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
      }
      .sp-test-panel {
          display: none;
          min-height: 240px;
      }
      .sp-test-panel.active {
          display: block;
      }
      .sp-test-panel-tip {
          margin-bottom: 10px;
          font-size: 12px;
          color: var(--text-secondary);
      }
      .sp-test-modal__row--method {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
      }
      .sp-test-modal__row--method .sp-test-modal__label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
      }
      .sp-test-modal__method {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
      }
      .sp-test-modal__url {
          flex: 1;
          min-width: 200px;
          font-size: 12px;
          line-height: 1.5;
          word-break: break-all;
          padding: 8px 10px;
          border-radius: 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: #a5d6ff;
      }
      .sp-test-modal__hint {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.55;
          margin-bottom: 14px;
      }
      .sp-test-modal__hint code {
          font-size: 11px;
          padding: 1px 5px;
          border-radius: 4px;
          background: var(--bg-tertiary);
          color: var(--accent-blue);
      }
      .sp-test-modal__field {
          margin-bottom: 12px;
      }
      .sp-test-modal__label-block {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
      }
      .sp-test-modal__label-tip {
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          cursor: help;
          user-select: none;
          background: var(--bg-secondary);
      }
      .sp-test-modal__label-tip:hover {
          color: var(--accent-blue);
          border-color: var(--accent-blue);
      }
      .sp-test-modal__textarea {
          width: 100%;
          min-height: 200px;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: #e6edf3;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          line-height: 1.5;
          resize: vertical;
          box-sizing: border-box;
      }
      .sp-test-modal__textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
      }
      .sp-test-modal__textarea:focus {
          outline: none;
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
      }
      .sp-test-modal__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
          margin-bottom: 12px;
          margin-top: 12px;
      }
      .sp-test-kv__list {
          display: flex;
          flex-direction: column;
          gap: 8px;
      }
      .sp-test-kv__row {
          display: grid;
          grid-template-columns: 1fr 1fr 32px;
          gap: 8px;
          align-items: center;
      }
      .sp-test-kv__row input {
          width: 100%;
          height: 34px;
          padding: 0 10px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 12px;
      }
      .sp-test-kv__row input:focus {
          outline: none;
          border-color: var(--accent-blue);
      }
      .sp-test-kv__key--readonly {
          color: #a5d6ff;
          background: rgba(59, 130, 246, 0.08);
      }
      .sp-test-kv__remove {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
      }
      .sp-test-kv__remove:hover:not(:disabled) {
          color: var(--accent-red);
      }
      .sp-test-kv__remove:disabled {
          opacity: 0.35;
          cursor: not-allowed;
      }
      .sp-test-kv__add {
          margin-top: 10px;
          height: 30px;
          padding: 0 10px;
          border-radius: 8px;
          border: 1px dashed var(--border-color);
          background: transparent;
          color: var(--accent-blue);
          font-size: 12px;
          cursor: pointer;
      }
      .sp-test-kv__add:hover {
          background: rgba(59, 130, 246, 0.08);
      }
      .sp-test-modal__btn {
          height: 36px;
          padding: 0 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--border-color);
      }
      .sp-test-modal__btn--primary {
          background: var(--accent-blue);
          color: #fff;
          border-color: var(--accent-blue);
      }
      .sp-test-modal__btn--primary:hover:not(:disabled) {
          filter: brightness(1.08);
      }
      .sp-test-modal__btn--primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
      }
      .sp-test-modal__btn--ghost {
          background: var(--bg-secondary);
          color: var(--text-primary);
      }
      .sp-test-modal__btn--ghost:hover {
          background: var(--bg-tertiary);
      }
      .sp-test-modal__error {
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          font-size: 13px;
          margin-bottom: 12px;
      }
      .sp-test-modal__response {
          min-height: 180px;
      }
      .sp-test-modal__response--placeholder {
          visibility: hidden;
      }
      .sp-test-modal__response-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
      }
      .sp-test-modal__status {
          font-size: 12px;
          font-weight: 600;
          font-family: monospace;
      }
      .sp-test-modal__status--2xx {
          color: var(--accent-green);
      }
      .sp-test-modal__status--err {
          color: var(--accent-orange);
      }
      .sp-test-modal__response-pre {
          margin: 0;
          max-height: 320px;
          overflow: auto;
          padding: 12px;
          border-radius: 10px;
          background: #0d1117;
          border: 1px solid var(--border-color);
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          line-height: 1.55;
          color: #e6edf3;
          white-space: pre-wrap;
          word-break: break-word;
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
