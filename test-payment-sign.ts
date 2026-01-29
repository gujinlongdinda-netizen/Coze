import crypto from "crypto";

// 测试数据
const testParams = {
  mch_id: "10615",
  out_trade_no: "ZBtest12345617000000001",
  total_fee: "6.00",
  key: "VNNcXCZY01JVbfwgpwyS"
};

// 生成 MD5 签名
function generateMD5Sign(params: {
  mch_id: string;
  out_trade_no: string;
  total_fee: string;
  key: string;
}): string {
  const { mch_id, out_trade_no, total_fee, key } = params;

  // 按照顺序拼接参数：mch_id + out_trade_no + total_fee + key
  const signStr = `${mch_id}${out_trade_no}${total_fee}${key}`;

  console.log("签名字符串:", signStr);

  // 生成 MD5 签名
  return crypto.createHash("md5").update(signStr).digest("hex").toLowerCase();
}

// 测试签名生成
console.log("=== 测试 MD5 签名生成 ===");
const sign = generateMD5Sign(testParams);
console.log("生成的签名:", sign);

// 测试请求参数构建
console.log("\n=== 测试请求参数 ===");
const requestBody = {
  mch_id: testParams.mch_id,
  out_trade_no: testParams.out_trade_no,
  total_fee: testParams.total_fee,
  body: "500字套餐",
  attach: JSON.stringify({
    userId: "test_user_123",
    planType: "500words",
    words: 500,
    days: 0
  }),
  sign
};

console.log("请求体:", JSON.stringify(requestBody, null, 2));

// 测试支付接口调用（需要后端服务运行）
console.log("\n=== 测试支付接口调用 ===");
async function testPaymentAPI() {
  try {
    const response = await fetch("http://localhost:5001/api/pay/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": "connect.sid=test-session-id" // 模拟会话
      },
      body: JSON.stringify({
        planType: "500words"
      })
    });

    const data = await response.json();
    console.log("API 响应:", data);
  } catch (error) {
    console.error("API 调用失败:", error);
  }
}

// 注意：这个测试需要有效的用户会话，实际使用时需要先登录
// testPaymentAPI();

console.log("\n=== 测试完成 ===");
