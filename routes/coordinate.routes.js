const router = require("express").Router();
const coordinates = require('../controllers/coordinate.contoller');
const auth = require('../middleware/auth')


router.post("/GetCoordinates", auth, coordinates.getLatLngFromPlaceId);
router.post("/SingupCoordinates", coordinates.getLatLngFromPlaceId)

module.exports = router;
