// API 配置文件
// 用于管理前后端 API 通信的配置

// 从环境变量获取 API 基础 URL
// 开发环境：使用 localhost:5005
// 生产环境：使用相对路径（由反向代理处理）
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * 构建 API 请求的完整 URL
 * @param path API 路径，例如 "/api/auth/send-code"
 * @returns 完整的请求 URL
 */
export function buildApiUrl(path: string): string {
  // 如果 API_BASE_URL 是相对路径且以 /api 开头（如 /api），说明是使用相对路径方案
  // 此时路径本身已经包含了 /api 前缀，直接返回原始路径即可
  if (API_BASE_URL && API_BASE_URL.startsWith('/api')) {
    // 直接返回原始路径，不进行拼接
    return path.startsWith('/') ? path : `/${path}`;
  }

  // 如果有配置完整的 API_BASE_URL（如 http://localhost:5005），则进行拼接
  if (API_BASE_URL) {
    // 去除 path 前的斜杠，避免重复
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // 确保 API_BASE_URL 以斜杠结尾
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    return `${baseUrl}${cleanPath}`;
  }

  // 如果没有配置 API_BASE_URL，则使用相对路径
  // 例如：/api/auth/send-code
  return path.startsWith('/') ? path : `/${path}`;
}
