const ExcelJS = require("exceljs");
const fs = require("fs");
const AdvocateUser = require("../models/AdvocateUser");

/* ================= SEARCH ================= */

exports.searchByName = async (req, res) => {
    try {
        const { name } = req.query;

        const data = await AdvocateUser.find({
            name: { $regex: name, $options: "i" }
        });

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
};

exports.searchByEnrollment = async (req, res) => {
    try {
        const { EnrollmentNo } = req.query;

        const data = await AdvocateUser.find({
            enrollment_no: { $regex: EnrollmentNo, $options: "i" }
        });

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
};

/* ================= EXCEL DATE ================= */

function excelDateToJSDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    return new Date(Math.round((value - 25569) * 86400 * 1000));
}

/* ================= EXCEL UPLOAD ================= */

exports.uploadExcel = async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: "No file uploaded" });

        const workbook = new ExcelJS.stream.xlsx.WorkbookReader(req.file.path);
        let batch = [];
        let inserted = 0;

        for await (const worksheet of workbook) {
            if (worksheet.id !== 1) continue;

            for await (const row of worksheet) {
                if (row.number === 1) continue;

                const enrollmentNo = row.getCell(2).text?.trim();
                if (!enrollmentNo) continue;

                const telNo = row.getCell(15).text?.trim();
                if (!telNo) continue; // 🚫 skip if phone missing

                const address = [
                    row.getCell(6).text,
                    row.getCell(7).text,
                    row.getCell(8).text
                ].filter(Boolean).join(", ");

                batch.push({
                    enrollment_no: enrollmentNo,
                    enrollment_date: excelDateToJSDate(row.getCell(3).value),
                    name: row.getCell(5).text || null,
                    address,
                    city: row.getCell(9).text || null,
                    bar_association: row.getCell(13).text || null,
                    tel_no: telNo
                });

                if (batch.length === 500) {
                    await AdvocateUser.insertMany(batch, { ordered: false });
                    inserted += batch.length;
                    batch = [];
                }
            }
        }

        if (batch.length) {
            await AdvocateUser.insertMany(batch, { ordered: false });
            inserted += batch.length;
        }

        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: "Excel uploaded successfully",
            totalInserted: inserted
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Excel processing failed" });
    }
};


/* ================= GET PHONE ================= */

exports.getPhoneByEnrollment = async (req, res) => {
    try {
        const { enrollmentNo } = req.query;

        const user = await AdvocateUser.findOne({
            enrollment_no: enrollmentNo.trim()
        }).select("enrollment_no tel_no");

        if (!user)
            return res.status(404).json({ error: "Advocate not found" });

        res.json({
            success: true,
            data: {
                enrollmentNo: user.enrollment_no,
                phone: user.tel_no
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/* ================= PROFILE ================= */

exports.getProfile = async (req, res) => {
    try {
        const user = await AdvocateUser.findById(req.user.id);

        if (!user)
            return res.status(404).json({ error: "Profile not found" });

        res.json({ success: true, data: user });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        const updated = await AdvocateUser.findByIdAndUpdate(
            req.user.id,
            {
                ...req.body,
                location: latitude && longitude ? {
                    type: "Point",
                    coordinates: [longitude, latitude]
                } : undefined
            },
            { new: true }
        );

        if (!updated)
            return res.status(404).json({ message: "Profile not found" });

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: updated
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

/* ================= NEARBY ADVOCATES ================= */

exports.getNearbyAdvocates = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        const data = await AdvocateUser.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [Number(longitude), Number(latitude)]
                    },
                    $maxDistance: 5000 // 5 KM
                }
            }
        }).select("name tel_no address ADV_Photo Latitude Longitude");

        res.json({
            success: true,
            count: data.length,
            data
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
