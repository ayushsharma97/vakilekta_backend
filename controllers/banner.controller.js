const Banner = require("../models/banner");

exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({
      status: 1,
      expire_time: { $gte: new Date() }
    })
      .sort({ _id: -1 })
      .select("title image_url expire_time");

    return res.status(200).json({
      success: true,
      data: banners,
      message: banners.length ? "Active banners fetched" : "No active banners"
    });

  } catch (error) {
    console.error("Banner fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.uploadBannerController = async (req, res) => {
  try {
    const { title, expire_time, status = 1, imageUrl } = req.body;

    if (!expire_time || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Expire time and image URL are required"
      });
    }

    const banner = await Banner.create({
      title,
      image_url: imageUrl,
      expire_time,
      status
    });

    return res.status(201).json({
      success: true,
      message: "Banner uploaded successfully",
      data: banner
    });

  } catch (error) {
    console.error("Banner upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
