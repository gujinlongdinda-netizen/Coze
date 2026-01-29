import { useContext, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../contexts/authContext";
import { toast } from "sonner";
import { db } from "../lib/db";
import { createPaymentOrder } from "../api/pay";

interface PricingPlan {
    id: string;
    name: string;
    price: number;
    words: number;
    description: string;
    tag?: string;
    isUnlimited?: boolean;
    unlimitedDays?: number;
}

interface PaymentQRCode {
    id: string;
    planId: string;
    qrCodeUrl: string;
    amount: number;
    paymentMethod: string;
}

export default function Pricing() {
    const {
        userInfo,
        updateRemainingWords
    } = useContext(AuthContext);

    const navigate = useNavigate();

    const pricingPlans: PricingPlan[] = [{
        id: "single",
        name: "单次应急",
        price: 6,
        words: 500,
        description: "适合结尾/摘要修改，随买随走，灵活方便"
    }, {
        id: "value",
        name: "超值套餐",
        price: 29,
        words: 3000,
        description: "适合核心章节降重，单价仅4.8元"
    }, {
        id: "full",
        name: "全篇包干",
        price: 99,
        words: 15000,
        description: "适合整篇初稿降重，适合大篇幅一次性处理",
        tag: "主推"
    }, {
        id: "unlimited",
        name: "七日无限",
        price: 499,
        words: 0,
        description: "适合深度返修/工作室，顶级权限，闭眼无限改",
        isUnlimited: true,
        unlimitedDays: 7
    }, {
        id: "newbie",
        name: "新人体验",
        price: 0,
        words: 500,
        description: "首次试用 建立信任，零成本体验",
        tag: "新人专享"
    }];

    const paymentQRCodes: PaymentQRCode[] = [{
        id: "wechat-single",
        planId: "single",
        qrCodeUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=WeChat%20Pay%20QR%20Code%20for%206%20Yuan%20payment&sign=d40f4a2d8e4c2f9f2896aa76e95fd8a2",
        amount: 6,
        paymentMethod: "微信支付"
    }, {
        id: "wechat-value",
        planId: "value",
        qrCodeUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=WeChat%20Pay%20QR%20Code%20for%2029%20Yuan%20payment&sign=02370dc91f452c90668ba9d441e71e04",
        amount: 29,
        paymentMethod: "微信支付"
    }, {
        id: "wechat-full",
        planId: "full",
        qrCodeUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=WeChat%20Pay%20QR%20Code%20for%2099%20Yuan%20payment&sign=c63648f3dfc21aa6f1090b36cf4759b9",
        amount: 99,
        paymentMethod: "微信支付"
    }, {
        id: "wechat-unlimited",
        planId: "unlimited",
        qrCodeUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=WeChat%20Pay%20QR%20Code%20for%20499%20Yuan%20payment&sign=69155b66baf0db8baa02bb14ccc3da2b",
        amount: 499,
        paymentMethod: "微信支付"
    }, {
        id: "alipay-single",
        planId: "single",
        qrCodeUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Alipay%20QR%20Code%20for%206%20Yuan%20payment&sign=7eec3bfc6fe54c7bbc2c7d819c4bd704",
        amount: 6,
        paymentMethod: "支付宝"
    }, {
        id: "alipay-value",
        planId: "value",
        qrCodeUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Alipay%20QR%20Code%20for%2029%20Yuan%20payment&sign=62ed269226dbec6c9dfd7ab3d482e70f",
        amount: 29,
        paymentMethod: "支付宝"
    }, {
        id: "alipay-full",
        planId: "full",
        qrCodeUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Alipay%20QR%20Code%20for%2099%20Yuan%20payment&sign=6dfdba8fa9d518b0854ec9fef0e40960",
        amount: 99,
        paymentMethod: "支付宝"
    }, {
        id: "alipay-unlimited",
        planId: "unlimited",
        qrCodeUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Alipay%20QR%20Code%20for%20499%20Yuan%20payment&sign=da0c352c29846de34c0271bb9fe1aab6",
        amount: 499,
        paymentMethod: "支付宝"
    }];

    const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("微信支付");

    const handlePurchase = async (plan: PricingPlan) => {
        if (!userInfo) {
            toast.error("请先登录");
            return;
        }

        if (plan.id === "newbie") {
            if (!userInfo.isFirstTime) {
                toast.error("您已经使用过新人体验套餐");
                return;
            }

            setTimeout(() => {
                try {
                    const newRemainingWords = userInfo.remainingWords + plan.words;
                    updateRemainingWords(newRemainingWords);

                    db.updateUser(userInfo.id, {
                        isFirstTime: false
                    });

                    toast.success(`获取${plan.name}成功，您的剩余字数为${newRemainingWords}字`);
                } catch (error) {
                    toast.error("获取免费套餐失败，请重试");
                    console.error("处理免费套餐时出错:", error);
                }
            }, 500);

            return;
        }

        // 映射套餐 ID 到后端 planType
        const planTypeMap: Record<string, string> = {
            "single": "500words",
            "value": "3000words",
            "full": "15000words",
            "unlimited": "7days"
        };

        const planType = planTypeMap[plan.id];

        if (!planType) {
            toast.error("无效的套餐类型");
            return;
        }

        // 显示加载提示
        toast.loading("正在创建支付订单...");

        try {
            // 调用支付 API 创建订单
            const result = await createPaymentOrder(planType);

            if (result.success && result.pay_url) {
                toast.dismiss();
                toast.success("订单创建成功，正在跳转到支付页面...");

                // 跳转到支付页面
                setTimeout(() => {
                    window.location.href = result.pay_url!;
                }, 1000);
            } else {
                toast.dismiss();
                toast.error(result.error || "创建订单失败，请稍后重试");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("网络错误，请稍后重试");
            console.error("创建支付订单时出错:", error);
        }
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedPlan(null);
    };

    const getSelectedQRCode = () => {
        if (!selectedPlan)
            return null;

        return paymentQRCodes.find(
            qr => qr.planId === selectedPlan.id && qr.paymentMethod === selectedPaymentMethod
        );
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 py-12 px-4">
            {}
            <header
                className="container mx-auto px-4 py-4 flex justify-between items-center mb-12">
                <Link to="/" className="flex items-center">
                    <i
                        className="fa-solid fa-pen-nib text-2xl text-blue-600 dark:text-blue-400 mr-2"></i>
                    <h1 className="text-2xl font-bold">知笔</h1>
                </Link>
                <div className="flex items-center space-x-4">
                    {userInfo && <div className="text-sm text-slate-600 dark:text-slate-300">剩余字数: <span className="font-bold text-blue-600 dark:text-blue-400">{userInfo.remainingWords}</span>字
                                                            </div>}
                </div>
            </header>
            {}
            <div className="container mx-auto mb-16 text-center">
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
                    className="text-3xl md:text-4xl font-bold mb-4">选择适合您的套餐
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
                    className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">灵活的价格方案，满足不同用户的需求
                                                </motion.p>
            </div>
            {}
            <div className="container mx-auto max-w-5xl">
                <motion.div
                    initial={{
                        opacity: 0,
                        y: 20
                    }}
                    animate={{
                        opacity: 1,
                        y: 0
                    }}
                    transition={{
                        duration: 0.5
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pricingPlans.map(plan => <motion.div
                        key={plan.id}
                        whileHover={{
                            y: -5,
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                        }}
                        className={`rounded-2xl overflow-hidden border relative ${plan.tag === "主推" ? "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-600 dark:border-indigo-400 shadow-lg z-10 transform scale-[1.02]" : plan.tag === "新人专享" ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg z-10 transform scale-[1.02]" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"} transition-all duration-300 h-full flex flex-col`}>
                        {plan.tag && <div
                            className={`absolute top-0 right-0 ${plan.tag === "主推" ? "bg-indigo-600" : plan.tag === "新人专享" ? "bg-green-600" : "bg-blue-600"} text-white px-4 py-1 text-sm font-bold shadow-md`}>
                            {plan.tag}款
                                                      </div>}
                        <div
                            className="p-6 flex flex-col flex-grow"
                            style={{
                                backgroundColor: "#FFFFFF"
                            }}>
                            <h3
                                className={`text-xl font-bold mb-2 ${plan.tag === "主推" ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400" : plan.tag === "新人专享" ? "bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400" : ""}`}>{plan.name}</h3>
                            <div className="mb-3">
                                <span
                                    className={`text-3xl font-bold ${plan.tag === "主推" ? "text-indigo-700 dark:text-indigo-400" : plan.tag === "新人专享" ? "text-green-700 dark:text-green-400" : ""}`}>¥{plan.price}</span>
                                {plan.isUnlimited ? <span className="text-sm text-slate-500 dark:text-slate-400">/{plan.unlimitedDays}天不限字数</span> : <span className="text-sm text-slate-500 dark:text-slate-400">/{plan.words.toLocaleString()}字</span>}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-xs mb-4">{plan.description}</p>
                            <div className="mt-auto">
                                <button
                                    onClick={() => handlePurchase(plan)}
                                    disabled={plan.id === "newbie" && userInfo && !userInfo.isFirstTime}
                                    className={`w-full py-3 rounded-lg text-white font-medium transition-all duration-300 ${plan.tag === "主推" ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-1" : plan.tag === "新人专享" ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transform hover:-translate-y-1" : "bg-blue-600 hover:bg-blue-700"} ${plan.id === "newbie" && userInfo && !userInfo.isFirstTime ? "opacity-50 cursor-not-allowed" : ""}`}>{plan.id === "newbie" ? "立即体验" : "立即购买"}
                                                                  </button>
                            </div>
                        </div>
                    </motion.div>)}
                </motion.div>
                {}
                <motion.div
                    initial={{
                        opacity: 0,
                        y: 20
                    }}
                    animate={{
                        opacity: 1,
                        y: 0
                    }}
                    transition={{
                        duration: 0.5,
                        delay: 0.4
                    }}
                    className="mt-16 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold mb-6 text-left">服务说明</h3>
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
            </div>
            {}
            <div className="container mx-auto max-w-3xl mt-16">
                <h3 className="text-2xl font-bold mb-6 text-center">常见问题</h3>
                <div className="space-y-4">
                    <div
                        className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                        <h4 className="text-lg font-bold mb-2">购买的字数有效期是多久？</h4>
                        <p className="text-slate-600 dark:text-slate-300">购买的字数长期有效，除非您使用完毕或账户被注销。</p>
                    </div>
                    <></>
                    <div
                        className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                        <h4 className="text-lg font-bold mb-2">七日无限套餐是什么意思？</h4>
                        <p className="text-slate-600 dark:text-slate-300">七日无限套餐允许您在购买后7天内不限字数使用我们的服务，适合需要大量处理文本的用户。</p>
                    </div>
                </div>
            </div>
            {}
            {showPaymentModal && selectedPlan && <motion.div
                initial={{
                    opacity: 0
                }}
                animate={{
                    opacity: 1
                }}
                exit={{
                    opacity: 0
                }}
                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
                onClick={closePaymentModal}>
                <motion.div
                    initial={{
                        scale: 0.9,
                        opacity: 0
                    }}
                    animate={{
                        scale: 1,
                        opacity: 1
                    }}
                    exit={{
                        scale: 0.9,
                        opacity: 0
                    }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6"
                    onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">购买 {selectedPlan.name}</h3>
                        <button
                            onClick={closePaymentModal}
                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                            <i className="fa-solid fa-times text-xl"></i>
                        </button>
                    </div>
                    <div className="text-center mb-6">
                        <p className="text-lg mb-2">请支付: <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">¥{selectedPlan.price}</span>
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">
                            {selectedPlan.isUnlimited ? `获得 ${selectedPlan.unlimitedDays} 天不限字数使用权限` : `获得 ${selectedPlan.words.toLocaleString()} 字处理额度`}
                        </p>
                    </div>
                    {}
                    <div className="mb-6">
                        <p className="text-sm font-medium mb-2">选择支付方式:</p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setSelectedPaymentMethod("微信支付")}
                                className={`flex-1 py-2 px-4 border rounded-lg transition-colors ${selectedPaymentMethod === "微信支付" ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-slate-300 dark:border-slate-600"}`}>
                                <i
                                    className={`fab fa-weixin mr-2 ${selectedPaymentMethod === "微信支付" ? "text-green-500" : ""}`}></i>微信支付
                                                                </button>
                            <button
                                onClick={() => setSelectedPaymentMethod("支付宝")}
                                className={`flex-1 py-2 px-4 border rounded-lg transition-colors ${selectedPaymentMethod === "支付宝" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-600"}`}>
                                <i
                                    className={`fab fa-alipay mr-2 ${selectedPaymentMethod === "支付宝" ? "text-blue-500" : ""}`}></i>支付宝
                                                                </button>
                        </div>
                    </div>
                    {}
                    <div className="flex flex-col items-center mb-6">
                        <div
                            className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 mb-2">
                            {getSelectedQRCode() && <img
                                src={getSelectedQRCode()?.qrCodeUrl}
                                alt={`${selectedPaymentMethod}收款码`}
                                className="w-48 h-48 object-contain" />}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">请使用{selectedPaymentMethod}扫描上方二维码支付
                                                        </p>
                    </div>
                    {}
                    <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg mb-6">
                        <p className="text-sm text-slate-600 dark:text-slate-300">订单编号: <span className="font-medium">{`ORD-${Date.now().toString().slice(-8)}`}</span>
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">下单时间: <span className="font-medium">{new Date().toLocaleString("zh-CN")}</span>
                        </p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={closePaymentModal}
                            className="flex-1 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">取消
                                                        </button>
                        <button
                            onClick={() => {
                                if (userInfo) {
                                    const newRemainingWords = userInfo.remainingWords + selectedPlan.words;
                                    updateRemainingWords(newRemainingWords);
                                    toast.success(`购买${selectedPlan.name}成功，您的剩余字数为${newRemainingWords}字`);
                                }

                                closePaymentModal();

                                setTimeout(() => {
                                    navigate("/process");
                                }, 1000);
                            }}
                            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">我已支付
                                                        </button>
                    </div>
                </motion.div>
            </motion.div>}
        </div>
    );
}