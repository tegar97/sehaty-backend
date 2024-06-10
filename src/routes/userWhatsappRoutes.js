const { generateWhatsappCode, startWhatsappSession ,checkSession , checkIsLinked} = require("../controllers/userWhatsappController");
const express = require('express');
const auth = require("../middlewares/whatsappSessionMiddleware");

const router = express.Router();

router.post("/generate-code", generateWhatsappCode);
router.post("/start-session", startWhatsappSession);
router.get('/check-session', auth, checkSession);
router.get('/check-is-linked', auth, checkIsLinked);

module.exports = router;

