const jwt = require("jsonwebtoken");
const twilio = require("twilio");

const OtpLog = require("../models/otpLog");
const AdvocateUser = require("../models/AdvocateUser");

/* ================= HELPERS ================= */

function normalizePhone(phone) {
    if (!phone) return null;
    phone = phone.replace(/\s|-/g, '');
    if (phone.startsWith('+91')) phone = phone.slice(3);
    if (phone.startsWith('0') && phone.length === 11) phone = phone.slice(1);
    return phone;
}

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const sendOTP = async (phone, otp) => {
    await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: "+91" + phone,
    });
};

/* ================= SEND OTP ================= */

exports.SendOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: "Phone required" });

        const normalizedPhone = normalizePhone(phone);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Invalidate old OTPs
        await OtpLog.updateMany(
            { mobile: normalizedPhone },
            { $set: { is_used: true } }
        );

        // Store new OTP
        await OtpLog.create({
            mobile: normalizedPhone,
            otp,
            expires_at: expiresAt
        });

        await sendOTP(normalizedPhone, otp);

        res.json({ success: true, message: "OTP sent successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
};

/* ================= VERIFY OTP & LOGIN ================= */

exports.verifyOtpAndLogin = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp)
            return res.status(400).json({ message: "Phone & OTP required" });

        const normalizedPhone = normalizePhone(phone);

        const otpDoc = await OtpLog.findOne({
            mobile: normalizedPhone,
            otp,
            is_used: false,
            expires_at: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!otpDoc)
            return res.status(401).json({ message: "Invalid or expired OTP" });

        otpDoc.is_used = true;
        await otpDoc.save();

        const advocate = await AdvocateUser.findOne({ tel_no: normalizedPhone });
        if (!advocate)
            return res.status(404).json({ message: "Advocate not found" });

        const token = jwt.sign(
            {
                id: advocate._id,
                enrollmentNo: advocate.enrollment_no,
                phone: normalizedPhone,
                lat: advocate.Latitude,
                long: advocate.Longitude,
                address: advocate.address
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ success: true, token, advocate });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "OTP verification failed" });
    }
};

/* ================= SIGNUP ================= */

exports.signup = async (req, res) => {
    try {
        const {
            regNo,
            regDate,
            barAssociation,
            name,
            address,
            latitude,
            longitude,
            photoUrl,
            OTP,
            phone
        } = req.body;


        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone || !name) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        /* 🔐 OTP VERIFY */
        const otpDoc = await OtpLog.findOne({
            mobile: normalizedPhone,
            otp: OTP,
            is_used: false,
            expires_at: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!otpDoc) {
            return res.status(401).json({ message: "Invalid or expired OTP" });
        }

        otpDoc.is_used = true;
        await otpDoc.save();

        /* 🔁 CHECK EXISTING USER */
        const exists = await AdvocateUser.findOne({ tel_no: normalizedPhone });
        if (exists) {
            return res.status(409).json({ message: "User already exists" });
        }

        /* 📍 CREATE USER WITH LOCATION */
        const user = await AdvocateUser.create({
            tel_no: normalizedPhone,
            enrollment_no: regNo,
            enrollment_date: regDate,
            bar_association: barAssociation,
            name,
            address,
            ADV_Photo: photoUrl,

            Latitude: latitude,
            Longitude: longitude,

            // 🔥 IMPORTANT PART
            location: (latitude && longitude) ? {
                type: "Point",
                coordinates: [Number(longitude), Number(latitude)]
            } : undefined
        });

        /* 🔑 JWT */
        const token = jwt.sign(
            { id: user._id, phone: normalizedPhone },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            success: true,
            message: "Signup successful",
            token,
            user
        });



    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: "Signup failed" });
    }
};

// ==================Check JWT Token================== //
exports.checkToken = (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                active: false,
                message: 'Token missing'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return res.status(200).json({
            active: true,
            message: 'Token is valid',
            user: decoded
        });

    } catch (error) {
        return res.status(401).json({
            active: false,
            message: 'Token is invalid or expired'
        });
    }
};

