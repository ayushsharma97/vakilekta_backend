const mongoose = require("mongoose");

const otpLogSchema = new mongoose.Schema({
    mobile: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    is_used: { type: Boolean, default: false },
    expires_at: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model("OtpLog", otpLogSchema);
