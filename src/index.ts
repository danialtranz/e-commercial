import "./config/config";
import path from "path";
import express, { Application, Request } from "express";
import bodyParser from "body-parser";
import { IDataResponse } from "./interface/request/request";
import { connectRedis } from "./config/redis";
import { connectKafkaProducer } from "./config/kafka";
import { connectEmail } from "./utils/emailUtil";

connectRedis()
  .then(() => {
    console.log("Connected redis!");
  })
  .catch((err) => {
    console.error("Redis connection failed:", err);
  });

connectEmail()
  .then(() => {
    console.log("Connected email (SMTP)!");
  })
  .catch((err) => {
    console.error("Email service connection failed:", err);
  });

connectKafkaProducer()
  .then(() => {
    console.log("Connected Kafka producer!");
  })
  .catch((err) => {
    console.error("Kafka producer connection failed:", err);
  });

import sequelize from "./config/postgres";
sequelize
  .authenticate()
  .then(() => {
    console.log("Connected postgres!");
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

import {
  userRouter,
  shopownerAuthRouter,
  collaboratorRouter,
  commonRouter,
} from "./routers";

const app = express();

/** Quảng cáo dạng video: file lưu disk, truy cập GET /videos/... */
const publicVideosDir = path.join(__dirname, "public", "videos");
app.use("/videos", express.static(publicVideosDir));

/** Video đính kèm bình luận sản phẩm: GET /video_comment/... */
const publicVideoCommentDir = path.join(
  __dirname,
  "public",
  "video_comment",
);
app.use("/video_comment", express.static(publicVideoCommentDir));

//
//CORS
import configCors from "./config/cors";
configCors(app);
//
//COOKIE
import cookieParser from "cookie-parser";
const router = express.Router();
app.use(cookieParser());

// Parse JSON body cho các route khác - phải đặt trước router
app.use(express.json({ limit: "10mb" }));
router.get("/v1/health", (req: Request, res: IDataResponse) => {
  res.status(200).json({
    code: 200,
    msg: "Payment service is running smoothly",
    data: {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  });
});

app.use(router);
app.use("/v1", userRouter);
app.use("/v1", shopownerAuthRouter);
app.use("/v1", collaboratorRouter);
app.use("/v1", commonRouter);
//Connect socket
import { createServer } from "http";
const server = createServer(app);

const port = Number(process.env.AGENT_PORT) || 3005;
server.listen(port, () => {
  console.log(`Agent is running on http://localhost:${port}`);
});
