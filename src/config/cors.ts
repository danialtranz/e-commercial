import { Response, Request, NextFunction } from "express";

const configCors = (app: any) => {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Cho phép tất cả origin
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE",
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With, Content-Type, Authorization, x-shop-id",
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
};

export default configCors;
