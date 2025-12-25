const router = require("express").Router();
const auth = require("../controllers/auth.controller");

router.post("/verify-otp", auth.verifyOtpAndLogin);
router.post("/Signup", auth.signup)
router.post("/SendOTP",auth.SendOTP)

module.exports = router;
