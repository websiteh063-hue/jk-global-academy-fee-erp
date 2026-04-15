const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const studentRoutes = require("./routes/studentRoutes");
const feeStructureRoutes = require("./routes/feeStructureRoutes");
const feeRoutes = require("./routes/feeRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const clientDistPath = path.resolve(__dirname, "../../client/dist");
const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: isProduction ? true : "*"
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "School Fee ERP API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/fee-structures", feeStructureRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/reports", reportRoutes);

if (isProduction) {
  app.use(express.static(clientDistPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    return res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
