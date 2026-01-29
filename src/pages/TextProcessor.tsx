import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';
import { authApi, processApi, rechargeApi } from '../lib/api';

export default function TextProcessor() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // 状态管理
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 用户状态
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 登录弹窗
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [sentCode, setSentCode] = useState('');
  
  // 字数检查结果
  const [checkResult, setCheckResult] = useState<any>(null);
  
  // 加载用户信息
  useEffect(() => {
    loadUserInfo();
  }, []);
  
  const loadUserInfo = async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
    } catch (error) {
      // 未登录
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 计算字数
  useEffect(() => {
    setWordCount(inputText.length);
  }, [inputText]);
  
  // 发送验证码
  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    setIsSendingCode(true);
    try {
      const data = await authApi.sendCode(email);
      setSentCode(data.code || '');
      toast.success('验证码已发送' + (data.code ? `: ${data.code}` : ''));
    } catch (error) {
      toast.error('发送验证码失败，请重试');
    } finally {
      setIsSendingCode(false);
    }
  };
  
  // 登录
  const handleLogin = async () => {
    if (!code) {
      toast.error('请输入验证码');
      return;
    }

    setIsLoggingIn(true);
    try {
      const data = await authApi.login(email, code);
      setUser(data.user);
      setShowLoginModal(false);
      setEmail('');
      setCode('');
      setSentCode('');
      toast.success('登录成功');

      // 登录成功后，检查是否需要充值
      if (inputText.trim()) {
        await checkAndProcess();
      }
    } catch (error: any) {
      toast.error(error.message || '登录失败，请重试');
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // 检查字数和费用
  const checkWordCount = async () => {
    if (!inputText.trim()) {
      toast.error('请输入要处理的文本');
      return null;
    }
    
    try {
      const data = await processApi.check(inputText);
      setCheckResult(data);
      
      if (!data.hasEnough) {
        toast.error(`您的剩余字数不足，需要 ${data.wordCount} 字，当前剩余 ${data.remainingWords} 字`);
        setTimeout(() => {
          navigate('/pricing');
        }, 1500);
        return null;
      }
      
      return data;
    } catch (error: any) {
      if (error.message?.includes('未登录')) {
        setShowLoginModal(true);
        return null;
      }
      toast.error(error.message || '检查字数失败');
      return null;
    }
  };
  
  // 检查并处理
  const checkAndProcess = async () => {
    const checkData = await checkWordCount();
    if (!checkData || !checkData.hasEnough) {
      return;
    }
    
    await processText();
  };
  
  // 处理文本
  const processText = async () => {
    if (!inputText.trim()) {
      toast.error('请输入要处理的文本');
      return;
    }
    
    setIsProcessing(true);
    setOutputText('');
    
    try {
      await processApi.process(
        inputText,
        (chunk) => {
          // 实时接收流式输出
          setOutputText(prev => prev + chunk);
        },
        (recordId) => {
          // 处理完成
          setIsProcessing(false);
          toast.success('文本处理完成');
          // 重新加载用户信息（更新剩余字数）
          loadUserInfo();
        }
      );
    } catch (error: any) {
      setIsProcessing(false);
      if (error.message?.includes('未登录')) {
        setShowLoginModal(true);
      } else {
        toast.error(error.message || '处理失败，请重试');
      }
    }
  };
  
  // 点击"开始降AI率"按钮
  const handleStartProcess = async () => {
    // 1. 检查用户是否登录
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    // 2. 检查字数并处理
    await checkAndProcess();
  };
  
  // 复制文本
  const handleCopyText = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText)
        .then(() => {
          toast.success('文本已复制到剪贴板');
        })
        .catch(err => {
          toast.error('复制失败，请手动复制');
        });
    }
  };
  
  // 清空输入
  const handleClearInput = () => {
    setInputText('');
    setOutputText('');
    setCheckResult(null);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <i className="fa fa-spinner fa-spin text-4xl text-blue-600"></i>
          <p className="mt-4 text-slate-600 dark:text-slate-300">加载中...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100">
      {/* 导航栏 */}
      <header className="container mx-auto px-4 py-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/')}
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <i className="fa-solid fa-pen-nib text-2xl text-blue-600 dark:text-blue-400 mr-2"></i>
          <h1 className="text-2xl font-bold">知笔</h1>
        </button>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <span className="mr-2">{user.email || user.phone}</span>
                剩余: <span className="font-bold text-blue-600 dark:text-blue-400">{user.remainingWords}</span> 字
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm transition-colors"
              >
                充值
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm transition-colors"
            >
              登录
            </button>
          )}
        </div>
      </header>
      
      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">论文降AI率</h2>
            <p className="text-slate-600 dark:text-slate-300">
              反AI独家算法 • 未通过检测率，全额退款
            </p>
          </div>
          
          {/* 字数统计 */}
          <div className="mb-4 flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <span className="mr-4">已输入: <span className="font-bold">{wordCount}</span> 字</span>
              <span className="mr-4">计费字数: <span className="font-bold">{checkResult?.wordCount || '-'}</span> 字</span>
              {checkResult && (
                <span>费用: <span className="font-bold text-blue-600 dark:text-blue-400">¥{checkResult.costInYuan?.toFixed(2)}</span></span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleClearInput}
                disabled={isProcessing}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <i className="fa-solid fa-trash-can mr-1"></i> 清空
              </button>
            </div>
          </div>
          
          {/* 两栏布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 左边框：输入文本 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
                  <h3 className="font-medium">
                    <i className="fa-solid fa-edit mr-2"></i>
                    原始文本
                  </h3>
                  <span className="text-sm opacity-90">{wordCount} 字</span>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="请在此粘贴需要处理的文本..."
                  className={`w-full h-[400px] p-4 bg-white dark:bg-slate-800 dark:text-white resize-none focus:outline-none transition-colors ${
                    isProcessing ? 'opacity-50' : ''
                  }`}
                  disabled={isProcessing}
                ></textarea>
              </div>
            </motion.div>
            
            {/* 右边框：输出文本 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-green-600 text-white px-4 py-3 flex justify-between items-center">
                  <h3 className="font-medium">
                    <i className="fa-solid fa-check-double mr-2"></i>
                    处理结果
                  </h3>
                  {outputText && (
                    <button
                      onClick={handleCopyText}
                      className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
                    >
                      <i className="fa-solid fa-copy mr-1"></i>
                      复制
                    </button>
                  )}
                </div>
                <div className="h-[400px] p-4 bg-white dark:bg-slate-800 dark:text-white overflow-auto">
                  {isProcessing ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <i className="fa fa-spinner fa-spin text-4xl mb-4 text-blue-600"></i>
                      <p>AI正在处理中，请稍候...</p>
                    </div>
                  ) : outputText ? (
                    <pre className="whitespace-pre-wrap break-words font-sans text-base leading-relaxed">{outputText}</pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <i className="fa-solid fa-pen-fancy text-4xl mb-4"></i>
                      <p>处理后的文本将显示在这里</p>
                      <p className="text-sm mt-2">点击"开始降AI率"按钮开始处理</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex justify-center mb-8">
            <motion.button
              onClick={handleStartProcess}
              disabled={isProcessing || !inputText.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full font-medium text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg ${
                isProcessing ? 'animate-pulse' : ''
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <i className="fa fa-spinner fa-spin mr-2"></i> 处理中...
                </span>
              ) : (
                <span className="flex items-center">
                  <i className="fa-solid fa-magic mr-2"></i> 开始降AI率
                </span>
              )}
            </motion.button>
          </div>
          
          {/* 服务说明 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-bold mb-6 text-left">服务说明</h3>
            <ul className="space-y-4 text-slate-600 dark:text-slate-300">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                  <i className="fa-solid fa-circle-info text-blue-600 dark:text-blue-400 text-xs"></i>
                </div>
                <span className="leading-relaxed">每字0.012元，500字起步，不满500字按500字计算</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                  <i className="fa-solid fa-circle-info text-blue-600 dark:text-blue-400 text-xs"></i>
                </div>
                <span className="leading-relaxed">处理后的文本将保留原文核心内容，但表达方式更接近人类写作</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                  <i className="fa-solid fa-circle-info text-blue-600 dark:text-blue-400 text-xs"></i>
                </div>
                <span className="leading-relaxed">未通过检测率，我们承诺全额退款</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                  <i className="fa-solid fa-circle-info text-blue-600 dark:text-blue-400 text-xs"></i>
                </div>
                <span className="leading-relaxed">支持中国知网、维普论文检测系统、Turnition等主流检测平台</span>
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
      
      {/* 登录弹窗 */}
      {showLoginModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">登录 / 注册</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">邮箱地址</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱地址"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">验证码</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入验证码"
                    maxLength={6}
                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-white transition-colors"
                  />
                  <button
                    onClick={handleSendCode}
                    disabled={isSendingCode || !email}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {isSendingCode ? '发送中...' : '获取验证码'}
                  </button>
                </div>
                {sentCode && (
                  <p className="text-xs text-slate-500 mt-2">
                    开发环境验证码: <span className="font-bold text-blue-600">{sentCode}</span>
                  </p>
                )}
              </div>
              
              <button
                onClick={handleLogin}
                disabled={isLoggingIn || !email || !code}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isLoggingIn ? '登录中...' : '登录 / 注册'}
              </button>

              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                首次登录即注册，新用户免费体验 500 字
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
