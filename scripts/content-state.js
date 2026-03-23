'use strict';

// 各 API 卡片完整数据（避免塞进 DOM）

// 存储每个卡片对应的完整接口数据，避免将大 JSON 塞进 DOM 属性
// 使用 var 以便多文件 content script 共享同一全局（const/let 无法跨文件访问）
var endpointMap = new Map();
