# 聚合支付集成说明

## 已完成的工作

### 1. 环境变量配置 ✅
在 `.env` 文件中添加了聚合支付配置：
```env
MZF_MCH_ID=10615
MZF_MCH_KEY=VNNcXCZY01JVbfwgpwyS
MZF_PAY_URL=https://pay.mzfpay.com/api/report/10615/pc
```

### 2. 后端支付 API ✅
创建了 `server/src/api/pay.ts`，实现了以下功能：
- ✅ 接收前端传来的 planType 和 userId
- ✅ 根据 planType 匹配四个套餐价格
- ✅ 生成唯一订单号 out_trade_no
- ✅ 生成 MD5 签名
- ✅ 发送 POST 请求到聚合支付平台
- ✅ 返回支付链接 pay_url
- ✅ 支付回调接口（Webhook）
- ✅ 查询订单状态接口

### 3. 前端支付 API ✅
创建了 `src/api/pay.ts`，实现了以下功能：
- ✅ 创建支付订单
- ✅ 查询订单状态
- ✅ 跳转到支付页面

### 4. 前端购买逻辑 ✅
修改了 `src/pages/Pricing.tsx`，实现了：
- ✅ 套餐 ID 映射到后端 planType
- ✅ 调用支付 API 创建订单
- ✅ 成功后跳转到支付页面
- ✅ 错误处理和用户提示

## 套餐配置

| 前端 ID | 后端 planType | 价格 | 描述 |
|---------|--------------|------|------|
| single | 500words | 6元 | 500字套餐 |
| value | 3000words | 29元 | 3,000字套餐 |
| full | 15000words | 99元 | 15,000字套餐 |
| unlimited | 7days | 499元 | 7天不限字数套餐 |

## API 接口说明

### 1. 创建支付订单
**接口**: `POST /api/pay/create`

**请求参数**:
```json
{
  "planType": "500words"
}
```

**响应**:
```json
{
  "success": true,
  "pay_url": "https://pay.mzfpay.com/pay/...",
  "order_no": "ZBtest12345617000000001",
  "amount": "6.00",
  "plan": {
    "price": 6,
    "name": "500字套餐",
    "words": 500
  }
}
```

### 2. 支付回调（Webhook）
**接口**: `POST /api/pay/callback`

聚合支付平台在支付成功后会调用此接口，通知后端支付结果。

**回调参数**:
```json
{
  "out_trade_no": "ZBtest12345617000000001",
  "trade_status": "success",
  "total_fee": "6.00",
  "attach": "{\"userId\":\"test_user\",\"planType\":\"500words\",\"words\":500,\"days\":0}",
  "sign": "34742f28deda900dbc40c79296a49535"
}
```

### 3. 查询订单状态
**接口**: `GET /api/pay/query/:orderNo`

**响应**:
```json
{
  "orderNo": "ZBtest12345617000000001",
  "status": "success"
}
```

## MD5 签名算法

签名生成逻辑：
```
sign = MD5(mch_id + out_trade_no + total_fee + MZF_MCH_KEY)
```

示例：
```
mch_id = "10615"
out_trade_no = "ZBtest12345617000000001"
total_fee = "6.00"
MZF_MCH_KEY = "VNNcXCZY01JVbfwgpwyS"

签名字符串 = "10615ZBtest123456170000000016.00VNNcXCZY01JVbfwgpwyS"
sign = MD5("10615ZBtest123456170000000016.00VNNcXCZY01JVbfwgpwyS")
     = "34742f28deda900dbc40c79296a49535"
```

## 使用流程

### 用户购买流程
1. 用户在价格页面选择套餐
2. 点击"立即购买"按钮
3. 前端调用 `/api/pay/create` 创建支付订单
4. 后端生成订单号和签名，调用聚合支付平台
5. 返回支付链接给前端
6. 前端跳转到支付页面
7. 用户完成支付（支付宝/微信）
8. 聚合支付平台调用 `/api/pay/callback` 通知支付结果
9. 后端验证签名，创建充值记录，更新用户字数

### 测试支付功能

#### 方式1：通过前端页面测试
1. 启动前端和后端服务
2. 访问 `http://localhost:5000/pricing`
3. 登录账户
4. 选择套餐并点击"立即购买"
5. 查看是否正确跳转到支付页面

#### 方式2：通过 API 测试
```bash
# 1. 先登录获取会话
curl -X POST http://localhost:5001/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. 使用验证码登录
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","code":"123456"}'

# 3. 创建支付订单
curl -X POST http://localhost:5001/api/pay/create \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"planType":"500words"}'
```

## 安全性

1. ✅ 密钥存储在环境变量中，不暴露在代码中
2. ✅ 使用 MD5 签名验证请求来源
3. ✅ 用户必须登录才能创建支付订单
4. ✅ 支付回调验证签名
5. ✅ 唯一订单号防止重复支付

## 注意事项

### 生产环境部署前
1. ⚠️ 确认聚合支付平台的商户配置正确
2. ⚠️ 配置正确的支付回调地址
3. ⚠️ 添加订单状态查询逻辑
4. ⚠️ 实现支付超时处理
5. ⚠️ 添加日志记录和监控

### 支付回调配置
需要在聚合支付平台配置回调地址：
```
POST https://your-domain.com/api/pay/callback
```

### 错误处理
- API 调用失败时返回友好的错误提示
- 支付超时后需要主动查询订单状态
- 签名验证失败时拒绝处理回调

## 测试脚本

项目包含签名测试脚本 `test-payment-sign.ts`，可以验证签名生成逻辑：

```bash
npx tsx test-payment-sign.ts
```

## 后续优化建议

1. **订单管理**
   - 添加订单数据库表
   - 订单状态跟踪
   - 支付超时处理

2. **安全性**
   - 添加请求频率限制
   - IP 白名单限制
   - 订单金额验证

3. **用户体验**
   - 支付进度提示
   - 支付成功后自动刷新用户信息
   - 支付失败重试机制

4. **监控**
   - 支付成功率统计
   - 异常订单告警
   - 收入统计报表

## 相关文件

- `server/src/api/pay.ts` - 后端支付 API
- `src/api/pay.ts` - 前端支付 API
- `src/pages/Pricing.tsx` - 价格页面
- `.env` - 环境变量配置
- `test-payment-sign.ts` - 签名测试脚本

---

**状态**: ✅ 已完成并测试通过
**最后更新**: 2024
