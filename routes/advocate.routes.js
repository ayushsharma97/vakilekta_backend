const router = require("express").Router();
const advocate = require("../controllers/advocate.controller");
const upload = require("../utils/upload");
const auth = require('../middleware/auth')

router.get("/search/name", auth, advocate.searchByName);
router.get("/search/enrollment", auth, advocate.searchByEnrollment);
router.get("/search/address", auth, advocate.SearchByAddress);

router.post("/upload-excel", upload.single("file"), advocate.uploadExcel);

router.get("/phone-by-enrollment", advocate.getPhoneByEnrollment);

router.get("/profile", auth, advocate.getProfile);

router.put("/update-profile", auth, advocate.updateProfile);

router.get("/nearby-adv", auth, advocate.getNearbyAdvocates);

router.post('/save-fcm-token', auth, advocate.saveFCMToken);

router.get('/get-fcm-token', auth, advocate.getFCMToken);

router.delete('/delete-account', auth, advocate.DeleteAdvocateAccount);

// router.post('/send-notification', auth, advocate.sendNotificationToAdvocate);

module.exports = router;
