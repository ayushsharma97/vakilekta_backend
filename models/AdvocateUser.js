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
      sparse: true   // ⭐ IMPORTANT
    },
    ADV_Photo: String,

    Latitude: Number,
    Longitude: Number,

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [lng, lat]
        index: "2dsphere"
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdvocateUser", advocateSchema);
