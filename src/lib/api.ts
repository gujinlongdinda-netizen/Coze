// API 客户端工具
import { buildApiUrl } from "../config/api";

// 通用请求方法
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const response = await fetch(url, {
    ...options,
    credentials: "include", // 包含 cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "请求失败" }));
    throw new Error(error.error || "请求失败");
  }

  return response.json();
}

// 认证相关 API
export const authApi = {
  // 发送验证码
  sendCode: (email: string) =>
    request<{ message: string; code?: string }>("/api/auth/send-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // 登录
  login: (email: string, code: string) =>
    request<{
      message: string;
      user: {
        id: string;
        email: string;
        remainingWords: number;
        totalWordsUsed: number;
        isFirstUser: boolean;
      };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),

  // 获取当前用户信息
  getMe: () =>
    request<{
      user: {
        id: string;
        email: string;
        remainingWords: number;
        totalWordsUsed: number;
        isFirstUser: boolean;
      };
    }>("/api/auth/me"),

  // 退出登录
  logout: () =>
    request<{ message: string }>("/api/auth/logout", {
      method: "POST",
    }),
};

// 充值相关 API
export const rechargeApi = {
  // 获取所有充值套餐
  getPlans: () =>
    request<{
      plans: Array<{
        id: string;
        name: string;
        description: string;
        price: number;
        words: number;
        unitPrice?: number;
        badge?: string;
      }>;
    }>("/api/recharge/plans"),

  // 计算文本字数和费用
  calculate: (text: string) =>
    request<{
      wordCount: number;
      cost: number;
      costInYuan: number;
    }>("/api/recharge/calculate", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  // 创建充值订单
  createOrder: (planId: string) =>
    request<{
      message: string;
      orderId?: string;
      plan?: any;
      paymentUrl?: string;
      record?: any;
      user?: any;
    }>("/api/recharge/create-order", {
      method: "POST",
      body: JSON.stringify({ planId }),
    }),

  // 确认支付
  confirmPayment: (planId: string) =>
    request<{
      message: string;
      record: any;
      user: any;
    }>("/api/recharge/confirm-payment", {
      method: "POST",
      body: JSON.stringify({ planId }),
    }),

  // 获取充值记录
  getRecords: () =>
    request<{ records: any[] }>("/api/recharge/records"),
};

// 文本处理相关 API
export const processApi = {
  // 检查字数和费用
  check: (text: string) =>
    request<{
      wordCount: number;
      hasEnough: boolean;
      remainingWords: number;
      cost: number;
      costInYuan: number;
      needRecharge: boolean;
    }>("/api/process/check", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  // 处理文本（流式输出）
  process: async (text: string, onChunk: (chunk: string) => void, onComplete: (recordId: string) => void) => {
    const response = await fetch(buildApiUrl("/api/process/process"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "处理失败" }));
      throw new Error(error.error || "处理失败");
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
            if (parsed.done) {
              onComplete(parsed.recordId);
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            console.error("解析 SSE 数据失败:", e);
          }
        }
      }
    }
  },

  // 获取处理记录
  getRecords: () =>
    request<{ records: any[] }>("/api/process/records"),

  // 获取单个处理记录
  getRecord: (id: string) =>
    request<{ record: any }>(`/api/process/records/${id}`),
};
