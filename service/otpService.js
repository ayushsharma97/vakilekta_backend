const axios = require("axios");

async function sendOTP(mobile, otp) {
    try {
        const payload = {
            route: "otp",
            variables_values: otp,
            numbers: mobile
        };

        const response = await axios.post(
            "https://www.fast2sms.com/dev/bulkV2",
            payload,
            {
                headers: {
                    authorization: process.env.FAST2SMS_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Fast2SMS Response:", response.data);
        return response.data;

    } catch (error) {
        console.log("Fast2SMS Error:", error.response?.data || error);
        throw error;
    }
}

module.exports = { sendOTP };
