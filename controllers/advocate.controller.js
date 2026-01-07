const ExcelJS = require("exceljs");
const fs = require("fs");
const AdvocateUser = require("../models/AdvocateUser");

/* ================= SEARCH ================= */

exports.searchByName = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        // Split by space → ["name", "surname"]
        const words = name.trim().split(/\s+/);

        const regexConditions = words.map(word => ({
            name: { $regex: word, $options: "i" }
        }));

        const data = await AdvocateUser.find({
            $and: regexConditions
        });

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
};

exports.SearchByAddress = async (req, res) => {
    try {
        const { address } = req.query;

        if (!address) {
            return res.status(400).json({ error: "Address is required" });
        }

        const words = address.trim().split(/\s+/);

        const regexConditions = words.map(word => ({
            address: { $regex: word, $options: "i" }
        }));

        const data = await AdvocateUser.find({
            $and: regexConditions
        });

        res.json(data);
    }
    catch (err) {
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
                if (!telNo) continue; // skip if phone missing

                const address = [
                    row.getCell(6).text,
                    row.getCell(7).text,
                    row.getCell(8).text
                ].filter(Boolean).join(", ");


                // If lat/lng missing, set location to [0,0]
                const locationCoordinates = [0, 0];

                batch.push({
                    enrollment_no: enrollmentNo,
                    enrollment_date: excelDateToJSDate(row.getCell(3).value),
                    name: row.getCell(5).text || null,
                    address,
                    city: row.getCell(9).text || null,
                    bar_association: row.getCell(13).text || null,
                    tel_no: telNo,
                    Latitude: null,
                    Longitude: null,
                    location: {
                        type: "Point",
                        coordinates: locationCoordinates
                    }
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

        const updateData = { ...req.body };

        console.log('Update data received:', updateData);

        if (latitude !== undefined && longitude !== undefined) {
            const lat = Number(latitude);
            const lng = Number(longitude);

            if (isNaN(lat) || isNaN(lng)) {
                return res.status(400).json({
                    message: "Invalid latitude or longitude"
                });
            }

            // ✅ update both outer + geo field
            updateData.Latitude = lat;
            updateData.Longitude = lng;
            updateData.location = {
                type: "Point",
                coordinates: [lng, lat]
            };
        }

        const updated = await AdvocateUser.findByIdAndUpdate(
            req.user.id,
            { $set: updateData }, // 🔥 important
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: updated
        });

    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


/* ================= NEARBY ADVOCATES ================= */

exports.getNearbyAdvocates = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        // Validate lat/lng
        if (!latitude || !longitude) {
            return res.status(400).json({ message: "Latitude & Longitude are required" });
        }

        const lat = Number(latitude);
        const lng = Number(longitude);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ message: "Invalid latitude or longitude" });
        }

        // MongoDB geo query
        const users = await AdvocateUser.find({
            location: {
                $nearSphere: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat]  // Always [longitude, latitude]
                    },
                    $maxDistance: 5000 // 5 km
                }
            }
        }).select("name tel_no address ADV_Photo Latitude Longitude");

        res.json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (err) {
        console.error("Nearby advocates error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ================== Add FMC Token ================= */
exports.saveFCMToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user.id;
        console.log('User ID:', userId);
        if (!fcmToken) {
            return res.status(400).json({ message: 'FCM token is required' });
        }

        await AdvocateUser.findByIdAndUpdate(
            userId,
            {
                $addToSet: { fcmTokens: fcmToken }, // no duplicates
            },
            { new: true }
        );

        res.status(200).json({
            message: 'FCM token saved successfully',
        });

    } catch (err) {
        console.error('FCM token error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ================== Get FCM Tokens ================= */
exports.getFCMToken = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await AdvocateUser.findById(userId).select('fcmTokens');

        if (!user) {
            return res.status(404).json({ message: 'Advocate not found' });
        }
        res.status(200).json({
            success: true,
            fcmTokens: user.fcmTokens || [],
        });

    }
    catch (err) {
        console.error('Get FCM token error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.DeleteAdvocateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        await AdvocateUser.findByIdAndDelete(userId);
        res.status(200).json({ message: "Advocate account deleted successfully" });
    } 
    catch (err) {
        console.error('Delete Advocate Account error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

