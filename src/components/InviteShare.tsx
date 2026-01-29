import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { getInviteInfo, type InviteInfo } from "../api/invite";

interface InviteShareProps {
  isAuthenticated: boolean;
}

export default function InviteShare({ isAuthenticated }: InviteShareProps) {
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const info = await getInviteInfo();
      setInviteInfo(info);
    } catch (error) {
      console.error("加载邀请信息失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (inviteInfo?.inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteInfo.inviteLink);
        toast.success("邀请链接已复制到剪贴板");
      } catch (error) {
        toast.error("复制失败，请手动复制");
      }
    }
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* 标题 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
            分享得免费额度
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            邀请好友注册，双方各得500字免费额度
          </p>
        </div>

        {/* 主要内容卡片 */}
        <div className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-3xl shadow-xl p-8 mb-8">
          {/* 邀请链接区域 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                专属邀请链接
              </h3>
              {isAuthenticated && (
                <button
                  onClick={copyInviteLink}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-copy"></i>
                  <span>一键复制</span>
                </button>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              {isAuthenticated ? (
                <p className="text-sm text-slate-600 dark:text-slate-300 break-all">
                  {loading ? "加载中..." : (inviteInfo?.inviteLink || "加载失败")}
                </p>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  登录后生成专属额度分享链接。
                </p>
              )}
            </div>
          </div>

          {/* 邀请统计 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
            <h4 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">
              邀请统计
            </h4>
            {isAuthenticated ? (
              loading ? (
                <div className="flex items-center justify-center py-4">
                  <i className="fa fa-spinner fa-spin text-blue-600"></i>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {inviteInfo?.stats.totalInvited || 0}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">已邀请人数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {inviteInfo?.stats.totalRewardedWords || 0}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">已获得字数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                      {inviteInfo?.stats.pending || 0}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">待发放</p>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-4">
                <Link
                  to="/login"
                  className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  立即登录
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 说明卡片 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h4 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">
            邀请规则
          </h4>
          <ul className="space-y-3 text-slate-600 dark:text-slate-300">
            <li className="flex items-start">
              <i className="fa-solid fa-check-circle text-green-500 mt-1 mr-3"></i>
              <span>分享专属邀请链接给好友</span>
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-check-circle text-green-500 mt-1 mr-3"></i>
              <span>好友通过链接注册并完成首次处理</span>
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-check-circle text-green-500 mt-1 mr-3"></i>
              <span>双方各获得500字免费额度</span>
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-check-circle text-green-500 mt-1 mr-3"></i>
              <span>免费额度无使用期限，随时可用</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
