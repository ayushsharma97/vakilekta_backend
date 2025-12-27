const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true
    },
    image_url: {
      type: String,
      required: true
    },
    expire_time: {
      type: Date,
      required: true
    },
    status: {
      type: Number,
      default: 1 // 1 = active, 0 = inactive
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
