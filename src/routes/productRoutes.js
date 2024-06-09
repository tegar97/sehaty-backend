const express = require("express");

const { createScanHistory  , getScanHistories , getScanHistoryDetail} = require("../controllers/userController");
const auth = require("../middlewares/whatsappSessionMiddleware");

const router = express.Router();

router.post("/add-history", auth, createScanHistory);
router.get("/get-history", auth, getScanHistories);
router.get("/detail-history", auth, getScanHistoryDetail);
module.exports = router;
