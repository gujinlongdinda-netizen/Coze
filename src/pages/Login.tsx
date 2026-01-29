import { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { AuthContext, UserInfo } from "../contexts/authContext";
import { sendCode, login } from "../api/auth";
import { toast } from "sonner";


export default function Login() {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { setIsAuthenticated, setUserInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 从URL参数中获取邀请码
  useEffect(() => {
    const inviteCode = searchParams.get("invite");
    if (inviteCode) {
      localStorage.setItem("inviteCode", inviteCode);
    }

    // 调试：输出当前环境变量
    console.log('=== 环境变量调试 ===');
    console.log('NODE_ENV:', import.meta.env.NODE_ENV);
    console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('====================');
  }, [searchParams]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendCode = async () => {
    if (!validateEmail(email)) {
      toast.error("请输入正确的邮箱地址");
      return;
    }

    setIsSendingCode(true);

    try {
      const data = await sendCode(email);

      // 开始倒计时
      setCountdown(60);
      toast.success(data?.message || "验证码已发送");

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('发送验证码失败:', error);
      toast.error(error instanceof Error ? error.message : "发送验证码失败");
    } finally {
      setIsSendingCode(false);
    }
  };


  const handleLogin = async () => {
    if (!validateEmail(email)) {
      toast.error("请输入正确的邮箱地址");
      return;
    }

    if (!verificationCode || verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      toast.error("请输入6位数字验证码");
      return;
    }

    setIsLoading(true);

    try {
      // 获取邀请码（如果有）
      const inviteCode = localStorage.getItem("inviteCode") || undefined;

      const user = await login({ email, code: verificationCode, inviteCode });

      toast.success("登录成功");

      setUserInfo({
        id: user.user.id,
        email: user.user.email,
        remainingWords: user.user.remainingWords,
        isFirstTime: user.isFirstUser,
        lastUsedDate: new Date().toISOString(),
      });

      setIsAuthenticated(true);
      navigate("/process");

    } catch (error) {
      console.error('登录失败:', error);
      toast.error(error instanceof Error ? error.message : "登录失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Link to="/">
              <i className="fa-solid fa-pen-nib text-3xl text-blue-600 dark:text-blue-400 mr-2 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors"></i>
            </Link>
            <Link to="/">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                知笔
              </h2>
            </Link>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            登录您的账号，开始使用降AI率服务
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              邮箱地址
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱地址"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="verificationCode"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              验证码
            </label>
            <div className="flex space-x-2">
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="请输入验证码"
                maxLength={6}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-white"
              />
              <button
                onClick={handleSendCode}
                disabled={isSendingCode || countdown > 0 || !validateEmail(email)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 whitespace-nowrap"
              >
                {isSendingCode
                  ? "发送中..."
                  : countdown > 0
                  ? `${countdown}秒后重发`
                  : "获取验证码"}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <i className="fa fa-spinner fa-spin mr-2"></i>
                登录中...
              </span>
            ) : (
              "登录"
            )}
          </button>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            未注册邮箱登录后将自动注册
          </div>
        </div>
      </motion.div>
    </div>
  );
}
