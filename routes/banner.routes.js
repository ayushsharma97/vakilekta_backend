const router = require("express").Router();
const banner = require('../controllers/banner.controller');
const uploadBanner = require("../utils/BannerUpload");

router.get("/GetBanner", banner.getActiveBanners);
router.post(
    '/updateBanner',
    uploadBanner.single('image'),
    banner.uploadBannerController
);
module.exports = router;
