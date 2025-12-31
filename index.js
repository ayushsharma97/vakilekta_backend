const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const app = express();

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


// Middleware
app.use(express.json());

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

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
