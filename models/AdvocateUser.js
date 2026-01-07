const mongoose = require("mongoose");

const advocateSchema = new mongoose.Schema(
  {
    enrollment_no: { type: String, index: true },
    enrollment_date: Date,
    name: { type: String, index: true },
    address: String,
    city: String,
    bar_association: String,
    tel_no: {
      type: String,
      index: true,
      sparse: true
    },
    ADV_Photo: String,

    Latitude: Number,
    Longitude: Number,

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: '2dsphere'
      }
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true, strict: false }

);

// ✅ THIS IS MANDATORY
advocateSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("AdvocateUser", advocateSchema);
