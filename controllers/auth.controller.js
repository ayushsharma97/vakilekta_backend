const db = require("../config/db");
const admin = require("../config/firebase");
const jwt = require("jsonwebtoken");
const { pool } = require('../config/db')
const twilio = require('twilio');

function normalizePhone(phone) {
    if (!phone) return null;

    // remove spaces, hyphens
    phone = phone.replace(/\s|-/g, '');

    // remove +91
    if (phone.startsWith('+91')) {
        phone = phone.slice(3);
    }

    // remove leading 0 (optional)
    if (phone.startsWith('0') && phone.length === 11) {
        phone = phone.slice(1);
    }

    return phone;
}

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

const sendOTP = async (phone, otp) => {

    await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: "+91" + phone, // e.g. +919876543210
    });

    return otp;
};

exports.SendOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ message: "Phone required" });
        }

        const normalizedPhone = normalizePhone(phone);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Invalidate old OTPs
        await pool.execute(
            'UPDATE otp_logs SET is_used = 1 WHERE mobile = ?',
            [normalizedPhone]
        );

        // Store new OTP
        await pool.execute(
            'INSERT INTO otp_logs (mobile, otp, expires_at, is_used) VALUES (?, ?, ?, 0)',
            [normalizedPhone, otp, expiresAt]
        );

        // Send OTP via Twilio
        await sendOTP(normalizedPhone, otp);

        res.json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
}

//     try {
//         const { firebaseToken } = req.body;

//         if (!firebaseToken) {
//             return res.status(400).json({ message: "Token required" });
//         }

//         // Verify Firebase ID token
//         const decoded = await admin.auth().verifyIdToken(firebaseToken);


//         const phone = normalizePhone(decoded.phone_number);

//         console.log(phone)


//         // Check advocate exists
//         const [rows] = await pool.query(
//             "SELECT * FROM advocate_user WHERE tel_no = ?",
//             [phone]
//         );

//         if (rows.length === 0) {
//             return res.status(404).json({ message: "Advocate not found" });
//         }

//         const advocate = rows[0];

//         // Generate JWT
//         const token = jwt.sign(
//             {
//                 id: advocate.id,
//                 enrollmentNo: advocate.enrollment_no,
//                 phone: phone,
//             },
//             process.env.JWT_SECRET,
//             { expiresIn: "7d" }
//         );

//         res.json({
//             success: true,
//             token,
//             advocate,
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(401).json({ message: "Invalid OTP or token" });
//     }
// };

exports.verifyOtpAndLogin = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: "Phone & OTP required" });
        }

        const normalizedPhone = normalizePhone(phone);

        const [otpRows] = await pool.query(
            `SELECT * FROM otp_logs
             WHERE mobile = ?
               AND otp = ?
               AND is_used = 0
               AND expires_at > NOW()
             ORDER BY id DESC
             LIMIT 1`,
            [normalizedPhone, otp]
        );

        if (otpRows.length === 0) {
            return res.status(401).json({ message: "Invalid or expired OTP" });
        }

        await pool.query(
            "UPDATE otp_logs SET is_used = 1 WHERE id = ?",
            [otpRows[0].id]
        );

        const [rows] = await pool.query(
            "SELECT * FROM advocate_user WHERE tel_no = ?",
            [normalizedPhone]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Advocate not found" });
        }

        const advocate = rows[0];

        const token = jwt.sign(
            {
                id: advocate.id,
                enrollmentNo: advocate.enrollment_no,
                phone: normalizedPhone,
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



        const normalizePhone = normalizePhone(phone);

        const [otpRows] = await pool.query(
            `SELECT * FROM otp_logs
             WHERE mobile = ?
               AND otp = ?
               AND is_used = 0
               AND expires_at > NOW()
             ORDER BY id DESC
             LIMIT 1`,
            [normalizePhone, OTP]
        );

        if (otpRows.length === 0) {
            return res.status(401).json({ message: "Invalid or expired OTP" });
        }

        await pool.query(
            "UPDATE otp_logs SET is_used = 1 WHERE id = ?",
            [otpRows[0].id]
        );

        if (!normalizePhone || !name) {
            return res.status(400).json({ message: 'Required fields missing' });
        }


        const [exists] = await pool.query(
            'SELECT id FROM advocate_user WHERE tel_no = ?',
            [normalizePhone]
        );

        if (exists.length > 0) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const [result] = await pool.query(
            `INSERT INTO advocate_user 
            (tel_no, enrollment_no, enrollment_date, bar_association, name, Address, ADV_Photo, Latitude, Longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                normalizePhone,
                regNo,
                regDate,
                barAssociation,
                name,
                address,
                photoUrl,
                latitude,
                longitude,
            ]
        );

        const userId = result.insertId;

        /* 🔹 CREATE JWT */
        const token = jwt.sign(
            { id: userId, phone },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        /* 🔹 RESPONSE */
        res.status(201).json({
            message: 'Signup successful',
            token,
            user: {
                id: userId,
                phone,
                name,
                photo: photoUrl,
            },
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Signup failed' });
    }
};