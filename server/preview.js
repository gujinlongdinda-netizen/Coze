import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const STATIC_DIR = path.join(__dirname, '..', 'dist', 'static');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5005';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

// 反向代理函数
function proxyRequest(req, res) {
  // 构造完整的后端 URL
  // BACKEND_URL 应该是完整的 URL，如 http://localhost:5005
  // req.url 包含 /api 前缀，如 /api/auth/send-code
  const fullUrl = BACKEND_URL + req.url;
  const url = new URL(fullUrl);

  // 准备代理请求选项
  const proxyOptions = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: url.host,  // 使用后端的 host
    },
  };

  // 选择 http 或 https 模块
  const proxyRequestFunc = url.protocol === 'https:' ? https.request : http.request;

  // 创建代理请求
  const proxyReq = proxyRequestFunc(proxyOptions, (proxyRes) => {
    // 转发响应头
    const headers = { ...proxyRes.headers };
    // 删除可能干扰的响应头
    delete headers['content-length'];
    delete headers['content-encoding'];

    res.writeHead(proxyRes.statusCode, headers);

    // 转发响应体
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('代理请求错误:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '代理服务器错误' }));
  });

  // 转发请求体（如果有）
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // 检查是否是 API 请求
  if (req.url.startsWith('/api')) {
    // 反向代理到后端
    proxyRequest(req, res);
    return;
  }

  // 解析 URL，移除查询参数
  let filePath = path.join(STATIC_DIR, req.url === '/' ? 'index.html' : req.url);

  // 获取文件扩展名
  const extname = path.extname(filePath);

  // 设置默认内容类型
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  // 读取文件
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在，尝试返回 index.html（用于 SPA）
        fs.readFile(path.join(STATIC_DIR, 'index.html'), (err, content) => {
          if (err) {
            // index.html 也不存在
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
          } else {
            // 返回 index.html
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        // 服务器错误
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>500 Server Error</h1><p>${err.message}</p>`);
      }
    } else {
      // 成功返回文件
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${STATIC_DIR}`);
  console.log(`Proxying /api requests to: ${BACKEND_URL}`);
});
