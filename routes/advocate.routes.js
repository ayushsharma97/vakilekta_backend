const router = require("express").Router();
const advocate = require("../controllers/advocate.controller");
const upload = require("../utils/upload");
const auth = require('../middleware/auth')

router.get("/search/name", auth, advocate.searchByName);
router.get("/search/enrollment", auth, advocate.searchByEnrollment);

router.post("/upload-excel", upload.single("file"), advocate.uploadExcel);

router.get("/phone-by-enrollment", advocate.getPhoneByEnrollment);

router.get("/profile", auth, advocate.getProfile);

router.put("/update-profile", auth, advocate.updateProfile);

router.get("/nearby-adv", auth, advocate.getNearbyAdvocates)

module.exports = router;
