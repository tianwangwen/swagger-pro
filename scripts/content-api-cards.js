'use strict';

// API 卡片 HTML 与懒加载详情

function renderApiCard(endpoint, baseUrl) {
  // 转义路径中的特殊字符用于ID
  const regex = new RegExp('[.*+?^$()|[\\]\\\\]', 'g');
  const safePathId = endpoint.path.replace(regex, '-');
  const cardId = `api-${safePathId}-${endpoint.method}`;
  
  // 注意：这里不再构建 fullPath，因为复制按钮会在点击时根据 baseUrl 设置来拼接
  // 这样可以避免 v3 版本中 baseUrl 可能包含域名的问题
  
  // 将 endpoint 数据存储在内存 Map 中，避免在 DOM 属性里塞大 JSON
  endpointMap.set(cardId, {
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
    apiGroup: endpoint.apiGroup || '',
    isV3: endpoint.isV3 || false
  });
  
  return `
    <div class="api-card" id="${cardId}" data-path="${escapeHtml(endpoint.path)}" data-method="${endpoint.method}" data-tag="${escapeHtml(endpoint.tag || '')}">
      <div class="api-card-header">
        <span class="http-method method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
        <span class="api-path">
          ${escapeHtml(endpoint.path)}
          <span class="copy-path-btn" data-path="${escapeHtml(endpoint.path)}" title="复制接口地址">📄</span>
          <span class="api-summary">${escapeHtml(endpoint.summary || '')}</span>
        </span>
        <span class="favorite-icon" data-path="${escapeHtml(endpoint.path)}" data-method="${endpoint.method}" data-tag="${escapeHtml(endpoint.tag || '')}" title="收藏接口">☆</span>
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
  
  // 从内存 Map 中获取 endpoint 数据，避免从 DOM 属性中反序列化大 JSON
  const cardId = cardElement.id;
  const endpoint = endpointMap.get(cardId);
  if (!endpoint) return;
  
  try {
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
