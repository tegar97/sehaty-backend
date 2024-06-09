const { generateWhatsappCode, startWhatsappSession } = require("../controllers/userWhatsappController");
const express = require('express');

const router = express.Router();

router.post("/generate-code", generateWhatsappCode);
router.post("/start-session", startWhatsappSession);

module.exports = router;

