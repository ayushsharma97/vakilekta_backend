const db = require("../config/db");
const XLSX = require("xlsx");
const { pool } = require('../config/db')

exports.searchByName = async (req, res) => {
    try {
        const { name } = req.query;

        console.log(name)
        // Destructure rows correctly
        const [rows, fields] = await pool.execute(
            "SELECT * FROM advocate_user WHERE name LIKE ?",
            [`%${name}%`]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
};

exports.searchByEnrollment = async (req, res) => {
    try {
        const { EnrollmentNo } = req.query;

        console.log(EnrollmentNo)
        // Destructure rows correctly
        const [rows, fields] = await pool.execute(
            "SELECT * FROM advocate_user WHERE enrollment_no LIKE ?",
            [`%${EnrollmentNo}%`]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
};

function excelDateToJSDate(serial) {
    if (!serial) return null;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    return new Date(utc_value * 1000);
}


exports.uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Excel file is required" });
        }

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const data = XLSX.utils.sheet_to_json(sheet);

        if (!data.length) {
            return res.status(400).json({ error: "Excel is empty" });
        }

        const insertPromises = data.map(row => {
            const enrollmentNo = row["Enrolment No. "]?.toString().trim();

            if (!enrollmentNo) return null; // skip invalid rows

            return db.query(
                `INSERT INTO advocate_user
                (enrollment_no, enrollment_date, name, bar_association, tel_no, alternative_no)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    enrollmentNo,
                    excelDateToJSDate(row["Enrol. Dt."]),
                    row["Name of Advocate"]?.trim() || null,
                    row["Bar Association"]?.trim() || null,
                    row["Tel. No. "]?.toString().trim() || null,
                    null
                ]
            );
        });

        await Promise.all(insertPromises.filter(Boolean));

        res.json({
            success: true,
            message: "Excel uploaded successfully",
            totalInserted: insertPromises.length
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Upload failed" });
    }
};

exports.getPhoneByEnrollment = async (req, res) => {
    try {
        const { enrollmentNo } = req.query;

        if (!enrollmentNo) {
            return res.status(400).json({
                error: "Enrollment number is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT 
                enrollment_no,
                tel_no,
                alternative_no
             FROM advocate_user
             WHERE enrollment_no = ?`,
            [enrollmentNo.trim()]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Advocate not found"
            });
        }

        res.json({
            success: true,
            data: {
                enrollmentNo: rows[0].enrollment_no,
                phone: rows[0].tel_no,
                alternativePhone: rows[0].alternative_no
            }
        });

    } catch (error) {
        console.error("getPhoneByEnrollment error:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        console.log(req.user)
        const userId = req.user.id; // from JWT

        const [rows] = await pool.execute(
            `SELECT 
                enrollment_no,
                enrollment_date,
                name,
                bar_association,
                tel_no,
                alternative_no,
                address,
                latitude,
                longitude,
                ADV_Photo
             FROM advocate_user
             WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Profile not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (err) {
        console.error("getProfile error:", err);
        res.status(500).json({
            error: "Internal server error"
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; // from auth middleware

        const {
            name,
            bar_association,
            tel_no,
            address,
            latitude,
            longitude,
            photo_url,
        } = req.body;

        const sql = `
      UPDATE advocate_user
      SET
        name = ?,
        bar_association = ?,
        tel_no = ?,
        Address = ?,
        Latitude = ?,
        Longitude = ?,
        ADV_Photo = ?
      WHERE id = ?
    `;

        const values = [
            name,
            bar_association,
            tel_no,
            address,
            latitude,
            longitude,
            photo_url,
            userId,
        ];

        const [result] = await pool.query(sql, values); // ✅ PROMISE

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Profile not found" });
        }

        return res.json({
            success: true,
            message: "Profile updated successfully",
        });

    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getNearbyAdvocates = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: "Lat & Lng required" });
        }

        const radius = 5;

        const sql = `
      SELECT
        id,
        name,
        tel_no,
        address,
        ADV_Photo,
        latitude,
        longitude,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(latitude))
          )
        ) AS distance
      FROM advocate_user
      HAVING distance <= ?
      ORDER BY distance ASC
    `;

        const [rows] = await pool.query(sql, [
            latitude,
            longitude,
            latitude,
            radius,
        ]);

        res.json({
            success: true,
            count: rows.length,
            data: rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};