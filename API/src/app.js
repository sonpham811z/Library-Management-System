require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const tokenBucketMiddleware = require("./utils/tokenBucket");
const { errorHandler, notFound } = require("./middlewares/error.middleware");

// Routes
const authRoutes = require("./routes/auth.routes");
const thamsoRoutes = require("./routes/thamso.routes");
const nguoidungRoutes = require("./routes/nguoidung.routes");
const nhomnguoidungRoutes = require("./routes/nhomnguoidung.routes");
const docgiaRoutes = require("./routes/docgia.routes");
const loaidocgiaRoutes = require("./routes/loaidocgia.routes");
const theloaiRoutes = require("./routes/theloai.routes");
const tacgiaRoutes = require("./routes/tacgia.routes");
const tuasachRoutes = require("./routes/tuasach.routes");
const sachRoutes = require("./routes/sach.routes");
const phieumuonRoutes = require("./routes/phieumuon.routes");
const phieutraRoutes = require("./routes/phieutra.routes");
const phieuthutienphatRoutes = require("./routes/phieuthutienphat.routes");
const baocaoRoutes = require("./routes/baocao.routes");
const reportRoutes = require("./routes/report.routes");
const fineRoutes = require("./routes/fine.routes");
const phieuthuRoutes = require("./routes/phieuthu.routes");
const datchoRoutes = require("./routes/datcho.routes");
const aiRoutes = require("./routes/ai.routes");
const phieunhapRoutes = require("./routes/phieunhap.routes");

const app = express();

// ─── Security & Logging ──────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── CORS ────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.CLIENT_URL || "http://localhost:3000";
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (origin === ALLOWED_ORIGIN) return callback(null, true);
      console.warn(
        `[CORS] Blocked origin: "${origin}" — expected: "${ALLOWED_ORIGIN}"`,
      );
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Request Timeout (30s) ───────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    console.error(`[TIMEOUT] ${req.method} ${req.originalUrl} exceeded 30s`);
    if (!res.headersSent) {
      res.status(504).json({ success: false, message: "Request timeout" });
    }
  });
  next();
});

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting (Token Bucket) ────────────────────────────────────────────
app.use("/api/", tokenBucketMiddleware);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/thamso", thamsoRoutes);
app.use("/api/nguoidung", nguoidungRoutes);
app.use("/api/nhomnguoidung", nhomnguoidungRoutes);
app.use("/api/docgia", docgiaRoutes);
app.use("/api/loaidocgia", loaidocgiaRoutes);
app.use("/api/theloai", theloaiRoutes);
app.use("/api/tacgia", tacgiaRoutes);
app.use("/api/tuasach", tuasachRoutes);
app.use("/api/sach", sachRoutes);
app.use("/api/phieumuon", phieumuonRoutes);
app.use("/api/phieutra", phieutraRoutes);
app.use("/api/phieuthutienphat", phieuthutienphatRoutes);
app.use("/api/baocao", baocaoRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/phieuthu", phieuthuRoutes);
app.use("/api/datcho", datchoRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/phieunhap", phieunhapRoutes);
// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Library API running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = app;
