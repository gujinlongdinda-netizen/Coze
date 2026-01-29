import { buildApiUrl } from "../config/api";

// 创建支付订单
export async function createPaymentOrder(planType: string): Promise<{
  success: boolean;
  pay_url?: string;
  order_no?: string;
  amount?: string;
  plan?: any;
  error?: string;
}> {
  try {
    const response = await fetch(buildApiUrl("/api/pay/create"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ planType }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "创建订单失败",
      };
    }

    return {
      success: true,
      pay_url: data.pay_url,
      order_no: data.order_no,
      amount: data.amount,
      plan: data.plan,
    };
  } catch (error) {
    console.error("创建支付订单失败:", error);
    return {
      success: false,
      error: "网络错误，请稍后重试",
    };
  }
}

// 查询订单状态
export async function queryOrderStatus(orderNo: string): Promise<{
  orderNo: string;
  status: string;
  error?: string;
}> {
  try {
    const response = await fetch(buildApiUrl(`/api/pay/query/${orderNo}`), {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("查询订单状态失败");
    }

    return await response.json();
  } catch (error) {
    console.error("查询订单状态失败:", error);
    return {
      orderNo,
      status: "unknown",
      error: "查询失败",
    };
  }
}

// 跳转到支付页面
export function redirectToPayment(payUrl: string): void {
  window.location.href = payUrl;
}
