// Brevo 邮件服务
import dotenv from 'dotenv';

dotenv.config();

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface BrevoEmailParams {
  sender: {
    name: string;
    email: string;
  };
  to: Array<{
    email: string;
  }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * 发送邮件（使用 Brevo API）
 * @param params 邮件参数
 * @returns Promise<boolean>
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  const { to, subject, htmlContent, textContent } = params;

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'gujinlongdinda@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'zhibi';

  if (!apiKey) {
    console.error('BREVO_API_KEY 未配置');
    return false;
  }

  try {
    const brevoParams: BrevoEmailParams = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent,
    };

    // 如果有纯文本内容，添加到参数中
    if (textContent) {
      brevoParams.textContent = textContent;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(brevoParams),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API 错误:', errorData);
      return false;
    }

    const responseData = await response.json();
    console.log(`Brevo 邮件发送成功: ${to} (messageId: ${responseData.messageId})`);
    return true;
  } catch (error) {
    console.error('Brevo 邮件发送失败:', error);
    return false;
  }
}

/**
 * 发送验证码邮件
 * @param email 邮箱地址
 * @param code 验证码
 * @returns Promise<boolean>
 */
export async function sendVerificationCodeEmail(
  email: string,
  code: string
): Promise<boolean> {
  const subject = '【zhibi】您的验证码';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .code-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 36px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            letter-spacing: 5px;
          }
          .info {
            background: #fff;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">zhibi</div>
          </div>
          <h2>您的验证码</h2>
          <p>您好，</p>
          <p>您正在登录 zhibi，您的验证码是：</p>
          <div class="code-box">${code}</div>
          <div class="info">
            <strong>重要提示：</strong>
            <ul>
              <li>验证码有效期为5分钟</li>
              <li>请勿将验证码泄露给他人</li>
              <li>如非本人操作，请忽略此邮件</li>
            </ul>
          </div>
          <p>感谢您使用 zhibi！</p>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复</p>
            <p>&copy; 2025 zhibi. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    htmlContent,
  });
}
