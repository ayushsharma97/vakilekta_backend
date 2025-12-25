const router = require("express").Router();
const auth = require('../middleware/auth')
const { getUploadSignature, uploadProfile, uploadBannerProfile } = require('../controllers/upload.controller.js')
const upload = require("../utils/Profileupload.js");
const uploadBanner = require("../utils/BannerUpload.js");

router.get('/cloudinary-signature', auth, getUploadSignature);
router.post('/profile-image', auth, upload.single('image'), uploadProfile)
router.post('/Signup_image_upload', upload.single('image'), uploadProfile)
router.post('/bannerUpload',uploadBanner.single('image'),uploadBannerProfile)


module.exports = router 
