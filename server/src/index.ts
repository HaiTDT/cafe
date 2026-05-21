import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth";
import { cartRouter } from "./routes/cart.routes";
import { categoryRouter } from "./routes/categories";
import { checkoutRouter } from "./routes/checkout.routes";
import { healthRouter } from "./routes/health";
import { orderRouter } from "./routes/orders.routes";
import { productRouter } from "./routes/products";
import { analyticsRouter } from "./routes/analytics.routes";
import { blogRouter } from "./routes/blogs.routes";
import { flashSaleRouter } from "./routes/flash-sale.routes";
import { userRouter } from "./routes/user.routes";
import { aiRouter } from "./routes/ai.routes";
import { publicBannerRouter, adminBannerRouter } from "./routes/banners.routes";

// POS Cafe Routers
import { posAuthRouter } from "./routes/pos-auth.routes";
import { posCategoryRouter } from "./routes/pos-category.routes";
import { posProductRouter } from "./routes/pos-product.routes";
import { posTableRouter } from "./routes/pos-table.routes";
import { posOrderRouter } from "./routes/pos-order.routes";
import { posAnalyticsRouter } from "./routes/pos-analytics.routes";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const app = express();
const port = Number(process.env.PORT ?? 4000);
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [clientUrl, "http://localhost:3000", "https://mis-hasaki-client.vercel.app"];
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    name: "Cosmetics E-commerce API",
    status: "running"
  });
});

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/analytics", analyticsRouter);
app.use("/api/blogs", blogRouter);
app.use("/api/flash-sales", flashSaleRouter);
app.use("/api/user", userRouter);
app.use("/api/ai", aiRouter);
app.use("/api/banners", publicBannerRouter);
app.use("/api/admin/banners", adminBannerRouter);

// POS Cafe Endpoints
app.use("/api/pos/auth", posAuthRouter);
app.use("/api/pos/categories", posCategoryRouter);
app.use("/api/pos/products", posProductRouter);
app.use("/api/pos/tables", posTableRouter);
app.use("/api/pos/orders", posOrderRouter);
app.use("/api/pos/analytics", posAnalyticsRouter);

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
