# 邮件验证码替代方案

## 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| 自建邮件服务器 | 完全自主控制、无成本 | 配置复杂、容易被拉黑、需要域名 | ⭐⭐ |
| 短信验证码 | 到达率高、用户体验好 | 需要购买短信服务、有成本 | ⭐⭐⭐⭐ |
| 第三方登录 | 用户体验最好、无需验证码 | 依赖第三方平台 | ⭐⭐⭐⭐⭐ |
| OAuth 2.0 标准登录 | 安全性高、支持多种方式 | 需要对接多个平台 | ⭐⭐⭐⭐ |

---

## 方案一：自建邮件服务器（Postfix）

### 优点
- ✅ 完全自主控制，无第三方依赖
- ✅ 无额外成本
- ✅ 数据隐私性高

### 缺点
- ❌ 配置复杂度高（MX记录、SPF、DKIM、DMARC）
- ❌ 容易被识别为垃圾邮件
- ❌ 需要维护邮件服务器
- ❌ IP可能被列入黑名单

### 实现步骤

#### 1. 安装Postfix
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postfix mailutils

# CentOS/RHEL
sudo yum install postfix mailx
```

#### 2. 配置Postfix
```bash
# 编辑配置文件
sudo nano /etc/postfix/main.cf

# 关键配置
myhostname = mail.yourdomain.com
mydomain = yourdomain.com
myorigin = $mydomain
inet_interfaces = all
mydestination = $myhostname, localhost.$mydomain, localhost, $mydomain
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
home_mailbox = Maildir/
```

#### 3. 安装DKIM
```bash
sudo apt install opendkim opendkim-tools

# 配置DKIM
sudo nano /etc/opendkim.conf
```

#### 4. DNS配置
```
MX记录：mail.yourdomain.com
SPF记录：v=spf1 ip4:your_server_ip -all
DKIM记录：选择._domainkey.yourdomain.com
DMARC记录：_dmarc.yourdomain.com
```

#### 5. 测试发送
```bash
echo "Test email" | mail -s "Test Subject" user@example.com
```

---

## 方案二：短信验证码（推荐）

### 优点
- ✅ 到达率高
- ✅ 用户体验好
- ✅ 不依赖邮件服务商

### 缺点
- ❌ 需要购买短信服务（0.05-0.1元/条）

### 实现代码

```typescript
// server/src/services/sms.ts
import axios from 'axios';

interface SMSParams {
  phone: string;
  code: string;
}

export async function sendVerificationSMS(params: SMSParams): Promise<boolean> {
  // 示例：使用阿里云短信服务
  const { phone, code } = params;

  try {
    // 这里需要接入实际的短信服务商API
    // 阿里云、腾讯云、华为云等都有短信服务

    const response = await axios.post(
      'https://dysmsapi.aliyuncs.com/',
      {
        PhoneNumbers: phone,
        SignName: '知笔',
        TemplateCode: 'SMS_123456789',
        TemplateParam: JSON.stringify({ code }),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.Code === 'OK';
  } catch (error) {
    console.error('发送短信失败:', error);
    return false;
  }
}
```

### 修改auth路由支持手机号

```typescript
// server/src/api/auth.ts

// 发送验证码（支持邮箱和手机号）
router.post("/send-code", async (req, res) => {
  try {
    const { email, phone } = req.body;

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 根据输入类型选择发送方式
    if (email) {
      // 发送邮件验证码
      await verificationCodesManager.createVerificationCode({
        email,
        code,
        expiresAt,
        used: false,
      });

      const emailSent = await sendVerificationCodeEmail(email, code);
      if (!emailSent) {
        return res.status(500).json({ error: "发送验证码失败，请稍后重试" });
      }

    } else if (phone) {
      // 发送短信验证码
      await verificationCodesManager.createVerificationCode({
        phone,
        code,
        expiresAt,
        used: false,
      });

      const smsSent = await sendVerificationSMS({ phone, code });
      if (!smsSent) {
        return res.status(500).json({ error: "发送验证码失败，请稍后重试" });
      }
    } else {
      return res.status(400).json({ error: "请提供邮箱或手机号" });
    }

    res.json({
      message: "验证码已发送",
      code: process.env.NODE_ENV === "development" ? code : undefined,
    });
  } catch (error) {
    console.error("发送验证码失败:", error);
    res.status(500).json({ error: "发送验证码失败" });
  }
});
```

---

## 方案三：第三方登录（最佳推荐）

### 优点
- ✅ 用户体验最好
- ✅ 无需验证码
- ✅ 安全性高
- ✅ 支持多种登录方式

### 缺点
- ❌ 依赖第三方平台（微信、QQ、GitHub等）

### 实现方案

#### 1. 使用Passport.js
```bash
pnpm add passport passport-github passport-qq
```

#### 2. 配置GitHub登录
```typescript
// server/src/auth/github.ts
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github';

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:5005/api/auth/github/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      // 查找或创建用户
      let user = await userManager.getUserByGithubId(profile.id);

      if (!user) {
        user = await userManager.createUser({
          email: profile.emails?.[0]?.value,
          githubId: profile.id,
          avatar: profile.photos?.[0]?.value,
          name: profile.displayName,
        });

        // 首次用户赠送500字
        await userManager.increaseRemainingWords(user.id, 500);
      }

      done(null, user);
    }
  )
);

// GitHub登录路由
router.get('/github', passport.authenticate('github'));

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // 登录成功
    res.redirect('/');
  }
);
```

---

## 方案四：OAuth 2.0 标准实现

### 优点
- ✅ 标准协议，兼容性强
- ✅ 支持多种授权方式
- ✅ 安全性高

### 缺点
- ❌ 实现复杂度高

---

## 方案五：简化方案（仅开发环境）

### 优点
- ✅ 无需任何外部服务
- ✅ 实现简单

### 缺点
- ❌ 仅适用于开发环境
- ❌ 生产环境不可用

### 实现方式

#### 1. 前端显示验证码（当前已实现）
```typescript
// server/src/api/auth.ts

res.json({
  message: "验证码已发送",
  code: process.env.NODE_ENV === "development" ? code : undefined,  // 开发环境返回验证码
});
```

#### 2. 使用localStorage存储验证码
```typescript
// 前端实现
const sendVerificationCode = async (email: string) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  // 存储到localStorage
  localStorage.setItem(`verify_${email}`, JSON.stringify({ code, expiresAt }));

  alert(`验证码是：${code}`);  // 弹窗显示验证码
};

const verifyCode = (email: string, inputCode: string) => {
  const stored = localStorage.getItem(`verify_${email}`);
  if (!stored) return false;

  const { code, expiresAt } = JSON.parse(stored);
  return Date.now() < expiresAt && code === inputCode;
};
```

---

## 推荐方案总结

### 开发环境
- **方案五**：前端显示验证码（当前已实现）

### 生产环境（按优先级）

1. **方案三：第三方登录**（⭐⭐⭐⭐⭐）
   - 用户体验最好
   - 无需验证码
   - 推荐接入：微信、QQ、GitHub、Google

2. **方案二：短信验证码**（⭐⭐⭐⭐）
   - 到达率高
   - 用户体验好
   - 成本：0.05-0.1元/条

3. **方案一：自建邮件服务器**（⭐⭐）
   - 完全自主控制
   - 但配置复杂
   - 容易被拉黑

---

## 快速实现：短信验证码

如果您想快速实现，我可以帮您：
1. 选择短信服务商（阿里云、腾讯云、华为云）
2. 接入短信API
3. 修改前端和后端代码
4. 测试验证码功能

需要我开始实现吗？
