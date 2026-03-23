'use strict';

// 全屏 Loading、Toast、进度文案

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

// 轻量提示（Toast）
function showToast(message, duration = 2000) {
  if (!message) return;
  
  let container = document.getElementById('swagger-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'swagger-toast-container';
    container.style.cssText = `
      position: fixed;
      right: 24px;
      top: 90px;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    max-width: 320px;
    background: rgba(15, 23, 42, 0.95);
    color: #e5e7eb;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    border: 1px solid rgba(148, 163, 184, 0.5);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35);
    pointer-events: auto;
    opacity: 0;
    transform: translateY(-6px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  `;
  
  container.appendChild(toast);
  
  // 直接显示，保证在任何环境下都能看到
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  
  const remove = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 200);
  };
  
  const timer = setTimeout(remove, duration);
  
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
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
