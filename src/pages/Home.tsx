import { useContext } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/authContext";
import { useTheme } from "../hooks/useTheme";
import InviteShare from "../components/InviteShare";

export default function Home() {
    const {
        isAuthenticated,
        loading
    } = useContext(AuthContext);

    const {
        theme,
        toggleTheme
    } = useTheme();

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {}
            <header className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <Link to="/" className="flex items-center">
                        <motion.div
                            initial={{
                                rotate: 0
                            }}
                            animate={{
                                rotate: 360
                            }}
                            transition={{
                                duration: 2,
                                repeat: 0
                            }}
                            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 mr-2 cursor-pointer">
                            <i className="fa-solid fa-pen-nib"></i>
                        </motion.div>
                        <h1 className="text-2xl font-bold">知笔</h1>
                    </Link>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="切换主题">
                        {theme === "light" ? <i className="fa-solid fa-moon"></i> : <i className="fa-solid fa-sun"></i>}
                    </button>
                    <Link
                        to="/login"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors">登录/注册
                                                                                                            </Link>
                </div>
            </header>
            {}
            <section
                className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
                <motion.h2
                    initial={{
                        opacity: 0,
                        y: -20
                    }}
                    animate={{
                        opacity: 1,
                        y: 0
                    }}
                    transition={{
                        duration: 0.5
                    }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">让您的文字<span
                        className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">远离AI检测</span>
                </motion.h2>
                <motion.p
                    initial={{
                        opacity: 0,
                        y: -20
                    }}
                    animate={{
                        opacity: 1,
                        y: 0
                    }}
                    transition={{
                        duration: 0.5,
                        delay: 0.2
                    }}
                    className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl">专业反AI检测算法，模拟真实写作者的表达方式，让您的文本轻松通过各类学术检测系统
                                                                                        </motion.p>
            </section>
            {}
            <section
                className="container mx-auto px-4 py-16 bg-white dark:bg-slate-800 rounded-3xl shadow-lg mx-4 mb-16">
                <h2 className="text-3xl font-bold text-center mb-12">如何使用</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20
                        }}
                        whileInView={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.5
                        }}
                        viewport={{
                            once: true
                        }}
                        className="flex flex-col items-center text-center">
                        <div
                            className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 text-2xl mb-4">
                            <span className="font-bold">1</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">粘贴文本</h3>
                        <p className="text-slate-600 dark:text-slate-300">将需要处理的文本粘贴到输入框中</p>
                    </motion.div>
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20
                        }}
                        whileInView={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.5,
                            delay: 0.2
                        }}
                        viewport={{
                            once: true
                        }}
                        className="flex flex-col items-center text-center">
                        <div
                            className="w-16 h-16 bg-violet-100 dark:bg-violet-900 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-300 text-2xl mb-4">
                            <span className="font-bold">2</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">智能处理</h3>
                        <p className="text-slate-600 dark:text-slate-300">我们的算法将模拟人类写作方式重新表达您的文本</p>
                    </motion.div>
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20
                        }}
                        whileInView={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.5,
                            delay: 0.4
                        }}
                        viewport={{
                            once: true
                        }}
                        className="flex flex-col items-center text-center">
                        <div
                            className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-300 text-2xl mb-4">
                            <span className="font-bold">3</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">复制使用</h3>
                        <p className="text-slate-600 dark:text-slate-300">复制处理后的文本直接使用，轻松通过检测</p>
                    </motion.div>
                </div>
                <div className="text-center mt-12">
                    {isAuthenticated ? <Link
                        to="/process"
                        className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-2xl font-bold transition-colors">立即开始使用
                                                                                                            </Link> : (
                        <div>
                            <Link
                                to="/login"
                                className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-2xl font-bold transition-colors">登录免费试用500字
                                                                                                            </Link>
                        </div>
                    )}
                </div>
            </section>
            {}
            <section
                className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
                <></>
                <></>
                <motion.div
                    initial={{
                        opacity: 0,
                        y: -20
                    }}
                    animate={{
                        opacity: 1,
                        y: 0
                    }}
                    transition={{
                        duration: 0.5,
                        delay: 0.4
                    }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                    <motion.div
                        whileHover={{
                            y: -5
                        }}
                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                        <div className="text-3xl text-blue-600 dark:text-blue-400 mb-4">
                            <i className="fa-solid fa-shield-halved"></i>
                        </div>
                        <h3 className="text-xl font-bold mb-2">反AI独家算法</h3>
                        <p className="text-slate-600 dark:text-slate-300">模拟真实人类写作风格，彻底改变AI检测特征</p>
                    </motion.div>
                    <motion.div
                        whileHover={{
                            y: -5
                        }}
                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                        <div className="text-3xl text-violet-600 dark:text-violet-400 mb-4">
                            <i className="fa-solid fa-check-circle"></i>
                        </div>
                        <h3 className="text-xl font-bold mb-2">检测平台支持</h3>
                        <p className="text-slate-600 dark:text-slate-300">支持中国知网、维普、Turnitin等主流检测系统</p>
                    </motion.div>
                    <motion.div
                        whileHover={{
                            y: -5
                        }}
                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                        <div className="text-3xl text-green-600 dark:text-green-400 mb-4">
                            <i className="fa-solid fa-money-bill-wave"></i>
                        </div>
                        <h3 className="text-xl font-bold mb-2">全额退款承诺</h3>
                        <p className="text-slate-600 dark:text-slate-300">未通过检测率，我们承诺全额退款</p>
                    </motion.div>
                </motion.div>
            </section>
            {}
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center mb-12">灵活的价格方案</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    <motion.div
                        whileHover={{
                            y: -5
                        }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2">单次应急</h3>
                            <p className="text-3xl font-bold mb-4">¥6<span className="text-sm text-slate-500 dark:text-slate-400 font-normal">/500字</span></p>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">适合结尾/摘要修改，随买随走，灵活方便</p>
                            <Link
                                to="/pricing"
                                className="block w-full py-2 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">立即购买
                                                                                                                                              </Link>
                        </div>
                    </motion.div>
                    <motion.div
                        whileHover={{
                            y: -5
                        }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2">超值套餐</h3>
                            <p className="text-3xl font-bold mb-4">¥29<span className="text-sm text-slate-500 dark:text-slate-400 font-normal">/3,000字</span></p>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">适合核心章节降重，单价仅4.8元</p>
                            <Link
                                to="/pricing"
                                className="block w-full py-2 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">立即购买
                                                                                                                                              </Link>
                        </div>
                    </motion.div>
                    <motion.div
                        whileHover={{
                            y: -5,
                            boxShadow: "0 25px 50px -12px rgba(66, 24, 139, 0.25)"
                        }}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-lg overflow-hidden relative border-2 border-indigo-600 dark:border-indigo-400">
                        <div
                            className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 text-sm font-bold shadow-md">主推款
                                                                                                                             </div>
                        <div
                            className="p-6"
                            style={{
                                backgroundColor: "#FFFFFF"
                            }}>
                            <h3
                                className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">全篇包干</h3>
                            <p className="text-3xl font-bold mb-4 text-indigo-700 dark:text-indigo-400">¥99<span className="text-sm text-slate-500 dark:text-slate-400 font-normal">/15,000字</span></p>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">适合整篇初稿降重，适合大篇幅一次性处理</p>
                            <Link
                                to="/pricing"
                                className="block w-full py-3 text-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1">立即购买
                                                                                                                                               </Link>
                        </div>
                    </motion.div>
                    <motion.div
                        whileHover={{
                            y: -5
                        }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2">七日无限</h3>
                            <p className="text-3xl font-bold mb-4">¥499<span className="text-sm text-slate-500 dark:text-slate-400 font-normal">/7天不限字数</span></p>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">适合深度返修/工作室，顶级权限，闭眼无限改</p>
                            <Link
                                to="/pricing"
                                className="block w-full py-2 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">立即购买
                                                                                                                                              </Link>
                        </div>
                    </motion.div>
                    <motion.div
                        whileHover={{
                            y: -5,
                            boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.25)"
                        }}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl shadow-lg overflow-hidden relative">
                        <div
                            className="absolute top-0 right-0 bg-green-600 text-white px-4 py-1 text-sm font-bold shadow-md">新人专享
                                                                                                                             </div>
                        <div
                            className="p-6"
                            style={{
                                backgroundColor: "#FFFFFF"
                            }}>
                            <h3
                                className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">新人体验</h3>
                            <p className="text-3xl font-bold mb-4 text-green-700 dark:text-green-400">¥0<span className="text-sm text-slate-500 dark:text-slate-400 font-normal">/500字</span></p>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">首次试用 建立信任，零成本体验</p>
                            <Link
                                to="/pricing"
                                className="block w-full py-3 text-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1">立即体验
                                                                                                                                               </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
            {}
            {/* 分享得免费额度板块 */}
            <InviteShare isAuthenticated={isAuthenticated} />
            {}
            <section
                className="container mx-auto px-4 py-16 bg-white dark:bg-slate-800 rounded-3xl shadow-lg mx-4 mb-16">
                <h2 className="text-3xl font-bold text-center mb-12">常见问题</h2>
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                        <h3 className="text-lg font-bold mb-2">什么是降AI率？</h3>
                        <p className="text-slate-600 dark:text-slate-300">降AI率是指将AI生成的文本通过特殊处理，使其更接近人类写作风格，从而降低被AI检测工具识别的概率。</p>
                    </div>
                    <></>
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                        <h3 className="text-lg font-bold mb-2">降AI效果如何达到最好？</h3>
                        <p className="text-slate-600 dark:text-slate-300">知笔独家算法，建议每次处理文本不超过1000字，对于部分专业术语较多的文本，反复处理两次以上效果更佳。</p>
                    </div>
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                        <h3 className="text-lg font-bold mb-2">退款政策是怎样的？</h3>
                        <p className="text-slate-600 dark:text-slate-300">如果您使用我们的服务后，文本仍被检测出AI生成，我们将提供全额退款。</p>
                    </div>
                </div>
            </section>
            {}
            <footer className="bg-slate-800 dark:bg-slate-900 text-white py-10">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center mb-4 md:mb-0">
                            <i className="fa-solid fa-pen-nib text-2xl mr-2"></i>
                            <span className="text-xl font-bold">知笔</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 mb-4 md:mb-0">
                            <a href="#" className="hover:text-blue-400 transition-colors">首页</a>
                            <a href="#pricing" className="hover:text-blue-400 transition-colors">价格</a>
                            <a href="#" className="hover:text-blue-400 transition-colors">常见问题</a>
                            <span className="text-slate-400">邮箱：3780565612@qq.com</span>
                        </div>
                        <div className="flex space-x-4">
                            <a href="#" className="hover:text-blue-400 transition-colors">
                                <i className="fa-weixin text-xl"></i>
                            </a>
                            <a href="#" className="hover:text-blue-400 transition-colors">
                                <i className="fa-weibo text-xl"></i>
                            </a>
                            <a href="#" className="hover:text-blue-400 transition-colors">
                                <i className="fa-envelope text-xl"></i>
                            </a>
                        </div>
                    </div>
                    <div
                        className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-400">
                        <p>© 2026 知笔 版权所有 | 专业降AI检测率工具</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}