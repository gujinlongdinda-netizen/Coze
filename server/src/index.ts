import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";

// 导入路由
import authRouter from "./api/auth";
import rechargeRouter from "./api/recharge";
import processRouter from "./api/process";
import payRouter from "./api/pay";
import inviteRouter from "./api/invite";

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 5005;

// 中间件
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || "https://zhibishop.cn"
    : ["http://localhost:5000", "http://localhost:5001", "http://localhost:5002", "http://localhost:5003", "http://localhost:5004", "http://localhost:5005", "http://localhost:5006", "http://localhost:5007", "http://localhost:5008", "http://localhost:5009"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session 中间件
app.use(
  session({
    secret: process.env.SESSION_SECRET || "zhibi-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 180 * 24 * 60 * 60 * 1000, // 180天
    },
  })
);

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "知笔后端服务运行正常" });
});

// API 路由
app.use("/api/auth", authRouter);
app.use("/api/recharge", rechargeRouter);
app.use("/api/process", processRouter);
app.use("/api/pay", payRouter);
app.use("/api/invite", inviteRouter);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: "接口不存在" });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("服务器错误:", err);
  res.status(500).json({ error: "服务器内部错误" });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`知笔后端服务运行在端口 ${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/health`);
});
