#!/usr/bin/env node

/**
 * 测试豆包大模型文本处理功能
 */

const http = require('http');

// Cookie存储
let cookies = '';

// 创建HTTP请求的辅助函数（支持cookie）
function httpRequest(options, data) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Cookie': cookies,
      }
    };

    const req = http.request(reqOptions, (res) => {
      // 保存cookie
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        cookies = setCookie.map(c => c.split(';')[0]).join('; ');
      }

      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 测试步骤
async function testAIProcess() {
  console.log('========================================');
  console.log('测试豆包大模型文本处理功能');
  console.log('========================================\n');

  try {
    // 步骤1: 发送验证码
    console.log('步骤1: 发送验证码...');
    const email = 'test' + Date.now() + '@example.com';
    const sendCodeResult = await httpRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/send-code',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email });

    console.log('✓ 验证码已发送');
    const code = sendCodeResult.code;
    console.log(`  邮箱: ${email}`);
    console.log(`  验证码: ${code}\n`);

    // 步骤2: 登录
    console.log('步骤2: 使用验证码登录...');
    const loginResult = await httpRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email, code });

    console.log('✓ 登录成功');
    console.log(`  用户ID: ${loginResult.user.id}`);
    console.log(`  剩余字数: ${loginResult.user.remainingWords}\n`);

    // 步骤3: 检查字数
    console.log('步骤3: 检查文本字数...');
    const testText = `人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。

人工智能的发展可以分为三个阶段：首先是计算智能，即快速计算和记忆存储能力；其次是感知智能，即视觉、听觉等感知能力；最后是认知智能，即理解、推理和决策能力。

目前，人工智能技术已经广泛应用于各个领域，包括医疗、金融、交通、教育等。例如，在医疗领域，AI可以辅助医生进行疾病诊断；在金融领域，AI可以用于风险评估和投资决策；在交通领域，AI可以优化交通流量和自动驾驶。`;

    const checkResult = await httpRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/process/check',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { text: testText });

    console.log('✓ 字数检查完成');
    console.log(`  文本长度: ${testText.length} 字`);
    console.log(`  计费字数: ${checkResult.wordCount} 字`);
    console.log(`  费用: ¥${checkResult.costInYuan.toFixed(2)}`);
    console.log(`  字数充足: ${checkResult.hasEnough}\n`);

    // 步骤4: 调用豆包大模型处理文本（流式输出）
    console.log('步骤4: 调用豆包大模型处理文本...');
    console.log('----------------------------------------');

    // 由于流式输出需要特殊处理，我们使用原生HTTP请求
    return new Promise((resolve, reject) => {
      const processOptions = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/process/process',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies,
        }
      };

      const req = http.request(processOptions, (res) => {
        console.log(`✓ 开始接收流式响应 (状态码: ${res.statusCode})`);
        console.log('----------------------------------------\n');

        let fullContent = '';

        res.on('data', (chunk) => {
          const chunkStr = chunk.toString();
          const lines = chunkStr.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);

                if (parsed.content) {
                  process.stdout.write(parsed.content);
                  fullContent += parsed.content;
                }

                if (parsed.done) {
                  console.log('\n\n----------------------------------------');
                  console.log('✓ 处理完成');
                  console.log(`  记录ID: ${parsed.recordId}`);
                  console.log(`  处理后字数: ${fullContent.length} 字`);
                  console.log('\n原始文本:');
                  console.log(testText);
                  console.log('\n处理后文本:');
                  console.log(fullContent);
                  resolve(fullContent);
                }

                if (parsed.error) {
                  console.log(`\n✗ 错误: ${parsed.error}`);
                  reject(new Error(parsed.error));
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        });

        res.on('end', () => {
          console.log('\n----------------------------------------');
          console.log('✓ 响应接收完毕');
          resolve(fullContent);
        });

        res.on('error', (err) => {
          console.error(`✗ 请求错误: ${err.message}`);
          reject(err);
        });
      });

      req.on('error', (err) => {
        console.error(`✗ 请求失败: ${err.message}`);
        reject(err);
      });

      req.write(JSON.stringify({ text: testText }));
      req.end();
    });

  } catch (error) {
    console.error(`\n✗ 测试失败: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
testAIProcess()
  .then(() => {
    console.log('\n========================================');
    console.log('测试完成！');
    console.log('========================================');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n测试失败:', error);
    process.exit(1);
  });
