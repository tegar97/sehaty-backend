const { generateWhatsappCode, startWhatsappSession ,checkSession} = require("../controllers/userWhatsappController");
const express = require('express');
const auth = require("../middlewares/whatsappSessionMiddleware");

const router = express.Router();

router.post("/generate-code", generateWhatsappCode);
router.post("/start-session", startWhatsappSession);
router.get('/check-session', auth, checkSession);

module.exports = router;

