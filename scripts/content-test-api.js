'use strict';

// 接口测试弹窗：Postman 风格 Body / Headers / Query / Path Tab

const SWAGGER_PRO_TEST_MODAL_ID = 'swaggerProTestModal';

let testModalState = {
  cardId: null,
  endpoint: null,
  activeTab: 'body',
  seed: null,
  canHaveBody: true
};

function getSwaggerProBaseUrlSetting() {
  try {
    return localStorage.getItem('swagger-baseUrl') || '';
  } catch {
    return '';
  }
}

function getSwaggerProCustomHeadersFromStorage() {
  try {
    const raw = localStorage.getItem('swagger-customHeaders');
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(h => h && String(h.key || '').trim()) : [];
  } catch {
    return [];
  }
}

function resolveSwaggerProRequestUrl(path, baseUrlSetting) {
  const pathTrim = (path || '').trim();
  if (pathTrim.startsWith('http://') || pathTrim.startsWith('https://')) {
    return pathTrim;
  }
  const normalizedPath = pathTrim.startsWith('/') ? pathTrim : `/${pathTrim}`;
  const base = (baseUrlSetting || '').trim();
  if (!base) return window.location.origin + normalizedPath;
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return base.replace(/\/+$/, '') + normalizedPath;
  }
  const nb = base.replace(/\/+$/, '');
  const pathPart = nb && nb !== '/' ? nb + normalizedPath : normalizedPath;
  return window.location.origin + (pathPart.startsWith('/') ? pathPart : `/${pathPart}`);
}

function applyPathParams(urlPath, pathVars) {
  let p = urlPath;
  Object.keys(pathVars || {}).forEach(k => {
    const v = pathVars[k];
    if (v === undefined || v === null || String(v).trim() === '') return;
    p = p.replace(new RegExp(`\\{${k}\\}`, 'g'), encodeURIComponent(String(v)));
  });
  return p;
}

function buildQueryString(queryObj) {
  const u = new URLSearchParams();
  Object.entries(queryObj || {}).forEach(([key, val]) => {
    if (val === undefined || val === null || val === '') return;
    if (Array.isArray(val)) {
      val.forEach(v => {
        if (v !== undefined && v !== null && String(v) !== '') u.append(key, String(v));
      });
      return;
    }
    u.append(key, String(val));
  });
  const s = u.toString();
  return s ? `?${s}` : '';
}

function parseDefaultSeed(endpoint, text) {
  const empty = { path: {}, query: {}, headers: {}, body: undefined };
  if (!text || typeof text !== 'string') return empty;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return empty;
  }

  const hasBody = !!(endpoint.bodyParam && endpoint.bodyParam.schema);
  const params = endpoint.parameters || [];
  const hasPQH = params.some(p => p.in === 'path' || p.in === 'query' || p.in === 'header');

  if (hasBody && hasPQH && data && typeof data === 'object' && !Array.isArray(data) && 'body' in data) {
    return {
      path: data.path && typeof data.path === 'object' ? data.path : {},
      query: data.query && typeof data.query === 'object' ? data.query : {},
      headers: data.headers && typeof data.headers === 'object' ? data.headers : {},
      body: data.body
    };
  }
  if (hasBody) return { ...empty, body: data };
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return {
      path: data.path && typeof data.path === 'object' ? data.path : {},
      query: data.query && typeof data.query === 'object' ? data.query : {},
      headers: data.headers && typeof data.headers === 'object' ? data.headers : {},
      body: undefined
    };
  }
  return empty;
}

function parseMaybeArrayValue(text) {
  const raw = String(text == null ? '' : text).trim();
  if (!raw) return '';
  if ((raw.startsWith('[') && raw.endsWith(']')) || (raw.startsWith('"') && raw.endsWith('"'))) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

function formatResponseBodyPreview(text) {
  if (text == null) return '';
  const s = String(text);
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

function renderKvRows(container, rows, options = {}) {
  if (!container) return;
  const { fixedKey = false, allowAdd = true, addBtnText = '+ 添加' } = options;
  const normalizedRows = Array.isArray(rows) && rows.length ? rows : [{ key: '', value: '' }];
  const rowsHtml = normalizedRows.map((r, idx) => {
    const keyVal = escapeAttr(r.key || '');
    const valueVal = escapeAttr(r.value == null ? '' : r.value);
    const keyReadonly = fixedKey ? 'readonly' : '';
    const keyClass = fixedKey ? 'sp-test-kv__key sp-test-kv__key--readonly' : 'sp-test-kv__key';
    const removeDisabled = fixedKey || normalizedRows.length === 1;
    return `
      <div class="sp-test-kv__row" data-row-index="${idx}">
        <input type="text" class="${keyClass}" placeholder="Key" value="${keyVal}" ${keyReadonly} />
        <input type="text" class="sp-test-kv__value" placeholder="Value" value="${valueVal}" />
        <button type="button" class="sp-test-kv__remove" ${removeDisabled ? 'disabled' : ''}>✕</button>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="sp-test-kv__list">${rowsHtml}</div>
    ${allowAdd ? `<button type="button" class="sp-test-kv__add">${addBtnText}</button>` : ''}
  `;
}

function readKvRows(container) {
  if (!container) return [];
  const out = [];
  container.querySelectorAll('.sp-test-kv__row').forEach((row) => {
    const key = String(row.querySelector('.sp-test-kv__key')?.value || '').trim();
    const value = String(row.querySelector('.sp-test-kv__value')?.value || '');
    if (!key) return;
    out.push({ key, value });
  });
  return out;
}

function pickParams(endpoint, location) {
  return (endpoint.parameters || []).filter(p => p && p.in === location);
}

function buildSeedRows(endpoint, seed) {
  const pathParams = pickParams(endpoint, 'path');
  const queryParams = pickParams(endpoint, 'query');
  const headerParams = pickParams(endpoint, 'header');

  const pathRows = pathParams.map(p => ({
    key: p.name,
    value: seed.path && seed.path[p.name] != null ? String(seed.path[p.name]) : ''
  }));

  const queryRows = queryParams.map(p => ({
    key: p.name,
    value: seed.query && seed.query[p.name] != null ? String(seed.query[p.name]) : ''
  }));

  const headerMap = {};
  getSwaggerProCustomHeadersFromStorage().forEach(h => {
    headerMap[h.key] = h.value == null ? '' : String(h.value);
  });
  headerParams.forEach(p => {
    if (!(p.name in headerMap)) headerMap[p.name] = '';
  });
  if (seed.headers && typeof seed.headers === 'object') {
    Object.keys(seed.headers).forEach(k => {
      headerMap[k] = seed.headers[k] == null ? '' : String(seed.headers[k]);
    });
  }
  const headerRows = Object.keys(headerMap).map(k => ({ key: k, value: headerMap[k] }));

  return {
    pathRows,
    queryRows,
    headerRows,
    bodyText: seed.body === undefined ? '{}' : JSON.stringify(seed.body, null, 2)
  };
}

function ensureTestModal() {
  let modal = document.getElementById(SWAGGER_PRO_TEST_MODAL_ID);
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = SWAGGER_PRO_TEST_MODAL_ID;
  modal.className = 'sp-test-modal';
  modal.innerHTML = `
    <div class="sp-test-modal__backdrop"></div>
    <div class="sp-test-modal__panel" role="dialog" aria-modal="true" aria-labelledby="spTestMethod">
      <div class="sp-test-modal__header sp-test-modal__header--compact">
        <div class="sp-test-modal__row sp-test-modal__row--method">
          <span id="spTestMethod" class="sp-test-modal__method"></span>
          <code id="spTestUrlPreview" class="sp-test-modal__url"></code>
        </div>
        <button type="button" class="sp-test-modal__close" id="spTestModalClose">✕</button>
      </div>

      <div class="sp-test-modal__body">
        <div class="sp-test-tabs" id="spTestTabs">
          <button type="button" class="sp-test-tab" data-tab="body">Body</button>
          <button type="button" class="sp-test-tab" data-tab="headers">Headers</button>
          <button type="button" class="sp-test-tab" data-tab="query">Query</button>
          <button type="button" class="sp-test-tab" data-tab="path">Path</button>
        </div>

        <div class="sp-test-panels">
          <div class="sp-test-panel" data-panel="body">
            <label class="sp-test-modal__label-block" for="spTestBodyText">
              Body (JSON)
              <span class="sp-test-modal__label-tip" data-tooltip="入参默认与详情区示例一致；可直接编辑 JSON。">!</span>
            </label>
            <div id="spTestBodyDisabledTip" class="sp-test-panel-tip" style="display:none;">当前请求方法通常不使用 Body。</div>
            <textarea id="spTestBodyText" class="sp-test-modal__textarea" spellcheck="false" rows="10"></textarea>
          </div>
          <div class="sp-test-panel" data-panel="headers">
            <div class="sp-test-panel-tip">包含设置里的全局请求头；此处同名值优先。</div>
            <div id="spTestHeadersEditor"></div>
          </div>
          <div class="sp-test-panel" data-panel="query">
            <div class="sp-test-panel-tip">可输入 JSON 数组（如 [1,2]）以重复 query key 发送。</div>
            <div id="spTestQueryEditor"></div>
          </div>
          <div class="sp-test-panel" data-panel="path">
            <div class="sp-test-panel-tip">Path 参数名固定，仅修改 value。</div>
            <div id="spTestPathEditor"></div>
          </div>
        </div>

        <div class="sp-test-modal__actions">
          <button type="button" class="sp-test-modal__btn sp-test-modal__btn--ghost" id="spTestResetDefault">恢复示例</button>
          <button type="button" class="sp-test-modal__btn sp-test-modal__btn--primary" id="spTestSend">发送请求</button>
        </div>

        <div id="spTestError" class="sp-test-modal__error"></div>
        <div class="sp-test-modal__response sp-test-modal__response--placeholder" id="spTestResponseWrap">
          <div class="sp-test-modal__response-head">
            <span class="sp-test-modal__label-block">响应</span>
            <span id="spTestStatus" class="sp-test-modal__status"></span>
          </div>
          <pre id="spTestResponseBody" class="sp-test-modal__response-pre"></pre>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('.sp-test-modal__backdrop').addEventListener('click', closeSwaggerProTestModal);
  modal.querySelector('#spTestModalClose').addEventListener('click', closeSwaggerProTestModal);
  return modal;
}

function closeSwaggerProTestModal() {
  const modal = document.getElementById(SWAGGER_PRO_TEST_MODAL_ID);
  if (modal) modal.classList.remove('active');
}

function activateTab(tabName) {
  const modal = document.getElementById(SWAGGER_PRO_TEST_MODAL_ID);
  if (!modal) return;
  testModalState.activeTab = tabName;
  modal.querySelectorAll('.sp-test-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  modal.querySelectorAll('.sp-test-panel').forEach(panel => {
    panel.classList.toggle('active', panel.getAttribute('data-panel') === tabName);
  });
}

function collectPayloadFromUi() {
  const modal = document.getElementById(SWAGGER_PRO_TEST_MODAL_ID);
  if (!modal) return null;

  const path = {};
  readKvRows(modal.querySelector('#spTestPathEditor')).forEach(r => { path[r.key] = r.value; });
  const query = {};
  readKvRows(modal.querySelector('#spTestQueryEditor')).forEach(r => { query[r.key] = parseMaybeArrayValue(r.value); });
  const headers = {};
  readKvRows(modal.querySelector('#spTestHeadersEditor')).forEach(r => { headers[r.key] = r.value; });

  return {
    path,
    query,
    headers,
    bodyText: modal.querySelector('#spTestBodyText')?.value || ''
  };
}

function updateUrlPreview() {
  const modal = document.getElementById(SWAGGER_PRO_TEST_MODAL_ID);
  if (!modal || !testModalState.endpoint) return;
  const payload = collectPayloadFromUi();
  if (!payload) return;
  const pathPart = applyPathParams(testModalState.endpoint.path, payload.path);
  const url = resolveSwaggerProRequestUrl(pathPart, getSwaggerProBaseUrlSetting()) + buildQueryString(payload.query);
  modal.querySelector('#spTestUrlPreview').textContent = url;
}

function resetResponseArea() {
  const modal = document.getElementById(SWAGGER_PRO_TEST_MODAL_ID);
  if (!modal) return;
  const errEl = modal.querySelector('#spTestError');
  errEl.style.display = 'none';
  errEl.textContent = '';
  modal.querySelector('#spTestResponseWrap').classList.add('sp-test-modal__response--placeholder');
  modal.querySelector('#spTestResponseBody').textContent = '';
}

function renderUiByState() {
  const modal = document.getElementById(SWAGGER_PRO_TEST_MODAL_ID);
  const ep = testModalState.endpoint;
  if (!modal || !ep || !testModalState.seed) return;

  const methodEl = modal.querySelector('#spTestMethod');
  methodEl.textContent = ep.method;
  methodEl.className = `sp-test-modal__method method-${String(ep.method).toLowerCase()}`;

  const bodyTa = modal.querySelector('#spTestBodyText');
  const bodyTip = modal.querySelector('#spTestBodyDisabledTip');
  bodyTa.value = testModalState.seed.bodyText || '{}';
  bodyTa.disabled = !testModalState.canHaveBody;
  bodyTip.style.display = testModalState.canHaveBody ? 'none' : 'block';

  renderKvRows(modal.querySelector('#spTestPathEditor'), testModalState.seed.pathRows, { fixedKey: true, allowAdd: false });
  renderKvRows(modal.querySelector('#spTestQueryEditor'), testModalState.seed.queryRows, { addBtnText: '+ 添加 Query' });
  renderKvRows(modal.querySelector('#spTestHeadersEditor'), testModalState.seed.headerRows, { addBtnText: '+ 添加 Header' });

  activateTab(testModalState.activeTab || 'body');
  updateUrlPreview();
  resetResponseArea();
}

function openSwaggerProTestModal(cardId) {
  const ep = endpointMap.get(cardId);
  if (!ep) {
    if (typeof showToast === 'function') showToast('未找到接口数据');
    return;
  }

  const modal = ensureTestModal();
  const defaultText = typeof buildDefaultRequestInputText === 'function' ? buildDefaultRequestInputText(ep) : '{}';
  const seedRows = buildSeedRows(ep, parseDefaultSeed(ep, defaultText));

  testModalState = {
    cardId,
    endpoint: ep,
    activeTab: 'body',
    seed: seedRows,
    canHaveBody: !['GET', 'HEAD'].includes(String(ep.method || 'GET').toUpperCase())
  };

  renderUiByState();
  modal.classList.add('active');
}

function runSwaggerProTest() {
  const modal = document.getElementById(SWAGGER_PRO_TEST_MODAL_ID);
  if (!modal || !testModalState.endpoint) return;

  const errEl = modal.querySelector('#spTestError');
  const wrapEl = modal.querySelector('#spTestResponseWrap');
  const statusEl = modal.querySelector('#spTestStatus');
  const bodyEl = modal.querySelector('#spTestResponseBody');

  errEl.style.display = 'none';
  errEl.textContent = '';
  wrapEl.classList.add('sp-test-modal__response--placeholder');
  bodyEl.textContent = '';

  const payload = collectPayloadFromUi();
  if (!payload) return;

  const method = String(testModalState.endpoint.method || 'GET').toUpperCase();
  const pathPart = applyPathParams(testModalState.endpoint.path, payload.path);
  if (/\{[^}]+\}/.test(pathPart)) {
    errEl.textContent = '路径中仍有未替换的占位符，请在 Path Tab 中补全。';
    errEl.style.display = 'block';
    activateTab('path');
    return;
  }

  const url = resolveSwaggerProRequestUrl(pathPart, getSwaggerProBaseUrlSetting()) + buildQueryString(payload.query);
  const headers = { ...payload.headers };

  let body;
  if (!['GET', 'HEAD'].includes(method) && testModalState.canHaveBody) {
    const bodyText = String(payload.bodyText || '').trim();
    if (bodyText) {
      try {
        const parsedBody = JSON.parse(bodyText);
        body = JSON.stringify(parsedBody);
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
      } catch {
        errEl.textContent = 'Body 不是合法 JSON，请检查后重试。';
        errEl.style.display = 'block';
        activateTab('body');
        return;
      }
    }
  }

  const sendBtn = modal.querySelector('#spTestSend');
  const prevLabel = sendBtn.textContent;
  sendBtn.disabled = true;
  sendBtn.textContent = '请求中…';

  chrome.runtime.sendMessage(
    {
      type: 'SWAGGER_PRO_FETCH',
      payload: { url, method, headers, body }
    },
    (resp) => {
      sendBtn.disabled = false;
      sendBtn.textContent = prevLabel;

      if (chrome.runtime.lastError) {
        errEl.textContent = chrome.runtime.lastError.message || '扩展消息失败';
        errEl.style.display = 'block';
        return;
      }
      if (!resp) {
        errEl.textContent = '无响应';
        errEl.style.display = 'block';
        return;
      }
      if (!resp.ok) {
        errEl.textContent = resp.error || '请求失败';
        errEl.style.display = 'block';
        return;
      }

      const statusLine = `${resp.status} ${resp.statusText || ''}`.trim();
      statusEl.textContent = statusLine;
      statusEl.classList.remove('sp-test-modal__status--2xx', 'sp-test-modal__status--err');
      statusEl.classList.add(resp.status >= 200 && resp.status < 300 ? 'sp-test-modal__status--2xx' : 'sp-test-modal__status--err');
      bodyEl.textContent = formatResponseBodyPreview(resp.body);
      wrapEl.classList.remove('sp-test-modal__response--placeholder');
    }
  );
}

function resetToSeed() {
  renderUiByState();
  if (typeof showToast === 'function') showToast('已恢复为默认示例');
}

function initSwaggerProTestApi() {
  if (window.swaggerProTestApiInited) return;
  window.swaggerProTestApiInited = true;

  document.addEventListener('click', (e) => {
    const testBtn = e.target.closest('.api-test-btn');
    if (testBtn) {
      e.stopPropagation();
      const cardId = testBtn.getAttribute('data-card-id');
      if (cardId) openSwaggerProTestModal(cardId);
      return;
    }

    const tabBtn = e.target.closest('.sp-test-tab');
    if (tabBtn) {
      activateTab(tabBtn.getAttribute('data-tab') || 'body');
      return;
    }

    if (e.target.id === 'spTestSend') {
      e.preventDefault();
      runSwaggerProTest();
      return;
    }

    if (e.target.id === 'spTestResetDefault') {
      e.preventDefault();
      resetToSeed();
      return;
    }

    if (e.target.closest('.sp-test-kv__add')) {
      const container = e.target.closest('[id$="Editor"]');
      if (!container) return;
      const rows = readKvRows(container);
      rows.push({ key: '', value: '' });
      if (container.id === 'spTestQueryEditor') {
        renderKvRows(container, rows, { addBtnText: '+ 添加 Query' });
      } else if (container.id === 'spTestHeadersEditor') {
        renderKvRows(container, rows, { addBtnText: '+ 添加 Header' });
      }
      return;
    }

    if (e.target.closest('.sp-test-kv__remove')) {
      const rowEl = e.target.closest('.sp-test-kv__row');
      const container = e.target.closest('[id$="Editor"]');
      if (!rowEl || !container) return;
      rowEl.remove();
      const rows = readKvRows(container);
      if (!rows.length) rows.push({ key: '', value: '' });
      if (container.id === 'spTestQueryEditor') {
        renderKvRows(container, rows, { addBtnText: '+ 添加 Query' });
      } else if (container.id === 'spTestHeadersEditor') {
        renderKvRows(container, rows, { addBtnText: '+ 添加 Header' });
      }
      updateUrlPreview();
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.closest('#spTestPathEditor') || e.target.closest('#spTestQueryEditor')) {
      updateUrlPreview();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById(SWAGGER_PRO_TEST_MODAL_ID);
    if (modal && modal.classList.contains('active')) {
      closeSwaggerProTestModal();
    }
  });
}
