'use strict';

// Schema / 参数表 / 响应示例 / 枚举解析

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

