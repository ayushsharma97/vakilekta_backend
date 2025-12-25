const db = require("../config/db");
const { pool } = require('../config/db')


exports.getActiveBanners = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT id, title, image_url, expire_time
      FROM banners
      WHERE status = 1
        AND expire_time >= NOW()
      ORDER BY id DESC
    `);

        return res.status(200).json({
            success: true,
            data: rows,
            message: rows.length ? 'Active banners fetched' : 'No active banners'
        });

    } catch (error) {
        console.error('Banner fetch error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.uploadBannerController = async (req, res) => {
    try {
        const { title, expire_time, status = 1, imageUrl } = req.body;

        if (!expire_time) {
            return res.status(400).json({
                success: false,
                message: 'Expire time required'
            });
        }


        await pool.query(
            `INSERT INTO banners (title, image_url, expire_time, status)
       VALUES (?, ?, ?, ?)`,
            [title, imageUrl, expire_time, status]
        );

        return res.status(201).json({
            success: true,
            message: 'Banner uploaded successfully',
            image_url: imageUrl
        });

    } catch (error) {
        console.error('Banner upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};