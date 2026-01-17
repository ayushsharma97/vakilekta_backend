const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
dotenv.config();
const app = express();
const fs = require("fs");

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const advRoutes = require("./routes/advocate.routes");
const coordinateRoutes = require("./routes/coordinate.routes");
const uploadRoutes = require("./routes/upload.routes");
const bannerRoutes = require("./routes/banner.routes");
// const notificationRoutes = require("./routes/notification.routes");

// Middleware
app.use(express.json());

app.use(
  "/documents",
  express.static(path.join(__dirname, "documents"))
);

// Connect MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("Hello from vakilekta backend");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/advocate", advRoutes);
app.use("/api/coordinates", coordinateRoutes);
app.use("/api/upload-profile", uploadRoutes);
app.use("/api/banner", bannerRoutes);
app.get("/api/documents", (req, res) => {
  const files = fs
    .readdirSync(path.join(__dirname, "documents"))
    .filter(file => file.endsWith(".pdf"));

  res.json(files);
});
// app.use("/api/notifications",notificationRoutes);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
